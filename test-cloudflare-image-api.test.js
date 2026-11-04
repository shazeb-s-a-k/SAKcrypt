import assert from 'node:assert/strict';
import test from 'node:test';
import handler from './api/image-generate.js';

function createResponseRecorder() {
  return {
    headers: {},
    statusCode: 0,
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    }
  };
}

async function withCloudflareEnv(values, callback) {
  const names = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  names.forEach((name) => {
    if (values[name] === undefined) delete process.env[name];
    else process.env[name] = values[name];
  });

  try {
    await callback();
  } finally {
    names.forEach((name) => {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    });
  }
}

test('reports Cloudflare provider configuration without exposing credentials', async () => {
  await withCloudflareEnv({
    CLOUDFLARE_ACCOUNT_ID: 'test-account',
    CLOUDFLARE_API_TOKEN: 'test-secret'
  }, async () => {
    const response = createResponseRecorder();
    await handler({ method: 'GET' }, response);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { configured: true });
    assert.equal(JSON.stringify(response.body).includes('test-secret'), false);
  });
});

test('returns setup instructions when Cloudflare credentials are missing', async () => {
  await withCloudflareEnv({}, async () => {
    const response = createResponseRecorder();
    await handler({ method: 'POST', body: { prompt: 'A tree' } }, response);
    assert.equal(response.statusCode, 503);
    assert.match(response.body.error, /CLOUDFLARE_ACCOUNT_ID.*CLOUDFLARE_API_TOKEN/);
    assert.equal(response.body.retryable, false);
  });
});

test('validates Cloudflare prompts before calling the provider', async () => {
  await withCloudflareEnv({
    CLOUDFLARE_ACCOUNT_ID: 'test-account',
    CLOUDFLARE_API_TOKEN: 'test-secret'
  }, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('Provider must not be called for invalid prompts.');
    };
    try {
      const response = createResponseRecorder();
      await handler({ method: 'POST', body: { prompt: ' ' } }, response);
      assert.equal(response.statusCode, 400);
      assert.match(response.body.error, /prompt between 1 and 2048 characters/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('sends HD aspect dimensions with server-side Cloudflare authorization', async () => {
  await withCloudflareEnv({
    CLOUDFLARE_ACCOUNT_ID: 'test-account',
    CLOUDFLARE_API_TOKEN: 'test-secret'
  }, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      assert.match(url, /accounts\/test-account\/ai\/run\/@cf\/stabilityai\/stable-diffusion-xl-base-1\.0$/);
      assert.equal(options.headers.Authorization, 'Bearer test-secret');
      assert.deepEqual(JSON.parse(options.body), {
        prompt: 'Wide cinematic scene',
        width: 1024,
        height: 576,
        num_steps: 20,
        guidance: 7.5
      });
      return new Response(Buffer.from('png image'), {
        headers: { 'Content-Type': 'image/png' }
      });
    };

    try {
      const response = createResponseRecorder();
      await handler({
        method: 'POST',
        body: { prompt: 'Wide cinematic scene', aspectRatio: '16:9', resolution: 'hd' }
      }, response);
      assert.equal(response.statusCode, 200);
      assert.equal(response.headers['Content-Type'], 'image/png');
      assert.equal(response.headers['Cache-Control'], 'no-store');
      assert.equal(response.body.toString(), 'png image');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('preserves upstream rate-limit guidance without leaking the token', async () => {
  await withCloudflareEnv({
    CLOUDFLARE_ACCOUNT_ID: 'test-account',
    CLOUDFLARE_API_TOKEN: 'sensitive-token'
  }, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(
      JSON.stringify({ errors: [{ message: 'Please retry sensitive-token' }] }),
      { status: 429, headers: { 'Retry-After': '12', 'Content-Type': 'application/json' } }
    );

    try {
      const response = createResponseRecorder();
      await handler({ method: 'POST', body: { prompt: 'A tree' } }, response);
      assert.equal(response.statusCode, 429);
      assert.equal(response.headers['Retry-After'], '12');
      assert.equal(response.body.retryable, true);
      assert.equal(response.body.retryAfterSeconds, 12);
      assert.equal(response.body.error.includes('sensitive-token'), false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('applies a per-client cooldown to the public generation endpoint', async () => {
  await withCloudflareEnv({
    CLOUDFLARE_ACCOUNT_ID: 'test-account',
    CLOUDFLARE_API_TOKEN: 'test-secret'
  }, async () => {
    const originalFetch = globalThis.fetch;
    let providerRequests = 0;
    globalThis.fetch = async () => {
      providerRequests += 1;
      return new Response(Buffer.from('png image'), {
        headers: { 'Content-Type': 'image/png' }
      });
    };

    try {
      const request = {
        method: 'POST',
        headers: { 'x-forwarded-for': '203.0.113.42' },
        body: { prompt: 'A tree' }
      };
      const firstResponse = createResponseRecorder();
      await handler(request, firstResponse);
      assert.equal(firstResponse.statusCode, 200);

      const secondResponse = createResponseRecorder();
      await handler(request, secondResponse);
      assert.equal(secondResponse.statusCode, 429);
      assert.equal(secondResponse.body.retryable, true);
      assert.ok(secondResponse.body.retryAfterSeconds > 0);
      assert.equal(providerRequests, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('rejects image payloads that exceed the Vercel response size limit', async () => {
  await withCloudflareEnv({
    CLOUDFLARE_ACCOUNT_ID: 'test-account',
    CLOUDFLARE_API_TOKEN: 'test-secret'
  }, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(
      Buffer.alloc((4 * 1024 * 1024) + 1),
      { headers: { 'Content-Type': 'image/png' } }
    );

    try {
      const response = createResponseRecorder();
      await handler({ method: 'POST', body: { prompt: 'A tree' } }, response);
      assert.equal(response.statusCode, 413);
      assert.match(response.body.error, /too large for Vercel/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
