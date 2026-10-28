import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, KeyRound, Bot, User, AlertTriangle, 
  Trash2, Copy, Check, Download, RefreshCw, Eye, EyeOff, 
  Sliders, ChevronDown, ChevronUp, 
  Zap, Sparkles, Square
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

// Comprehensive Provider Registry with updated active models
const PROVIDERS = {
  DEMO: {
    id: 'demo',
    name: 'SAKrypt Neural Sim (Free Demo)',
    tag: 'NO KEY NEEDED',
    color: '#10b981',
    models: [
      'sakrypt-neural-v3 (Simulated AI)',
      'cyber-sentinel-v2 (Security Specialist)',
      'code-architect-pro (Full-Stack Sim)'
    ],
    placeholder: 'No key required! Experience the sandbox immediately.'
  },
  GOOGLE: {
    id: 'google',
    name: 'Google Gemini',
    tag: 'OFFICIAL API',
    color: '#38bdf8',
    models: [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-lite-preview-02-05'
    ],
    placeholder: 'AIzaSy...'
  },
  OPENAI: {
    id: 'openai',
    name: 'OpenAI',
    tag: 'OFFICIAL API',
    color: '#10b981',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'o3-mini',
      'o1-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo'
    ],
    endpoint: 'https://api.openai.com/v1/chat/completions',
    placeholder: 'sk-proj-...'
  },
  GROQ: {
    id: 'groq',
    name: 'Groq (Ultra-Fast LPUs)',
    tag: 'ULTRA FAST',
    color: '#f97316',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama-3.2-11b-vision-preview',
      'deepseek-r1-distill-llama-70b',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
    ],
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    placeholder: 'gsk_...'
  },
  DEEPSEEK: {
    id: 'deepseek',
    name: 'DeepSeek AI',
    tag: 'REASONING & CODE',
    color: '#3b82f6',
    models: [
      'deepseek-chat',
      'deepseek-reasoner'
    ],
    endpoint: 'https://api.deepseek.com/chat/completions',
    placeholder: 'sk-...'
  },
  ANTHROPIC: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    tag: 'DIRECT ACCESS',
    color: '#d97706',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229'
    ],
    endpoint: 'https://api.anthropic.com/v1/messages',
    placeholder: 'sk-ant-...'
  },
  OPENROUTER: {
    id: 'openrouter',
    name: 'OpenRouter (Multi-Model)',
    tag: 'UNIVERSAL',
    color: '#8b5cf6',
    models: [
      'deepseek/deepseek-r1',
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-001',
      'mistralai/mistral-large-2411',
      'auto'
    ],
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    placeholder: 'sk-or-v1-...'
  },
  CUSTOM: {
    id: 'custom',
    name: 'Local Ollama / Custom API',
    tag: 'SELF-HOSTED / LOCAL',
    color: '#a855f7',
    models: ['llama3.2', 'deepseek-r1', 'mistral', 'qwen2.5', 'custom-model'],
    endpoint: 'http://localhost:11434/v1/chat/completions',
    placeholder: 'Leave blank for local Ollama, or enter Bearer token...'
  }
};

// System Persona Presets
const PERSONA_PRESETS = [
  {
    id: 'default',
    name: '💬 General Assistant',
    prompt: 'You are a brilliant, concise, and helpful AI assistant embedded in the SAKrypt Suite. Provide clear answers with clean code formatting.'
  },
  {
    id: 'sentinel',
    name: '🛡️ Cyber Sentinel',
    prompt: 'You are Cyber Sentinel, an elite cybersecurity penetration tester and code auditor. Provide rigorous, security-first analyses, identify OWASP Top 10 vulnerabilities, and offer concrete cryptographic mitigations.'
  },
  {
    id: 'architect',
    name: '⚡ Code Architect',
    prompt: 'You are a Principal Software Architect. Write production-grade, clean, maintainable code with strict typing, zero technical debt, and modern architectural patterns.'
  },
  {
    id: 'crypto',
    name: '🧬 Cryptographer',
    prompt: 'You are a Senior Cryptographic Engineer specializing in WebCrypto, AES-256-GCM, RSA, elliptic curve mathematics, and zero-knowledge protocols. Provide mathematically sound implementations.'
  },
  {
    id: 'json',
    name: '🤖 Strict JSON API',
    prompt: 'You are a headless machine API. You MUST output strictly valid JSON format only. Do NOT include markdown code blocks, formatting, greetings, or explanations.'
  }
];

