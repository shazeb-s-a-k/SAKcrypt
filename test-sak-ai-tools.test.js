import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeMorse } from './src/utils/morse.js';
import { runAssistantTool } from './src/utils/assistantTools.js';

test('creates a copyable Phantom Text result from a quoted request', async () => {
  const result = await runAssistantTool('Create a stealth copyable text using Phantom Text to convert "Hello"');

  assert.equal(result.tool, 'Phantom Text');
  assert.equal(result.path, '/phantom');
  assert.equal(result.output, encodeMorse('Hello', 'stealth'));
  assert.ok(result.output.length > 0);
});

test('asks for text when a direct tool request has no input', async () => {
  const result = await runAssistantTool('Create a stealth copyable text using Phantom Text');

  assert.equal(result.needsInput, true);
  assert.match(result.message, /What text should I use/);
});

test('does not silently drop unsupported Phantom Text characters', async () => {
  await assert.rejects(
    runAssistantTool('Use Phantom Text to encode "Hello!"'),
    /supports letters, numbers, and spaces/
  );
});

test('formats raw JSON with the site formatter', async () => {
  const result = await runAssistantTool('Format this JSON: {"ok":true}');

  assert.equal(result.tool, 'JSON Formatter');
  assert.equal(result.output, '{\n  "ok": true\n}');
});

test('encodes UTF-8 text with the site Base64 tool', async () => {
  const result = await runAssistantTool('Encode this text as Base64: "café"');

  assert.equal(result.tool, 'Base64 Converter');
  assert.equal(result.output, 'Y2Fmw6k=');
});

test('encodes text with the site URL tool', async () => {
  const result = await runAssistantTool('URL encode "hello world"');

  assert.equal(result.tool, 'URL Encoder');
  assert.equal(result.output, 'hello%20world');
});

test('decodes Base64 text with the site converter', async () => {
  const result = await runAssistantTool('Decode this Base64 text: "Y2Fmw6k="');

  assert.equal(result.output, 'café');
});

test('formats a UUID with the site generator', async () => {
  const result = await runAssistantTool('Generate a UUID');

  assert.equal(result.tool, 'UUID Generator');
  assert.match(result.output, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test('uses a supported Web Crypto algorithm for SHA-512 requests', async () => {
  const result = await runAssistantTool('Calculate SHA-512 for "hello"');

  assert.equal(result.tool, 'Hash Engine');
  assert.equal(result.output, '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043');
});

test('does not claim to execute a tool without a registered action', async () => {
  assert.equal(await runAssistantTool('Generate a QR code for hello'), null);
});
