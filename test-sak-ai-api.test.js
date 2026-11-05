import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './api/assistant.js';

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
    'x-forwarded-for': `192.0.2.${Math.floor(Math.random() * 200) + 1}`
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
      json: async () => ({ output_text: 'Use JSON Formatter.' })
    };
  };
  try {
    const response = createResponse();
    await handler(createRequest(), response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.answer, 'Use JSON Formatter.');
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
