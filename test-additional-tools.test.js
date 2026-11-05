import test from 'node:test';
import assert from 'node:assert/strict';
import { ADDITIONAL_TOOLS, runAdditionalTool } from './src/utils/additionalTools.js';
import { runAssistantTool } from './src/utils/assistantTools.js';

test('registers at least 50 unique, executable additional tools', () => {
  const ids = ADDITIONAL_TOOLS.map(tool => tool.id);
  const paths = ADDITIONAL_TOOLS.map(tool => tool.path);

  assert.ok(ADDITIONAL_TOOLS.length >= 50);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(ADDITIONAL_TOOLS.every(tool => tool.title && tool.desc && typeof tool.run === 'function'));
});

test('converts case, slugs, and counts text', async () => {
  assert.equal(await runAdditionalTool('text-case-converter', 'hELLO wORLD', { mode: 'title' }), 'Hello World');
  assert.equal(await runAdditionalTool('slug-generator', ' Crème Brûlée & Tea '), 'creme-brulee-tea');
  assert.match(await runAdditionalTool('text-counter', 'One two\nthree'), /Words: 3/);
});

test('sorts lines and removes duplicate rows without changing first-seen order', async () => {
  assert.equal(await runAdditionalTool('line-sorter', 'pear\napple\nPear'), 'apple\npear\nPear');
  assert.equal(await runAdditionalTool('duplicate-line-remover', 'a\nb\na\n'), 'a\nb\n');
});

test('converts UTF-8 text to and from binary and hexadecimal', async () => {
  const text = 'Hi 😊';
  assert.equal(await runAdditionalTool('binary-to-text', await runAdditionalTool('text-to-binary', text)), text);
  assert.equal(await runAdditionalTool('hex-to-text', await runAdditionalTool('text-to-hex', text)), text);
});

test('encodes and decodes Unicode escape sequences including supplementary characters', async () => {
  const escaped = await runAdditionalTool('unicode-escape-converter', 'Hi 😊');
  assert.match(escaped, /\\u\{1f60a\}/);
  assert.equal(await runAdditionalTool('unicode-escape-converter', escaped, { mode: 'decode' }), 'Hi 😊');
});

test('converts CSV with quoted commas and escaped quotes to JSON', async () => {
  const csv = 'name,note\nAda,"likes, commas"\nLin,"said ""hello"""';
  assert.deepEqual(JSON.parse(await runAdditionalTool('csv-to-json', csv)), [
    { name: 'Ada', note: 'likes, commas' },
    { name: 'Lin', note: 'said "hello"' }
  ]);
});

test('converts TSV, JSON schema, and JSONPath input', async () => {
  assert.equal(await runAdditionalTool('tsv-to-csv', 'name\tage\nAda\t36'), 'name,age\nAda,36');
  assert.match(await runAdditionalTool('json-schema-generator', '{"count":2}'), /"type": "object"/);
  assert.equal(
    await runAdditionalTool('jsonpath-query', '{"items":[{"name":"Ada"}]}', { path: '$.items[0].name' }),
    '"Ada"'
  );
});

test('converts Roman numerals and colors with range validation', async () => {
  assert.equal(await runAdditionalTool('roman-numeral-converter', '1994'), 'MCMXCIV');
  assert.equal(await runAdditionalTool('roman-numeral-converter', 'MCMXCIV', { direction: 'toNumber' }), '1994');
  assert.match(await runAdditionalTool('color-format-converter', '#fff'), /RGB: rgb\(255, 255, 255\)/);
  await assert.rejects(runAdditionalTool('roman-numeral-converter', '4000'), /1 to 3999/);
});

test('guards malformed JSON and regular expressions with clear errors', async () => {
  await assert.rejects(runAdditionalTool('json-minifier', '{bad'), /Invalid JSON/);
  await assert.rejects(runAdditionalTool('regex-replace', 'sample', { pattern: '[', flags: 'g' }), /Invalid regular expression/);
});

test('assistant can execute common added converters without describing implementation details', async () => {
  const binaryResult = await runAssistantTool('Convert text to binary "Hi"');
  assert.equal(binaryResult.tool, 'Text to Binary');
  assert.equal(binaryResult.output, '01001000 01101001');

  const caseResult = await runAssistantTool('Convert "hello world" to title case');
  assert.equal(caseResult.tool, 'Text Case Converter');
  assert.equal(caseResult.output, 'Hello World');

  const slugResult = await runAssistantTool('Use URL Slug Generator for "Crème Brûlée & Tea"');
  assert.equal(slugResult.tool, 'URL Slug Generator');
  assert.equal(slugResult.output, 'creme-brulee-tea');

  const unitResult = await runAssistantTool('Convert 10 km to miles');
  assert.equal(unitResult.tool, 'Unit Converter');
  assert.match(unitResult.output, /6\.21371 miles/);

  const percentResult = await runAssistantTool('What is 15% of 200?');
  assert.equal(percentResult.tool, 'Percentage Calculator');
  assert.equal(percentResult.output, '30');
});
