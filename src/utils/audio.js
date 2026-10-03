// Web Audio API logic for Morse Code playback

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Timing constants (in seconds)
// Standard Morse: dot = 1 unit, dash = 3 units, intra-char gap = 1 unit, inter-char gap = 3 units, word gap = 7 units
const DOT_DURATION = 0.08; 
const DASH_DURATION = DOT_DURATION * 3;
const INTRA_CHAR_GAP = DOT_DURATION;
const INTER_CHAR_GAP = DOT_DURATION * 3;
const WORD_GAP = DOT_DURATION * 7;
const FREQUENCY = 600; // Hz

export async function playMorseAudio(text, onComplete) {
  if (!text) {
    if (onComplete) onComplete();
    return;
  }
  
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  let time = ctx.currentTime;

  // We'll create an oscillator and gain node for the entire sequence
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(FREQUENCY, ctx.currentTime);
  
  // Start with 0 volume
  gainNode.gain.setValueAtTime(0, time);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start(time);

  // Parse the input text directly and schedule audio.
  const words = text.toUpperCase().trim().split(/\s+/);
  
  // Import the morseDict from morse.js or recreate it. Recreating is safer for avoiding circular dependencies.
  const dict = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
    '9': '----.', '0': '-----'
  };

  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    for (let c = 0; c < word.length; c++) {
      const char = word[c];
      const code = dict[char];
      
      if (code) {
        for (let i = 0; i < code.length; i++) {
          const sym = code[i];
          const duration = (sym === '.') ? DOT_DURATION : DASH_DURATION;
          
          // Smooth attack and release to avoid clicks
          gainNode.gain.setTargetAtTime(1, time, 0.005);
          time += duration;
          gainNode.gain.setTargetAtTime(0, time, 0.005);
          
          // Gap between symbols in a character
          if (i < code.length - 1) {
            time += INTRA_CHAR_GAP;
          }
        }
      }
      // Gap between characters
      if (c < word.length - 1) {
        time += INTER_CHAR_GAP;
      }
    }
    // Gap between words
    if (w < words.length - 1) {
      time += WORD_GAP;
    }
  }

  // Stop the oscillator after the sequence
  oscillator.stop(time + 0.1);

  // Callback when finished
  if (onComplete) {
    setTimeout(onComplete, (time - ctx.currentTime) * 1000);
  }
}

export function stopAudio() {
  if (audioCtx) {
    audioCtx.close().then(() => {
      audioCtx = null;
    });
  }
}