// Starter prompt inspirations
const STARTER_PROMPTS = [
  "Explain how Diffie-Hellman Key Exchange prevents eavesdropping with a visual diagram",
  "Write an AES-256-GCM encryption & decryption helper in modern TypeScript",
  "Audit this React component for race conditions, memory leaks and re-render loops",
  "Design a secure zero-trust authentication architecture for microservices"
];

// Custom Syntax Code Block with Copy Button
const CodeBlock = ({ inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const codeContent = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  if (inline) {
    return <code {...props}>{children}</code>;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-container">
      <div className="code-block-bar">
        <span className="code-block-lang">{lang || 'CODE'}</span>
        <button type="button" className="code-block-copy-btn" onClick={handleCopy} title="Copy code snippet">
          {copied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy Code'}</span>
        </button>
      </div>
      <pre className="code-block-content">
        <code>{codeContent}</code>
      </pre>
    </div>
  );
};

const LLMChatSandbox = () => {
  // Provider & Model State
  const [provider, setProvider] = useState(PROVIDERS.DEMO);
  const [model, setModel] = useState(PROVIDERS.DEMO.models[0]);
  const [customModelInput, setCustomModelInput] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('http://localhost:11434/v1/chat/completions');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Hyperparameters
  const [systemPrompt, setSystemPrompt] = useState(PERSONA_PRESETS[0].prompt);
  const [activePersona, setActivePersona] = useState('default');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [enableStreaming, setEnableStreaming] = useState(true);

  // Conversation State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState(null);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const showToast = useToast();
  const showSupport = useSupport();

  // Load saved API key from localStorage when provider changes
  useEffect(() => {
    if (provider.id === 'demo') {
      setApiKey('');
    } else {
      const savedKey = localStorage.getItem(`sakrypt_llm_key_${provider.id}`) || '';
      setApiKey(savedKey);
    }
    setModel(provider.models[0]);
  }, [provider]);

  // Save API key to localStorage when updated
  const handleApiKeyChange = (newKey) => {
    setApiKey(newKey);
    if (provider.id !== 'demo') {
      if (newKey.trim()) {
        localStorage.setItem(`sakrypt_llm_key_${provider.id}`, newKey.trim());
      } else {
        localStorage.removeItem(`sakrypt_llm_key_${provider.id}`);
      }
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Set persona preset
  const handleSelectPersona = (preset) => {
    setActivePersona(preset.id);
    setSystemPrompt(preset.prompt);
    showToast(`Loaded "${preset.name}" system persona`, 'success');
  };

  // Abort running generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      showToast('Generation halted', 'info');
    }
  };

  // Free Local Neural Simulation Engine (Zero-Key Demo Mode)
  const simulateNeuralResponse = async (history, onChunk) => {
    const lastUserMsg = history[history.length - 1]?.content || '';
    const q = lastUserMsg.toLowerCase();

    let response = '';

    if (q.includes('diffie') || q.includes('exchange') || q.includes('key')) {
      response = `### Diffie-Hellman Key Exchange Protocol

The **Diffie-Hellman (DH)** protocol allows two parties (Alice and Bob) to establish a shared cryptographic secret over an untrusted, public communication channel without prior transmission of the secret.

#### Mathematical Foundation:
1. **Public Agreement**: A prime modulus $p$ and a generator base $g$ are publicly chosen.
2. **Private Secrets**: 
   - Alice picks secret $a$, computes public key $A = g^a \\pmod p$.
   - Bob picks secret $b$, computes public key $B = g^b \\pmod p$.
3. **Public Exchange**: They exchange $A$ and $B$.
4. **Shared Secret Computation**:
   - Alice computes: $K_A = B^a \\equiv (g^b)^a \\equiv g^{ab} \\pmod p$
   - Bob computes: $K_B = A^b \\equiv (g^a)^b \\equiv g^{ab} \\pmod p$

\`\`\`mermaid
Alice (a)                   Public Channel                  Bob (b)
    │                              │                           │
    ├───── Send A = g^a mod p ────>│────────── A ─────────────>│
    │<──────────── B ──────────────│<─── Send B = g^b mod p ───┤
    │                              │                           │
 Computes:                                                 Computes:
 K = B^a mod p                                             K = A^b mod p
\`\`\`

> **Security Note:** An eavesdropper Eve only observes $g, p, A, B$. Deriving $a$ or $b$ requires solving the **Discrete Logarithm Problem (DLP)**, which is computationally infeasible for large primes (2048+ bits).`;
    } else if (q.includes('aes') || q.includes('encrypt') || q.includes('decrypt')) {
      response = `### Modern AES-256-GCM Cryptographic Implementation

Here is a production-grade, authenticated AES-256-GCM helper module utilizing the native **Web Crypto API**:

\`\`\`typescript
export interface EncryptedPayload {
  cipherText: string; // Base64
  iv: string;         // Base64 (12 bytes)
}

export async function encryptAES_GCM(
  data: string, 
  rawKeyHex: string
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

  // Convert hex key string to crypto key
  const keyBuffer = new Uint8Array(
    rawKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  const cryptoKey = await crypto.subtle.importKey(
    'raw', 
    keyBuffer, 
    { name: 'AES-GCM' }, 
    false, 
    ['encrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoder.encode(data)
  );

  return {
    cipherText: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
    iv: btoa(String.fromCharCode(...iv))
  };
}
\`\`\`

#### Key Attributes:
- **Galois/Counter Mode (GCM)** delivers authenticated encryption, preventing bit-flipping and tampering attacks.
- Requires unique 12-byte initialization vectors (IVs) for every distinct encryption.`;
    } else if (q.includes('json') || q.includes('schema') || activePersona === 'json') {
      response = `{\n  "status": "success",\n  "protocol": "SAKRYPT-NEURAL-SIM",\n  "audit_version": "3.4.1",\n  "telemetry": {\n    "vulnerabilities_detected": 0,\n    "entropy_score": 98.4,\n    "client_isolation": true\n  },\n  "modules": [\n    { "id": "aes-gcm", "state": "ARMED", "latency_ms": 1.2 },\n    { "id": "bip39-seed", "state": "READY", "latency_ms": 0.8 },\n    { "id": "jwt-inspector", "state": "VERIFIED", "latency_ms": 1.5 }\n  ]\n}`;
    } else if (q.includes('react') || q.includes('audit') || q.includes('code')) {
      response = `### Code Audit & Architectural Review

I have analyzed the scenario under strict performance and vulnerability guidelines:

#### 1. Potential Vulnerability Vectors
- **Stale Closures & Callback Race Conditions**: Async state updates within \`useEffect\` can execute after unmount if an \`AbortController\` or cleanup flag is missing.
- **Reference Equality Thrashing**: Inline object/function props passed to children trigger cascading re-renders unless memoized with \`useCallback\` and \`useMemo\`.

#### 2. Hardened Architecture Pattern:
\`\`\`jsx
import React, { useState, useEffect, useRef } from 'react';

export const SecureDataLoader = ({ endpoint, token }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    async function fetchData() {
      try {
        const res = await fetch(endpoint, {
          headers: { Authorization: \`Bearer \${token}\` },
          signal: abortControllerRef.current.signal
        });
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      }
    }

    fetchData();
    return () => abortControllerRef.current?.abort();
  }, [endpoint, token]);

  if (error) return <div className="error-banner">{error}</div>;
  return <div>{data ? JSON.stringify(data) : 'Decrypting stream...'}</div>;
};
\`\`\``;
    } else {
      response = `### Analysis & Operational Report

I have received your prompt:
> *"${lastUserMsg}"*

#### Synthesized Response:
1. **System Context**: Executing under the **${provider.name}** profile with persona parameter \`${activePersona}\`.
2. **Parameters**: Temperature set to \`${temperature}\`, Max tokens set to \`${maxTokens}\`.
3. **Execution State**: Client-side sandbox isolation active. All session data resides exclusively in your browser memory.

Feel free to paste code, inquire about cryptographic algorithms, request API refactors, or switch to your live **OpenAI**, **Gemini**, **Groq**, **DeepSeek**, or **Claude** API keys at any time!`;
    }

    // Stream the simulated response chunk by chunk for realism
    let current = '';
    const words = response.split(' ');
    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? '' : ' ') + words[i];
      onChunk(current);
      await new Promise(r => setTimeout(r, 12));
    }
    return current;
  };

  // OpenAI / Groq / DeepSeek / OpenRouter / Custom compatible API caller
  const callOpenAICompatible = async (messagesHistory, prov, apiKeyToUse, onChunk) => {
    const validHistory = messagesHistory.filter(m => !m.isError);
    
    // Inject system message if set
    const formattedMessages = [];
    if (systemPrompt.trim()) {
      formattedMessages.push({ role: 'system', content: systemPrompt.trim() });
    }

    validHistory.forEach(m => {
      formattedMessages.push({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      });
    });

    const activeModelName = prov.id === 'custom' ? (customModelInput.trim() || model) : model;
    const activeEndpoint = prov.id === 'custom' ? (customEndpoint.trim() || prov.endpoint) : prov.endpoint;

    const headers = {
      'Content-Type': 'application/json'
    };

    if (apiKeyToUse) {
      headers['Authorization'] = `Bearer ${apiKeyToUse}`;
    }

    if (prov.id === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'SAKrypt LLM Sandbox';
    }

    abortControllerRef.current = new AbortController();

    const response = await fetch(activeEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: activeModelName,
        messages: formattedMessages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: enableStreaming
      }),
      signal: abortControllerRef.current.signal
    });

    if (!response.ok) {
      let errDetail = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errJson = await response.json();
        errDetail = errJson.error?.message || errJson.message || errDetail;
      } catch (e) {}
      throw new Error(errDetail);
    }

    // If streaming enabled and response body supports reader
    if (enableStreaming && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let accumulated = '';
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete trailing line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue; // Skip comments/keepalives
            if (trimmed === 'data: [DONE]') continue;

            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const contentChunk = parsed.choices?.[0]?.delta?.content || '';
                if (contentChunk) {
                  accumulated += contentChunk;
                  onChunk(accumulated);
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }
      return accumulated || 'No text output received from model.';
    } else {
      // Non-streaming fallback
      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No text response received.';
    }
  };

  // Google Gemini API Caller
  const callGemini = async (messagesHistory, apiKeyToUse, onChunk) => {
    const validHistory = messagesHistory.filter(m => !m.isError);
    
    // Using official GoogleGenerativeAI SDK
    const genAI = new GoogleGenerativeAI(apiKeyToUse);
    const genModel = genAI.getGenerativeModel({
      model: model,
      systemInstruction: systemPrompt.trim() ? { parts: [{ text: systemPrompt.trim() }] } : undefined,
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens
      }
    });

    // Format chat history for Gemini
    const contents = [];
    let lastRole = null;

    for (const m of validHistory) {
      const gRole = m.role === 'ai' ? 'model' : 'user';
      if (gRole === lastRole && contents.length > 0) {
        contents[contents.length - 1].parts[0].text += '\n\n' + m.content;
      } else {
        contents.push({ role: gRole, parts: [{ text: m.content }] });
        lastRole = gRole;
      }
    }

    if (contents.length > 0 && contents[0].role !== 'user') {
      contents.unshift({ role: 'user', parts: [{ text: '(System: Session initiated)' }] });
    }

    if (enableStreaming) {
      const result = await genModel.generateContentStream({ contents });
      let accumulated = '';
      for await (const chunk of result.stream) {
        const textChunk = chunk.text();
        accumulated += textChunk;
        onChunk(accumulated);
      }
      return accumulated || 'No text response received from Gemini.';
    } else {
      const result = await genModel.generateContent({ contents });
      return result.response.text();
    }
  };

  // Anthropic Claude API Caller
  const callAnthropic = async (messagesHistory, apiKeyToUse, onChunk) => {
    const validHistory = messagesHistory.filter(m => !m.isError);
    const formattedMessages = validHistory.map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content
    }));

    abortControllerRef.current = new AbortController();

    const response = await fetch(PROVIDERS.ANTHROPIC.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyToUse,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemPrompt.trim() || undefined,
        messages: formattedMessages
      }),
      signal: abortControllerRef.current.signal
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}`);
    }

    const textOutput = data.content?.[0]?.text || '';
    onChunk(textOutput);
    return textOutput;
  };

  // Send Message Handler
  const handleSend = async (messageText = null) => {
    const textToSend = messageText !== null ? messageText : input;
    if (!textToSend.trim() || isLoading) return;

    if (provider.id !== 'demo' && !apiKey.trim() && provider.id !== 'custom') {
      showToast(`Please enter your ${provider.name} API Key in the config panel.`, 'error');
      setShowConfig(true);
      return;
    }

    const userMsg = { 
      role: 'user', 
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);

    // Placeholder for AI streaming reply
    const aiPlaceholder = { 
      role: 'ai', 
      content: '', 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: model,
      providerUsed: provider.name
    };
    setMessages([...updatedHistory, aiPlaceholder]);

    const startTime = performance.now();

    const updateLiveText = (liveText) => {
      setMessages(prev => {
        const copy = [...prev];
        if (copy.length > 0 && copy[copy.length - 1].role === 'ai') {
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            content: liveText
          };
        }
        return copy;
      });
    };

    try {
      let finalContent = '';

      if (provider.id === 'demo') {
        finalContent = await simulateNeuralResponse(updatedHistory, updateLiveText);
      } else if (provider.id === 'google') {
        finalContent = await callGemini(updatedHistory, apiKey.trim(), updateLiveText);
      } else if (provider.id === 'anthropic') {
        finalContent = await callAnthropic(updatedHistory, apiKey.trim(), updateLiveText);
      } else {
        finalContent = await callOpenAICompatible(updatedHistory, provider, apiKey.trim(), updateLiveText);
      }

      const durationMs = Math.round(performance.now() - startTime);
      setLastLatencyMs(durationMs);

      setMessages(prev => {
        const copy = [...prev];
        if (copy.length > 0 && copy[copy.length - 1].role === 'ai') {
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            content: finalContent,
            latencyMs: durationMs
          };
        }
        return copy;
      });

      // Occasional support prompt
      if (Math.random() < 0.15) setTimeout(showSupport, 2500);

    } catch (err) {
      if (err.name === 'AbortError') return; // User deliberately aborted
      const errMsg = err.message === 'Failed to fetch' 
        ? 'Network / CORS Error. Check API endpoint, internet connection, or browser privacy extensions.'
        : err.message;

      showToast(errMsg, 'error');
      setMessages(prev => {
        const copy = [...prev];
        if (copy.length > 0 && copy[copy.length - 1].role === 'ai') {
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            content: `**API Protocol Failure:**\n\`${errMsg}\``,
            isError: true
          };
        }
        return copy;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (messages.length < 2 || isLoading) return;
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIdx === -1) return;
    const actualIdx = messages.length - 1 - lastUserIdx;
    const lastPrompt = messages[actualIdx].content;
    
    // Trim conversation up to the last user message
    setMessages(messages.slice(0, actualIdx));
    handleSend(lastPrompt);
  };

  // Clear conversation
  const clearChat = () => {
    setMessages([]);
    setLastLatencyMs(null);
    showToast('Sandbox session cleared', 'success');
  };

  // Copy entire message content
  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Message copied to clipboard', 'success');
  };

  // Export conversation as Markdown
  const handleExportMarkdown = () => {
    if (messages.length === 0) {
      showToast('No messages to export', 'error');
      return;
    }

    let md = `# SAKrypt LLM Sandbox Session Export\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n`;
    md += `**Provider:** ${provider.name} | **Model:** ${model}\n\n---\n\n`;

    messages.forEach(m => {
      const author = m.role === 'user' ? 'USER' : 'ASSISTANT';
      md += `### ${author} [${m.timestamp || ''}]\n\n${m.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sakrypt-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported as Markdown', 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="container llm-sandbox-layout"
    >
      <ToolHeader 
        title="LLM Chat Sandbox" 
        subtitle="Universal neural playground: Test raw prompts across OpenAI, Gemini, Groq, DeepSeek, Claude, or free Demo simulator." 
      />

      {/* Top Action & Navigation Toolbar */}
      <div className="llm-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="llm-active-badge">
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: provider.color, boxShadow: `0 0 8px ${provider.color}` }}></span>
            <span>{provider.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{provider.id === 'custom' ? (customModelInput || model) : model}</span>
          </div>

          {lastLatencyMs && (
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Zap size={13} /> {lastLatencyMs}ms
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            type="button"
            className="view-toggle-btn"
            onClick={() => setShowConfig(!showConfig)}
            style={{ 
              background: showConfig ? 'rgba(94, 106, 210, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: showConfig ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <Sliders size={14} />
            <span>Parameters & Keys</span>
            {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {messages.length > 0 && (
            <>
              <button 
                type="button" 
                className="icon-btn" 
                onClick={handleExportMarkdown} 
                title="Export conversation to Markdown (.md)"
              >
                <Download size={16} />
              </button>
              <button 
                type="button" 
                className="icon-btn" 
                onClick={clearChat} 
                title="Clear current session"
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Configuration & Parameters Drawer */}
      <AnimatePresence>
        {showConfig && (
          <motion.div 
            key="configDrawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="llm-config-drawer"
          >
            {/* Persona Preset Ribbon */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--secondary)', fontSize: '0.78rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                SYSTEM PERSONA PRESETS
              </label>
              <div className="llm-persona-ribbon">
                {PERSONA_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`llm-persona-btn ${activePersona === preset.id ? 'active' : ''}`}
                    onClick={() => handleSelectPersona(preset)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Config Inputs Grid */}
            <div className="llm-drawer-grid">
              {/* Provider Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  PROVIDER
                </label>
                <select 
                  className="input-glass" 
                  value={provider.id} 
                  onChange={(e) => {
                    const selected = Object.values(PROVIDERS).find(p => p.id === e.target.value);
                    if (selected) setProvider(selected);
                  }}
                  style={{ width: '100%', cursor: 'pointer', padding: '0.65rem' }}
                >
                  {Object.values(PROVIDERS).map(p => (
                    <option key={p.id} value={p.id} style={{ background: '#0a0d16', color: '#fff' }}>
                      {p.name} [{p.tag}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  MODEL
                </label>
                {provider.id === 'custom' ? (
                  <input 
                    type="text"
                    className="input-glass"
                    placeholder="e.g. llama3.2, mistral..."
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                ) : (
                  <select 
                    className="input-glass" 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)}
                    style={{ width: '100%', cursor: 'pointer', padding: '0.65rem' }}
                  >
                    {provider.models.map(m => (
                      <option key={m} value={m} style={{ background: '#0a0d16', color: '#fff' }}>
                        {m}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Temperature Slider */}
              <div className="llm-param-slider">
                <div className="llm-slider-label">
                  <span>TEMPERATURE</span>
                  <span style={{ color: 'var(--accent)' }}>{temperature}</span>
                </div>
                <input 
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {temperature < 0.3 ? 'Deterministic / Rigorous' : temperature > 1.0 ? 'Highly Creative / Exploratory' : 'Balanced General'}
                </span>
              </div>

              {/* Max Tokens Slider */}
              <div className="llm-param-slider">
                <div className="llm-slider-label">
                  <span>MAX OUTPUT TOKENS</span>
                  <span style={{ color: '#10b981' }}>{maxTokens}</span>
                </div>
                <input 
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
              </div>
            </div>

            {/* Custom Endpoint Input (if Local / Custom) */}
            {provider.id === 'custom' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', color: '#a855f7', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  CUSTOM OPENAI-COMPATIBLE ENDPOINT URL
                </label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="http://localhost:11434/v1/chat/completions"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', padding: '0.65rem' }}
                />
              </div>
            )}

            {/* API Key Input Field */}
            {provider.id !== 'demo' && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fb923c', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    <KeyRound size={13} /> {provider.name.toUpperCase()} API KEY
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Stored locally in browser only
                  </span>
                </div>

                <div style={{ position: 'relative' }}>
                  <input 
                    type={showApiKey ? 'text' : 'password'} 
                    className="input-glass" 
                    placeholder={provider.placeholder}
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', padding: '0.75rem 2.5rem 0.75rem 1rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    title={showApiKey ? "Hide Key" : "Show Key"}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* System Prompt Input */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--secondary)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                CUSTOM SYSTEM INSTRUCTIONS
              </label>
              <textarea 
                className="input-glass"
                rows={2}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Instruct the model how to act and respond..."
                style={{ width: '100%', resize: 'vertical', fontSize: '0.85rem', padding: '0.65rem 0.85rem' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Viewport */}
      <div className="llm-chat-shell">
        <div className="llm-messages-viewport">
          {/* Zero Message Starter State */}
          {messages.length === 0 && (
            <div className="llm-empty-state">
              <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '16px', background: `${provider.color}15`, marginBottom: '1rem' }}>
                <Bot size={44} style={{ color: provider.color }} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.35rem' }}>
                {provider.name} Playground Ready
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                {provider.id === 'demo'
                  ? 'No API key needed! Ask any coding, security, cryptography or system design question.'
                  : `Configured for ${model}. Enter your prompt below to initiate neural inference.`}
              </p>

              {/* Quick Starter Chips */}
              <div className="llm-starters-grid">
                {STARTER_PROMPTS.map((starter, i) => (
                  <div 
                    key={i} 
                    className="llm-starter-card"
                    onClick={() => handleSend(starter)}
                  >
                    <Sparkles size={14} style={{ color: 'var(--accent)', marginBottom: '0.35rem' }} />
                    <div>{starter}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render Dialogue Messages */}
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`llm-msg-row ${msg.role === 'user' ? 'user' : 'ai'}`}
            >
              <div className={`llm-avatar ${msg.role === 'user' ? 'user' : (msg.isError ? 'error' : 'ai')}`}>
                {msg.role === 'user' ? <User size={18} /> : (msg.isError ? <AlertTriangle size={18} /> : <Bot size={18} />)}
              </div>

              <div className="llm-msg-bubble-wrap">
                <div className="llm-msg-meta">
                  <span>{msg.role === 'user' ? 'YOU' : (msg.modelUsed || model)}</span>
                  {msg.timestamp && <span>{msg.timestamp}</span>}
                  {msg.latencyMs && <span>• ⚡ {msg.latencyMs}ms</span>}
                </div>

                <div className={`llm-msg-bubble ${msg.role === 'user' ? 'user' : (msg.isError ? 'error' : 'ai')}`}>
                  {msg.role === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  ) : (
                    <div className="llm-markdown-body">
                      {msg.content ? (
                        <ReactMarkdown components={{ code: CodeBlock }}>
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', padding: '0.5rem 0' }}>
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Utility Actions */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msg.content)}
                    className="icon-btn"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}
                    title="Copy text"
                  >
                    <Copy size={12} />
                  </button>
                  {msg.role === 'ai' && idx === messages.length - 1 && !isLoading && (
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      className="icon-btn"
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}
                      title="Regenerate response"
                    >
                      <RefreshCw size={12} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Field & Controls */}
        <div className="llm-input-tray">
          <div className="llm-input-row">
            <textarea 
              className="llm-textarea"
              placeholder={`Message ${provider.name} (${model})... (Shift+Enter for newline, Enter to send)`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
            />

            {isLoading ? (
              <button 
                type="button" 
                className="llm-stop-btn" 
                onClick={handleStopGeneration} 
                title="Halt Generation"
              >
                <Square size={20} />
              </button>
            ) : (
              <button 
                type="button" 
                className="llm-send-btn" 
                onClick={() => handleSend()}
                disabled={!input.trim()}
                title="Send Prompt"
              >
                <Send size={20} />
              </button>
            )}
          </div>

          <div className="llm-tray-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span>{input.length} characters</span>
              <span>•</span>
              <span>~{Math.ceil(input.length / 4)} est. tokens</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={enableStreaming} 
                  onChange={(e) => setEnableStreaming(e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span>Token Stream</span>
              </label>
              <span>•</span>
              <span>Shift+Enter for newline</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LLMChatSandbox;
