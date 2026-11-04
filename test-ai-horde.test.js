import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fetchAvailableImageModels,
  getImageDimensions,
  generateHordeImage,
  generatePollinationsImage
} from './src/utils/aiHorde.js';

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
  assert.deepEqual(
    { width: request.params.width, height: request.params.height },
    { width: 512, height: 512 }
  );
  assert.equal(request.nsfw, false);
  assert.equal(request.censor_nsfw, true);
  assert.equal(request.params.n, 1);
  assert.equal(request.models, undefined);
  assert.equal(image.type, 'image/webp');
  assert.equal(image.size, 'test image'.length);
  assert.equal(statuses[0].queuePosition, 4);
  assert.equal(statuses.at(-1).phase, 'retrieving');
});

test('maps supported aspect ratios to exact provider-compatible dimensions', () => {
  assert.deepEqual(getImageDimensions('1:1', 'aihorde', 'standard'), { width: 512, height: 512 });
  assert.deepEqual(getImageDimensions('16:9', 'aihorde', 'standard'), { width: 1024, height: 576 });
  assert.deepEqual(getImageDimensions('9:16', 'aihorde', 'standard'), { width: 576, height: 1024 });
  assert.deepEqual(getImageDimensions('4:3', 'aihorde', 'standard'), { width: 768, height: 576 });
  assert.deepEqual(getImageDimensions('3:4', 'aihorde', 'standard'), { width: 576, height: 768 });
  assert.deepEqual(getImageDimensions('1:1', 'aihorde', 'hd'), { width: 1024, height: 1024 });
  assert.deepEqual(getImageDimensions('16:9', 'aihorde', 'hd'), { width: 1024, height: 576 });
  assert.deepEqual(getImageDimensions('9:16', 'aihorde', 'hd'), { width: 576, height: 1024 });
  assert.deepEqual(getImageDimensions('4:3', 'aihorde', 'hd'), { width: 1024, height: 768 });
  assert.deepEqual(getImageDimensions('3:4', 'aihorde', 'hd'), { width: 768, height: 1024 });
  assert.deepEqual(getImageDimensions('1:1', 'pollinations', 'hd'), { width: 768, height: 768 });
  assert.deepEqual(getImageDimensions('16:9', 'pollinations', 'hd'), { width: 768, height: 432 });
  assert.deepEqual(getImageDimensions('9:16', 'pollinations', 'hd'), { width: 432, height: 768 });
  assert.deepEqual(getImageDimensions('4:3', 'pollinations', 'hd'), { width: 768, height: 576 });
  assert.deepEqual(getImageDimensions('3:4', 'pollinations', 'hd'), { width: 576, height: 768 });
  assert.throws(() => getImageDimensions('2:1', 'aihorde'), /supported image aspect ratio/);
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
    model: 'Juggernaut XL',
    aspectRatio: '16:9'
  });
  assert.deepEqual(submittedRequest.models, ['Juggernaut XL']);
  assert.deepEqual(
    { width: submittedRequest.params.width, height: submittedRequest.params.height },
    { width: 1024, height: 576 }
  );
});

