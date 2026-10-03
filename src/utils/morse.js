// Zero-width (Stealth)
export const ZW_DOT = '\u200B';
export const ZW_DASH = '\u200C';
export const ZW_LETTER_SEP = '\u200D';
export const ZW_WORD_SEP = '\u2060';

// Obscure visual characters
export const OBS_DOT = '●';
export const OBS_DASH = '▬';
export const OBS_LETTER_SEP = '|';
export const OBS_WORD_SEP = '‖';

// Standard Morse Code Dictionary
const morseDict = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
  '9': '----.', '0': '-----', ' ': ' '
};

const reverseMorseDict = Object.fromEntries(
  Object.entries(morseDict).map(([k, v]) => [v, k])
);

export function encodeMorse(text, mode = 'stealth') {
  if (!text) return '';
  const isStealth = mode === 'stealth';
  const dot = isStealth ? ZW_DOT : OBS_DOT;
  const dash = isStealth ? ZW_DASH : OBS_DASH;
  const letterSep = isStealth ? ZW_LETTER_SEP : OBS_LETTER_SEP;
  const wordSep = isStealth ? ZW_WORD_SEP : OBS_WORD_SEP;

  // By adding empty strings at the start and end, we force the encoded output 
  // to begin and end with a `wordSep` character. These act as "sacrificial" 
  // characters for chat apps (like Telegram) that trim invisible whitespace.
  const words = ['', ...text.toUpperCase().trim().split(/\s+/), ''];
  
  const encodedWords = words.map(word => {
    if (!word) return ''; // Skip empty words (our sacrificial boundaries)
    const letters = word.split('').map(char => morseDict[char] || '');
    const encodedLetters = letters.map(letterMorse => {
      return letterMorse
        .split('')
        .map(sym => sym === '.' ? dot : (sym === '-' ? dash : ''))
        .join('');
    });
    return encodedLetters.join(letterSep);
  });
  
  return encodedWords.join(wordSep);
}

export function isPhantomText(text) {
  if (!text) return false;
  const hasStealth = /[\u200B\u200C\u200D\u2060]/.test(text);
  const hasObscure = text.includes(OBS_DOT) || text.includes(OBS_DASH);
  return hasStealth || hasObscure;
}

export function decodeMorse(encodedText) {
  if (!encodedText) return '';
  
  // Detect mode based on characters present
  const isObscure = encodedText.includes(OBS_DOT) || encodedText.includes(OBS_DASH);
  
  let validOnly = encodedText;
  if (!isObscure) {
    // If it's stealth, extract ONLY stealth characters (allows hiding text inside normal text)
    validOnly = encodedText.replace(/[^\u200B\u200C\u200D\u2060]/g, '');
  }
  
  if (!validOnly) return '';

  const dot = isObscure ? OBS_DOT : ZW_DOT;
  const dash = isObscure ? OBS_DASH : ZW_DASH;
  const letterSep = isObscure ? OBS_LETTER_SEP : ZW_LETTER_SEP;
  const wordSep = isObscure ? OBS_WORD_SEP : ZW_WORD_SEP;

  const words = validOnly.split(wordSep);
  
  const decodedWords = words.map(word => {
    const letters = word.split(letterSep);
    const decodedLetters = letters.map(encodedLetter => {
      const standardMorse = encodedLetter
        .split('')
        .map(char => char === dot ? '.' : (char === dash ? '-' : ''))
        .join('');
        
      return reverseMorseDict[standardMorse] || '';
    });
    return decodedLetters.join('');
  });
  
  return decodedWords.join(' ').trim();
}
