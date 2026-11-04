import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createImageFilename,
  getImageExtension,
  parseImagePrompts
} from './src/utils/imageBatch.js';

test('parses actual LF and CRLF lines and ignores empty lines', () => {
  assert.deepEqual(
    parseImagePrompts('A very long prompt that wraps visually in an editor\r\n\r\nSecond prompt\nThird prompt'),
    [
      'A very long prompt that wraps visually in an editor',
      'Second prompt',
      'Third prompt'
    ]
  );
});

test('keeps wrapped visual text as one prompt until an actual line break', () => {
  const prompt = 'A detailed image prompt that may wrap in a narrow editor';
  assert.deepEqual(parseImagePrompts(prompt), [prompt]);
});

test('creates safe prompt-based filenames with ordered padded sequence numbers', () => {
  assert.equal(
    createImageFilename('Image of Bird: / sunrise', 1, 12, 'image/webp'),
    'Image_of_Bird_sunrise_001.webp'
  );
  assert.equal(
    createImageFilename('Bird', 12, 1200, 'image/png'),
    'Bird_0012.png'
  );
});

test('uses a fallback label and preserves known image extensions', () => {
  assert.equal(createImageFilename('///', 1, 1, 'image/jpeg'), 'image_001.jpg');
  assert.equal(getImageExtension('image/webp'), 'webp');
});