test('submits the selected HD dimensions to AI Horde', async () => {
  let submittedRequest;
  const fetchImpl = async (url, options = {}) => {
    if (options.method === 'POST') {
      submittedRequest = JSON.parse(options.body);
      return jsonResponse({ id: 'request-hd' }, 202);
    }
    if (url.endsWith('/check/request-hd')) return jsonResponse({ done: true });
    if (url.endsWith('/status/request-hd')) {
      return jsonResponse({ generations: [{ img: btoa('hd result') }] });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  await generateHordeImage('A square image', {
    fetchImpl,
    sleep: async () => {},
    resolution: 'hd'
  });
  assert.deepEqual(
    { width: submittedRequest.params.width, height: submittedRequest.params.height },
    { width: 1024, height: 1024 }
  );
});

test('generates a safe Pollinations Classic image without a user API key', async () => {
  const image = await generatePollinationsImage('A fox in a snowy forest', {
    fetchImpl: async (url) => {
      const requestUrl = new URL(url);
      assert.equal(requestUrl.hostname, 'image.pollinations.ai');
      assert.equal(requestUrl.pathname, '/prompt/A%20fox%20in%20a%20snowy%20forest');
      assert.equal(requestUrl.searchParams.get('width'), '432');
      assert.equal(requestUrl.searchParams.get('height'), '768');
      assert.equal(requestUrl.searchParams.get('safe'), 'true');
      assert.equal(requestUrl.searchParams.has('key'), false);
      return new Response(new Blob(['jpeg image'], { type: 'image/jpeg' }));
    },
    aspectRatio: '9:16',
    resolution: 'hd'
  });

  assert.equal(image.type, 'image/jpeg');
  assert.equal(image.size, 'jpeg image'.length);
});

test('honors Retry-After and retries Pollinations rate limits with a countdown', async () => {
  const statuses = [];
  let requests = 0;
  const image = await generatePollinationsImage('A fox', {
    fetchImpl: async () => {
      requests += 1;
      if (requests === 1) {
        return new Response(
          JSON.stringify({ message: 'Please wait' }),
          { status: 402, headers: { 'Content-Type': 'application/json', 'Retry-After': '67' } }
        );
      }
      return new Response(new Blob(['retried image'], { type: 'image/jpeg' }));
    },
    aspectRatio: '9:16',
    onStatus: (status) => statuses.push(status),
    sleep: async () => {}
  });
  assert.equal(image.type, 'image/jpeg');
  assert.equal(requests, 2);
  assert.equal(statuses.length, 67);
  assert.equal(statuses[0].phase, 'retrying');
  assert.equal(statuses[0].waitSeconds, 67);
});

test('allows a mass-generation retry countdown to be cancelled', async () => {
  let shouldStop = false;
  const statuses = [];
  let requests = 0;
  const resultPromise = generatePollinationsImage('A fox', {
    fetchImpl: async () => {
      requests += 1;
      return new Response(
        JSON.stringify({ message: 'Please wait' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '10' } }
      );
    },
    shouldStop: () => shouldStop,
    onStatus: (status) => {
      statuses.push(status);
      shouldStop = true;
    },
    sleep: async () => {}
  });
  assert.equal(await resultPromise, null);
  assert.equal(requests, 1);
  assert.equal(statuses[0].phase, 'retrying');
});

test('does not leave a single generation waiting through an excessive provider delay', async () => {
  let requests = 0;
  await assert.rejects(
    generatePollinationsImage('A fox', {
      fetchImpl: async () => {
        requests += 1;
        return new Response(
          JSON.stringify({ message: 'Please wait' }),
          { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '301' } }
        );
      },
      sleep: async () => {}
    }),
    /longer than five minutes/
  );
  assert.equal(requests, 1);
});

test('retries a rejected Horde submission after rate limiting', async () => {
  let submissions = 0;
  const image = await generateHordeImage('A landscape', {
    fetchImpl: async (url, options = {}) => {
      if (options.method === 'POST') {
        submissions += 1;
        if (submissions === 1) {
          return new Response(JSON.stringify({ message: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json', 'Retry-After': '1' }
          });
        }
        return jsonResponse({ id: 'request-retried' }, 202);
      }
      if (url.endsWith('/check/request-retried')) return jsonResponse({ done: true });
      if (url.endsWith('/status/request-retried')) {
        return jsonResponse({ generations: [{ img: btoa('retried result') }] });
      }
      throw new Error(`Unexpected request: ${url}`);
    },
    sleep: async () => {}
  });
  assert.equal(submissions, 2);
  assert.equal(image.type, 'image/webp');
});

test('retries Horde status polling without creating a duplicate generation job', async () => {
  let submissions = 0;
  let checks = 0;
  const statuses = [];
  const image = await generateHordeImage('A landscape', {
    fetchImpl: async (url, options = {}) => {
      if (options.method === 'POST') {
        submissions += 1;
        return jsonResponse({ id: 'request-poll-retry' }, 202);
      }
      if (url.endsWith('/check/request-poll-retry')) {
        checks += 1;
        if (checks === 1) {
          return new Response(JSON.stringify({ message: 'Temporarily unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', 'Retry-After': '1' }
          });
        }
        return jsonResponse({ done: true });
      }
      if (url.endsWith('/status/request-poll-retry')) {
        return jsonResponse({ generations: [{ img: btoa('poll result') }] });
      }
      throw new Error(`Unexpected request: ${url}`);
    },
    sleep: async () => {},
    onStatus: (status) => statuses.push(status),
    pollIntervalMs: 1
  });

  assert.equal(submissions, 1);
  assert.equal(checks, 2);
  assert.equal(statuses.some((status) => status.phase === 'retrying'), true);
  assert.equal(image.type, 'image/webp');
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
