import * as yaml from 'js-yaml';
import { ADVANCED_TOOLS } from './advancedTools.js';

const encodeEntities = text => text.replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);

const decodeEntities = text => {
  const document = new DOMParser().parseFromString(text, 'text/html');
  return document.documentElement.textContent || '';
};

const parseCsv = (input, delimiter = ',') => {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"' && quoted && input[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      row.push(cell);
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
      cell = '';
      if (character === '\r' && input[index + 1] === '\n') index += 1;
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error('The CSV contains an unclosed quoted field.');
  row.push(cell);
  if (row.some(value => value !== '')) rows.push(row);
  return rows;
};

const toCsvCell = value => {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const encodeBase64 = text => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

const decodeBase64 = text => {
  const binary = atob(text.trim());
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
};

const toHex = text => [...new TextEncoder().encode(text)]
  .map(byte => byte.toString(16).padStart(2, '0')).join(' ');

const fromHex = text => {
  const normalized = text.replace(/0x/gi, '').replace(/[\s,:-]/g, '');
  if (!normalized || normalized.length % 2 || !/^[\da-f]+$/i.test(normalized)) {
    throw new Error('Enter an even number of hexadecimal digits.');
  }
  const bytes = new Uint8Array(normalized.match(/.{2}/g).map(byte => Number.parseInt(byte, 16)));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
};

const toBinary = text => [...new TextEncoder().encode(text)]
  .map(byte => byte.toString(2).padStart(8, '0')).join(' ');

const fromBinary = text => {
  const tokens = text.trim().split(/\s+/);
  if (!tokens.length || tokens.some(token => !/^[01]{1,8}$/.test(token))) {
    throw new Error('Enter binary bytes separated by spaces (for example: 01001000 01101001).');
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(tokens.map(token => Number.parseInt(token, 2))));
};

const morseCodes = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-',
  ',': '--..--', '?': '..--..', '!': '-.-.--', "'": '.----.', '/': '-..-.',
  '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.',
  '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.'
};
const morseByCode = Object.fromEntries(Object.entries(morseCodes).map(([key, value]) => [value, key]));

const csvToObjects = input => {
  const rows = parseCsv(input);
  if (rows.length < 2) throw new Error('Include a header row and at least one data row.');
  const [headers, ...data] = rows;
  return data.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
};

const jsonToXml = value => {
  const element = (name, item) => {
    const safeName = /^[A-Za-z_][\w.-]*$/.test(name) ? name : 'item';
    if (Array.isArray(item)) return item.map(child => element(safeName, child)).join('');
    if (item && typeof item === 'object') {
      return `<${safeName}>${Object.entries(item).map(([key, child]) => element(key, child)).join('')}</${safeName}>`;
    }
    return `<${safeName}>${encodeEntities(item == null ? '' : String(item))}</${safeName}>`;
  };
  const entries = Array.isArray(value) ? value.map(item => element('item', item)).join('') : element('root', value);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${entries}`;
};

const xmlToJson = input => {
  if (/<!DOCTYPE|<!ENTITY/i.test(input)) throw new Error('DOCTYPE and entity declarations are not supported.');
  const document = new DOMParser().parseFromString(input, 'application/xml');
  const error = document.querySelector('parsererror');
  if (error) throw new Error(`Invalid XML: ${error.textContent.slice(0, 180)}`);
  const visit = node => {
    const children = [...node.children];
    const attributes = Object.fromEntries([...node.attributes].map(attribute => [attribute.name, attribute.value]));
    const text = [...node.childNodes]
      .filter(child => child.nodeType === 3 || child.nodeType === 4)
      .map(child => child.nodeValue)
      .join('')
      .trim();
    if (!children.length && !Object.keys(attributes).length) return text;
    const result = {};
    if (Object.keys(attributes).length) result['@attributes'] = attributes;
    children.forEach(child => {
      const value = visit(child);
      if (Object.hasOwn(result, child.tagName)) {
        result[child.tagName] = Array.isArray(result[child.tagName])
          ? [...result[child.tagName], value]
          : [result[child.tagName], value];
      } else {
        result[child.tagName] = value;
      }
    });
    if (text) result['#text'] = text;
    return result;
  };
  return JSON.stringify({ [document.documentElement.tagName]: visit(document.documentElement) }, null, 2);
};

const toJsonSchema = value => {
  const infer = item => {
    if (item === null) return { type: 'null' };
    if (Array.isArray(item)) {
      const types = [...new Map(item.map(entry => [JSON.stringify(infer(entry)), infer(entry)])).values()];
      return { type: 'array', items: types.length === 1 ? types[0] : { anyOf: types } };
    }
    if (typeof item === 'object') {
      return {
        type: 'object',
        properties: Object.fromEntries(Object.entries(item).map(([key, child]) => [key, infer(child)])),
        required: Object.keys(item),
        additionalProperties: false
      };
    }
    return { type: typeof item };
  };
  return JSON.stringify({ $schema: 'https://json-schema.org/draft/2020-12/schema', ...infer(value) }, null, 2);
};

const parsePath = path => {
  const parts = [];
  path.replace(/^\$\.?/, '').replace(/(?:^|\.)([^.[\]]+)|\[(?:"([^"]+)"|'([^']+)'|(\d+))\]/g, (_match, dot, double, single, index) => {
    parts.push(dot ?? double ?? single ?? index);
    return '';
  });
  if (!parts.length) throw new Error('Enter a JSON path such as data.items[0].name.');
  return parts;
};

const jsonPathQuery = (source, path) => {
  const value = parsePath(path).reduce((current, key) => {
    if (current == null || !Object.hasOwn(Object(current), key)) {
      throw new Error(`Path segment "${key}" was not found.`);
    }
    return current[key];
  }, JSON.parse(source));
  return JSON.stringify(value, null, 2) ?? String(value);
};

const toRoman = input => {
  const number = Number(input);
  if (!Number.isInteger(number) || number < 1 || number > 3999) throw new Error('Enter a whole number from 1 to 3999.');
  const symbols = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let remaining = number;
  return symbols.map(([value, symbol]) => {
    const count = Math.floor(remaining / value);
    remaining %= value;
    return symbol.repeat(count);
  }).join('');
};

const fromRoman = input => {
  const roman = input.trim().toUpperCase();
  if (!/^(?=[MDCLXVI])M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$/.test(roman)) {
    throw new Error('Enter a valid Roman numeral from I to MMMCMXCIX.');
  }
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  return String([...roman].reduce((total, symbol, index) =>
    total + (values[symbol] < (values[roman[index + 1]] || 0) ? -values[symbol] : values[symbol]), 0));
};

const hexToRgb = hex => {
  const value = hex.trim().replace(/^#/, '');
  const expanded = value.length === 3 ? [...value].map(character => character + character).join('') : value;
  if (!/^[\da-f]{6}$/i.test(expanded)) throw new Error('Enter a 3- or 6-digit hex color (for example #6c63ff).');
  return [0, 2, 4].map(offset => Number.parseInt(expanded.slice(offset, offset + 2), 16));
};

const rgbToHsl = ([red, green, blue]) => {
  const [r, g, b] = [red, green, blue].map(value => value / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  const lightness = (max + min) / 2;
  let saturation = 0;
  if (delta) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  return [Math.round((hue * 60 + 360) % 360), Math.round(saturation * 100), Math.round(lightness * 100)];
};

const convertColor = input => {
  const rgbMatch = input.match(/^\s*(?:rgb\()?\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*\)?\s*$/i);
  const hslMatch = input.match(/^\s*hsl\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})%?\s*[, ]\s*(\d{1,3})%?\s*\)\s*$/i);
  let rgb;
  if (rgbMatch) {
    rgb = rgbMatch.slice(1).map(Number);
    if (rgb.some(value => value > 255)) throw new Error('RGB values must be between 0 and 255.');
  } else if (hslMatch) {
    const [hue, saturation, lightness] = hslMatch.slice(1).map(Number);
    if (hue > 360 || saturation > 100 || lightness > 100) throw new Error('HSL values are outside their valid range.');
    const s = saturation / 100;
    const l = lightness / 100;
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = l - chroma / 2;
    const values = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
    rgb = values.map(value => Math.round((value + m) * 255));
  } else {
    rgb = hexToRgb(input);
  }
  const hex = `#${rgb.map(value => value.toString(16).padStart(2, '0')).join('')}`;
  const [hue, saturation, lightness] = rgbToHsl(rgb);
  return `HEX: ${hex}\nRGB: rgb(${rgb.join(', ')})\nHSL: hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const parseDate = input => {
  const date = /^\d{9,13}$/.test(input.trim())
    ? new Date(Number(input) * (input.trim().length <= 10 ? 1000 : 1))
    : new Date(input);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid date/time or Unix timestamp.');
  return date;
};

const imageFromFile = file => new Promise((resolve, reject) => {
  if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) {
    reject(new Error('Use SVG to PNG Converter for SVG files.'));
    return;
  }
  if (!file.type.startsWith('image/')) {
    reject(new Error('Choose a supported image file.'));
    return;
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The selected file could not be decoded as an image.')); };
  image.src = url;
});

const canvasBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
  canvas.toBlob(blob => {
    if (!blob) {
      reject(new Error('This browser cannot encode the requested image format.'));
    } else if (blob.type !== type) {
      reject(new Error(`This browser does not support ${type} image output.`));
    } else {
      resolve(blob);
    }
  }, type, quality);
});

const imageToBlob = async (file, options, mode) => {
  if (!file) throw new Error('Choose an image file first.');
  if (file.size > 30 * 1024 * 1024) throw new Error('Images must be 30 MB or smaller.');
  const image = await imageFromFile(file);
  if (image.naturalWidth > 8192 || image.naturalHeight > 8192 || image.naturalWidth * image.naturalHeight > 60000000) {
    throw new Error('Images must be no larger than 8,192 px per side or 60 megapixels.');
  }
  if (mode === 'resize') {
    const width = Number(options.width);
    const height = Number(options.height);
    if ((Number.isFinite(width) && width < 1) || (Number.isFinite(height) && height < 1)) {
      throw new Error('Image dimensions must be positive.');
    }
    if (width > 8192 || height > 8192) throw new Error('Maximum output dimensions are 8,192 px.');
  }
  if (mode === 'compress' && (!Number.isFinite(Number(options.quality)) || Number(options.quality) < 0.1 || Number(options.quality) > 1)) {
    throw new Error('Quality must be a number from 0.1 to 1.0.');
  }
  const mime = mode === 'convert' ? options.format : mode === 'compress' ? options.format : 'image/png';
  const canvas = document.createElement('canvas');
  const maxWidth = Number(options.width) || image.naturalWidth;
  const maxHeight = Number(options.height) || image.naturalHeight;
  const scale = mode === 'resize'
    ? Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1)
    : 1;
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available in this browser.');
  if (options.background && mime === 'image/jpeg') {
    context.fillStyle = options.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const quality = Number(options.quality ?? 0.9);
  const blob = await canvasBlob(canvas, mime, Math.min(1, Math.max(0.1, quality)));
  const extension = mime === 'image/jpeg' && options.jpegExtension ? options.jpegExtension : `.${mime.split('/')[1]}`;
  return {
    value: blob,
    filename: file.name.replace(/\.[^.]+$/, '') + extension,
    mimeType: mime
  };
};

const imageTools = {
  'image-format-converter': (file, options) => imageToBlob(file, options, 'convert'),
  'image-resizer': (file, options) => imageToBlob(file, options, 'resize'),
  'image-compressor': (file, options) => imageToBlob(file, options, 'compress')
};

const parseCsvTable = (text, toolName) => {
  const [headers, ...rows] = parseCsv(text);
  if (!headers?.length || !rows.length) throw new Error('Include a CSV header row and at least one data row.');
  if (headers.some(header => !header.trim())) throw new Error('Every CSV column needs a header.');
  if (new Set(headers.map(header => header.toLocaleLowerCase())).size !== headers.length) {
    throw new Error('CSV column names must be unique.');
  }
  if (rows.some(row => row.length !== headers.length)) {
    throw new Error(`${toolName} needs every row to have the same number of columns as the header.`);
  }
  return { headers, rows };
};

const markdownSlug = heading => heading
  .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/<[^>]*>/g, '')
  .normalize('NFKD')
  .replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase()
  .trim()
  .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const sqlIdentifier = value => {
  const parts = value.split('.');
  if (parts.some(part => !/^[a-z_][\w$]*$/i.test(part))) {
    throw new Error('Use a valid SQL table name (letters, numbers, underscores, and optional schema).');
  }
  return parts.map(part => `"${part.replaceAll('"', '""')}"`).join('.');
};

