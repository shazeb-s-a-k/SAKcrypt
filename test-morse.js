import { encodeMorse, decodeMorse } from './src/utils/morse.js';
const encoded = encodeMorse("HELLO WORLD");
console.log("Encoded:", JSON.stringify(encoded));
console.log("Decoded:", decodeMorse(encoded));
