import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './api/gemini.js';

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
    'x-forwarded-for': `198.51.100.${++requestId}`
  },
  body: {
    systemInstruction: 'Be concise.',
    prompt: 'Explain this code.',
    model: 'gemini-2.5-flash',
    temperature: 0.4,
    maxOutputTokens: 512
  },
  ...overrides
});

test('reports server configuration without exposing the API key', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const secret = 'gemini-server-only-test-key';
  process.env.GEMINI_API_KEY = secret;
  try {
    const response = createResponse();
    await handler(createRequest({ method: 'GET' }), response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { configured: true });
    assert.equal(JSON.stringify(response.body).includes(secret), false);
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('uses the server key for Gemini and returns only generated text', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  const secret = 'gemini-server-only-test-key';
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
        candidates: [{ content: { parts: [{ text: 'Here is the explanation.' }] } }]
      })
    };
  };
  try {
    const response = createResponse();
    await handler(createRequest(), response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { text: 'Here is the explanation.' });
    assert.equal(upstreamUrl, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
    assert.equal(upstreamRequest.headers['x-goog-api-key'], secret);
    assert.equal(upstreamUrl.includes(secret), false);
    assert.equal(JSON.stringify(response.body).includes(secret), false);
    const requestBody = JSON.parse(upstreamRequest.body);
    assert.equal(requestBody.systemInstruction.parts[0].text, 'Be concise.');
    assert.equal(requestBody.contents[0].parts[0].text, 'Explain this code.');
    assert.deepEqual(requestBody.generationConfig, {
      temperature: 0.4,
      maxOutputTokens: 512
    });
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('accepts sandbox conversation history and merges consecutive roles', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'gemini-server-only-test-key';
  let upstreamRequest;
  globalThis.fetch = async (_url, options) => {
    upstreamRequest = options;
    return {
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'A response.' }] } }] })
    };
  };
  try {
    const response = createResponse();
    await handler(createRequest({
      body: {
        model: 'gemini-2.0-flash',
        messages: [
          { role: 'user', content: 'First part.' },
          { role: 'user', content: 'Second part.' },
          { role: 'model', content: 'Previous answer.' }
        ]
      }
    }), response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(upstreamRequest.body).contents, [
      { role: 'user', parts: [{ text: 'First part.\n\nSecond part.' }] },
      { role: 'model', parts: [{ text: 'Previous answer.' }] }
    ]);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('rejects cross-origin calls and invalid model names before contacting Gemini', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'gemini-server-only-test-key';
  globalThis.fetch = async () => { throw new Error('Gemini must not be called.'); };
  try {
    const crossOriginResponse = createResponse();
    await handler(createRequest({
      headers: { host: 'sakrypt.example', origin: 'https://attacker.example' }
    }), crossOriginResponse);
    assert.equal(crossOriginResponse.statusCode, 403);

    const invalidModelResponse = createResponse();
    await handler(createRequest({ body: { prompt: 'Test', model: 'other-provider/model' } }), invalidModelResponse);
    assert.equal(invalidModelResponse.statusCode, 400);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test('reports missing server configuration without requesting a user key', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const response = createResponse();
    await handler(createRequest(), response);

    assert.equal(response.statusCode, 503);
    assert.match(response.body.error, /Gemini-powered tools are not configured/);
  } finally {
    if (previousKey !== undefined) process.env.GEMINI_API_KEY = previousKey;
  }
});
