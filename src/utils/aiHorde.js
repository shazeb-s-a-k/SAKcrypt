const AI_HORDE_API = 'https://aihorde.net/api/v2';
const ANONYMOUS_API_KEY = '0000000000';
const CLIENT_AGENT = 'SAKrypt:2.1.0:https://github.com/shazeb-s-a-k/SAKrypt';
const DEFAULT_TIMEOUT_MS = 9 * 60 * 1000;
const DEFAULT_POLL_INTERVAL_MS = 3000;

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
    if (response.status === 429) {
      throw new Error(`The free image service is rate limiting requests. Please wait before trying again.${detail}`);
    }
    if (response.status === 503) {
      throw new Error(`The free image service is temporarily unavailable.${detail}`);
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
    throw new Error(`Could not download the generated image (${response.status}).`);
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
  signal,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS
} = {}) {
  const submissionResponse = await fetchImpl(`${AI_HORDE_API}/generate/async`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANONYMOUS_API_KEY,
      'Client-Agent': CLIENT_AGENT
    },
    body: JSON.stringify({
      prompt,
      params: {
        width: 512,
        height: 512,
        steps: 20,
        n: 1
      },
      nsfw: false,
      censor_nsfw: true,
      slow_workers: true,
      validated_backends: true,
      r2: false
    }),
    signal
  });
  const submission = await readResponse(submissionResponse);
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
    const checkResponse = await fetchImpl(`${AI_HORDE_API}/generate/check/${submission.id}`, {
      headers: { 'Client-Agent': CLIENT_AGENT },
      signal
    });
    const check = await readResponse(checkResponse);

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
  const resultResponse = await fetchImpl(`${AI_HORDE_API}/generate/status/${submission.id}`, {
    headers: { 'Client-Agent': CLIENT_AGENT },
    signal
  });
  const result = await readResponse(resultResponse);
  if (result.faulted) {
    throw new Error('The image service could not complete this request. Please try again later.');
  }
  if (!Array.isArray(result.generations) || result.generations.length === 0) {
    throw new Error('The image service completed the request without returning an image.');
  }

  return downloadImage(result.generations[0].img, fetchImpl, signal);
}
