import { getImageDimensions } from '../src/utils/aiHorde.js';

const CLOUDFLARE_MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
const MAX_PROMPT_LENGTH = 2048;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const CLIENT_COOLDOWN_MS = 3000;
const MAX_TRACKED_CLIENTS = 1000;
const recentClientRequests = new Map();

function getErrorMessage(data, fallback) {
  const messages = Array.isArray(data?.errors)
    ? data.errors.map((error) => error?.message).filter((message) => typeof message === 'string')
    : [];
  const message = messages[0] || data?.error || data?.message || fallback;
  return String(message).slice(0, 500);
}

function sendError(res, status, message, retryable = false, retryAfterSeconds) {
  if (retryAfterSeconds) res.setHeader('Retry-After', String(retryAfterSeconds));
  return res.status(status).json({
    error: message,
    retryable,
    ...(retryAfterSeconds ? { retryAfterSeconds } : {})
  });
}

function getRetryAfterSeconds(headers) {
  const retryAfter = headers.get('Retry-After');
  if (!retryAfter) return undefined;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return Math.max(1, Math.ceil(seconds));

  const retryAt = Date.parse(retryAfter);
  return Number.isNaN(retryAt) ? undefined : Math.max(1, Math.ceil((retryAt - Date.now()) / 1000));
}

function getClientIp(req) {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  return typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : '';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'GET') {
    const configured = Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
    return res.status(200).json({ configured });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    return sendError(
      res,
      503,
      'Cloudflare image generation is not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to the Vercel project environment variables, then redeploy.'
    );
  }

  const body = typeof req.body === 'string'
    ? (() => {
      try {
        return JSON.parse(req.body);
      } catch {
        return null;
      }
    })()
    : req.body;
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({
      error: `Enter a prompt between 1 and ${MAX_PROMPT_LENGTH} characters.`
    });
  }

  let dimensions;
  try {
    dimensions = getImageDimensions(body.aspectRatio || '1:1', 'cloudflare', body.resolution || 'standard');
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const clientIp = getClientIp(req);
  if (clientIp) {
    const now = Date.now();
    const lastRequest = recentClientRequests.get(clientIp);
    if (lastRequest && now - lastRequest < CLIENT_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((CLIENT_COOLDOWN_MS - (now - lastRequest)) / 1000);
      return sendError(res, 429, 'Please wait before submitting another Cloudflare image request.', true, retryAfterSeconds);
    }
    if (recentClientRequests.size >= MAX_TRACKED_CLIENTS) {
      for (const [ip, timestamp] of recentClientRequests) {
        if (now - timestamp >= CLIENT_COOLDOWN_MS) recentClientRequests.delete(ip);
      }
      if (recentClientRequests.size >= MAX_TRACKED_CLIENTS) {
        recentClientRequests.delete(recentClientRequests.keys().next().value);
      }
    }
    recentClientRequests.set(clientIp, now);
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${CLOUDFLARE_MODEL}`;
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        ...dimensions,
        num_steps: 20,
        guidance: 7.5
      })
    });
  } catch {
    return sendError(res, 502, 'Could not connect to Cloudflare Workers AI. Please try again.', true);
  }

  if (!response.ok) {
    const retryAfterSeconds = getRetryAfterSeconds(response.headers);
    let responseData = {};
    try {
      responseData = await response.json();
    } catch {
      responseData = {};
    }

    const detail = getErrorMessage(responseData, `Cloudflare Workers AI returned HTTP ${response.status}.`)
      .replaceAll(apiToken, '[redacted]');
    const quotaExhausted = /daily.{0,30}(?:quota|limit)|(?:quota|limit).{0,30}(?:daily|neuron|free plan)|billing.{0,20}required/i
      .test(detail);
    const retryable = !quotaExhausted
      && (response.status === 429 || [500, 502, 503, 504].includes(response.status));
    return sendError(res, response.status, detail, retryable, retryAfterSeconds);
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.startsWith('image/')) {
    return sendError(res, 502, 'Cloudflare Workers AI returned an unexpected non-image response.');
  }

  const image = Buffer.from(await response.arrayBuffer());
  if (image.length > MAX_IMAGE_BYTES) {
    return sendError(
      res,
      413,
      'The generated image is too large for Vercel to return. Choose Standard resolution and try again.'
    );
  }
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', String(image.length));
  return res.status(200).send(image);
}

export const config = { maxDuration: 60 };
