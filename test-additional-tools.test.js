import test from 'node:test';
import assert from 'node:assert/strict';
import { ADDITIONAL_TOOLS, runAdditionalTool } from './src/utils/additionalTools.js';
import { runAssistantTool } from './src/utils/assistantTools.js';

test('registers at least 250 unique, executable additional tools', () => {
  const ids = ADDITIONAL_TOOLS.map(tool => tool.id);
  const paths = ADDITIONAL_TOOLS.map(tool => tool.path);

  assert.ok(ADDITIONAL_TOOLS.length >= 250);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(ADDITIONAL_TOOLS.every(tool => tool.title && tool.desc && typeof tool.run === 'function'));
});

test('adds 26 searchable, runnable productivity and developer tools', () => {
  const addedTools = [
    'csv-transposer', 'csv-deduplicator', 'csv-row-sorter', 'csv-row-filter',
    'markdown-toc-generator', 'markdown-link-extractor', 'markdown-table-to-csv',
    'json-flattener', 'json-pointer-query', 'json-to-sql-insert', 'json-to-go-struct',
    'sql-in-clause-generator', 'url-query-builder', 'utm-link-builder', 'url-extractor',
    'regex-literal-escaper', 'css-px-rem-converter', 'css-clamp-generator', 'css-grid-generator',
    'html-boilerplate-generator', 'robots-txt-generator', 'xml-sitemap-generator',
    'gitignore-generator', 'env-example-generator', 'http-fetch-snippet-generator',
    'html-meta-inspector'
  ];
  assert.equal(addedTools.length, 26);
  assert.ok(ADDITIONAL_TOOLS.length >= 120);
  for (const id of addedTools) {
    const tool = ADDITIONAL_TOOLS.find(item => item.id === id);
    assert.ok(tool, `${id} is registered`);
    assert.ok(tool.path.startsWith('/tools/'));
    assert.equal(typeof tool.run, 'function');
  }
});

test('adds more than 100 additional math, physics, conversion, data, developer, and time tools', () => {
  const addedTools = ADDITIONAL_TOOLS.filter(tool => [
    'scientific-expression-calculator', 'kinetic-energy-calculator', 'world-clock',
    'json-to-csv-converter', 'markdown-heading-auditor', 'quadratic-equation-solver'
  ].includes(tool.id));
  assert.ok(ADDITIONAL_TOOLS.length >= 250);
  assert.ok(addedTools.length === 6);
  assert.equal(new Set(ADDITIONAL_TOOLS.map(tool => tool.id)).size, ADDITIONAL_TOOLS.length);
  assert.ok(ADDITIONAL_TOOLS.every(tool => tool.path.startsWith('/tools/') && typeof tool.run === 'function'));
});

test('evaluates scientific expressions safely and reports invalid expressions', async () => {
  assert.equal(await runAdditionalTool('scientific-expression-calculator', 'sqrt(81) + 2^3'), '17');
  assert.equal(await runAdditionalTool('scientific-expression-calculator', 'sin(pi / 2)'), '1');
  assert.equal(await runAdditionalTool('scientific-expression-calculator', '5!'), '120');
  await assert.rejects(runAdditionalTool('scientific-expression-calculator', 'globalThis.process.exit()'), /Unknown constant|Unknown function|Unexpected token/);
});

test('calculates common geometry, financial, and physics results', async () => {
  assert.match(await runAdditionalTool('circle-geometry-calculator', '2'), /Area: 12\.5663706144/);
  assert.match(await runAdditionalTool('loan-payment-calculator', '100000, 6, 30'), /Monthly payment: 599\.550525153/);
  assert.match(await runAdditionalTool('kinetic-energy-calculator', '2, 3'), /Kinetic energy: 9 J/);
  assert.match(await runAdditionalTool('projectile-range-calculator', '10, 45'), /Horizontal range: 10\.1971621298 m/);
  await assert.rejects(runAdditionalTool('triangle-geometry-calculator', '1, 2, 9'), /do not form a triangle/);
});

test('supports practical JSON, CSV, and developer workflows', async () => {
  assert.equal(await runAdditionalTool('json-to-csv-converter', '[{"name":"Ada","note":"hello, world"}]'), 'name,note\nAda,"hello, world"');
  assert.equal(await runAdditionalTool('json-deep-merge', '[{"settings":{"a":1,"b":2}},{"settings":{"b":3}}]'), '{\n  "settings": {\n    "a": 1,\n    "b": 3\n  }\n}');
  assert.equal(await runAdditionalTool('slug-case-converter', 'someVariableName', { mode: 'snake' }), 'some_variable_name');
  assert.match(await runAdditionalTool('markdown-heading-auditor', '# Title\n### Skipped'), /skips from H1 to H3/);
});

