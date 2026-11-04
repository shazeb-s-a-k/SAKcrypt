const AI_HORDE_API = 'https://aihorde.net/api/v2';
const ANONYMOUS_API_KEY = '0000000000';
const CLIENT_AGENT = 'SAKrypt:2.1.0:https://github.com/shazeb-s-a-k/SAKrypt';
const DEFAULT_TIMEOUT_MS = 9 * 60 * 1000;
const DEFAULT_POLL_INTERVAL_MS = 3000;

const IMAGE_DIMENSIONS = {
  '1:1': {
    aihorde: {
      standard: { width: 512, height: 512 },
      hd: { width: 1024, height: 1024 }
    },
    pollinations: {
      standard: { width: 512, height: 512 },
      hd: { width: 768, height: 768 }
    }
  },
  '16:9': {
    aihorde: {
      standard: { width: 1024, height: 576 },
      hd: { width: 1024, height: 576 }
    },
    pollinations: {
      standard: { width: 512, height: 288 },
      hd: { width: 768, height: 432 }
    }
  },
  '9:16': {
    aihorde: {
      standard: { width: 576, height: 1024 },
      hd: { width: 576, height: 1024 }
    },
    pollinations: {
      standard: { width: 288, height: 512 },
      hd: { width: 432, height: 768 }
    }
  },
  '4:3': {
    aihorde: {
      standard: { width: 768, height: 576 },
      hd: { width: 1024, height: 768 }
    },
    pollinations: {
      standard: { width: 512, height: 384 },
      hd: { width: 768, height: 576 }
    }
  },
  '3:4': {
    aihorde: {
      standard: { width: 576, height: 768 },
      hd: { width: 768, height: 1024 }
    },
    pollinations: {
      standard: { width: 384, height: 512 },
      hd: { width: 576, height: 768 }
    }
  }
};

const MAX_RETRIES = 2;
const MAX_AUTOMATIC_RETRY_WAIT_SECONDS = 300;

export function getImageDimensions(aspectRatio, provider, resolution = 'standard') {
  const dimensions = IMAGE_DIMENSIONS[aspectRatio]?.[provider]?.[resolution];
  if (!dimensions) {
    throw new Error('Choose a supported image aspect ratio, provider, and resolution.');
  }
  return dimensions;
}

function getRetryAfterSeconds(headers) {
  const retryAfter = headers.get('Retry-After');
  if (!retryAfter) return null;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return Math.max(1, Math.ceil(seconds));

  const retryAt = Date.parse(retryAfter);
  return Number.isNaN(retryAt) ? null : Math.max(1, Math.ceil((retryAt - Date.now()) / 1000));
}

async function waitBeforeRetry(seconds, attempt, onStatus, sleep, shouldStop) {
  for (let secondsLeft = seconds; secondsLeft > 0; secondsLeft -= 1) {
    if (shouldStop()) return false;
    onStatus({
      phase: 'retrying',
      attempt: attempt + 1,
      maxAttempts: MAX_RETRIES + 1,
      waitSeconds: secondsLeft
    });
    await sleep(1000);
  }
  return !shouldStop();
}

async function withRetries(operation, {
  onStatus = () => {},
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  shouldStop = () => false,
  defaultRetryDelaySeconds = 5,
  isRetryable = (error) => error.retryable || error instanceof TypeError
} = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= MAX_RETRIES || !isRetryable(error)) throw error;

      const delay = error.retryAfterSeconds || defaultRetryDelaySeconds * (2 ** attempt);
      if (delay > MAX_AUTOMATIC_RETRY_WAIT_SECONDS) {
        throw new Error(
          `${error.message} Automatic retry paused because the provider requested a wait longer than five minutes.`
        );
      }
      if (!await waitBeforeRetry(delay, attempt, onStatus, sleep, shouldStop)) return null;
    }
  }
}

export async function generatePollinationsImage(prompt, {
  fetchImpl = fetch,
  signal,
  aspectRatio = '1:1',
  resolution = 'standard',
  onStatus = () => {},
  sleep,
  shouldStop
} = {}) {
  const url = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
  const { width, height } = getImageDimensions(aspectRatio, 'pollinations', resolution);
  url.searchParams.set('width', String(width));
  url.searchParams.set('height', String(height));
  url.searchParams.set('safe', 'true');
  if (shouldStop?.()) return null;

  return withRetries(async () => {
    const response = await fetchImpl(url, { signal });
    if (!response.ok) {
      let detail = '';
      try {
        const error = await response.json();
        if (typeof error.message === 'string') detail = ` ${error.message}`;
        else if (typeof error.error === 'string') detail = ` ${error.error}`;
      } catch {
        detail = '';
      }

      const rateLimited = response.status === 402 || response.status === 429;
      const transient = [500, 502, 503, 504].includes(response.status);
      const retryAfterSeconds = getRetryAfterSeconds(response.headers)
        || (rateLimited ? 45 : null);
      const error = new Error(rateLimited
        ? `Pollinations' free per-IP limit has been reached. Wait at least ${retryAfterSeconds} seconds before retrying.${detail}`
        : `Pollinations could not generate this image (${response.status}).${detail}`);
      error.retryable = rateLimited || transient;
      error.retryAfterSeconds = retryAfterSeconds;
      throw error;
    }

    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) {
      throw new Error('Pollinations returned an invalid image response.');
    }
    return blob;
  }, {
    onStatus,
    sleep,
    shouldStop,
    defaultRetryDelaySeconds: 5,
    isRetryable: (error) => (
      error.retryable || (error instanceof TypeError && error.name !== 'AbortError')
    )
  });
}

