# SAKrypt Suite 🛡️

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-Fast-facc15)

**SAKrypt Suite** is an all-in-one collection of browser-based converters, creative utilities, cryptography, and developer tools.

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
- **AI Image Generator**: Choose AI Horde, Pollinations Classic, or the hosted Cloudflare SDXL model; generate images in-app with selectable models, aspect ratios, and resolutions.
- **Mass Generate**: Upload a text file with one prompt per line, generate images sequentially, and download the results together as an ordered ZIP archive.
- **S.A.K AI**: Ask the home-page assistant to find tools across the suite, run supported local actions, or get answers through a server-side API route. Visitors never enter or receive the owner's API key.
- **Expanded tool catalog**: Browse the suite in six categories, search by name or capability, and switch between a full grid and horizontal rows.
- **124 additional local tools**: Convert common text, data, code, dates, colors, and image formats in the browser, including JPG/JPEG, PNG, and WebP conversion, image resizing/compression, CSV/TSV, JSON/XML, Unicode, timestamps, and unit conversion.
- **New workflow tools**: Filter, sort, transpose, and deduplicate CSV data; create Markdown tables of contents; flatten and query JSON; generate SQL and Go snippets; build tracked URLs and API fetch examples; and create responsive CSS, HTML, sitemap, robots.txt, `.gitignore`, and secret-free `.env.example` templates.
- Categories are ordered by use case: A.I & Neural Intelligence, Stealth & Covert Systems, Cyber Security & Encryption, Web & Network Protocols, Code & Data Transformers, then System Utilities & Generators. Tools within each category are curated by usefulness.
- **Local file drafts**: Open text files up to 200 KB, optionally include a selected file in a prompt, save generated drafts, or explicitly confirm before replacing a selected file.

### S.A.K AI privacy and file access

The assistant can search and link to all catalog tools, execute registered text/data actions locally, and help with selected text files. Image conversion and tools with custom options are opened in their own pages and run in the browser.

S.A.K AI uses Google's Interactions API at `/api/assistant`, with a retry and backup model for temporary service errors. The endpoint opts out of provider-side conversation storage (`store: false`) and passes bounded conversation history with each request. Set `GEMINI_API_KEY` in the Vercel project environment variables for Preview and Production, then redeploy. Keep it as a server-only variable: do not prefix it with `VITE_`, commit it, or put it in browser storage. Requests, including any file the user explicitly includes, are sent to Google. A short per-client cooldown is included; configure Vercel Firewall rate limits and provider quotas for stronger public endpoint abuse protection. The offline tool guide and registered local actions work without the assistant endpoint.

For local development, put `GEMINI_API_KEY=your-key` in the ignored `.env.local` file and restart `npm run dev` from this repository directory. The Vercel environment variable is not automatically available to a local Vite server. The assistant status badge reports whether the current server route is available and configured.

If a Gemini key is ever pasted into chat, source control, or another public place, revoke it and create a replacement before adding the new value to Vercel.

File access requires a user action. The assistant can read a selected text file up to 200 KB; file contents are not included in prompts unless **Include in next prompt** is checked. Saving a draft uses the browser's save dialog or a download. Replacing an opened file requires browser write permission and a separate confirmation; browsers without the File System Access API can still open files and save drafts as downloads.

## 💎 Design & Animations

Built with a massive focus on user experience and aesthetics. It utilizes a **Vercel-inspired** clean dark theme, combined with buttery-smooth **Framer Motion** page transitions, a beautifully animated landing page, interactive top navigation, and micro-animations to impress everyone who uses it. Tool pages are loaded on demand to keep the initial download lighter. Fully responsive for PC, Mac, Android, and iOS.

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

Pollinations Classic is an alternative no-key provider with one fixed model and JPEG output up to 768px per side. Its free tier is limited per client IP to at least one request every 45 seconds, adds a Pollinations logo, and may return HTTP 402 with a retry delay. Mass generation spaces requests to respect that interval.

Cloudflare Workers AI adds the hosted Stable Diffusion XL Base model (Beta), which supports aspect-ratio dimensions up to 2048px; this app caps output at 1024px per side for compatibility with Vercel response limits. Cloudflare currently lists the model at $0.00 per step and provides 10,000 Workers AI Neurons per day at no charge across the platform. Pricing and model availability can change; using other models or a Workers Paid account may incur charges. This provider uses the site owner's Cloudflare account and its quota is shared by everyone using the public site. The API route adds a short per-client cooldown, but it does not isolate each visitor's quota. See [model details](https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-base-1.0/), [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), and [REST API setup](https://developers.cloudflare.com/workers-ai/get-started/rest-api/).

To enable Cloudflare on Vercel:
1. Create a Cloudflare account, open **Workers AI**, select **Use REST API**, and create a Workers AI API token. Copy the account ID shown there.
2. In Vercel, add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` under **Project Settings → Environment Variables**.
3. Redeploy the project. The token is read only by the serverless function; do not add it to a `VITE_` variable or client-side code.

AI Horde and Pollinations remain available without Cloudflare setup. All providers are best-effort public services and prompts are sent to the selected provider; do not include sensitive information.

Choose an aspect ratio in the image generator for square (1:1), landscape (16:9 or 4:3), or portrait (9:16 or 3:4) output. Each provider uses dimensions suited to its service limits while preserving the selected ratio.

The HD resolution uses up to 1024px per side on AI Horde or Cloudflare (subject to model/worker limits) and up to Pollinations' 768px limit. Rate-limited and temporary provider errors are retried up to two times with a visible countdown; provider `Retry-After` delays are observed. Automatic waits are capped at five minutes, after which the provider's requested delay is shown and the user can retry later. Mass generation remains sequential; stopping takes effect after the current AI Horde image, or during a Pollinations/Cloudflare cooldown or retry. AI Horde polling retries reuse the existing generation job rather than submitting a duplicate.

No additional dependable, documented no-key hosted generator was found. Hugging Face Inference Providers require authentication ([official guide](https://huggingface.co/docs/inference-providers/en/index)), while public community Spaces can sleep or exhaust their shared GPU capacity. The app avoids undocumented website endpoints and account-session scraping.

AI Horde is community-run rather than a production API with an availability guarantee. Generation can queue for several minutes, anonymous requests may be limited during high load, and availability depends on volunteer workers. The app respects provider queues and limits; it does not rotate identities or attempt to bypass them.

The **Mass Generate** mode accepts pasted text as well as `.txt`, `.text`, and `.md` files, treating each actual line as one prompt and ignoring blank lines. It generates images sequentially in file order with no hard prompt-count cap. Filenames use a sanitized prompt prefix and a zero-padded sequence number (for example, `Image_of_Bird_001.webp`). Download the batch as one ZIP. If generation fails, already completed images remain downloadable; the ZIP also contains a note identifying the failed prompt. Very large batches may take a long time and consume substantial browser memory.

## 🔐 Secure Build
The project is configured in `vite.config.js` to strip out all `console.log` statements and completely disable source maps in production to ensure private code details are never leaked.

---
*Created by Shazeb. Secure the invisible.*
