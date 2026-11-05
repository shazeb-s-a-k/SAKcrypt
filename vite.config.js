import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import assistantHandler from './api/assistant.js'

const assistantApiPlugin = {
  name: 'sakrypt-assistant-api',
  configureServer(server) {
    const localGeminiKey = loadEnv(server.config.mode, process.cwd(), 'GEMINI_API_KEY').GEMINI_API_KEY;
    if (localGeminiKey && !process.env.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = localGeminiKey;
    }

    server.middlewares.use('/api/assistant', async (req, res, next) => {
      if (req.method === 'POST') {
        const chunks = [];
        let size = 0;
        try {
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 1024 * 1024) {
              res.statusCode = 413;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Assistant request is too large.' }));
              return;
            }
            chunks.push(chunk);
          }
          req.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } catch (error) {
          if (res.writableEnded) return;
          if (error instanceof SyntaxError) {
            req.body = null;
          } else {
            next(error);
            return;
          }
        }
      }

      const apiResponse = {
        setHeader: (name, value) => res.setHeader(name, value),
        status(code) {
          res.statusCode = code;
          return this;
        },
        json(body) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(body));
          return res;
        }
      };

      try {
        await assistantHandler(req, apiResponse);
      } catch (error) {
        next(error);
      }
    });
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), assistantApiPlugin],
  server: {
    allowedHosts: true,
  },
  build: {
    sourcemap: false,
    minify: true,
  }
})
