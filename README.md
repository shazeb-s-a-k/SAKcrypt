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
- **AI Image Generator**: Generate and view images directly in the app using Black Forest Labs' public FLUX.1 Schnell Hugging Face demo; no app API key or sign-in is required.
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

The image generator calls Black Forest Labs' public FLUX.1 Schnell Hugging Face Space through Gradio's JavaScript client. No app API key, sign-in, or payment setup is required. Prompts are sent to that third-party demo, so do not include sensitive information.

This is a shared public demo rather than a production API with an availability guarantee. It may queue, limit, or stop accepting requests; the app does not retry or attempt to bypass provider limits.

The **Mass Generate** mode accepts `.txt`, `.text`, and `.md` files, treating each saved line as one prompt and ignoring blank lines. It generates images sequentially in file order with no hard prompt-count cap. Filenames use a sanitized prompt prefix and a zero-padded sequence number (for example, `Image_of_Bird_001.webp`). Download the batch as one ZIP. If generation fails, already completed images remain downloadable; the ZIP also contains a note identifying the failed prompt. Very large batches may take a long time and consume substantial browser memory.

## 🔐 Secure Build
The project is configured in `vite.config.js` to strip out all `console.log` statements and completely disable source maps in production to ensure private code details are never leaked.

---
*Created by Shazeb. Secure the invisible.*
