import { encodeMorse } from './morse.js';

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

const extractQuotedText = prompt => {
  const match = prompt.match(/["“]([\s\S]*?)["”]|'([^']*)'/);
  return match ? match[1] ?? match[2] : '';
};

const extractUnquotedText = prompt => {
  const match = prompt.match(/\b(?:text|message|content)\s*(?:is|:)\s*(.+?)\s*$/i);
  return match?.[1]?.replace(/[.!?]\s*$/, '').trim() || '';
};

export async function runAssistantTool(prompt, selectedText = '') {
  const tool = toolDefinitions.find(definition => definition.matches.test(prompt));
  if (!tool) return null;

  const jsonSource = tool.name === 'JSON Formatter' ? prompt.match(/\{[\s\S]*\}|\[[\s\S]*\]/)?.[0] : '';
  const text = jsonSource || extractQuotedText(prompt) || extractUnquotedText(prompt) || selectedText;
  if (tool.name !== 'UUID Generator' && !text) {
    return {
      tool: tool.name,
      path: tool.path,
      needsInput: true,
      message: `What text should I use for ${tool.name}? Put it in quotes, for example: "${tool.name === 'Phantom Text' ? 'Create a stealth copyable text using Phantom Text for "Hello"' : 'encode this text "Hello"'}".`
    };
  }

  return {
    tool: tool.name,
    path: tool.path,
    output: await tool.run(text, prompt)
  };
}