test('routes exact time and scientific math requests to local, executable tools', async () => {
  assert.equal((await runAssistantTool('Calculate 2 plus 2')).output, '4');
  assert.equal((await runAssistantTool('What is the square root of 81?')).output, '9');
  assert.match((await runAssistantTool('Calculate the kinetic energy of a 2 kg object moving at 3 m/s')).output, /Kinetic energy: 9 J/);
  assert.match((await runAssistantTool('Calculate the force on a 2 kg mass accelerating at 3 m/s2')).output, /Force: 6 N/);

  const previousFetch = globalThis.fetch;
  globalThis.fetch = async url => ({
    ok: true,
    json: async () => ({
      timeZone: new URL(url, 'https://sakrypt.example').searchParams.get('timeZone'),
      time: 'Monday, November 9, 2026 at 7:00:00 PM GMT+5:30',
      utcOffset: 'GMT+05:30',
      iso: '2026-11-09T13:30:00.000Z',
      unixSeconds: 1794231000
    })
  });
  try {
    const result = await runAssistantTool('What is the current time in Tokyo?');
    assert.equal(result.tool, 'Exact Current Time & World Clock');
    assert.match(result.output, /Asia\/Tokyo/);
    assert.match(result.output, /2026-11-09T13:30:00\.000Z/);

    const indiaResult = await runAssistantTool('what is the time inj india now?');
    assert.equal(indiaResult.tool, 'Exact Current Time & World Clock');
    assert.match(indiaResult.output, /Asia\/Kolkata/);
  } finally {
    globalThis.fetch = previousFetch;
  }
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

test('transposes, filters, sorts, and deduplicates CSV without corrupting quoted values', async () => {
  assert.equal(await runAdditionalTool('csv-transposer', 'name,note\nAda,"likes, tea"'), 'name,Ada\nnote,"likes, tea"');
  const csv = 'name,score\nAda,9\nLin,12\nada,4';
  assert.equal(
    await runAdditionalTool('csv-deduplicator', csv, { column: 'name', caseSensitive: 'no' }),
    'name,score\nAda,9\nLin,12'
  );
  assert.equal(
    await runAdditionalTool('csv-row-sorter', csv, { column: 'score', mode: 'numeric' }),
    'name,score\nada,4\nAda,9\nLin,12'
  );
  assert.equal(
    await runAdditionalTool('csv-row-filter', csv, { column: 'name', operator: 'contains', value: 'ad' }),
    'name,score\nAda,9\nada,4'
  );
  await assert.rejects(runAdditionalTool('csv-row-sorter', 'name,score\nAda,no', { column: 'score', mode: 'numeric' }), /must be a number/);
});

test('builds Markdown tables of contents, extracts links, and converts tables to CSV', async () => {
  assert.equal(
    await runAdditionalTool('markdown-toc-generator', '# Start\n## About Us\n## About Us'),
    '- [Start](#start)\n  - [About Us](#about-us)\n  - [About Us](#about-us-1)'
  );
  assert.equal(
    await runAdditionalTool('markdown-link-extractor', 'See [Docs](https://example.com/docs).'),
    'Docs\thttps://example.com/docs'
  );
  assert.equal(
    await runAdditionalTool('markdown-table-to-csv', '| Name | Note |\n| --- | --- |\n| Ada | likes \\| tea |'),
    'Name,Note\nAda,likes | tea'
  );
});

test('flattens JSON, queries JSON Pointers, and generates safe SQL and Go', async () => {
  assert.equal(
    await runAdditionalTool('json-flattener', '{"user":{"name":"Ada"},"items":[1,2]}'),
    '{\n  "/user/name": "Ada",\n  "/items/0": 1,\n  "/items/1": 2\n}'
  );
  assert.equal(
    await runAdditionalTool('json-pointer-query', '{"a/b":{"~key":7}}', { pointer: '/a~1b/~0key' }),
    '7'
  );
  assert.equal(
    await runAdditionalTool('json-to-sql-insert', JSON.stringify([{ name: "O'Reilly", age: 36 }, { name: 'Ada', age: 37 }]), { table: 'people' }),
    `INSERT INTO "people" ("name", "age") VALUES ('O''Reilly', 36);\nINSERT INTO "people" ("name", "age") VALUES ('Ada', 37);`
  );
  const go = await runAdditionalTool('json-to-go-struct', '{"first-name":"Ada","first_name":"Lin","active":true}');
  assert.match(go, /FirstName string/);
  assert.match(go, /FirstName2 string/);
  assert.match(go, /Active bool/);
  await assert.rejects(runAdditionalTool('json-to-sql-insert', '{"id":1}', { table: 'people; DROP TABLE users' }), /valid SQL table name/);
});

test('creates query and campaign URLs and extracts links', async () => {
  assert.equal(
    await runAdditionalTool('url-query-builder', 'q=hello world\npage=2', { url: 'https://example.com/search?existing=1' }),
    'https://example.com/search?existing=1&q=hello+world&page=2'
  );
  const campaign = await runAdditionalTool('utm-link-builder', 'https://example.com/item', {
    source: 'newsletter', medium: 'email', campaign: 'spring sale', term: '', content: ''
  });
  assert.match(campaign, /utm_campaign=spring\+sale/);
  assert.equal(
    await runAdditionalTool('url-extractor', 'Visit https://example.com/a, then https://example.com/a.'),
    'https://example.com/a'
  );
});

test('generates CSS, HTML, and repository templates with validated settings', async () => {
  assert.equal(await runAdditionalTool('regex-literal-escaper', 'a+b(c)'), 'a\\+b\\(c\\)');
  assert.equal(await runAdditionalTool('css-px-rem-converter', '.x { margin: 16px 8px; }'), '.x { margin: 1rem 0.5rem; }');
  assert.equal(await runAdditionalTool('css-px-rem-converter', 'font-size: 1.5rem', { direction: 'toPx', rootSize: '10' }), 'font-size: 15px');
  assert.match(await runAdditionalTool('css-clamp-generator', '', { minimum: '16', maximum: '40', minViewport: '320', maxViewport: '1200' }), /^clamp\(16px, calc\(.+vw\), 40px\)$/);
  assert.match(await runAdditionalTool('css-grid-generator', '', { columns: '4', gap: '12', alignment: 'center' }), /repeat\(4, minmax\(0, 1fr\)\)/);
  await assert.rejects(runAdditionalTool('css-grid-generator', '', { columns: '2.5', gap: '12', alignment: 'center' }), /whole number/);
  assert.match(await runAdditionalTool('html-boilerplate-generator', '', { title: '<Hello>', description: 'A "page"', themeColor: '#123abc' }), /&lt;Hello&gt;/);
  await assert.rejects(runAdditionalTool('html-boilerplate-generator', '', { title: 'Page', description: '', themeColor: 'red' }), /6-digit hex/);
  assert.match(await runAdditionalTool('gitignore-generator', '', { template: 'react' }), /node_modules\/\ndist\//);
  assert.equal(await runAdditionalTool('env-example-generator', 'API_KEY=secret\nPORT=3000\nAPI_KEY=again'), 'API_KEY=\nPORT=');
  await assert.rejects(runAdditionalTool('robots-txt-generator', '', { userAgent: '*', disallow: 'private', allow: '/', sitemap: '' }), /must start with/);
});

test('generates crawler files and safe request examples', async () => {
  const robots = await runAdditionalTool('robots-txt-generator', '', {
    userAgent: '*', disallow: '/private/\n/admin/', allow: '/', sitemap: 'https://example.com/sitemap.xml'
  });
  assert.equal(robots, 'User-agent: *\nDisallow: /private/\nDisallow: /admin/\nAllow: /\n\nSitemap: https://example.com/sitemap.xml\n');
  const sitemap = await runAdditionalTool('xml-sitemap-generator', 'https://example.com/\nhttps://example.com/page?a=1&b=2\nhttps://example.com/');
  assert.match(sitemap, /https:\/\/example\.com\/page\?a=1&amp;b=2/);
  assert.equal((sitemap.match(/<loc>/g) || []).length, 2);
  const snippet = await runAdditionalTool('http-fetch-snippet-generator', '', {
    url: 'https://api.example.com/items', method: 'POST', headers: '{"Content-Type":"application/json"}', body: '{"name":"Ada"}'
  });
  assert.match(snippet, /method": "POST"/);
  assert.ok(snippet.includes(`"body": ${JSON.stringify('{"name":"Ada"}')}`));
  await assert.rejects(
    runAdditionalTool('http-fetch-snippet-generator', '', { url: 'https://api.example.com', method: 'GET', headers: '{}', body: 'ignored' }),
    /cannot include a request body/
  );
});

test('S.A.K AI can run named tools from the expanded catalog', async () => {
  const result = await runAssistantTool(`Use JSON Pointer Query on ${JSON.stringify({ user: { name: 'Ada' } })} with pointer /user/name`);
  assert.equal(result.tool, 'JSON Pointer Query');
  assert.equal(result.output, '"Ada"');

  const missingJson = await runAssistantTool('Use JSON Pointer Query with pointer /user/name');
  assert.equal(missingJson.needsInput, true);

  const generated = await runAssistantTool('Create a robots.txt file');
  assert.equal(generated.tool, 'robots.txt Generator');
  assert.match(generated.output, /User-agent: \*/);
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
