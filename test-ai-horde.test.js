import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchAvailableImageModels, generateHordeImage } from './src/utils/aiHorde.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

test('submits an anonymous SFW request and returns its queued WebP result', async () => {
  const calls = [];
  const statuses = [];
  let checks = 0;
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });

    if (options.method === 'POST') return jsonResponse({ id: 'request-123' }, 202);
    if (url.endsWith('/check/request-123')) {
      checks += 1;
      return jsonResponse(checks === 1
        ? { done: false, waiting: 1, queue_position: 4, wait_time: 30 }
        : { done: true });
    }
    if (url.endsWith('/status/request-123')) {
      return jsonResponse({ generations: [{ img: btoa('test image') }] });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  const image = await generateHordeImage('A red apple on a white table', {
    fetchImpl,
    sleep: async () => {},
    onStatus: (status) => statuses.push(status),
    pollIntervalMs: 1
  });

  const submission = calls[0];
  const request = JSON.parse(submission.options.body);
  assert.equal(submission.options.headers.apikey, '0000000000');
  assert.equal(submission.options.headers['Client-Agent'].startsWith('SAKrypt:'), true);
  assert.equal(request.prompt, 'A red apple on a white table');
  assert.equal(request.nsfw, false);
  assert.equal(request.censor_nsfw, true);
  assert.equal(request.params.n, 1);
  assert.equal(request.models, undefined);
  assert.equal(image.type, 'image/webp');
  assert.equal(image.size, 'test image'.length);
  assert.equal(statuses[0].queuePosition, 4);
  assert.equal(statuses.at(-1).phase, 'retrieving');
});

test('lists only image models with active workers and sorts them', async () => {
  const models = await fetchAvailableImageModels({
    fetchImpl: async (url) => {
      assert.match(url, /status\/models\?type=image$/);
      return jsonResponse([
        { name: 'Zeta', type: 'image', count: 2 },
        { name: 'No workers', type: 'image', count: 0 },
        { name: 'Alpha', type: 'image', count: 1 },
        { name: 'Hentai Diffusion', type: 'image', count: 10 },
        { name: 'WAI-NSFW-illustrious', type: 'image', count: 8 },
        { name: 'Text model', type: 'text', count: 10 },
        { name: '', type: 'image', count: 1 }
      ]);
    }
  });

  assert.deepEqual(models.map((model) => model.name), ['Alpha', 'Zeta']);
});

test('restricts generation to the selected community model when requested', async () => {
  let submittedRequest;
  const fetchImpl = async (url, options = {}) => {
    if (options.method === 'POST') {
      submittedRequest = JSON.parse(options.body);
      return jsonResponse({ id: 'request-model' }, 202);
    }
    if (url.endsWith('/check/request-model')) return jsonResponse({ done: true });
    if (url.endsWith('/status/request-model')) {
      return jsonResponse({ generations: [{ img: btoa('model result') }] });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  await generateHordeImage('A landscape', {
    fetchImpl,
    sleep: async () => {},
    model: 'Juggernaut XL'
  });
  assert.deepEqual(submittedRequest.models, ['Juggernaut XL']);
});

test('explains provider rate limiting without retrying or changing identities', async () => {
  await assert.rejects(
    generateHordeImage('A landscape', {
      fetchImpl: async () => jsonResponse({ message: 'Too many requests' }, 429)
    }),
    /rate limiting requests.*Too many requests/
  );
});

test('reports when no available worker can serve the request', async () => {
  await assert.rejects(
    generateHordeImage('A landscape', {
      fetchImpl: async (url, options = {}) => (
        options.method === 'POST'
          ? jsonResponse({ id: 'request-456' }, 202)
          : jsonResponse({ done: false, is_possible: false })
      ),
      sleep: async () => {},
      pollIntervalMs: 1
    }),
    /No available volunteer GPU/
  );
});

test('times out a request rather than polling past the configured deadline', async () => {
  let time = 0;
  let checks = 0;
  await assert.rejects(
    generateHordeImage('A landscape', {
      fetchImpl: async (url, options = {}) => {
        if (options.method === 'POST') return jsonResponse({ id: 'request-789' }, 202);
        checks += 1;
        return jsonResponse({ done: false, is_possible: true });
      },
      sleep: async (milliseconds) => {
        time += milliseconds;
      },
      now: () => time,
      timeoutMs: 2000,
      pollIntervalMs: 1000
    }),
    /request timed out/
  );
  assert.equal(checks, 2);
});
