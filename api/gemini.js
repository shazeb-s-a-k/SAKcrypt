const DEFAULT_MODEL = 'gemini-2.5-flash';
const MAX_PROMPT_LENGTH = 100 * 1024;
const MAX_SYSTEM_INSTRUCTION_LENGTH = 16 * 1024;
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 20 * 1024;
const MAX_OUTPUT_TOKENS = 8192;
const CLIENT_COOLDOWN_MS = 3000;
const MAX_TRACKED_CLIENTS = 1000;
const UPSTREAM_TIMEOUT_MS = 25000;
const recentClientRequests = new Map();

const sendError = (res, status, message, retryAfterSeconds) => {
  if (retryAfterSeconds) res.setHeader('Retry-After', String(retryAfterSeconds));
  return res.status(status).json({ error: message });
};

const parseBody = body => {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

function isSameOriginRequest(req) {
  const origin = req.headers?.origin;
  const host = req.headers?.host;
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function applyClientCooldown(req, res) {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  const clientIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : '';
  if (!clientIp) return null;

  const now = Date.now();
  const lastRequest = recentClientRequests.get(clientIp);
  if (lastRequest && now - lastRequest < CLIENT_COOLDOWN_MS) {
    const retryAfterSeconds = Math.ceil((CLIENT_COOLDOWN_MS - (now - lastRequest)) / 1000);
    return sendError(res, 429, 'Please wait before submitting another AI request.', retryAfterSeconds);
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
  return null;
}

function normalizeMessages(body) {
  const rawMessages = Array.isArray(body.messages)
    ? body.messages.slice(-MAX_HISTORY_MESSAGES)
    : typeof body.prompt === 'string' && body.prompt.trim()
      ? [{ role: 'user', content: body.prompt.trim() }]
      : [];
  const messages = [];
  let totalLength = 0;

  for (const message of rawMessages) {
    if (!['user', 'model'].includes(message?.role) || typeof message.content !== 'string') continue;
    const content = message.content.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) continue;
    totalLength += content.length;
    if (totalLength > MAX_PROMPT_LENGTH) return null;

    const previousMessage = messages.at(-1);
    if (previousMessage?.role === message.role) previousMessage.content += `\n\n${content}`;
    else messages.push({ role: message.role, content });
  }

  if (messages[0]?.role === 'model') {
    messages.unshift({ role: 'user', content: '(Conversation started.)' });
  }
  return messages;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method === 'GET') {
    return res.status(200).json({ configured: Boolean(process.env.GEMINI_API_KEY) });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!isSameOriginRequest(req)) {
    return sendError(res, 403, 'Cross-origin AI requests are not allowed.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendError(res, 503, 'Gemini-powered tools are not configured. Please try again later.');
  }

  const body = parseBody(req.body);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return sendError(res, 400, 'The AI request body is invalid.');
  }

  const systemInstruction = typeof body.systemInstruction === 'string'
    ? body.systemInstruction.trim()
    : '';
  if (systemInstruction.length > MAX_SYSTEM_INSTRUCTION_LENGTH) {
    return sendError(res, 400, 'The AI instructions are too large.');
  }

  const messages = normalizeMessages(body);
  if (!messages?.length) {
    return sendError(res, 400, `Enter a prompt under ${MAX_PROMPT_LENGTH} characters.`);
  }

  const model = typeof body.model === 'string' ? body.model : DEFAULT_MODEL;
  if (!/^gemini-[a-zA-Z0-9._-]{1,80}$/.test(model)) {
    return sendError(res, 400, 'Choose a valid Gemini model.');
  }
  const temperature = Number(body.temperature);
  const maxOutputTokens = Number(body.maxOutputTokens);
  const generationConfig = {
    maxOutputTokens: Number.isFinite(maxOutputTokens)
      ? Math.min(MAX_OUTPUT_TOKENS, Math.max(1, Math.floor(maxOutputTokens)))
      : 2048
  };
  if (Number.isFinite(temperature)) {
    generationConfig.temperature = Math.min(2, Math.max(0, temperature));
  }
  const googleSearch = body.googleSearch === true;

  const cooldownResponse = applyClientCooldown(req, res);
  if (cooldownResponse) return cooldownResponse;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  let upstream;
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      body: JSON.stringify({
        ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        ...(googleSearch ? { tools: [{ google_search: {} }] } : {}),
        contents: messages.map(message => ({
          role: message.role,
          parts: [{ text: message.content }]
        })),
        generationConfig
      })
    });
  } catch {
    return sendError(res, 502, 'Could not connect to Gemini. Please try again shortly.');
  }

  let data;
  try {
    data = await upstream.json();
  } catch {
    return sendError(res, 502, 'Gemini returned an invalid response. Please try again.');
  }

  if (!upstream.ok) {
    if (upstream.status === 429) {
      return sendError(res, 503, 'Gemini is busy right now. Please try again shortly.', 10);
    }
    return sendError(
      res,
      upstream.status >= 500 ? 502 : 503,
      'Gemini could not complete that request. Please check the request and try again.'
    );
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map(part => typeof part.text === 'string' ? part.text : '')
    .join('')
    .trim();
  if (!text) {
    return sendError(res, 502, 'Gemini returned an empty response. Please try again.');
  }
  const sources = googleSearch
    ? [...(data.candidates?.[0]?.groundingMetadata?.groundingChunks || []).reduce((uniqueSources, chunk) => {
      const source = chunk?.web;
      if (typeof source?.uri === 'string' && /^https:\/\//i.test(source.uri) && !uniqueSources.has(source.uri)) {
        uniqueSources.set(source.uri, {
          title: typeof source.title === 'string' ? source.title.slice(0, 200) : source.uri,
          url: source.uri
        });
      }
      return uniqueSources;
    }, new Map()).values()].slice(0, 8)
    : [];
  return res.status(200).json({
    text,
    ...(googleSearch ? { sources } : {})
  });
}

export const config = { maxDuration: 30 };