const sqlValue = value => {
  if (value === null) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('SQL output does not support non-finite numbers.');
    return String(value);
  }
  const text = value && typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `'${text.replaceAll("'", "''")}'`;
};

const toGoFieldName = (key, index) => {
  const words = key.match(/[\p{Letter}\p{Number}]+/gu) || [];
  const name = words.map(word => word[0].toLocaleUpperCase() + word.slice(1)).join('');
  const safeName = name || `Field${index + 1}`;
  return /^\p{Letter}/u.test(safeName) ? safeName : `Field${safeName}`;
};

const makeTool = (categoryId, id, title, description, run, options = {}) => ({
  categoryId,
  id,
  title,
  desc: description,
  tag: options.tag || 'LOCAL TOOL',
  path: `/tools/${id}`,
  inputLabel: options.inputLabel || 'Input',
  placeholder: options.placeholder || 'Paste or type your content here…',
  inputMode: options.inputMode || 'text',
  fields: options.fields || [],
  requiresInput: options.requiresInput !== false,
  run,
  assistantMatch: options.assistantMatch,
  keywords: options.keywords || ''
});

const BASE_ADDITIONAL_TOOLS = [
  makeTool('utilities', 'text-case-converter', 'Text Case Converter', 'Convert text to uppercase, lowercase, title case, or sentence case.', (text, options) => {
    const mode = options.mode;
    if (mode === 'upper') return text.toLocaleUpperCase();
    if (mode === 'lower') return text.toLocaleLowerCase();
    if (mode === 'title') return text.toLocaleLowerCase().replace(/(^|[\s([{])\p{L}/gu, value => value.toLocaleUpperCase());
    return text.toLocaleLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, value => value.toLocaleUpperCase());
  }, { fields: [{ name: 'mode', label: 'Case', type: 'select', defaultValue: 'title', options: [['title', 'Title case'], ['upper', 'UPPERCASE'], ['lower', 'lowercase'], ['sentence', 'Sentence case']] }], assistantMatch: /\b(?:title case|uppercase|lowercase|sentence case)\b/i }),
  makeTool('utilities', 'slug-generator', 'URL Slug Generator', 'Create clean, shareable URL slugs from titles and phrases.', text => text.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), { assistantMatch: /\b(?:slug|url slug)\b/i, keywords: 'permalink url seo' }),
  makeTool('utilities', 'text-counter', 'Word & Character Counter', 'Count words, characters, sentences, paragraphs, and estimated reading time.', text => `Words: ${text.trim() ? text.trim().split(/\s+/).length : 0}\nCharacters: ${[...text].length}\nCharacters (without spaces): ${[...text].filter(char => !/\s/.test(char)).length}\nLines: ${text ? text.split(/\r\n|\r|\n/).length : 0}\nEstimated reading time: ${Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 200))} min`, { assistantMatch: /\b(?:word count|character count|count words)\b/i }),
  makeTool('utilities', 'line-sorter', 'Line Sorter', 'Sort text lines alphabetically or numerically, ascending or descending.', (text, options) => {
    const lines = text.split(/\r\n|\r|\n/);
    const sorted = options.order === 'numeric'
      ? lines.sort((a, b) => Number(a) - Number(b))
      : lines.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    return (options.direction === 'descending' ? sorted.reverse() : sorted).join('\n');
  }, { fields: [{ name: 'order', label: 'Sort by', type: 'select', defaultValue: 'alphabetical', options: [['alphabetical', 'Alphabetical'], ['numeric', 'Numeric']] }, { name: 'direction', label: 'Direction', type: 'select', defaultValue: 'ascending', options: [['ascending', 'Ascending'], ['descending', 'Descending']] }] }),
  makeTool('utilities', 'duplicate-line-remover', 'Duplicate Line Remover', 'Remove repeated lines while preserving their first occurrence and original order.', text => [...new Set(text.split(/\r\n|\r|\n/))].join('\n')),
  makeTool('utilities', 'text-reverser', 'Text Reverser', 'Reverse text by Unicode characters, preserving emoji and composed symbols.', text => [...text].reverse().join('')),
  makeTool('utilities', 'whitespace-cleaner', 'Whitespace Cleaner', 'Trim lines, remove blank lines, or collapse repeated spaces and tabs.', (text, options) => {
    if (options.mode === 'lines') return text.split(/\r\n|\r|\n/).map(line => line.trim()).filter(Boolean).join('\n');
    if (options.mode === 'trim') return text.split(/\r\n|\r|\n/).map(line => line.trim()).join('\n').trim();
    return text.replace(/[ \t]{2,}/g, ' ').replace(/\r\n?/g, '\n').trim();
  }, { fields: [{ name: 'mode', label: 'Cleanup', type: 'select', defaultValue: 'spaces', options: [['spaces', 'Collapse spaces'], ['trim', 'Trim lines'], ['lines', 'Remove blank lines']] }] }),
  makeTool('utilities', 'find-replace', 'Find & Replace Text', 'Replace literal text or a regular expression, with optional case sensitivity.', (text, options) => {
    if (!options.find) throw new Error('Enter the text or pattern to find.');
    if (options.regex === 'yes') {
      if (options.find.length > 300) throw new Error('Regular expressions are limited to 300 characters.');
      if (text.length > 10000) throw new Error('Regular-expression mode is limited to 10,000 input characters.');
      try { return text.replace(new RegExp(options.find, options.caseSensitive === 'yes' ? 'g' : 'gi'), options.replace ?? ''); }
      catch (error) { throw new Error(`Invalid regular expression: ${error.message}`); }
    }
    const escaped = options.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, options.caseSensitive === 'yes' ? 'g' : 'gi'), () => options.replace ?? '');
  }, { fields: [{ name: 'find', label: 'Find', type: 'text', defaultValue: '' }, { name: 'replace', label: 'Replace with', type: 'text', defaultValue: '' }, { name: 'regex', label: 'Pattern mode', type: 'select', defaultValue: 'no', options: [['no', 'Literal text'], ['yes', 'Regular expression']] }, { name: 'caseSensitive', label: 'Case sensitive', type: 'select', defaultValue: 'no', options: [['no', 'No'], ['yes', 'Yes']] }], assistantMatch: /\bfind.{0,30}replace\b|\breplace.{0,30}with\b/i }),
  makeTool('transformers', 'html-entity-encoder', 'HTML Entity Encoder', 'Encode HTML-sensitive characters so text displays safely as plain content.', encodeEntities),
  makeTool('transformers', 'html-entity-decoder', 'HTML Entity Decoder', 'Decode common HTML entities into readable text.', decodeEntities),
  makeTool('transformers', 'unicode-escape-converter', 'Unicode Escape Converter', 'Convert text to Unicode escape sequences or decode escapes back to text.', (text, options) => {
    if (options.mode === 'decode') {
      try {       return text.replace(/\\u\{([\da-f]{1,6})\}|\\u([\da-f]{4})|\\x([\da-f]{2})|\\([\\nrtbfv'"0])/gi, (_match, codePoint, unicode, hex, escaped) => {
        if (codePoint) {
          const value = Number.parseInt(codePoint, 16);
          if (value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) throw new Error('Invalid Unicode code point.');
          return String.fromCodePoint(value);
        }
        if (unicode) return String.fromCharCode(Number.parseInt(unicode, 16));
        if (hex) return String.fromCharCode(Number.parseInt(hex, 16));
        return ({ '\\': '\\', n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', "'": "'", '"': '"', 0: '\0' })[escaped];
      }); }
      catch { throw new Error('Invalid escaped string. Use sequences such as \\u0048.'); }
    }
    return [...text].map(char => {
      const code = char.codePointAt(0);
      return code <= 0xffff ? `\\u${code.toString(16).padStart(4, '0')}` : `\\u{${code.toString(16)}}`;
    }).join('');
  }, { fields: [{ name: 'mode', label: 'Direction', type: 'select', defaultValue: 'encode', options: [['encode', 'Escape text'], ['decode', 'Unescape text']] }] }),
  makeTool('transformers', 'json-string-escape', 'JSON String Escaper', 'Escape or unescape JSON string content without adding object wrappers.', (text, options) => {
    if (options.mode === 'escape') return JSON.stringify(text).slice(1, -1);
    try { return JSON.parse(`"${text}"`); } catch { throw new Error('Invalid JSON string escapes.'); }
  }, { fields: [{ name: 'mode', label: 'Direction', type: 'select', defaultValue: 'escape', options: [['escape', 'Escape'], ['unescape', 'Unescape']] }] }),
  makeTool('transformers', 'text-to-binary', 'Text to Binary', 'Encode UTF-8 text as readable groups of binary bytes.', toBinary, { assistantMatch: /\b(?:text to binary|binary encode)\b/i }),
  makeTool('transformers', 'binary-to-text', 'Binary to Text', 'Decode space-separated binary bytes into UTF-8 text.', fromBinary, { assistantMatch: /\bbinary to text\b/i }),
  makeTool('transformers', 'text-to-hex', 'Text to Hex', 'Encode UTF-8 text as hexadecimal byte pairs.', toHex),
  makeTool('transformers', 'hex-to-text', 'Hex to Text', 'Decode hexadecimal byte pairs into UTF-8 text.', fromHex),
  makeTool('transformers', 'text-to-morse', 'Text to Morse Code', 'Encode letters, numbers, and punctuation as standard Morse code.', text => [...text.toUpperCase()].map(char => char === ' ' ? '/' : morseCodes[char] || char).join(' ')),
  makeTool('transformers', 'morse-to-text', 'Morse Code to Text', 'Decode standard Morse code into readable letters and numbers.', text => text.trim().split(/\s*\/\s*|\s{2,}/).map(word => word.split(/\s+/).map(code => morseByCode[code] || '?').join('')).join(' ')),
  makeTool('transformers', 'query-string-parser', 'Query String Parser', 'Parse a URL query string into readable key-value JSON.', text => {
    const query = text.includes('?') ? text.slice(text.indexOf('?') + 1).split('#')[0] : text.replace(/^\?/, '');
    return JSON.stringify(Object.fromEntries(new URLSearchParams(query)), null, 2);
  }, { assistantMatch: /\b(?:parse|decode|read).{0,30}(?:query string|url parameters)\b/i }),
  makeTool('transformers', 'query-string-builder', 'Query String Builder', 'Convert a JSON object into a percent-encoded URL query string.', text => {
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('Enter a valid JSON object of query parameters.'); }
    if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('The input must be a JSON object.');
    return new URLSearchParams(Object.entries(data).map(([key, value]) => [key, String(value)])).toString();
  }),
  makeTool('transformers', 'csv-to-json', 'CSV to JSON', 'Convert quoted CSV rows into a JSON array of objects using the first row as headers.', text => JSON.stringify(csvToObjects(text), null, 2), { assistantMatch: /\bcsv to json\b/i }),
  makeTool('transformers', 'tsv-to-csv', 'TSV to CSV', 'Convert tab-separated data into escaped, spreadsheet-ready CSV.', text => parseCsv(text, '\t').map(row => row.map(toCsvCell).join(',')).join('\n')),
  makeTool('transformers', 'csv-to-tsv', 'CSV to TSV', 'Convert quoted CSV data to tab-separated values.', text => parseCsv(text).map(row => row.map(value => value.replace(/[\t\r\n]/g, ' ')).join('\t')).join('\n')),
  makeTool('transformers', 'json-to-xml', 'JSON to XML', 'Convert JSON data into escaped XML elements.', text => {
    try { return jsonToXml(JSON.parse(text)); } catch (error) { throw new Error(error instanceof SyntaxError ? `Invalid JSON: ${error.message}` : error.message); }
  }),
  makeTool('transformers', 'xml-to-json', 'XML to JSON', 'Convert well-formed XML into a JSON object; external entities are not processed.', xmlToJson),
  makeTool('transformers', 'json-schema-generator', 'JSON Schema Generator', 'Infer a JSON Schema from sample JSON data, including nested objects and arrays.', text => {
    try { return toJsonSchema(JSON.parse(text)); } catch (error) { throw new Error(`Invalid JSON: ${error.message}`); }
  }),
  makeTool('transformers', 'jsonpath-query', 'JSON Path Query', 'Extract a nested value using safe dot and bracket JSON path notation.', (text, options) => jsonPathQuery(text, options.path), { fields: [{ name: 'path', label: 'Path', type: 'text', defaultValue: '$.items[0]' }], assistantMatch: /\bjsonpath\b|\bjson path\b/i }),
  makeTool('utilities', 'regex-replace', 'Regex Replace Tester', 'Preview global regular-expression replacements locally with a bounded input size.', (text, options) => {
    if (text.length > 10000) throw new Error('Input is limited to 10,000 characters for safe local matching.');
    if (options.pattern.length > 300) throw new Error('Patterns are limited to 300 characters.');
    try { return text.replace(new RegExp(options.pattern, options.flags.replace(/[^dgimsuvy]/g, '')), options.replacement); }
    catch (error) { throw new Error(`Invalid regular expression: ${error.message}`); }
  }, { fields: [{ name: 'pattern', label: 'Regular expression', type: 'text', defaultValue: '' }, { name: 'replacement', label: 'Replacement', type: 'text', defaultValue: '' }, { name: 'flags', label: 'Flags', type: 'text', defaultValue: 'g' }], assistantMatch: /\bregex replace\b|\bregular expression replace\b/i }),
  makeTool('utilities', 'number-to-words', 'Number to Words', 'Spell out whole numbers in English up to the trillions.', text => {
    const number = Number(text.trim());
    if (!Number.isSafeInteger(number) || Math.abs(number) > 999999999999) throw new Error('Enter a whole number between -999,999,999,999 and 999,999,999,999.');
    if (number === 0) return 'zero';
    const small = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const underThousand = value => {
      const parts = [];
      if (value >= 100) { parts.push(`${small[Math.floor(value / 100)]} hundred`); value %= 100; }
      if (value >= 20) { parts.push(`${tens[Math.floor(value / 10)]}${value % 10 ? `-${small[value % 10]}` : ''}`); value %= 10; }
      if (value) parts.push(small[value]);
      return parts.join(' ');
    };
    const groups = ['', 'thousand', 'million', 'billion'];
    let remaining = Math.abs(number);
    const parts = [];
    groups.forEach(group => {
      const chunk = remaining % 1000;
      if (chunk) parts.unshift(`${underThousand(chunk)}${group ? ` ${group}` : ''}`);
      remaining = Math.floor(remaining / 1000);
    });
    return `${number < 0 ? 'minus ' : ''}${parts.join(' ')}`;
  }),
  makeTool('utilities', 'roman-numeral-converter', 'Roman Numeral Converter', 'Convert whole numbers 1–3999 to Roman numerals and back.', (text, options) => options.direction === 'toNumber' ? fromRoman(text) : toRoman(text), { fields: [{ name: 'direction', label: 'Conversion', type: 'select', defaultValue: 'toRoman', options: [['toRoman', 'Number to Roman'], ['toNumber', 'Roman to number']] }], assistantMatch: /\b(?:roman numeral|to roman|from roman)\b/i }),
  makeTool('utilities', 'timestamp-converter', 'Unix Timestamp Converter', 'Convert Unix seconds or milliseconds to UTC/local date or a date to Unix time.', (text, options) => {
    const date = parseDate(text);
    return options.direction === 'toTimestamp'
      ? `Unix seconds: ${Math.floor(date.getTime() / 1000)}\nUnix milliseconds: ${date.getTime()}`
      : `UTC: ${date.toISOString()}\nLocal: ${date.toLocaleString()}\nUnix seconds: ${Math.floor(date.getTime() / 1000)}\nUnix milliseconds: ${date.getTime()}`;
  }, { fields: [{ name: 'direction', label: 'Mode', type: 'select', defaultValue: 'toDate', options: [['toDate', 'Timestamp to date (or date to timestamp)'], ['toTimestamp', 'Date to timestamp']] }], assistantMatch: /\b(?:unix timestamp|unix time)\b/i }),
  makeTool('utilities', 'date-difference', 'Date Difference Calculator', 'Calculate the exact duration between two dates in days, hours, and minutes.', (_text, options) => {
    const start = parseDate(options.start);
    const end = parseDate(options.end);
    const difference = Math.abs(end - start);
    const days = Math.floor(difference / 86400000);
    const hours = Math.floor((difference % 86400000) / 3600000);
    const minutes = Math.floor((difference % 3600000) / 60000);
    return `${days} days, ${hours} hours, ${minutes} minutes\nTotal days: ${(difference / 86400000).toFixed(4)}\nOrder: ${start <= end ? 'start is before end' : 'start is after end'}`;
  }, { fields: [{ name: 'start', label: 'Start date/time', type: 'text', defaultValue: '' }, { name: 'end', label: 'End date/time', type: 'text', defaultValue: '' }] }),
  makeTool('utilities', 'timezone-converter', 'Time Zone Converter', 'Convert a date and time between IANA time zones using the browser’s locale database.', (text, options) => {
    const date = parseDate(text);
    try {
      return `${options.from}: ${new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'long', timeZone: options.from }).format(date)}\n${options.to}: ${new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'long', timeZone: options.to }).format(date)}\nUTC: ${date.toISOString()}`;
    } catch { throw new Error('Enter valid IANA time zones (for example: America/New_York and Europe/London).'); }
  }, { fields: [{ name: 'from', label: 'First time zone', type: 'text', defaultValue: 'America/New_York' }, { name: 'to', label: 'Convert to', type: 'text', defaultValue: 'Europe/London' }] }),
  makeTool('utilities', 'color-format-converter', 'Color Format Converter', 'Convert hexadecimal, RGB, or HSL color values into all three formats.', convertColor),
  makeTool('utilities', 'aspect-ratio-calculator', 'Aspect Ratio Calculator', 'Reduce pixel dimensions to a simplified aspect ratio and calculate a matching dimension.', (text, options) => {
    const match = text.match(/^\s*(\d+(?:\.\d+)?)\s*[,x×:\s]\s*(\d+(?:\.\d+)?)\s*$/);
    if (!match) throw new Error('Enter dimensions such as 1920 x 1080.');
    const [, widthText, heightText] = match;
    const width = Number(widthText);
    const height = Number(heightText);
    if (!width || !height) throw new Error('Dimensions must be greater than zero.');
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const divisor = gcd(Math.round(width * 1000), Math.round(height * 1000));
    const ratio = `${Math.round(width * 1000) / divisor}:${Math.round(height * 1000) / divisor}`;
    const targetWidth = Number(options.targetWidth) || width;
    return `Aspect ratio: ${ratio}\nAt width ${targetWidth}: height ${(targetWidth * height / width).toFixed(2)}\nAt height ${options.targetHeight || height}: width ${(Number(options.targetHeight || height) * width / height).toFixed(2)}`;
  }, { fields: [{ name: 'targetWidth', label: 'Target width (optional)', type: 'number', defaultValue: '' }, { name: 'targetHeight', label: 'Target height (optional)', type: 'number', defaultValue: '' }] }),
  makeTool('utilities', 'percentage-calculator', 'Percentage Calculator', 'Calculate a percentage of a value, percentage change, or the percentage one value is of another.', (text, options) => {
    const values = text.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
    if (values.length < 2) throw new Error('Enter two numbers (for example: 15, 200).');
    const [first, second] = values;
    if (options.mode === 'change') {
      if (first === 0) throw new Error('Starting value cannot be zero.');
      return `${(((second - first) / Math.abs(first)) * 100).toFixed(4)}% change`;
    }
    if (options.mode === 'of') return `${((first / second) * 100).toFixed(4)}%`;
    return `${((first / 100) * second).toFixed(6).replace(/\.?0+$/, '')}`;
  }, { fields: [{ name: 'mode', label: 'Calculation', type: 'select', defaultValue: 'ofValue', options: [['ofValue', 'First number % of second'], ['of', 'First number is what % of second'], ['change', 'Percentage change (first → second)']] }], assistantMatch: /\b\d+(?:\.\d+)?%?\s+of\s+-?\d|\bpercentage change\b/i }),
  makeTool('utilities', 'unit-converter', 'Unit Converter', 'Convert common length, mass, temperature, and volume units offline.', (text, options) => {
    const value = Number(text.trim());
    if (!Number.isFinite(value)) throw new Error('Enter a numeric value to convert.');
    const factors = {
      kmToMi: [0.621371, 'miles'], miToKm: [1.609344, 'kilometers'], mToFt: [3.28084, 'feet'],
      ftToM: [0.3048, 'meters'], kgToLb: [2.20462262, 'pounds'], lbToKg: [0.45359237, 'kilograms'],
      lToGal: [0.264172, 'US gallons'], galToL: [3.78541178, 'liters']
    };
    if (options.unit === 'cToF') return `${(value * 9 / 5 + 32).toFixed(4)} °F`;
    if (options.unit === 'fToC') return `${((value - 32) * 5 / 9).toFixed(4)} °C`;
    const [factor, unit] = factors[options.unit];
    return `${(value * factor).toFixed(6).replace(/\.?0+$/, '')} ${unit}`;
  }, { fields: [{ name: 'unit', label: 'Conversion', type: 'select', defaultValue: 'kmToMi', options: [['kmToMi', 'Kilometers → miles'], ['miToKm', 'Miles → kilometers'], ['mToFt', 'Meters → feet'], ['ftToM', 'Feet → meters'], ['kgToLb', 'Kilograms → pounds'], ['lbToKg', 'Pounds → kilograms'], ['lToGal', 'Liters → US gallons'], ['galToL', 'US gallons → liters'], ['cToF', 'Celsius → Fahrenheit'], ['fToC', 'Fahrenheit → Celsius']] }], assistantMatch: /\bconvert\b.{0,30}\b(?:km|kilometers?|miles?|feet|kg|pounds?|celsius|fahrenheit|liters?|gallons?)\b/i }),
  makeTool('utilities', 'file-size-converter', 'File Size Converter', 'Convert a byte count into decimal and binary storage units.', text => {
    const bytes = Number(text.trim());
    if (!Number.isFinite(bytes) || bytes < 0) throw new Error('Enter a non-negative number of bytes.');
    return `Bytes: ${bytes}\nDecimal: ${(bytes / 1e3).toFixed(3)} kB · ${(bytes / 1e6).toFixed(6)} MB · ${(bytes / 1e9).toFixed(9)} GB\nBinary: ${(bytes / 1024).toFixed(3)} KiB · ${(bytes / 1048576).toFixed(6)} MiB · ${(bytes / 1073741824).toFixed(9)} GiB`;
  }),
  makeTool('utilities', 'mime-type-lookup', 'MIME Type Lookup', 'Look up common file extensions and MIME types without sending data anywhere.', text => {
    const types = { txt: 'text/plain', md: 'text/markdown', html: 'text/html', css: 'text/css', js: 'text/javascript', json: 'application/json', xml: 'application/xml', csv: 'text/csv', pdf: 'application/pdf', zip: 'application/zip', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', mp3: 'audio/mpeg', mp4: 'video/mp4', webm: 'video/webm', wasm: 'application/wasm', yaml: 'application/yaml', yml: 'application/yaml', ts: 'text/typescript' };
    const key = text.trim().toLowerCase().replace(/^\./, '').split('.').pop();
    return types[key] ? `.${key} → ${types[key]}` : `No common MIME type is registered for ".${key}".`;
  }),
  makeTool('utilities', 'filename-sanitizer', 'Filename Sanitizer', 'Remove unsafe filename characters and create portable filenames.', text => text.trim().normalize('NFKD').replace(/\p{Diacritic}/gu, '').split('').map(character => character.charCodeAt(0) < 32 ? '-' : character).join('').replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^[.-]+|[. -]+$/g, '').slice(0, 180) || 'untitled'),
  makeTool('transformers', 'data-url-converter', 'Data URL Converter', 'Decode a Base64 data URL into its MIME type and readable text payload.', text => {
    const match = text.trim().match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/i);
    if (!match) throw new Error('Enter a data URL beginning with data:');
    const mime = match[1] || 'text/plain';
    const payload = match[2] ? decodeBase64(match[3]) : decodeURIComponent(match[3]);
    return `MIME type: ${mime}\nEncoding: ${match[2] ? 'Base64' : 'URL encoded'}\n\n${payload}`;
  }),
  makeTool('transformers', 'html-formatter', 'HTML Formatter', 'Indent HTML markup for easier reading and review.', text => text.replace(/>\s*</g, '>\n<').split('\n').map((line, index, lines) => {
    const previous = lines[index - 1] || '';
    const depth = Math.max(0, (previous.match(/<[^/!?][^>]*[^/]>/g) || []).length - (previous.match(/<\/[^>]+>/g) || []).length);
    const currentDepth = line.startsWith('</') ? Math.max(0, depth - 1) : depth;
    return `${'  '.repeat(currentDepth)}${line.trim()}`;
  }).join('\n')),
  makeTool('transformers', 'css-formatter', 'CSS Formatter', 'Format CSS rules with readable indentation and line breaks.', text => text.replace(/\s*([{}:;,])\s*/g, '$1 ').replace(/\s*{\s*/g, ' {\n  ').replace(/;\s*/g, ';\n  ').replace(/,\s*/g, ', ').replace(/\s*}\s*/g, '\n}\n').replace(/;\s*\n\s*}/g, '\n}').replace(/\n\s*\n/g, '\n').trim()),
  makeTool('transformers', 'javascript-beautifier', 'JavaScript Beautifier', 'Add basic line breaks and indentation around JavaScript blocks and statements.', text => text.replace(/\s*([{};])\s*/g, '$1\n').split('\n').map(line => line.trim()).filter(Boolean).reduce((result, line) => {
    const dedent = line.startsWith('}') ? 1 : 0;
    const depth = Math.max(0, result.depth - dedent);
    result.lines.push(`${'  '.repeat(depth)}${line}`);
    result.depth = Math.max(0, depth + (line.endsWith('{') ? 1 : 0));
    return result;
  }, { depth: 0, lines: [] }).lines.join('\n')),
  makeTool('transformers', 'json-minifier', 'JSON Minifier', 'Validate JSON and remove unnecessary whitespace to reduce payload size.', text => {
    try { return JSON.stringify(JSON.parse(text)); } catch (error) { throw new Error(`Invalid JSON: ${error.message}`); }
  }, { assistantMatch: /\b(?:minify|minimize).{0,20}\bjson\b|\bjson minifier\b/i }),
  makeTool('transformers', 'yaml-formatter', 'YAML Formatter', 'Validate and consistently format YAML documents.', text => {
    try { return yaml.dump(yaml.load(text), { noRefs: true, lineWidth: -1, sortKeys: false }); }
    catch (error) { throw new Error(`Invalid YAML: ${error.message}`); }
  }),
  makeTool('utilities', 'markdown-checklist-generator', 'Markdown Checklist Generator', 'Turn a plain-text list into a Markdown task checklist.', text => text.split(/\r\n|\r|\n/).map(line => line.trim()).filter(Boolean).map(line => `- [ ] ${line.replace(/^[-*]\s*/, '')}`).join('\n')),
  makeTool('utilities', 'ipv4-decimal-converter', 'IPv4 Decimal Converter', 'Convert IPv4 addresses into unsigned decimal values and back.', (text, options) => {
    if (options.direction === 'toIp') {
      const decimal = Number(text.trim());
      if (!Number.isInteger(decimal) || decimal < 0 || decimal > 4294967295) throw new Error('Enter an integer from 0 to 4,294,967,295.');
      return [24, 16, 8, 0].map(shift => (decimal >>> shift) & 255).join('.');
    }
    const parts = text.trim().split('.');
    if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) throw new Error('Enter a valid IPv4 address.');
    return String(parts.reduce((value, part) => (value * 256) + Number(part), 0));
  }, { fields: [{ name: 'direction', label: 'Conversion', type: 'select', defaultValue: 'toDecimal', options: [['toDecimal', 'IPv4 to decimal'], ['toIp', 'Decimal to IPv4']] }] }),
  makeTool('utilities', 'random-number-generator', 'Random Number Generator', 'Generate cryptographically secure random integers in a configurable range.', (_text, options) => {
    const min = Number(options.min);
    const max = Number(options.max);
    const count = Math.min(100, Math.max(1, Number(options.count) || 1));
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max || max - min > 2 ** 32 - 1) throw new Error('Choose an integer range within the safe 32-bit range.');
    const range = max - min + 1;
    const limit = Math.floor(2 ** 32 / range) * range;
    return Array.from({ length: count }, () => {
      const bytes = new Uint32Array(1);
      let value;
      do { crypto.getRandomValues(bytes); value = bytes[0]; } while (value >= limit);
      return min + (value % range);
    }).join('\n');
  }, { requiresInput: false, fields: [{ name: 'min', label: 'Minimum integer', type: 'number', defaultValue: '1' }, { name: 'max', label: 'Maximum integer', type: 'number', defaultValue: '100' }, { name: 'count', label: 'How many (max 100)', type: 'number', defaultValue: '1' }] }),
  makeTool('utilities', 'bulk-uuid-generator', 'Bulk UUID Generator', 'Create up to 100 cryptographically random UUID v4 identifiers.', (_text, options) => {
    const count = Math.min(100, Math.max(1, Number(options.count) || 1));
    return Array.from({ length: count }, () => crypto.randomUUID()).join('\n');
  }, { requiresInput: false, fields: [{ name: 'count', label: 'How many (max 100)', type: 'number', defaultValue: '10' }] }),
  makeTool('transformers', 'image-format-converter', 'Image Format Converter', 'Convert images locally between PNG, JPEG, and WebP formats, including JPG/JPEG extension changes.', (file, options) => imageTools['image-format-converter'](file, options), { inputMode: 'image', fields: [{ name: 'format', label: 'Output format', type: 'select', defaultValue: 'image/webp', options: [['image/png', 'PNG'], ['image/jpeg', 'JPEG'], ['image/webp', 'WebP']] }, { name: 'jpegExtension', label: 'JPEG file extension', type: 'select', defaultValue: '.jpg', options: [['.jpg', '.jpg'], ['.jpeg', '.jpeg']] }, { name: 'background', label: 'Background for transparent images', type: 'text', defaultValue: '#ffffff' }], keywords: 'jpg jpeg png avif webp convert picture photo image format' }),
  makeTool('transformers', 'image-resizer', 'Image Resizer', 'Resize an image to fit within chosen dimensions while preserving aspect ratio.', (file, options) => imageTools['image-resizer'](file, options), { inputMode: 'image', fields: [{ name: 'width', label: 'Maximum width (px)', type: 'number', defaultValue: '1200' }, { name: 'height', label: 'Maximum height (px)', type: 'number', defaultValue: '1200' }], keywords: 'resize scale dimensions picture photo' }),
  makeTool('transformers', 'image-compressor', 'Image Compressor', 'Reduce image file size locally by adjusting output format and quality.', (file, options) => imageTools['image-compressor'](file, options), { inputMode: 'image', fields: [{ name: 'format', label: 'Output format', type: 'select', defaultValue: 'image/webp', options: [['image/jpeg', 'JPEG'], ['image/webp', 'WebP']] }, { name: 'quality', label: 'Quality (0.1–1.0)', type: 'number', defaultValue: '0.75' }, { name: 'background', label: 'Background for transparent images', type: 'text', defaultValue: '#ffffff' }], keywords: 'compress optimize photo picture jpg jpeg webp' }),
  makeTool('transformers', 'svg-to-png', 'SVG to PNG Converter', 'Render SVG markup as a downloadable PNG image entirely in your browser.', async text => {
    if (!/^\s*<svg[\s>]/i.test(text)) throw new Error('Paste a valid SVG document.');
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('DOCTYPE and entity declarations are not supported.');
    if (/<script\b|\bon[a-z]+\s*=|<foreignObject\b|\b(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|data:)/i.test(text)) {
      throw new Error('Scripts, event handlers, embedded objects, and external image references are not supported.');
    }
    const parsed = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (parsed.querySelector('parsererror')) throw new Error('The SVG markup is invalid.');
    const svgBlob = new Blob([text], { type: 'image/svg+xml' });
    const image = await imageFromFile(new File([svgBlob], 'source.svg', { type: 'image/svg+xml' }));
    const canvas = document.createElement('canvas');
    const sourceWidth = image.naturalWidth || 512;
    const sourceHeight = image.naturalHeight || 512;
    const scale = Math.min(1, 8192 / sourceWidth, 8192 / sourceHeight, Math.sqrt(60000000 / (sourceWidth * sourceHeight)));
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available in this browser.');
    context.drawImage(image, 0, 0);
    return { value: await canvasBlob(canvas, 'image/png'), filename: 'converted.png', mimeType: 'image/png' };
  }, { inputMode: 'text', placeholder: '<svg xmlns="http://www.w3.org/2000/svg" …>…</svg>', keywords: 'vector picture image rasterize' }),
  makeTool('utilities', 'favicon-generator', 'Favicon SVG Generator', 'Create a simple, scalable SVG favicon with a custom letter and colors.', (_text, options) => {
    const letter = [...(options.letter || 'S')][0] || 'S';
    const background = /^#[\da-f]{6}$/i.test(options.background) ? options.background : '#5e6ad2';
    const foreground = /^#[\da-f]{6}$/i.test(options.foreground) ? options.foreground : '#ffffff';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${background}"/><text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" font-weight="700" fill="${foreground}">${encodeEntities(letter)}</text></svg>`;
  }, { requiresInput: false, fields: [{ name: 'letter', label: 'Letter or symbol', type: 'text', defaultValue: 'S' }, { name: 'background', label: 'Background hex color', type: 'text', defaultValue: '#5e6ad2' }, { name: 'foreground', label: 'Text hex color', type: 'text', defaultValue: '#ffffff' }] }),
  makeTool('transformers', 'svg-optimizer', 'SVG Optimizer', 'Remove comments and redundant whitespace from SVG source markup.', text => {
    if (!/^\s*<svg[\s>]/i.test(text)) throw new Error('Paste a valid SVG document.');
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('DOCTYPE and entity declarations are not supported.');
    return text.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  }),
  makeTool('transformers', 'json-to-yaml-document', 'JSON to YAML Document', 'Convert valid JSON input to readable YAML.', text => {
    try { return yaml.dump(JSON.parse(text), { noRefs: true, lineWidth: -1 }); } catch (error) { throw new Error(`Invalid JSON: ${error.message}`); }
  }),
  makeTool('transformers', 'yaml-to-json-document', 'YAML to JSON Document', 'Convert valid YAML input to formatted JSON.', text => {
    try { return JSON.stringify(yaml.load(text), null, 2); } catch (error) { throw new Error(`Invalid YAML: ${error.message}`); }
  }),
  makeTool('transformers', 'html-to-plain-text', 'HTML to Plain Text', 'Extract readable text from HTML without rendering scripts or styles.', text => {
    const document = new DOMParser().parseFromString(text, 'text/html');
    document.querySelectorAll('script,style,noscript,template').forEach(node => node.remove());
    return (document.body.textContent || '').replace(/\s+/g, ' ').trim();
  }),
  makeTool('transformers', 'csv-to-markdown-table', 'CSV to Markdown Table', 'Turn CSV rows into a Markdown table with properly escaped cells.', text => {
    const rows = parseCsv(text);
    if (rows.length < 2) throw new Error('Include a header row and at least one data row.');
    const format = row => `| ${row.map(cell => cell.replaceAll('|', '\\|').replace(/\r?\n/g, ' ')).join(' | ')} |`;
    return [format(rows[0]), format(rows[0].map(() => '---')), ...rows.slice(1).map(format)].join('\n');
  }),
  makeTool('transformers', 'json-array-to-ndjson', 'JSON Array to NDJSON', 'Convert a JSON array to one JSON object per line for data pipelines.', text => {
    let data;
    try { data = JSON.parse(text); } catch (error) { throw new Error(`Invalid JSON: ${error.message}`); }
    if (!Array.isArray(data)) throw new Error('The JSON input must be an array.');
    return data.map(item => JSON.stringify(item)).join('\n');
  }),
  makeTool('transformers', 'ndjson-to-json-array', 'NDJSON to JSON Array', 'Parse newline-delimited JSON into a formatted JSON array.', text => {
    try { return JSON.stringify(text.split(/\r\n|\r|\n/).filter(line => line.trim()).map(line => JSON.parse(line)), null, 2); }
    catch (error) { throw new Error(`Invalid NDJSON: ${error.message}`); }
  }),
  makeTool('utilities', 'date-iso-converter', 'ISO Date Converter', 'Normalize date/time input to ISO 8601 and show browser-local time.', text => {
    const date = parseDate(text);
    return `ISO 8601: ${date.toISOString()}\nLocal: ${date.toLocaleString()}\nUTC: ${date.toUTCString()}`;
  }),
  makeTool('utilities', 'text-to-data-url', 'Text to Data URL', 'Encode UTF-8 text as a Base64 data URL for embedding in development prototypes.', text => `data:text/plain;charset=utf-8;base64,${encodeBase64(text)}`),
  makeTool('utilities', 'url-component-converter', 'URL Component Converter', 'Encode or decode individual URL components without changing reserved delimiters.', (text, options) => {
    try { return options.direction === 'decode' ? decodeURIComponent(text) : encodeURIComponent(text); }
    catch { throw new Error('The encoded URL component is malformed.'); }
  }, { fields: [{ name: 'direction', label: 'Direction', type: 'select', defaultValue: 'encode', options: [['encode', 'Encode'], ['decode', 'Decode']] }], assistantMatch: /\burl component\b|\bencodeURIComponent\b/i }),
  makeTool('utilities', 'querystring-to-json', 'Query String to JSON', 'Decode percent-encoded URL parameters into a JSON object.', text => {
    const params = new URLSearchParams(text.trim().replace(/^[^?]*\?/, '').replace(/^\?/, ''));
    return JSON.stringify(Object.fromEntries(params), null, 2);
  }),
  makeTool('utilities', 'json-to-querystring', 'JSON to Query String', 'Encode a flat JSON object as URL query parameters.', text => {
    let data;
    try { data = JSON.parse(text); } catch (error) { throw new Error(`Invalid JSON: ${error.message}`); }
    if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('Enter a flat JSON object.');
    return new URLSearchParams(Object.entries(data).map(([key, value]) => [key, String(value)])).toString();
  }),
  makeTool('utilities', 'text-to-ascii-codes', 'Text to ASCII Codes', 'Show Unicode code points in decimal and hexadecimal for each character.', text => [...text].map(char => `${JSON.stringify(char)}  ${char.codePointAt(0)}  U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join('\n')),
  makeTool('utilities', 'ascii-codes-to-text', 'Character Codes to Text', 'Convert decimal or U+ hexadecimal Unicode code points into readable text.', text => text.trim().split(/[\s,;]+/).map(token => {
    const code = token.match(/^U\+([\da-f]+)$/i) ? Number.parseInt(token.slice(2), 16) : Number(token);
    if (!Number.isInteger(code) || code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) throw new Error(`Invalid Unicode code point: ${token}`);
    return String.fromCodePoint(code);
  }).join('')),
  makeTool('utilities', 'html-table-to-csv', 'HTML Table to CSV', 'Extract the first HTML table and convert its cells to properly quoted CSV.', text => {
    const document = new DOMParser().parseFromString(text, 'text/html');
    const table = document.querySelector('table');
    if (!table) throw new Error('No HTML table was found.');
    return [...table.querySelectorAll('tr')].map(row => [...row.querySelectorAll('th,td')].map(cell => toCsvCell(cell.textContent.trim())).join(',')).join('\n');
  }),
  makeTool('utilities', 'character-frequency-counter', 'Character Frequency Counter', 'Count each character in text, optionally ignoring case and whitespace.', (text, options) => {
    const normalized = options.ignoreCase === 'yes' ? text.toLocaleLowerCase() : text;
    const counts = new Map();
    [...normalized].forEach(char => {
      if (options.ignoreSpaces === 'yes' && /\s/.test(char)) return;
      counts.set(char, (counts.get(char) || 0) + 1);
    });
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([char, count]) => `${JSON.stringify(char)}: ${count}`).join('\n');
  }, { fields: [{ name: 'ignoreCase', label: 'Ignore case', type: 'select', defaultValue: 'yes', options: [['yes', 'Yes'], ['no', 'No']] }, { name: 'ignoreSpaces', label: 'Ignore whitespace', type: 'select', defaultValue: 'yes', options: [['yes', 'Yes'], ['no', 'No']] }] }),
  makeTool('utilities', 'csv-column-extractor', 'CSV Column Extractor', 'Select a column by name from CSV data and export its values as text.', (text, options) => {
    const rows = parseCsv(text);
    if (!rows.length) throw new Error('Enter CSV data with a header row.');
    const index = rows[0].findIndex(header => header.toLowerCase() === options.column.trim().toLowerCase());
    if (index < 0) throw new Error(`Column "${options.column}" was not found. Available columns: ${rows[0].join(', ')}`);
    return rows.slice(1).map(row => row[index] || '').join('\n');
  }, { fields: [{ name: 'column', label: 'Column name', type: 'text', defaultValue: '' }] }),
  makeTool('utilities', 'text-deduplicator', 'Text Deduplicator', 'Remove repeated words or phrases while retaining their first occurrence.', (text, options) => {
    const delimiter = options.delimiter === 'comma' ? /,\s*/ : /\s+/;
    return [...new Set(text.split(delimiter).map(value => value.trim()).filter(Boolean))].join(options.delimiter === 'comma' ? ', ' : ' ');
  }, { fields: [{ name: 'delimiter', label: 'Split on', type: 'select', defaultValue: 'space', options: [['space', 'Whitespace'], ['comma', 'Commas']] }] }),
  makeTool('utilities', 'css-gradient-generator', 'CSS Gradient Generator', 'Generate a customizable two-color CSS linear gradient.', (_text, options) => {
    const first = /^#[\da-f]{6}$/i.test(options.first) ? options.first : '#5e6ad2';
    const second = /^#[\da-f]{6}$/i.test(options.second) ? options.second : '#06b6d4';
    const angle = Math.min(360, Math.max(0, Number(options.angle) || 135));
    return `background: linear-gradient(${angle}deg, ${first} 0%, ${second} 100%);`;
  }, { fields: [{ name: 'first', label: 'First color', type: 'text', defaultValue: '#5e6ad2' }, { name: 'second', label: 'Second color', type: 'text', defaultValue: '#06b6d4' }, { name: 'angle', label: 'Angle (degrees)', type: 'number', defaultValue: '135' }] }),
  makeTool('utilities', 'roman-date-formatter', 'Date Format Helper', 'Format a date in common human-readable, ISO, and locale styles.', text => {
    const date = parseDate(text);
    return `ISO: ${date.toISOString()}\nLocal: ${date.toLocaleString()}\nDate: ${date.toLocaleDateString(undefined, { dateStyle: 'full' })}\nTime: ${date.toLocaleTimeString()}\nUTC: ${date.toUTCString()}`;
  }),
  makeTool('utilities', 'text-line-numberer', 'Text Line Numberer', 'Add line numbers to source text or remove existing line-number prefixes.', (text, options) => options.mode === 'remove'
    ? text.replace(/^\s*\d+[.)]\s?/gm, '')
    : (() => {
      const lines = text.split(/\r\n|\r|\n/);
      const width = String(lines.length).length;
      return lines.map((line, index) => `${String(index + 1).padStart(width, ' ')}. ${line}`).join('\n');
    })(),
  { fields: [{ name: 'mode', label: 'Mode', type: 'select', defaultValue: 'add', options: [['add', 'Add line numbers'], ['remove', 'Remove line numbers']] }] }),
  makeTool('transformers', 'svg-data-url-converter', 'SVG Data URL Converter', 'Encode pasted SVG markup as a percent-encoded data URL.', text => {
    if (!/^\s*<svg[\s>]/i.test(text)) throw new Error('Paste SVG markup starting with <svg>.');
    return `data:image/svg+xml,${encodeURIComponent(text.trim())}`;
  }),
  makeTool('utilities', 'json-keys-extractor', 'JSON Keys Extractor', 'List object keys in dot notation for a JSON document.', text => {
    const data = JSON.parse(text);
    const keys = [];
    const visit = (value, path = '') => {
      if (!value || typeof value !== 'object') return;
      Object.entries(value).forEach(([key, child]) => {
        const next = path ? `${path}.${key}` : key;
        keys.push(next);
        visit(child, next);
      });
    };
    visit(data);
    return keys.join('\n');
  }),
  makeTool('utilities', 'text-to-hex-color', 'Hex Color Validator', 'Validate a hexadecimal color and show its RGB and HSL values.', convertColor),
  makeTool('utilities', 'base64-url-safe-converter', 'Base64 URL-Safe Converter', 'Convert standard Base64 text to URL-safe Base64 or decode URL-safe text.', (text, options) => {
    if (options.direction === 'decode') {
      const standard = text.replace(/-/g, '+').replace(/_/g, '/');
      return decodeBase64(standard.padEnd(Math.ceil(standard.length / 4) * 4, '='));
    }
    return encodeBase64(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }, { fields: [{ name: 'direction', label: 'Direction', type: 'select', defaultValue: 'encode', options: [['encode', 'Text to URL-safe Base64'], ['decode', 'URL-safe Base64 to text']] }] }),
  makeTool('utilities', 'csv-row-column-counter', 'CSV Row & Column Counter', 'Count rows and columns in CSV data and flag inconsistent row widths.', text => {
    const rows = parseCsv(text);
    if (!rows.length) throw new Error('Enter CSV data first.');
    const counts = rows.map(row => row.length);
    const expected = counts[0];
    return `Rows: ${rows.length}\nColumns in header: ${expected}\n${counts.some(count => count !== expected) ? `Rows with a different column count: ${counts.map((count, index) => count === expected ? null : index + 1).filter(Boolean).join(', ')}` : 'All rows have a consistent column count.'}`;
  }),
  makeTool('utilities', 'email-validator', 'Email Address Validator', 'Check email address syntax locally; this does not verify whether an inbox exists.', text => {
    const addresses = text.split(/[\s,;]+/).filter(Boolean);
    if (!addresses.length) throw new Error('Enter one or more email addresses.');
    return addresses.map(address => `${address}: ${/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address) ? 'valid syntax' : 'invalid syntax'}`).join('\n');
  }),
  makeTool('utilities', 'http-header-parser', 'HTTP Header Parser', 'Parse pasted HTTP headers into a readable JSON object.', text => {
    const headers = {};
    for (const line of text.split(/\r\n|\r|\n/).filter(Boolean)) {
      const separator = line.indexOf(':');
      if (separator <= 0) throw new Error(`Invalid header line: ${line}`);
      headers[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim();
    }
    return JSON.stringify(headers, null, 2);
  }),
  makeTool('utilities', 'base64-text-file', 'Base64 Text Converter', 'Encode or decode plain text as Base64 with Unicode support.', (text, options) => options.direction === 'decode' ? decodeBase64(text) : encodeBase64(text), { fields: [{ name: 'direction', label: 'Direction', type: 'select', defaultValue: 'encode', options: [['encode', 'Encode text'], ['decode', 'Decode Base64']] }] }),
  makeTool('utilities', 'html-comment-stripper', 'HTML Comment Remover', 'Remove HTML comments from source markup.', text => text.replace(/<!--[\s\S]*?-->/g, '')),
  makeTool('utilities', 'list-to-json-array', 'List to JSON Array', 'Convert one item per line into a JSON string array.', text => JSON.stringify(text.split(/\r\n|\r|\n/).filter(line => line.trim()).map(line => line.trim()), null, 2)),
  makeTool('utilities', 'json-array-to-list', 'JSON Array to List', 'Convert a JSON array into one readable item per line.', text => {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('Enter a JSON array.');
    return data.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('\n');
  }),
  makeTool('utilities', 'image-data-url-reader', 'Image Data URL Reader', 'Inspect image data URLs and decode a previewable image locally.', text => {
    const match = text.trim().match(/^data:(image\/[\w.+-]+);base64,([\s\S]+)$/i);
    if (!match) throw new Error('Paste a Base64 image data URL.');
    const binary = atob(match[2]);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    return { value: new Blob([bytes], { type: match[1] }), filename: `decoded.${match[1].split('/')[1]}`, mimeType: match[1] };
  }, { inputMode: 'text', keywords: 'image base64 decode convert picture' }),
  makeTool('utilities', 'text-to-qr-payload', 'QR Payload Text Cleaner', 'Prepare plain text for QR code input by trimming invisible edge whitespace.', text => text.trim().replace(/[\u200B-\u200D\uFEFF]/g, ''), { keywords: 'qr code clean invisible whitespace' }),
  makeTool('utilities', 'json-object-to-typescript', 'JSON to TypeScript Type', 'Infer a basic TypeScript type declaration from a JSON sample.', text => {
    const data = JSON.parse(text);
    const typeOf = value => {
      if (value === null) return 'null';
      if (Array.isArray(value)) return value.length ? `${typeOf(value[0])}[]` : 'unknown[]';
      if (typeof value === 'object') {
        const entries = Object.entries(value).map(([key, child]) => `  ${/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${typeOf(child)};`);
        return `{\n${entries.join('\n')}\n}`;
      }
      return typeof value;
    };
    return `type Root = ${typeOf(data)};`;
  }),
  makeTool('utilities', 'text-to-html-list', 'Text to HTML List', 'Convert a line-separated list into escaped HTML list items.', text => `<ul>\n${text.split(/\r\n|\r|\n/).filter(line => line.trim()).map(line => `  <li>${encodeEntities(line.trim())}</li>`).join('\n')}\n</ul>`),
  makeTool('utilities', 'url-validator', 'URL Validator', 'Validate and normalize absolute HTTP and HTTPS URLs.', text => text.split(/\r\n|\r|\n/).filter(Boolean).map(value => {
    try {
      const url = new URL(value.trim());
      if (!['http:', 'https:'].includes(url.protocol)) return `${value}: only HTTP and HTTPS are supported.`;
      return `${value} → ${url.toString()}`;
    } catch { return `${value}: invalid absolute URL.`; }
  }).join('\n')),
  makeTool('utilities', 'json-value-search', 'JSON Value Search', 'Find values matching a text query and return their JSON paths.', (text, options) => {
    const data = JSON.parse(text);
    const query = options.query.toLocaleLowerCase();
    if (!query) throw new Error('Enter a value to search for.');
    const found = [];
    const visit = (value, path = '$') => {
      if (value && typeof value === 'object') Object.entries(value).forEach(([key, child]) => visit(child, Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`));
      else if (String(value).toLocaleLowerCase().includes(query)) found.push(`${path}: ${String(value)}`);
    };
    visit(data);
    return found.length ? found.join('\n') : 'No matching values were found.';
  }, { fields: [{ name: 'query', label: 'Value to find', type: 'text', defaultValue: '' }] }),
  makeTool('utilities', 'image-file-info', 'Image File Info', 'Read image dimensions and file size locally without uploading the image.', async file => {
    if (!file) throw new Error('Choose an image file first.');
    if (file.size > 30 * 1024 * 1024) throw new Error('Images must be 30 MB or smaller.');
    const image = await imageFromFile(file);
    return `${file.name}\nType: ${file.type || 'unknown'}\nSize: ${file.size.toLocaleString()} bytes (${(file.size / 1024).toFixed(2)} KiB)\nDimensions: ${image.naturalWidth} × ${image.naturalHeight}`;
  }, { inputMode: 'image', keywords: 'picture photo dimensions metadata' }),
  makeTool('utilities', 'unicode-normalizer', 'Unicode Normalizer', 'Normalize Unicode text into NFC, NFD, NFKC, or NFKD form.', (text, options) => text.normalize(options.form), { fields: [{ name: 'form', label: 'Normalization form', type: 'select', defaultValue: 'NFC', options: [['NFC', 'NFC'], ['NFD', 'NFD'], ['NFKC', 'NFKC'], ['NFKD', 'NFKD']] }] }),
  makeTool('utilities', 'text-to-pig-latin', 'Pig Latin Converter', 'Translate English words into a basic Pig Latin form for playful text transformations.', text => text.replace(/\b([a-z]+)([.!?,;:]*)\b/gi, (_match, word, punctuation) => {
    const upper = word[0] === word[0].toUpperCase();
    const converted = /^[aeiou]/i.test(word) ? `${word}way` : `${word.replace(/^([^aeiou]+)(.*)$/i, '$2$1')}ay`;
    return `${upper ? converted[0].toUpperCase() + converted.slice(1) : converted}${punctuation}`;
  })),
  makeTool('utilities', 'url-encode-full-url', 'Full URL Encoder', 'Encode a complete URL string for safe use as a parameter in another URL.', text => encodeURIComponent(text.trim())),
  makeTool('utilities', 'text-to-csv-column', 'Text List to CSV Column', 'Convert each non-empty line into a safely escaped single-column CSV file.', text => text.split(/\r\n|\r|\n/).filter(Boolean).map(toCsvCell).join('\n')),
  makeTool('transformers', 'csv-transposer', 'CSV Transposer', 'Flip rows and columns in a CSV table while preserving quoted values.', text => {
    const rows = parseCsv(text);
    if (!rows.length) throw new Error('Enter a CSV table to transpose.');
    const width = Math.max(...rows.map(row => row.length));
    return Array.from({ length: width }, (_, column) =>
      rows.map(row => row[column] ?? '').map(toCsvCell).join(',')
    ).join('\n');
  }, { keywords: 'spreadsheet pivot rotate switch rows columns transpose' }),
  makeTool('transformers', 'csv-deduplicator', 'CSV Deduplicator', 'Remove duplicate CSV data rows while keeping the header and first occurrence.', (text, options) => {
    const { headers, rows } = parseCsvTable(text, 'CSV Deduplicator');
    const keyIndex = options.column ? headers.indexOf(options.column) : -1;
    if (options.column && keyIndex === -1) throw new Error('Choose a column name that exists in the CSV header.');
    const seen = new Set();
    const uniqueRows = rows.filter(row => {
      const key = JSON.stringify((keyIndex === -1 ? row : [row[keyIndex]]).map(value =>
        options.caseSensitive === 'yes' ? value : value.toLocaleLowerCase()
      ));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return [headers, ...uniqueRows].map(row => row.map(toCsvCell).join(',')).join('\n');
  }, { fields: [{ name: 'column', label: 'Deduplicate by column (blank = full row)', type: 'text', defaultValue: '' }, { name: 'caseSensitive', label: 'Case sensitive', type: 'select', defaultValue: 'no', options: [['no', 'No'], ['yes', 'Yes']] }], keywords: 'spreadsheet remove repeated unique records rows' }),
  makeTool('transformers', 'csv-row-sorter', 'CSV Row Sorter', 'Sort CSV data rows by any column without moving the header.', (text, options) => {
    const { headers, rows } = parseCsvTable(text, 'CSV Row Sorter');
    const column = headers.indexOf(options.column);
    if (column === -1) throw new Error('Choose a column name that exists in the CSV header.');
    if (options.mode === 'numeric' && rows.some(row => !row[column].trim() || !Number.isFinite(Number(row[column])))) {
      throw new Error('Every value in the selected column must be a number for numeric sorting.');
    }
    const sorted = [...rows].sort((left, right) => {
      const a = left[column];
      const b = right[column];
      if (options.mode === 'numeric') return Number(a) - Number(b);
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: options.caseSensitive === 'yes' ? 'variant' : 'base' });
    });
    if (options.direction === 'descending') sorted.reverse();
    return [headers, ...sorted].map(row => row.map(toCsvCell).join(',')).join('\n');
  }, { fields: [{ name: 'column', label: 'Sort by column', type: 'text', defaultValue: '' }, { name: 'mode', label: 'Sort type', type: 'select', defaultValue: 'text', options: [['text', 'Text'], ['numeric', 'Numeric']] }, { name: 'direction', label: 'Direction', type: 'select', defaultValue: 'ascending', options: [['ascending', 'Ascending'], ['descending', 'Descending']] }, { name: 'caseSensitive', label: 'Case sensitive', type: 'select', defaultValue: 'no', options: [['no', 'No'], ['yes', 'Yes']] }], keywords: 'spreadsheet order rows alphabetically numerically' }),
  makeTool('transformers', 'csv-row-filter', 'CSV Row Filter', 'Keep only CSV rows that match a column value or text condition.', (text, options) => {
    const { headers, rows } = parseCsvTable(text, 'CSV Row Filter');
    const column = headers.indexOf(options.column);
    if (column === -1) throw new Error('Choose a column name that exists in the CSV header.');
    const query = options.value ?? '';
    const matches = rows.filter(row => {
      const value = row[column];
      const candidate = options.caseSensitive === 'yes' ? value : value.toLocaleLowerCase();
      const expected = options.caseSensitive === 'yes' ? query : query.toLocaleLowerCase();
      if (options.operator === 'contains') return candidate.includes(expected);
      if (options.operator === 'startsWith') return candidate.startsWith(expected);
      if (options.operator === 'endsWith') return candidate.endsWith(expected);
      if (options.operator === 'notEmpty') return value.trim() !== '';
      return candidate === expected;
    });
    return [headers, ...matches].map(row => row.map(toCsvCell).join(',')).join('\n');
  }, { fields: [{ name: 'column', label: 'Filter column', type: 'text', defaultValue: '' }, { name: 'operator', label: 'Condition', type: 'select', defaultValue: 'contains', options: [['equals', 'Equals'], ['contains', 'Contains'], ['startsWith', 'Starts with'], ['endsWith', 'Ends with'], ['notEmpty', 'Is not empty']] }, { name: 'value', label: 'Match value', type: 'text', defaultValue: '' }, { name: 'caseSensitive', label: 'Case sensitive', type: 'select', defaultValue: 'no', options: [['no', 'No'], ['yes', 'Yes']] }], keywords: 'spreadsheet search select query rows data' }),
  makeTool('utilities', 'markdown-toc-generator', 'Markdown TOC Generator', 'Build a linked table of contents from Markdown headings, including stable duplicate-heading links.', (text, options) => {
    const maxDepth = Number(options.depth) || 6;
    const seen = new Map();
    const headings = text.split(/\r\n|\r|\n/).flatMap(line => {
      const match = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (!match || match[1].length > maxDepth) return [];
      const title = match[2].replace(/\\([\\`*_[\]{}()#+.!<>|-])/g, '$1').trim();
      const base = markdownSlug(title) || 'section';
      const count = seen.get(base) || 0;
      seen.set(base, count + 1);
      return [{ depth: match[1].length, title, slug: count ? `${base}-${count}` : base }];
    });
    if (!headings.length) throw new Error('Add Markdown headings such as ## Getting Started.');
    return headings.map(({ depth, title, slug }) => `${'  '.repeat(depth - 1)}- [${title}](#${slug})`).join('\n');
  }, { fields: [{ name: 'depth', label: 'Include headings through level', type: 'select', defaultValue: '6', options: [['2', 'H1–H2'], ['3', 'H1–H3'], ['4', 'H1–H4'], ['6', 'H1–H6']] }], assistantMatch: /\b(?:table of contents|toc)\b/i, keywords: 'readme navigation anchors heading outline' }),
  makeTool('utilities', 'markdown-link-extractor', 'Markdown Link Extractor', 'Extract Markdown links and image URLs into a clean, copyable list.', text => {
    const links = [...text.matchAll(/!?\[([^\]]*)\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/g)]
      .map(([, label, target]) => `${label || 'Image'}\t${target.replace(/^<|>$/g, '')}`);
    return links.length ? links.join('\n') : 'No inline Markdown links were found.';
  }, { keywords: 'readme markdown href image link urls' }),
  makeTool('transformers', 'markdown-table-to-csv', 'Markdown Table to CSV', 'Convert a Markdown pipe table into escaped CSV rows.', text => {
    const splitRow = line => {
      const cells = [];
      let cell = '';
      let escaped = false;
      for (const character of line.trim().replace(/^\|/, '').replace(/\|$/, '')) {
        if (escaped) {
          cell += character;
          escaped = false;
        } else if (character === '\\') {
          escaped = true;
        } else if (character === '|') {
          cells.push(cell.trim());
          cell = '';
        } else {
          cell += character;
        }
      }
      cells.push(cell.trim());
      return cells;
    };
    const rows = text.split(/\r\n|\r|\n/).filter(line => line.includes('|')).map(splitRow);
    if (rows.length < 2) throw new Error('Paste a Markdown table with a header and at least one row.');
    const dataRows = rows.filter(row => !row.every(cell => /^:?-{3,}:?$/.test(cell)));
    if (dataRows.some(row => row.length !== dataRows[0].length)) throw new Error('Every Markdown table row must have the same number of columns.');
    return dataRows.map(row => row.map(toCsvCell).join(',')).join('\n');
  }, { keywords: 'markdown github spreadsheet export pipe table' }),
  makeTool('transformers', 'json-flattener', 'JSON Flattener', 'Flatten nested JSON objects and arrays into JSON Pointer paths with JSON-typed values.', text => {
    const value = JSON.parse(text);
    const flattened = {};
    const visit = (item, path) => {
      if (item && typeof item === 'object' && Object.keys(item).length) {
        Object.entries(item).forEach(([key, child]) => {
          const segment = String(key).replaceAll('~', '~0').replaceAll('/', '~1');
          visit(child, `${path}/${segment}`);
        });
      } else {
        flattened[path] = item;
      }
    };
    visit(value, '');
    return JSON.stringify(flattened, null, 2);
  }, { keywords: 'nested object flatten normalize data paths' }),
  makeTool('utilities', 'json-pointer-query', 'JSON Pointer Query', 'Look up a value in JSON using an RFC 6901 JSON Pointer.', (text, options) => {
    const pointer = options.pointer ?? '';
    if (pointer && !pointer.startsWith('/')) throw new Error('A JSON Pointer must be empty for the root or start with /.');
    if (/~(?![01])/.test(pointer)) throw new Error('In JSON Pointers, ~ must be escaped as ~0 or ~1.');
    const value = pointer.split('/').slice(1).map(part => part.replaceAll('~1', '/').replaceAll('~0', '~'))
      .reduce((current, key) => {
        if (Array.isArray(current)) {
          if (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= current.length) throw new Error(`Array index "${key}" was not found.`);
          return current[Number(key)];
        }
        if (current === null || typeof current !== 'object' || !Object.hasOwn(current, key)) {
          throw new Error(`JSON property "${key}" was not found.`);
        }
        return current[key];
      }, JSON.parse(text));
    return JSON.stringify(value, null, 2) ?? String(value);
  }, { fields: [{ name: 'pointer', label: 'JSON Pointer (for example /users/0/name)', type: 'text', defaultValue: '' }], keywords: 'json query path lookup rfc6901' }),
  makeTool('transformers', 'json-to-sql-insert', 'JSON to SQL INSERT', 'Generate escaped SQL INSERT statements from a JSON object or array of objects.', (text, options) => {
    const data = JSON.parse(text);
    const records = Array.isArray(data) ? data : [data];
    if (!records.length || records.some(record => !record || typeof record !== 'object' || Array.isArray(record))) {
      throw new Error('Enter a JSON object or an array of JSON objects.');
    }
    const columns = Object.keys(records[0]);
    if (!columns.length || records.some(record => columns.length !== Object.keys(record).length || columns.some(key => !Object.hasOwn(record, key)))) {
      throw new Error('Every JSON object must have the same non-empty set of properties.');
    }
    const table = sqlIdentifier(options.table || 'records');
    const names = columns.map(column => `"${column.replaceAll('"', '""')}"`).join(', ');
    return records.map(record =>
      `INSERT INTO ${table} (${names}) VALUES (${columns.map(column => sqlValue(record[column])).join(', ')});`
    ).join('\n');
  }, { fields: [{ name: 'table', label: 'SQL table name', type: 'text', defaultValue: 'records' }], keywords: 'database insert query postgres mysql sqlite' }),
  makeTool('transformers', 'json-to-go-struct', 'JSON to Go Struct', 'Generate a Go struct with JSON tags from a sample JSON object.', text => {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Enter a JSON object to create a Go struct.');
    const goFields = entries => {
      const usedNames = new Set();
      return entries.map(([key, value], index) => {
        const baseName = toGoFieldName(key, index);
        let name = baseName;
        let suffix = 2;
        while (usedNames.has(name)) name = `${baseName}${suffix++}`;
        usedNames.add(name);
        return `\t${name} ${goType(value)} ${JSON.stringify(`json:"${key}"`)}`;
      });
    };
    const goType = value => {
      if (value === null) return 'any';
      if (typeof value === 'string') return 'string';
      if (typeof value === 'boolean') return 'bool';
      if (typeof value === 'number') return Number.isInteger(value) ? 'int64' : 'float64';
      if (Array.isArray(value)) {
        const types = [...new Set(value.map(goType))];
        return `[]${types.length === 1 ? types[0] : 'any'}`;
      }
      return `struct {\n${goFields(Object.entries(value)).map(field => `\t${field}`).join('\n')}\n\t}`;
    };
    const fields = goFields(Object.entries(data));
    if (!fields.length) throw new Error('The JSON object needs at least one property.');
    return `type Root struct {\n${fields.join('\n')}\n}`;
  }, { keywords: 'golang golang struct json model code generation' }),
  makeTool('transformers', 'sql-in-clause-generator', 'SQL IN Clause Generator', 'Build a safely quoted SQL IN list from a comma-separated or line-separated value list.', (text, options) => {
    const values = options.delimiter === 'lines'
      ? text.split(/\r\n|\r|\n/).filter(value => value.trim())
      : parseCsv(text).flat();
    if (!values.length || values.every(value => !value.trim())) throw new Error('Enter at least one non-empty value.');
    const items = options.valueType === 'number' ? values.map(value => {
      const number = Number(value.trim());
      if (!Number.isFinite(number)) throw new Error(`"${value}" is not a valid number.`);
      return String(number);
    }) : values.map(sqlValue);
    return `(${items.join(', ')})`;
  }, { fields: [{ name: 'delimiter', label: 'Input format', type: 'select', defaultValue: 'csv', options: [['csv', 'CSV values'], ['lines', 'One value per line']] }, { name: 'valueType', label: 'Value type', type: 'select', defaultValue: 'text', options: [['text', 'Text (quoted safely)'], ['number', 'Numbers']] }], keywords: 'database query where select list values' }),
  makeTool('utilities', 'url-query-builder', 'URL Query Builder', 'Add query parameters to an absolute HTTP or HTTPS URL from key=value lines.', (text, options) => {
    let url;
    try { url = new URL(options.url); } catch { throw new Error('Enter a valid absolute URL in the URL field.'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
    parseCsv(text).flat().forEach((pair, index) => {
      if (!pair) return;
      const separator = pair.indexOf('=');
      if (separator <= 0) throw new Error(`Line ${index + 1}: use key=value.`);
      url.searchParams.append(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
    });
    return url.toString();
  }, { fields: [{ name: 'url', label: 'Base URL', type: 'text', defaultValue: 'https://example.com/search' }], placeholder: 'q=browser tools\npage=1', assistantMatch: /\b(?:build|add|create)\b.{0,30}\b(?:query parameters?|search params?)\b/i, keywords: 'URL search params query string builder' }),
  makeTool('utilities', 'utm-link-builder', 'UTM Link Builder', 'Add properly encoded campaign tracking parameters to an HTTP or HTTPS URL.', (text, options) => {
    let url;
    try { url = new URL(text.trim()); } catch { throw new Error('Enter a valid absolute campaign URL.'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
    [['utm_source', options.source], ['utm_medium', options.medium], ['utm_campaign', options.campaign], ['utm_term', options.term], ['utm_content', options.content]]
      .forEach(([key, value]) => { if (value.trim()) url.searchParams.set(key, value.trim()); });
    if (!options.source.trim() || !options.medium.trim() || !options.campaign.trim()) {
      throw new Error('Campaign source, medium, and name are required.');
    }
    return url.toString();
  }, { fields: [{ name: 'source', label: 'Campaign source (required)', type: 'text', defaultValue: '' }, { name: 'medium', label: 'Campaign medium (required)', type: 'text', defaultValue: '' }, { name: 'campaign', label: 'Campaign name (required)', type: 'text', defaultValue: '' }, { name: 'term', label: 'Campaign term (optional)', type: 'text', defaultValue: '' }, { name: 'content', label: 'Campaign content (optional)', type: 'text', defaultValue: '' }], placeholder: 'https://example.com/product', assistantMatch: /\butm\b|\bcampaign tracking\b/i, keywords: 'analytics marketing tracking campaign link' }),
  makeTool('utilities', 'url-extractor', 'URL Extractor', 'Find unique HTTP and HTTPS links in text and normalize valid URLs.', text => {
    const candidates = text.match(/https?:\/\/[^\s<>"']+/gi) || [];
    const urls = [...new Set(candidates.map(candidate => {
      const cleaned = candidate.replace(/[.,!?;:)}\]]+$/g, '');
      try {
        const url = new URL(cleaned);
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
      } catch { return ''; }
    }).filter(Boolean))];
    return urls.length ? urls.join('\n') : 'No HTTP or HTTPS URLs were found.';
  }, { keywords: 'find links extract web addresses from text' }),
  makeTool('utilities', 'regex-literal-escaper', 'Regex Literal Escaper', 'Escape special characters so text can be safely searched as a literal regular expression.', text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), { keywords: 'regular expression escape quote literal metacharacters' }),
  makeTool('transformers', 'css-px-rem-converter', 'CSS px/rem Converter', 'Convert CSS pixel lengths to rem units or rem units back to pixels.', (text, options) => {
    const rootSize = Number(options.rootSize);
    if (!Number.isFinite(rootSize) || rootSize <= 0 || rootSize > 1000) throw new Error('Root font size must be a positive number no greater than 1,000 px.');
    const toRem = options.direction === 'toRem';
    const sourceUnit = toRem ? 'px' : 'rem';
    const targetUnit = toRem ? 'rem' : 'px';
    const pattern = new RegExp(`(-?(?:\\d+\\.?\\d*|\\.\\d+))${sourceUnit}\\b`, 'gi');
    let found = false;
    const result = text.replace(pattern, (_match, number) => {
      found = true;
      const converted = toRem ? Number(number) / rootSize : Number(number) * rootSize;
      return `${Number(converted.toFixed(5))}${targetUnit}`;
    });
    if (!found) throw new Error(`No CSS ${sourceUnit} values were found.`);
    return result;
  }, { fields: [{ name: 'direction', label: 'Conversion', type: 'select', defaultValue: 'toRem', options: [['toRem', 'px to rem'], ['toPx', 'rem to px']] }, { name: 'rootSize', label: 'Root font size (px)', type: 'number', defaultValue: '16' }], keywords: 'css responsive typography units convert' }),
  makeTool('transformers', 'css-clamp-generator', 'CSS clamp() Generator', 'Create a fluid CSS clamp() value from minimum and maximum sizes and viewport widths.', (_text, options) => {
    const min = Number(options.minimum);
    const max = Number(options.maximum);
    const minViewport = Number(options.minViewport);
    const maxViewport = Number(options.maxViewport);
    if (![min, max, minViewport, maxViewport].every(Number.isFinite) || min < 0 || max < min || minViewport < 1 || maxViewport <= minViewport) {
      throw new Error('Use valid sizes, with a larger maximum size and maximum viewport width.');
    }
    const slope = (max - min) / (maxViewport - minViewport) * 100;
    const intercept = min - slope * minViewport / 100;
    return `clamp(${min}px, calc(${Number(intercept.toFixed(4))}px + ${Number(slope.toFixed(4))}vw), ${max}px)`;
  }, { fields: [{ name: 'minimum', label: 'Minimum size (px)', type: 'number', defaultValue: '16' }, { name: 'maximum', label: 'Maximum size (px)', type: 'number', defaultValue: '40' }, { name: 'minViewport', label: 'Minimum viewport width (px)', type: 'number', defaultValue: '320' }, { name: 'maxViewport', label: 'Maximum viewport width (px)', type: 'number', defaultValue: '1200' }], keywords: 'fluid responsive typography spacing css function' }),
  makeTool('transformers', 'css-grid-generator', 'CSS Grid Generator', 'Generate a CSS Grid layout with configurable columns, gap, and alignment.', (_text, options) => {
    const columns = Number(options.columns);
    const gap = Number(options.gap);
    if (!Number.isInteger(columns) || columns < 1 || columns > 12) throw new Error('Choose a whole number of columns from 1 to 12.');
    if (!Number.isFinite(gap) || gap < 0 || gap > 500) throw new Error('Grid gap must be between 0 and 500 pixels.');
    return `.grid-container {\n  display: grid;\n  grid-template-columns: repeat(${columns}, minmax(0, 1fr));\n  gap: ${gap}px;\n  align-items: ${options.alignment};\n}`;
  }, { requiresInput: false, fields: [{ name: 'columns', label: 'Columns (1–12)', type: 'number', defaultValue: '3' }, { name: 'gap', label: 'Gap (px)', type: 'number', defaultValue: '16' }, { name: 'alignment', label: 'Vertical alignment', type: 'select', defaultValue: 'start', options: [['start', 'Start'], ['center', 'Center'], ['end', 'End'], ['stretch', 'Stretch']] }], keywords: 'layout responsive frontend design' }),
  makeTool('transformers', 'html-boilerplate-generator', 'HTML Boilerplate Generator', 'Create a responsive HTML5 page with safe, escaped title and description metadata.', (_text, options) => {
    const title = encodeEntities(options.title.trim() || 'New Page');
    const description = encodeEntities(options.description.trim());
    const themeColor = options.themeColor.trim() || '#111827';
    if (!/^#[\da-f]{6}$/i.test(themeColor)) throw new Error('Enter a 6-digit hex theme color such as #112233.');
    return `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta name="theme-color" content="${themeColor}">\n  <meta name="description" content="${description}">\n  <title>${title}</title>\n</head>\n<body>\n  <main>\n    <h1>${title}</h1>\n  </main>\n</body>\n</html>`;
  }, { requiresInput: false, fields: [{ name: 'title', label: 'Page title', type: 'text', defaultValue: 'New Page' }, { name: 'description', label: 'Description', type: 'text', defaultValue: '' }, { name: 'themeColor', label: 'Theme color', type: 'text', defaultValue: '#111827' }], keywords: 'starter template responsive webpage skeleton' }),
  makeTool('utilities', 'robots-txt-generator', 'robots.txt Generator', 'Create a robots.txt file with crawler rules and an optional sitemap URL.', (_text, options) => {
    const userAgent = options.userAgent.trim() || '*';
    if (/[\r\n]/.test(userAgent)) throw new Error('User-agent must be a single line.');
    const rules = [];
    const paths = (value, label) => value.split(/[\r\n,]/).map(path => path.trim()).filter(Boolean).map(path => {
      if (!path.startsWith('/') || /[\r\n]/.test(path)) throw new Error(`${label} paths must start with /.`);
      return path;
    });
    rules.push(`User-agent: ${userAgent}`);
    paths(options.disallow, 'Disallow').forEach(path => rules.push(`Disallow: ${path}`));
    paths(options.allow, 'Allow').forEach(path => rules.push(`Allow: ${path}`));
    if (options.sitemap.trim()) {
      let sitemap;
      try { sitemap = new URL(options.sitemap.trim()); } catch { throw new Error('Enter an absolute sitemap URL.'); }
      if (!['http:', 'https:'].includes(sitemap.protocol)) throw new Error('The sitemap URL must use HTTP or HTTPS.');
      rules.push('', `Sitemap: ${sitemap.toString()}`);
    }
    return rules.join('\n') + '\n';
  }, { requiresInput: false, fields: [{ name: 'userAgent', label: 'User-agent', type: 'text', defaultValue: '*' }, { name: 'disallow', label: 'Disallow paths (one per line)', type: 'textarea', rows: 3, defaultValue: '/private/' }, { name: 'allow', label: 'Allow paths (one per line)', type: 'textarea', rows: 3, defaultValue: '/' }, { name: 'sitemap', label: 'Sitemap URL (optional)', type: 'text', defaultValue: '' }], assistantMatch: /\brobots\.txt\b/i, keywords: 'SEO crawler search engine indexing website' }),
  makeTool('utilities', 'xml-sitemap-generator', 'XML Sitemap Generator', 'Generate a basic XML sitemap from one absolute HTTP or HTTPS URL per line.', text => {
    const urls = text.split(/\r\n|\r|\n/).map(line => line.trim()).filter(Boolean);
    if (!urls.length) throw new Error('Enter at least one page URL.');
    const normalized = urls.map(value => {
      let url;
      try { url = new URL(value); } catch { throw new Error(`Invalid absolute URL: ${value}`); }
      if (!['http:', 'https:'].includes(url.protocol) || url.hash) throw new Error(`Use an HTTP or HTTPS page URL without a fragment: ${value}`);
      return url.toString();
    });
    const unique = [...new Set(normalized)];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map(url => `  <url><loc>${encodeEntities(url)}</loc></url>`).join('\n')}\n</urlset>`;
  }, { keywords: 'SEO search indexing website pages crawl' }),
  makeTool('utilities', 'gitignore-generator', '.gitignore Generator', 'Create a starter .gitignore for common programming languages and development platforms.', (_text, options) => {
    const templates = {
      node: '# Node\nnode_modules/\ndist/\ncoverage/\n.env\n.env.*\n!.env.example\nnpm-debug.log*\n',
      react: '# React / Vite\nnode_modules/\ndist/\ncoverage/\n.env\n.env.*\n!.env.example\n.vite/\n',
      python: '# Python\n__pycache__/\n*.py[cod]\n.venv/\nvenv/\n.pytest_cache/\n.mypy_cache/\n.env\n',
      java: '# Java\n*.class\n*.jar\n/target/\n.gradle/\nbuild/\n.idea/\n',
      go: '# Go\n*.exe\n*.test\n/vendor/\n.env\n',
      rust: '# Rust\n/target/\n',
      macos: '# macOS\n.DS_Store\n.AppleDouble\n.LSOverride\n',
      windows: '# Windows\nThumbs.db\nDesktop.ini\n$RECYCLE.BIN/\n*.lnk\n'
    };
    return templates[options.template] || templates.node;
  }, { requiresInput: false, fields: [{ name: 'template', label: 'Project type', type: 'select', defaultValue: 'node', options: [['node', 'Node.js'], ['react', 'React / Vite'], ['python', 'Python'], ['java', 'Java'], ['go', 'Go'], ['rust', 'Rust'], ['macos', 'macOS'], ['windows', 'Windows']] }], assistantMatch: /\.gitignore\b/i, keywords: 'git source control ignore build artifacts' }),
  makeTool('utilities', 'env-example-generator', '.env.example Generator', 'Create a safe .env.example containing variable names only; supplied values are discarded.', text => {
    const names = [...new Set(text.split(/\r\n|\r|\n/).map(line => line.trim()).filter(Boolean).map(line => line.split('=', 1)[0].trim()))];
    if (!names.length) throw new Error('Enter environment variable names, one per line.');
    if (names.some(name => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))) throw new Error('Variable names must use letters, numbers, and underscores, and cannot start with a number.');
    return names.map(name => `${name}=`).join('\n');
  }, { assistantMatch: /\.env\.example\b/i, keywords: 'environment variables template configuration secret scrub remove values' }),
  makeTool('transformers', 'http-fetch-snippet-generator', 'HTTP Fetch Snippet Generator', 'Generate a safe JavaScript fetch() example from a URL, method, headers, and body.', (_text, options) => {
    let url;
    try { url = new URL(options.url.trim()); } catch { throw new Error('Enter a valid absolute HTTP or HTTPS URL.'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
    let headers;
    try { headers = JSON.parse(options.headers || '{}'); } catch { throw new Error('Headers must be a valid JSON object.'); }
    if (!headers || typeof headers !== 'object' || Array.isArray(headers) || Object.values(headers).some(value => typeof value !== 'string')) {
      throw new Error('Headers must be a JSON object with string values.');
    }
    const method = options.method;
    if (options.body && ['GET', 'HEAD'].includes(method)) throw new Error(`${method} requests cannot include a request body.`);
    const request = { method, headers };
    if (options.body && !['GET', 'HEAD'].includes(method)) request.body = options.body;
    return `const response = await fetch(${JSON.stringify(url.toString())}, ${JSON.stringify(request, null, 2)});\nconst data = await response.json();\nconsole.log(data);`;
  }, { requiresInput: false, fields: [{ name: 'url', label: 'Request URL', type: 'text', defaultValue: 'https://api.example.com/items' }, { name: 'method', label: 'HTTP method', type: 'select', defaultValue: 'GET', options: [['GET', 'GET'], ['POST', 'POST'], ['PUT', 'PUT'], ['PATCH', 'PATCH'], ['DELETE', 'DELETE']] }, { name: 'headers', label: 'Headers (JSON object)', type: 'textarea', rows: 3, defaultValue: '{}' }, { name: 'body', label: 'Request body', type: 'textarea', rows: 4, defaultValue: '' }], keywords: 'API REST request fetch code snippet JavaScript client' }),
  makeTool('utilities', 'html-meta-inspector', 'HTML Meta Inspector', 'Inspect pasted HTML and summarize its title, description, canonical URL, and social preview tags.', text => {
    const document = new DOMParser().parseFromString(text, 'text/html');
    const getMeta = selector => document.querySelector(selector)?.getAttribute('content')?.trim() || 'Not set';
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || 'Not set';
    return [
      `Title: ${document.title.trim() || 'Not set'}`,
      `Description: ${getMeta('meta[name="description"]')}`,
      `Canonical URL: ${canonical}`,
      `Open Graph title: ${getMeta('meta[property="og:title"]')}`,
      `Open Graph description: ${getMeta('meta[property="og:description"]')}`,
      `Open Graph image: ${getMeta('meta[property="og:image"]')}`,
      `Twitter card: ${getMeta('meta[name="twitter:card"]')}`
    ].join('\n');
  }, { keywords: 'SEO website preview social sharing open graph head tags' })
];

export const ADDITIONAL_TOOLS = [...BASE_ADDITIONAL_TOOLS, ...ADVANCED_TOOLS];

export const getAdditionalTool = id => ADDITIONAL_TOOLS.find(tool => tool.id === id);

export async function runAdditionalTool(id, input, options = {}) {
  const tool = getAdditionalTool(id);
  if (!tool) throw new Error('That tool is not available.');
  if (tool.inputMode !== 'image' && typeof input !== 'string') throw new Error('Enter text to process.');
  const defaults = Object.fromEntries(tool.fields.map(field => [field.name, field.defaultValue ?? '']));
  return tool.run(input, { ...defaults, ...options });
}
