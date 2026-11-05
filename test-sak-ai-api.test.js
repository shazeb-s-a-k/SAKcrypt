import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './api/assistant.js';

let requestId = 0;

const createResponse = () => ({
  headers: {},
  statusCode: 200,
  body: null,
  setHeader(name, value) {
    this.headers[name] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const createRequest = (overrides = {}) => ({
  method: 'POST',
  headers: {
    host: 'sakrypt.example',
    origin: 'https://sakrypt.example',
    'x-forwarded-for': `192.0.2.${++requestId}`
  },
  body: {
    prompt: 'Recommend a useful tool.',
    catalog: '- JSON Formatter: format JSON',
    history: [{ role: 'user', content: 'Hello' }]
  },
  ...overrides
});

test('does not need a browser API key and clearly reports missing server configuration', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const response = createResponse();
    await handler(createRequest(), response);

    assert.equal(response.statusCode, 503);
    assert.match(response.body.error, /GEMINI_API_KEY/);
    assert.equal(response.headers['Cache-Control'], 'no-store');
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('reports configuration status without exposing the API key', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const secret = 'server-only-health-test-key';
  process.env.GEMINI_API_KEY = secret;
  try {
    const response = createResponse();
    await handler(createRequest({ method: 'GET' }), response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, {
      configured: true,
      model: 'gemini-3.8-flash',
      fallbackModel: 'gemini-3.6-flash'
    });
    assert.equal(JSON.stringify(response.body).includes(secret), false);
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('rejects cross-origin calls before contacting Gemini', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'test-secret';
  globalThis.fetch = async () => { throw new Error('Gemini must not be called.'); };
  try {
    const response = createResponse();
    await handler(createRequest({
      headers: { host: 'sakrypt.example', origin: 'https://attacker.example' }
    }), response);

    assert.equal(response.statusCode, 403);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('uses Gemini 3.8 Interactions API without returning the server key to the browser', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  const secret = 'server-side-test-key';
  process.env.GEMINI_API_KEY = secret;
  let upstreamUrl;
  let upstreamRequest;
  globalThis.fetch = async (url, options) => {
    upstreamUrl = url;
    upstreamRequest = options;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        object: 'interaction',
        status: 'completed',
        steps: [{
          type: 'model_output',
          content: [{ type: 'text', text: 'Use JSON Formatter.' }]
        }]
      }),
      headers: { get: () => null }
    };
  };
  try {
    const response = createResponse();
    await handler(createRequest(), response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.answer, 'Use JSON Formatter.');
    assert.equal(response.body.model, 'gemini-3.8-flash');
    assert.equal(response.body.fallback, false);
    assert.equal(upstreamUrl, 'https://generativelanguage.googleapis.com/v1beta/interactions');
    assert.equal(upstreamRequest.headers['x-goog-api-key'], secret);
    assert.equal(upstreamUrl.includes(secret), false);
    assert.equal(JSON.stringify(response.body).includes(secret), false);
    const requestBody = JSON.parse(upstreamRequest.body);
    assert.equal(requestBody.model, 'gemini-3.8-flash');
    assert.equal(requestBody.store, false);
    assert.match(requestBody.system_instruction, /You are S\.A\.K AI/);
    assert.match(requestBody.input, /User: Hello/);
    assert.match(requestBody.input, /User: Recommend a useful tool\./);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('joins text from model output steps and ignores non-text content', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'server-side-test-key';
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: async () => ({
      status: 'completed',
      steps: [
        { type: 'user_input', content: [{ type: 'text', text: 'Do not return this.' }] },
        { type: 'model_output', content: [
          { type: 'text', text: 'First part ' },
          { type: 'image', data: 'not text' }
        ] },
        { type: 'model_output', content: [{ type: 'text', text: 'and second part.' }] }
      ]
    })
  });
  try {
    const response = createResponse();
    await handler(createRequest(), response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.answer, 'First part and second part.');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('retries overloaded Gemini 3.8 then falls back to the available production model', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'server-side-test-key';
  const requestedModels = [];
  globalThis.fetch = async (_url, options) => {
    const requestBody = JSON.parse(options.body);
    requestedModels.push(requestBody.model);
    if (requestedModels.length < 3) {
      return {
        ok: false,
        status: 503,
        headers: { get: () => '0.001' },
        json: async () => ({ error: { message: 'Model is currently facing high demand.' } })
      };
    }
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ output_text: 'Here is my answer.' })
    };
  };
  try {
    const response = createResponse();
    await handler(createRequest(), response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(requestedModels, [
      'gemini-3.8-flash',
      'gemini-3.8-flash',
      'gemini-3.6-flash'
    ]);
    assert.deepEqual(response.body, {
      answer: 'Here is my answer.',
      model: 'gemini-3.6-flash',
      fallback: true
    });
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('returns a clear retry response when all supported models are overloaded', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'server-side-test-key';
  const requestedModels = [];
  globalThis.fetch = async (_url, options) => {
    requestedModels.push(JSON.parse(options.body).model);
    return {
      ok: false,
      status: 503,
      headers: { get: () => '0.001' },
      json: async () => ({ error: { message: 'Provider is temporarily busy.' } })
    };
  };
  try {
    const response = createResponse();
    await handler(createRequest(), response);

    assert.equal(response.statusCode, 503);
    assert.equal(requestedModels.length, 3);
    assert.match(response.body.error, /gemini-3\.8-flash or gemini-3\.6-flash/);
    assert.equal(response.headers['Retry-After'], '10');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('does not retry model fallbacks for invalid API credentials', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'server-side-test-key';
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    return {
      ok: false,
      status: 403,
      headers: { get: () => null },
      json: async () => ({ error: { message: 'API key is invalid.' } })
    };
  };
  try {
    const response = createResponse();
    await handler(createRequest(), response);

    assert.equal(response.statusCode, 403);
    assert.equal(response.body.error, 'API key is invalid.');
    assert.equal(attempts, 1);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('rejects oversized prompts without making an upstream request', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'server-side-test-key';
  globalThis.fetch = async () => { throw new Error('Gemini must not be called.'); };
  try {
    const response = createResponse();
    await handler(createRequest({
      body: { prompt: 'x'.repeat(220 * 1024 + 1), catalog: '', history: [] }
    }), response);

    assert.equal(response.statusCode, 400);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});
