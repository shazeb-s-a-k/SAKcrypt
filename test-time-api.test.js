import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './api/time.js';

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

test('returns server-synchronized time and Unix timestamps for requested IANA zones', () => {
  const response = createResponse();
  handler({
    method: 'GET',
    headers: { host: 'sakrypt.example', origin: 'https://sakrypt.example' },
    query: { timeZone: 'Asia/Tokyo' }
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.timeZone, 'Asia/Tokyo');
  assert.ok(Number.isFinite(Date.parse(response.body.iso)));
  assert.equal(response.body.unixSeconds, Math.floor(response.body.unixMilliseconds / 1000));
  assert.match(response.body.time, /\d{4}/);
  assert.match(response.body.utcOffset, /^GMT[+-]/);
  assert.equal(response.headers['Cache-Control'], 'no-store');
});

test('rejects invalid time zones, cross-origin requests, and unsupported methods', () => {
  const invalidZone = createResponse();
  handler({ method: 'GET', headers: { host: 'sakrypt.example' }, query: { timeZone: 'Not/A_Timezone' } }, invalidZone);
  assert.equal(invalidZone.statusCode, 400);
  assert.match(invalidZone.body.error, /valid IANA time zone/);

  const crossOrigin = createResponse();
  handler({
    method: 'GET',
    headers: { host: 'sakrypt.example', origin: 'https://attacker.example' },
    query: { timeZone: 'UTC' }
  }, crossOrigin);
  assert.equal(crossOrigin.statusCode, 403);

  const unsupportedMethod = createResponse();
  handler({ method: 'POST', headers: { host: 'sakrypt.example' }, query: {} }, unsupportedMethod);
  assert.equal(unsupportedMethod.statusCode, 405);
  assert.equal(unsupportedMethod.headers.Allow, 'GET');
});
