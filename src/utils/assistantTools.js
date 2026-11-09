import { encodeMorse } from './morse.js';
import { ADDITIONAL_TOOLS, runAdditionalTool } from './additionalTools.js';

const toolDefinitions = [
  {
    name: 'Phantom Text',
    path: '/phantom',
    matches: /\b(phantom|stealth(?:\s+(?:text|copy|message))?|zero[-\s]?width|invisible text)\b/i,
    run: text => {
      if (!/^[a-z0-9\s]+$/i.test(text)) {
        const unsupported = [...new Set([...text].filter(char => !/[a-z0-9\s]/i.test(char)))].join(' ');
        throw new Error(`Phantom Text currently supports letters, numbers, and spaces. Remove or replace: ${unsupported}`);
      }
      return encodeMorse(text, 'stealth');
    }
  },
  {
    name: 'JSON Formatter',
    path: '/json',
    matches: /\b(json\s+(?:format|beautif|validat|minif)|(?:format|beautif|minif|validate)\s+(?:this\s+)?json|json formatter)\b/i,
    run: (text, prompt) => {
      const source = text || prompt.match(/\{[\s\S]*\}|\[[\s\S]*\]/)?.[0];
      if (!source) throw new Error('Include the JSON to format in quotes or a code block.');
      return JSON.stringify(JSON.parse(source), null, 2);
    }
  },
  {
    name: 'Base64 Converter',
    path: '/base64',
    matches: /\b(base\s*64|base64)\b/i,
    run: (text, prompt) => {
      if (!text) throw new Error('Include the text to encode or decode in quotes.');
      if (/\b(decode|decoding)\b/i.test(prompt)) {
        const bytes = Uint8Array.from(atob(text.trim()), char => char.charCodeAt(0));
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      }
      const bytes = new TextEncoder().encode(text);
      let binary = '';
      bytes.forEach(byte => { binary += String.fromCharCode(byte); });
      return btoa(binary);
    }
  },
  {
    name: 'URL Encoder',
    path: '/url',
    matches: /\b(url|uri)\b.{0,24}\b(encode|decode)\b|\b(encode|decode)\b.{0,24}\b(url|uri)\b/i,
    run: (text, prompt) => {
      if (!text) throw new Error('Include the text or URL to encode or decode in quotes.');
      return /\b(decode|decoding)\b/i.test(prompt)
        ? decodeURIComponent(text)
        : encodeURIComponent(text);
    }
  },
  {
    name: 'UUID Generator',
    path: '/uuid',
    matches: /\b(generate|create|make)\b.{0,30}\buuid\b|\buuid\b.{0,30}\b(generate|create|make)\b/i,
    run: () => crypto.randomUUID()
  },
  {
    name: 'Hash Engine',
    path: '/hash',
    matches: /\b(sha[-\s]?(?:256|384|512)|hash(?:ing)?\s+(?:this\s+)?text)\b/i,
    run: async (text, prompt) => {
      if (!text) throw new Error('Include the text to hash in quotes.');
      const requestedBits = prompt.match(/\bsha[-\s]?(256|384|512)\b/i)?.[1];
      const algorithm = requestedBits ? `SHA-${requestedBits}` : 'SHA-256';
      const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(text));
      return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    }
  },
  {
    name: 'Text Tools',
    path: '/text',
    matches: /\b(uppercase|lowercase|word count|character count)\b/i,
    run: (text, prompt) => {
      if (!text) throw new Error('Include the text to transform or count in quotes.');
      if (/\blowercase\b/i.test(prompt)) return text.toLowerCase();
      if (/\buppercase\b/i.test(prompt)) return text.toUpperCase();
      if (/\bword count\b/i.test(prompt)) return String(text.trim().split(/\s+/).filter(Boolean).length);
      return String([...text].length);
    }
  }
];

const jsonToolIds = new Set([
  'json-flattener', 'json-pointer-query', 'json-to-sql-insert', 'json-to-go-struct',
  'json-schema-generator', 'jsonpath-query'
]);
const numericInputCounts = {
  'force-calculator': 2,
  'kinetic-energy-calculator': 2,
  'pressure-calculator': 2,
  'projectile-range-calculator': 2
};

const extractQuotedText = prompt => {
  const match = prompt.match(/["“]([\s\S]*?)["”]|'([^']*)'/);
  return match ? match[1] ?? match[2] : '';
};

