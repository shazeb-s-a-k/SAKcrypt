const text = "1234567890".repeat(20); // 200 chars
const chunkSize = 100;
const chunks = [];
for (let i = 0; i < text.length; i += chunkSize) {
  chunks.push(text.slice(i, i + chunkSize));
}
console.log(chunks);