export async function fetchAvailableImageModels({ fetchImpl = fetch, signal } = {}) {
  const response = await fetchImpl(`${AI_HORDE_API}/status/models?type=image`, {
    headers: { 'Client-Agent': CLIENT_AGENT },
    signal
  });
  const models = await readResponse(response);
  if (!Array.isArray(models)) {
    throw new Error('The image service returned an invalid model list.');
  }

  return models
    .filter((model) => (
      model
      && model.type === 'image'
      && typeof model.name === 'string'
      && model.name.length > 0
      && Number.isFinite(model.count)
      && model.count > 0
      && !/(?:nsfw|hentai|afterdark|yiff|porn|sex)/i.test(model.name)
    ))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function readResponse(response) {
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (response.ok) {
        throw new Error('The image service returned an unreadable response.');
      }
      data = { message: text };
    }
  }

  if (!response.ok) {
    const detail = typeof data.message === 'string' ? ` ${data.message}` : '';
    const retryAfterSeconds = getRetryAfterSeconds(response.headers);
    if (response.status === 429) {
      const error = new Error(`The free image service is rate limiting requests.${detail}`);
      error.status = response.status;
      error.retryable = true;
      error.retryAfterSeconds = retryAfterSeconds;
      throw error;
    }
    if ([500, 502, 503, 504].includes(response.status)) {
      const error = new Error(`The free image service is temporarily unavailable.${detail}`);
      error.status = response.status;
      error.retryable = true;
      error.retryAfterSeconds = retryAfterSeconds;
      throw error;
    }
    throw new Error(`The free image service returned an error (${response.status}).${detail}`);
  }

  return data;
}

async function wait(milliseconds, sleep) {
  await sleep(milliseconds);
}

function decodeImage(imageData) {
  if (typeof imageData !== 'string' || imageData.length === 0) {
    throw new Error('The image service completed the request without returning an image.');
  }

  if (imageData.startsWith('https://')) {
    return imageData;
  }

  const dataUrlMatch = imageData.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
  const mimeType = dataUrlMatch?.[1] || 'image/webp';
  const base64 = dataUrlMatch?.[2] || imageData;
  let binary;
  try {
    binary = atob(base64);
  } catch {
    throw new Error('The image service returned an invalid image file.');
  }

  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

async function downloadImage(imageData, fetchImpl, signal) {
  const decoded = decodeImage(imageData);
  if (decoded instanceof Blob) return decoded;

  const response = await fetchImpl(decoded, { signal });
  if (!response.ok) {
    const error = new Error(`Could not download the generated image (${response.status}).`);
    if (response.status === 429 || response.status === 503) {
      error.retryable = true;
      error.retryAfterSeconds = getRetryAfterSeconds(response.headers);
    }
    throw error;
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('The image service returned an invalid image file.');
  }
  return blob;
}

export async function generateHordeImage(prompt, {
  fetchImpl = fetch,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  now = Date.now,
  onStatus = () => {},
  shouldStop = () => false,
  signal,
  model,
  aspectRatio = '1:1',
  resolution = 'standard',
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS
} = {}) {
  const submission = await withRetries(async () => {
    const response = await fetchImpl(`${AI_HORDE_API}/generate/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANONYMOUS_API_KEY,
        'Client-Agent': CLIENT_AGENT
      },
      body: JSON.stringify({
        prompt,
        params: {
          ...getImageDimensions(aspectRatio, 'aihorde', resolution),
          steps: 20,
          n: 1
        },
        nsfw: false,
        censor_nsfw: true,
        slow_workers: true,
        validated_backends: true,
        models: model ? [model] : undefined,
        r2: false
      }),
      signal
    });
    return readResponse(response);
  }, {
    onStatus,
    sleep,
    shouldStop,
    isRetryable: (error) => error.retryable && error.status === 429
  });
  if (!submission) return null;
  if (typeof submission.id !== 'string' || submission.id.length === 0) {
    throw new Error('The image service did not return a generation ID.');
  }

  const deadline = now() + timeoutMs;
  let requestDone = false;
  while (!requestDone) {
    const remaining = deadline - now();
    if (remaining <= 0) {
      throw new Error('No volunteer GPU completed this image in time. The request timed out; please try again later.');
    }

    await wait(Math.min(pollIntervalMs, remaining), sleep);
    const check = await withRetries(async () => {
      const response = await fetchImpl(`${AI_HORDE_API}/generate/check/${submission.id}`, {
        headers: { 'Client-Agent': CLIENT_AGENT },
        signal
      });
      return readResponse(response);
    }, { onStatus, sleep, shouldStop });
    if (!check) return null;

    if (check.faulted) {
      throw new Error('The image service could not complete this request. Please try again later.');
    }
    if (check.is_possible === false) {
      throw new Error('No available volunteer GPU can currently process this image request. Please try again later.');
    }

    onStatus({
      phase: 'waiting',
      queuePosition: check.queue_position,
      waitSeconds: check.wait_time,
      waiting: check.waiting,
      processing: check.processing
    });
    requestDone = check.done === true;
  }

  onStatus({ phase: 'retrieving' });
  const result = await withRetries(async () => {
    const response = await fetchImpl(`${AI_HORDE_API}/generate/status/${submission.id}`, {
      headers: { 'Client-Agent': CLIENT_AGENT },
      signal
    });
    return readResponse(response);
  }, { onStatus, sleep, shouldStop });
  if (!result) return null;
  if (result.faulted) {
    throw new Error('The image service could not complete this request. Please try again later.');
  }
  if (!Array.isArray(result.generations) || result.generations.length === 0) {
    throw new Error('The image service completed the request without returning an image.');
  }

  return withRetries(
    () => downloadImage(result.generations[0].img, fetchImpl, signal),
    { onStatus, sleep, shouldStop }
  );
}
