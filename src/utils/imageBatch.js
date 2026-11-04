export function parseImagePrompts(text) {
  return text
    .split(/\r\n?|\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getImageExtension(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/jpeg') return 'jpg';
  return 'img';
}

export function createImageFilename(prompt, sequence, total, mimeType) {
  const promptLabel = prompt
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split('')
    .filter((character) => (
      character.charCodeAt(0) >= 32 && !/[<>:"/\\|?*]/.test(character)
    ))
    .join('')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 48)
    .replace(/_+$/g, '') || 'image';
  const sequenceWidth = Math.max(3, String(total).length);
  const sequenceLabel = String(sequence).padStart(sequenceWidth, '0');

  return `${promptLabel}_${sequenceLabel}.${getImageExtension(mimeType)}`;
}
