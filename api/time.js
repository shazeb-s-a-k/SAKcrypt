function sendJson(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(status).json(body);
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  const origin = req.headers?.origin;
  const host = req.headers?.host;
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return sendJson(res, 403, { error: 'Cross-origin time requests are not allowed.' });
    } catch {
      return sendJson(res, 403, { error: 'Invalid request origin.' });
    }
  }

  const timeZone = typeof req.query?.timeZone === 'string'
    ? req.query.timeZone
    : new URL(req.url || '/', `https://${host || 'localhost'}`).searchParams.get('timeZone') || 'UTC';
  const now = new Date();
  try {
    const time = new Intl.DateTimeFormat('en', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone
    }).format(now);
    const utcOffset = new Intl.DateTimeFormat('en', {
      timeZone,
      timeZoneName: 'longOffset'
    }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || 'Unknown';
    return sendJson(res, 200, {
      timeZone,
      time,
      utcOffset,
      iso: now.toISOString(),
      unixMilliseconds: now.getTime(),
      unixSeconds: Math.floor(now.getTime() / 1000)
    });
  } catch {
    return sendJson(res, 400, { error: 'Use a valid IANA time zone, such as Asia/Tokyo or America/New_York.' });
  }
}