const extractUnquotedText = prompt => {
  const match = prompt.match(/\b(?:text|message|content)\s*(?:is|:)\s*(.+?)\s*$/i);
  return match?.[1]?.replace(/[.!?]\s*$/, '').trim() || '';
};

const extractJsonInput = prompt => {
  const fenced = prompt.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  for (let start = 0; start < prompt.length; start += 1) {
    if (prompt[start] !== '{' && prompt[start] !== '[') continue;
    const stack = [];
    let inString = false;
    let escaped = false;
    for (let index = start; index < prompt.length; index += 1) {
      const character = prompt[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') inString = true;
      else if (character === '{' || character === '[') stack.push(character);
      else if (character === '}' || character === ']') {
        const opening = stack.pop();
        if ((opening === '{' && character !== '}') || (opening === '[' && character !== ']')) break;
        if (!stack.length) return prompt.slice(start, index + 1);
      }
    }
  }
  return '';
};

export async function runAssistantTool(prompt, selectedText = '') {
  const tool = toolDefinitions.find(definition => definition.matches.test(prompt));
  const normalizedPrompt = prompt.toLowerCase().replace(/[-_]/g, ' ');
  const additionalTool = tool ? null : ADDITIONAL_TOOLS.find(definition => {
    if (definition.inputMode === 'image') return false;
    const namedRequest = normalizedPrompt.includes(definition.title.toLowerCase())
      || normalizedPrompt.includes(definition.id.replaceAll('-', ' '));
    return definition.assistantMatch?.test(prompt) || namedRequest;
  });
  if (!tool && !additionalTool) return null;

  const jsonSource = tool?.name === 'JSON Formatter' || jsonToolIds.has(additionalTool?.id)
    ? extractJsonInput(prompt)
    : '';
  const quotedText = tool?.name === 'JSON Formatter' || jsonToolIds.has(additionalTool?.id)
    ? ''
    : extractQuotedText(prompt);
  let text = jsonSource || quotedText || extractUnquotedText(prompt) || selectedText;
  if (additionalTool?.id === 'scientific-expression-calculator' && !quotedText) {
    text = prompt
      .replace(/^\s*(?:please\s+)?(?:calculate|evaluate|solve|what is|what's)\s*/i, '')
      .replace(/\s*[?=]\s*$/, '')
      .replace(/\b(?:the\s+)?square root of\b/gi, 'sqrt(')
      .replace(/\bplus\b/gi, '+')
      .replace(/\bminus\b/gi, '-')
      .replace(/\bmultiplied by\b|\btimes\b/gi, '*')
      .replace(/\bdivided by\b/gi, '/')
      .replace(/\bto the power of\b/gi, '^')
      .trim();
    if (text.startsWith('sqrt(') && !text.endsWith(')')) text += ')';
  }
  if (additionalTool?.id === 'world-clock') {
    const timeZone = prompt.match(/\b(?:in|at)\s+(Asia\/[A-Za-z_+-]+|America\/[A-Za-z_+-]+(?:\/[A-Za-z_+-]+)?|Europe\/[A-Za-z_+-]+|Australia\/[A-Za-z_+-]+|UTC)\b/i)?.[1];
    const city = prompt.match(/\b(?:in|at)\s+(New York|Los Angeles|Chicago|Denver|Tokyo|London|Paris|Berlin|Sydney|Singapore|Dubai|Kolkata|Mumbai|Delhi)\b/i)?.[1];
    if (timeZone || city) text = timeZone || city;
  }
  if (!text && numericInputCounts[additionalTool?.id]) {
    const values = [...prompt.matchAll(/(^|[^A-Za-z0-9])(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/gi)]
      .map(match => match[2])
      .slice(0, numericInputCounts[additionalTool.id]);
    if (values.length) text = values.join(',');
  }
  if (!text && additionalTool?.id === 'roman-numeral-converter') {
    text = prompt.match(/\b[MDCLXVI]{1,15}\b/i)?.[0] || '';
  }
  if (!text && ['unit-converter', 'roman-numeral-converter', 'timestamp-converter'].includes(additionalTool?.id)) {
    text = prompt.match(/-?\d+(?:\.\d+)?/)?.[0] || '';
  }
  if (!text && additionalTool?.id === 'percentage-calculator') {
    const values = prompt.match(/-?\d+(?:\.\d+)?/g) || [];
    if (values.length >= 2) text = `${values[0]},${values[1]}`;
  }
  const toolName = tool?.name || additionalTool.title;
  const toolPath = tool?.path || additionalTool.path;
  const additionalToolNeedsInput = additionalTool?.requiresInput !== false;
  if ((toolName !== 'UUID Generator' && additionalToolNeedsInput) && !text) {
    return {
      tool: toolName,
      path: toolPath,
      needsInput: true,
      message: `What text should I use for ${toolName}? Put it in quotes, for example: "${toolName === 'Phantom Text' ? 'Create a stealth copyable text using Phantom Text for "Hello"' : 'convert this text "Hello"'}".`
    };
  }

  if (additionalTool) {
    const options = Object.fromEntries(
      additionalTool.fields.map(field => [field.name, field.defaultValue ?? ''])
    );
    if (additionalTool.id === 'world-clock') options.timeZone = text || options.timeZone;
    if (additionalTool.id === 'text-case-converter') {
      options.mode = /\buppercase\b/i.test(prompt) ? 'upper'
        : /\blowercase\b/i.test(prompt) ? 'lower'
          : /\bsentence case\b/i.test(prompt) ? 'sentence' : 'title';
    }
    if (additionalTool.id === 'unicode-escape-converter' && /\b(?:decode|unescape)\b/i.test(prompt)) options.mode = 'decode';
    if (additionalTool.id === 'json-string-escape' && /\b(?:decode|unescape)\b/i.test(prompt)) options.mode = 'unescape';
    if (additionalTool.id === 'roman-numeral-converter' && /\b(?:roman|numeral)\b[\s\S]*\b(?:number|integer)\b/i.test(prompt)) options.direction = 'toNumber';
    if (additionalTool.id === 'timestamp-converter' && /\b(?:unix|timestamp)\b/i.test(prompt)) options.direction = 'toTimestamp';
    if (additionalTool.id === 'url-component-converter' && /\bdecode\b/i.test(prompt)) options.direction = 'decode';
    if (additionalTool.id === 'base64-url-safe-converter' && /\bdecode\b/i.test(prompt)) options.direction = 'decode';
    if (additionalTool.id === 'json-pointer-query') {
      options.pointer = prompt.match(/\b(?:pointer|path)\s*(?:is|=|:)?\s*["']?(\/[^ \t\r\n"'`]+)/i)?.[1]?.replace(/[.,!?;:]$/, '') || '';
    }
    if (additionalTool.id === 'unit-converter') {
      const unit = prompt.match(/\b(km|kilometers?)\b[\s\S]*\b(miles?)\b/i) ? 'kmToMi'
        : prompt.match(/\b(miles?)\b[\s\S]*\b(km|kilometers?)\b/i) ? 'miToKm'
          : prompt.match(/\b(m|meters?)\b[\s\S]*\b(ft|feet)\b/i) ? 'mToFt'
            : prompt.match(/\b(ft|feet)\b[\s\S]*\b(m|meters?)\b/i) ? 'ftToM'
          : prompt.match(/\b(kg|kilograms?)\b[\s\S]*\b(pounds?|lbs?)\b/i) ? 'kgToLb'
            : prompt.match(/\b(pounds?|lbs?)\b[\s\S]*\b(kg|kilograms?)\b/i) ? 'lbToKg'
              : prompt.match(/\b(l|liters?)\b[\s\S]*\b(gallons?)\b/i) ? 'lToGal'
                : prompt.match(/\b(gallons?)\b[\s\S]*\b(l|liters?)\b/i) ? 'galToL'
                  : prompt.match(/\b(celsius|c)\b[\s\S]*\b(fahrenheit|f)\b/i) ? 'cToF'
                    : prompt.match(/\b(fahrenheit|f)\b[\s\S]*\b(celsius|c)\b/i) ? 'fToC' : options.unit;
      options.unit = unit;
    }
    if (additionalTool.id === 'percentage-calculator') {
      if (/\bwhat\s+percent|\bwhat\s+percentage/i.test(prompt)) options.mode = 'of';
      else if (/\bchange\b|\bincrease\b|\bdecrease\b/i.test(prompt)) options.mode = 'change';
    }
    return {
      tool: toolName,
      path: toolPath,
      output: await runAdditionalTool(additionalTool.id, text, options)
    };
  }

  return {
    tool: toolName,
    path: toolPath,
    output: await tool.run(text, prompt)
  };
}
