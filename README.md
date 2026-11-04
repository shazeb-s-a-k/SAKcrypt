# SAKrypt Suite 🛡️

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-Fast-facc15)

**SAKrypt Suite** is a high-end, hyper-secure collection of cryptography and developer utilities designed for absolute stealth. 

It features an array of powerful tools, including encoding secret payloads into invisible zero-width characters (Phantom Text) and transmitting data over-the-air using high-frequency sound waves (Sonic Transfer).

> **Made with ❤️ by Shazeb**

---

## ✨ The Arsenal

- **Phantom Text (Stealth Morse)**: Turn text, passwords, and media files (up to 100KB via drag-and-drop) into completely invisible zero-width unicode characters. Paste them securely into any chat app without anyone knowing they are there. Auto-translates upon pasting back.
- **Sonic Transfer**: Utilizing `ggwave` FSK modulation and the Web Audio API, transmit offline text payloads to nearby devices using sound waves. No Bluetooth or WiFi pairing required.
- **Cyber Vault**: Generate cryptographically secure, unbreakable passwords with highly customizable parameters.
- **QR Code Engine**: Generate custom, high-res QR codes instantly with customizable foregrounds and backgrounds.
- **Regex Sandbox**: A live playground to test, debug, and execute Regular Expressions on the fly.
- **UUID Generator**: Instantly generate universally unique identifiers (v4).
- **AI Image Generator**: Choose the AI Horde volunteer network or Pollinations Classic, select available Horde models, and generate images in the app without a personal API key.
- **Mass Generate**: Upload a text file with one prompt per line, generate images sequentially, and download the results together as an ordered ZIP archive.

## 💎 Design & Animations

Built with a massive focus on user experience and aesthetics. It utilizes a **Vercel-inspired** clean dark theme, combined with buttery-smooth **Framer Motion** page transitions, a beautifully animated landing page, interactive top navigation, and micro-animations to impress everyone who uses it. Fully responsive for PC, Mac, Android, and iOS.

## 🚀 Quick Start (Local Deployment)

We've made local deployment 1-click easy!

### Mac / Linux
Double-click `deploy.command` in Finder to automatically install dependencies and launch the local server.

### Windows
Double-click `deploy.bat` to launch the server instantly.

Alternatively, via terminal:
```bash
npm install
npm run dev
```

### AI Image Generator notes

AI Horde is the default provider and uses its documented anonymous API with the public anonymous access key. Its model selector loads currently available models from the community worker catalog, omitting model names explicitly labeled NSFW; choose a specific model or let the service select any compatible model. The same selection applies to single and mass generation. Anonymous requests are lower priority and are shared with LAION by the provider.

Pollinations Classic is an alternative no-key provider with one fixed model and JPEG output up to 768×768. Its free tier is limited per client IP to at least one request every 45 seconds, adds a Pollinations logo, and may return HTTP 402 with a retry delay. Mass generation spaces requests to respect that interval. Both providers are best-effort public services and prompts are sent to the selected provider; do not include sensitive information.

Choose an aspect ratio in the image generator for square (1:1), landscape (16:9 or 4:3), or portrait (9:16 or 3:4) output. Each provider uses dimensions suited to its service limits while preserving the selected ratio.

AI Horde is community-run rather than a production API with an availability guarantee. Generation can queue for several minutes, anonymous requests may be limited during high load, and availability depends on volunteer workers. The app respects provider queues and limits; it does not rotate identities or attempt to bypass them.

The **Mass Generate** mode accepts pasted text as well as `.txt`, `.text`, and `.md` files, treating each actual line as one prompt and ignoring blank lines. It generates images sequentially in file order with no hard prompt-count cap. Filenames use a sanitized prompt prefix and a zero-padded sequence number (for example, `Image_of_Bird_001.webp`). Download the batch as one ZIP. If generation fails, already completed images remain downloadable; the ZIP also contains a note identifying the failed prompt. Very large batches may take a long time and consume substantial browser memory.

## 🔐 Secure Build
The project is configured in `vite.config.js` to strip out all `console.log` statements and completely disable source maps in production to ensure private code details are never leaked.

---
*Created by Shazeb. Secure the invisible.*
