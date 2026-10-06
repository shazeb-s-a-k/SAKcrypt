const fs = require('fs');

const file = 'src/pages/LandingPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// The titles in the desired order
const orderedTitles = [
  'JSON Formatter',
  'JWT Inspector',
  'Regex Sandbox',
  'UUID Generator',
  'Base64 Converter',
  'URL Encoder',
  'Hash Engine',
  'CRON Job Generator',
  'SQL Formatter',
  'Meta Tag Generator',
  
  'Port Scanner',
  'SSL Checker',
  'Network Scanner',
  'DNS Lookup',
  'API Key Tester',
  'Password Strength',
  'Cyber Vault',

  'YAML to JSON',
  'JSON to YAML',
  'JSON to CSV',
  'HTML to JSX Converter',
  'Markdown to HTML',
  'Markdown Previewer',
  'CSS Minifier',
  'XML Formatter',

  'Fake Data Generator',
  'Base Converter',
  'Text Tools',
  'Lorem Ipsum Generator',
  'Color Palette Gen',
  'SVG Placeholder Gen',
  'ASCII Art Generator',
  'HTTP Status Codes',
  'Chmod Calculator',
  'IP Subnet Calculator',

  'AI Prompt Optimizer',
  'AI Code Explainer',
  'AI Regex Generator',

  'Phantom Text',
  'Sonic Transfer',
  'QR Code Engine',
  'WiFi QR Generator',
  'EXIF Scrubber',
  'File Encryptor',
  'Bcrypt Generator',
  'JWT Generator',
  'HMAC Generator',
  'RSA Key Generator',
  'Base64 File Encoder',
  'JWT Decoder',
  'Cron Job Parser'
];

// Extract the features array using regex
// It starts with `const features = [` and ends with `];\n\nconst containerVariants`
const featuresStartIdx = content.indexOf('const features = [');
const featuresEndIdx = content.indexOf('];\n\nconst containerVariants');

if (featuresStartIdx === -1 || featuresEndIdx === -1) {
  console.error("Couldn't find features array boundaries.");
  process.exit(1);
}

const featuresArrayString = content.substring(featuresStartIdx, featuresEndIdx + 1);

// We'll extract individual feature blocks. 
// A block is basically `{ ... }` but can contain nested `{}` for the icon prop.
// So we can split by `  },\n  {` or use a regex.
let featureBlocks = [];
const blockRegex = /\{\n\s+title: '([^']+)'[\s\S]*?\n\s+\}/g;
let match;
let lastIndex = featuresStartIdx + 18; // after '['
let blocksMap = new Map();

while ((match = blockRegex.exec(featuresArrayString)) !== null) {
  const title = match[1];
  blocksMap.set(title, match[0]);
}

// Ensure all ordered titles exist
let newArrayParts = [];
orderedTitles.forEach(title => {
  if (blocksMap.has(title)) {
    newArrayParts.push(blocksMap.get(title));
    blocksMap.delete(title);
  } else {
    console.warn("Warning: Missing in file -> " + title);
  }
});

// Append any remaining live blocks that were missed
for (let [title, block] of blocksMap.entries()) {
  if (!block.includes('comingSoon: true')) {
    console.log("Appending missed live tool: " + title);
    newArrayParts.push(block);
    blocksMap.delete(title);
  }
}

// Append a comment
newArrayParts.push("  // --- COMING SOON TOOLS ---");

// Append coming soon tools
for (let [title, block] of blocksMap.entries()) {
  newArrayParts.push(block);
}

const newFeaturesString = 'const features = [\n  ' + newArrayParts.map(x => {
  if (x === "  // --- COMING SOON TOOLS ---") return x.trim();
  return x;
}).join(',\n  ') + '\n';

content = content.substring(0, featuresStartIdx) + newFeaturesString + content.substring(featuresEndIdx + 1);

fs.writeFileSync(file, content);
console.log("Done!");
