import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, UploadCloud, FileText, CheckCircle, XCircle, 
  AlertTriangle, RefreshCw, Download, Server, Key, Eye, EyeOff, 
  Send, MessageSquare, MapPin, CloudSun, CreditCard, Copy, 
  Check, Zap, Sparkles, Terminal, Layers, Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

// Provider list for auto or manual routing
const PROVIDERS_LIST = [
  { id: 'auto', name: 'Auto-Detect & Deep Probe (All Services)' },
  { id: 'google', name: 'Google (Gemini AI / Maps / YouTube)' },
  { id: 'openai', name: 'OpenAI (GPT-4o / GPT-4o-mini)' },
  { id: 'groq', name: 'Groq Cloud (Llama 3.1 / Mixtral)' },
  { id: 'anthropic', name: 'Anthropic (Claude 3.5)' },
  { id: 'weather', name: 'Weather Services (OpenWeather / WeatherAPI)' },
  { id: 'github', name: 'GitHub Personal Access Token' },
  { id: 'stripe', name: 'Stripe Secret Key (Live / Test)' },
  { id: 'unknown', name: 'Unknown / Generic Key' }
];

// Heuristics to detect potential provider format
const detectProviderHeuristic = (key) => {
  if (/^AIza[0-9A-Za-z-_]{35}$/.test(key)) return { id: 'google', name: 'Google Cloud (Gemini / Maps / YouTube)' };
  if (/^sk-ant-[a-zA-Z0-9_-]+$/.test(key)) return { id: 'anthropic', name: 'Anthropic (Claude)' };
  if (/^sk-(?:proj-)?[a-zA-Z0-9_-]{32,}$/.test(key)) return { id: 'openai', name: 'OpenAI' };
  if (/^gsk_[a-zA-Z0-9]{32,}$/.test(key)) return { id: 'groq', name: 'Groq Cloud' };
  if (/^(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})$/.test(key)) return { id: 'github', name: 'GitHub Personal Access Token' };
  if (/^sk_(?:live|test)_[a-zA-Z0-9]{24,}$/.test(key)) return { id: 'stripe', name: 'Stripe Secret Key' };
  if (/^hf_[a-zA-Z0-9]{34,}$/.test(key)) return { id: 'huggingface', name: 'Hugging Face' };
  if (/^[a-f0-9]{32}$/i.test(key)) return { id: 'weather', name: 'OpenWeather / 32-char Hex Key' };
  return { id: 'unknown', name: 'Generic Token' };
};

// --- MULTI-PROBE TESTING LOGIC WITH "HI" MESSAGE & SUB-KEY DISAMBIGUATION ---
const probeKeyDiagnostics = async (key, providerHint = 'auto', sendHiPrompt = true) => {
  const startTime = performance.now();
  let details = {
    valid: false,
    provider: 'Unknown',
    subCategory: 'unknown', // 'ai' | 'google_maps' | 'weather' | 'developer' | 'payments' | 'cloud_comm' | 'dead'
    subService: 'Unknown Service',
    plan: 'Unknown Plan',
    extraInfo: '',
    hiTested: false,
    hiResponse: null,
    latencyMs: null
  };

  const keyClean = key.trim();

  // 1. GOOGLE KEYS (AIza...) -> Probes Gemini AI, Google Maps Geocoding, YouTube Data v3
  if (providerHint === 'google' || /^AIza[0-9A-Za-z-_]{35}$/.test(keyClean)) {
    details.provider = 'Google Cloud';

    // Probe 1A: Gemini Generative AI ("hi" live test prompt)
    if (sendHiPrompt) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keyClean}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "hi" }] }],
            generationConfig: { maxOutputTokens: 25 }
          })
        });
        const geminiData = await geminiRes.json();
        if (geminiRes.ok && geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
          details.valid = true;
          details.subCategory = 'ai';
          details.subService = 'Google Gemini AI (Gemini 1.5 Flash)';
          details.plan = 'Google Generative Language Active';
          details.hiTested = true;
          details.hiResponse = geminiData.candidates[0].content.parts[0].text.trim();
          details.extraInfo = 'Live "hi" response generated successfully from Gemini 1.5 Flash.';
          details.latencyMs = Math.round(performance.now() - startTime);
          return details;
        }
      } catch (e) {}
    }

    // Probe 1B: Google Maps Geocoding API
    try {
      const mapsRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Paris&key=${keyClean}`);
      const mapsData = await mapsRes.json();
      if (mapsData.status === 'OK') {
        details.valid = true;
        details.subCategory = 'google_maps';
        details.subService = 'Google Maps API (Geocoding)';
        details.plan = 'Active Google Maps Platform Quota';
        const address = mapsData.results?.[0]?.formatted_address || 'Paris, France';
        details.extraInfo = `Verified live Geocoding resolution: "${address}". Maps billing enabled.`;
        details.latencyMs = Math.round(performance.now() - startTime);
        return details;
      } else if (mapsData.status === 'REQUEST_DENIED' && mapsData.error_message && !mapsData.error_message.toLowerCase().includes('api key is invalid')) {
        // Project exists on GCP, but Maps API specifically is not enabled
        details.subService = 'Google Cloud Key (Maps Not Activated)';
        details.plan = 'GCP Project Key';
        details.extraInfo = mapsData.error_message;
      }
    } catch (e) {}

    // Probe 1C: YouTube Data API v3
    try {
      const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=US&key=${keyClean}`);
      const ytData = await ytRes.json();
      if (ytRes.ok && ytData.items) {
        details.valid = true;
        details.subCategory = 'cloud_comm';
        details.subService = 'Google YouTube Data API v3';
        details.plan = 'YouTube Developer API Quota';
        details.extraInfo = `Active YouTube API access. Fetched ${ytData.items.length} video category definitions.`;
        details.latencyMs = Math.round(performance.now() - startTime);
        return details;
      }
    } catch (e) {}

    // If all Google probes fail
    details.valid = false;
    details.subCategory = 'dead';
    details.subService = 'Google API Key';
    details.extraInfo = 'Key is invalid, revoked, or denied access across Gemini, Maps, and YouTube.';
    details.latencyMs = Math.round(performance.now() - startTime);
    return details;
  }

  // 2. WEATHER KEYS -> Probes OpenWeatherMap and WeatherAPI
  if (/^[a-f0-9]{32}$/i.test(keyClean) || providerHint === 'weather') {
    // Probe 2A: OpenWeatherMap Current Weather API
    try {
      const owmRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=London&appid=${keyClean}`);
      const owmData = await owmRes.json();
      if (owmRes.ok && owmData.main) {
        details.valid = true;
        details.provider = 'OpenWeatherMap';
        details.subCategory = 'weather';
        details.subService = 'OpenWeatherMap Current Weather API';
        details.plan = 'Active Weather Subscription';
        const tempC = Math.round(owmData.main.temp - 273.15);
        const cond = owmData.weather?.[0]?.description || 'Clear';
        details.extraInfo = `Live weather feed verified! ${owmData.name}: ${tempC}°C, ${cond}.`;
        details.latencyMs = Math.round(performance.now() - startTime);
        return details;
      }
    } catch (e) {}

    // Probe 2B: WeatherAPI.com
    try {
      const wapiRes = await fetch(`https://api.weatherapi.com/v1/current.json?key=${keyClean}&q=London`);
      const wapiData = await wapiRes.json();
      if (wapiRes.ok && wapiData.current) {
        details.valid = true;
        details.provider = 'WeatherAPI.com';
        details.subCategory = 'weather';
        details.subService = 'WeatherAPI.com Realtime Forecast';
        details.plan = 'WeatherAPI Developer Account';
        details.extraInfo = `Live feed verified! ${wapiData.location?.name}: ${wapiData.current.temp_c}°C, ${wapiData.current.condition?.text}.`;
        details.latencyMs = Math.round(performance.now() - startTime);
        return details;
      }
    } catch (e) {}
  }

  // 3. OPENAI KEYS -> Probes Chat Completions with "hi" message
  if (/^sk-(?:proj-)?[a-zA-Z0-9_-]{32,}$/.test(keyClean) || providerHint === 'openai') {
    details.provider = 'OpenAI';
    try {
      if (sendHiPrompt) {
        const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyClean}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 25
          })
        });
        const chatData = await chatRes.json();
        if (chatRes.ok && chatData.choices?.[0]?.message?.content) {
          details.valid = true;
          details.subCategory = 'ai';
          details.subService = 'OpenAI Chat Completions (gpt-4o-mini)';
          details.plan = 'Funded Active Account (Tier 1+)';
          details.hiTested = true;
          details.hiResponse = chatData.choices[0].message.content.trim();
          details.extraInfo = `Live "hi" response generated in ${Math.round(performance.now() - startTime)}ms.`;
          details.latencyMs = Math.round(performance.now() - startTime);
          return details;
        } else if (chatData.error?.code === 'insufficient_quota') {
          details.valid = false;
          details.subCategory = 'dead';
          details.subService = 'OpenAI';
          details.plan = 'Quota Exceeded / Unfunded';
          details.extraInfo = 'Key is valid, but billing quota has been completely exhausted.';
          details.latencyMs = Math.round(performance.now() - startTime);
          return details;
        }
      }

      // Fallback check models endpoint
      const modelsRes = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${keyClean}` }
      });
      const modelsData = await modelsRes.json();
      if (modelsRes.ok) {
        details.valid = true;
        details.subCategory = 'ai';
        details.subService = 'OpenAI API';
        details.plan = modelsData.data?.some(m => m.id.includes('gpt-4')) ? 'Funded (GPT-4 Enabled)' : 'Standard';
        details.extraInfo = `Access to ${modelsData.data?.length || 0} models.`;
        details.latencyMs = Math.round(performance.now() - startTime);
        return details;
      } else {
        details.valid = false;
        details.subCategory = 'dead';
        details.extraInfo = modelsData.error?.message || 'Invalid OpenAI key.';
        details.latencyMs = Math.round(performance.now() - startTime);
        return details;
      }
    } catch (e) {
      details.valid = false;
      details.subCategory = 'dead';
      details.extraInfo = e.message;
      return details;
    }
  }

  // 4. GROQ KEYS -> Probes Chat Completions with "hi" message
  if (/^gsk_[a-zA-Z0-9]{32,}$/.test(keyClean) || providerHint === 'groq') {
    details.provider = 'Groq Cloud';
    try {
      if (sendHiPrompt) {
        const groqChat = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyClean}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 25
          })
        });
        const groqData = await groqChat.json();
        if (groqChat.ok && groqData.choices?.[0]?.message?.content) {
          details.valid = true;
          details.subCategory = 'ai';
          details.subService = 'Groq LPU (llama-3.1-8b)';
          details.plan = 'Groq Active Developer Tier';
          details.hiTested = true;
          details.hiResponse = groqData.choices[0].message.content.trim();
          details.extraInfo = `Live "hi" response generated in ${Math.round(performance.now() - startTime)}ms.`;
          details.latencyMs = Math.round(performance.now() - startTime);
          return details;
        }
      }

      // Check models
      const gModels = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${keyClean}` }
      });
      const gData = await gModels.json();
      if (gModels.ok) {
        details.valid = true;
        details.subCategory = 'ai';
        details.subService = 'Groq Cloud Inference';
        details.plan = 'Groq Active Account';
        details.extraInfo = `Access to ${gData.data?.length || 0} high-speed models.`;
        details.latencyMs = Math.round(performance.now() - startTime);
        return details;
      } else {
        details.valid = false;
        details.subCategory = 'dead';
        details.extraInfo = gData.error?.message || 'Invalid Groq key.';
        return details;
      }
    } catch (e) {
      details.valid = false;
      details.subCategory = 'dead';
      details.extraInfo = e.message;
      return details;
    }
  }

  // 5. ANTHROPIC KEYS -> Probes Messages with "hi"
  if (/^sk-ant-[a-zA-Z0-9_-]+$/.test(keyClean) || providerHint === 'anthropic') {
    details.provider = 'Anthropic (Claude)';
    try {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': keyClean,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 25,
          messages: [{ role: 'user', content: 'hi' }]
        })
      });
      const claudeData = await claudeRes.json();
      if (claudeRes.ok && claudeData.content?.[0]?.text) {
        details.valid = true;
        details.subCategory = 'ai';
        details.subService = 'Anthropic Claude (claude-3-5-haiku)';
        details.plan = 'Active Anthropic Account';
        details.hiTested = true;
        details.hiResponse = claudeData.content[0].text.trim();
        details.extraInfo = `Live "hi" response generated in ${Math.round(performance.now() - startTime)}ms.`;
        details.latencyMs = Math.round(performance.now() - startTime);
        return details;
      } else {
        details.valid = false;
        details.subCategory = 'dead';
        details.extraInfo = claudeData.error?.message || 'Invalid Anthropic key.';
        return details;
      }
    } catch (e) {
      details.valid = false;
      details.subCategory = 'dead';
      details.extraInfo = e.message;
      return details;
    }
  }

  // 6. GITHUB PATs -> Probes User Profile & Scopes
  if (/^(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})$/.test(keyClean) || providerHint === 'github') {
    details.provider = 'GitHub';
    try {
      const ghRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${keyClean}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      const ghData = await ghRes.json();
      if (ghRes.ok && ghData.login) {
        details.valid = true;
        details.subCategory = 'developer';
        details.subService = 'GitHub Personal Access Token';
        details.plan = `User: @${ghData.login} (${ghData.plan?.name || 'Standard'})`;
        details.extraInfo = `Public repos: ${ghData.public_repos}, Total Private: ${ghData.total_private_repos || 0}. Token active.`;
        details.latencyMs = Math.round(performance.now() - startTime);
        return details;
      } else {
        details.valid = false;
        details.subCategory = 'dead';
        details.extraInfo = ghData.message || 'Invalid GitHub token.';
        return details;
      }
    } catch (e) {
      details.valid = false;
      details.subCategory = 'dead';
      details.extraInfo = e.message;
      return details;
    }
  }

  // 7. STRIPE KEYS -> Probes Balance & Live/Test Mode
  if (/^sk_(?:live|test)_[a-zA-Z0-9]{24,}$/.test(keyClean) || providerHint === 'stripe') {
    details.provider = 'Stripe';
    const isLive = keyClean.startsWith('sk_live_');
    try {
      const stripeRes = await fetch('https://api.stripe.com/v1/balance', {
        headers: { 'Authorization': `Bearer ${keyClean}` }
      });
      const stripeData = await stripeRes.json();
      if (stripeRes.ok) {
        details.valid = true;
        details.subCategory = 'payments';
        details.subService = isLive ? 'Stripe LIVE Secret Key' : 'Stripe Test Secret Key';
        details.plan = isLive ? 'Production Live Account' : 'Sandbox Test Mode';
        const currency = stripeData.available?.[0]?.currency?.toUpperCase() || 'USD';
        details.extraInfo = `Balance accessible. Default currency: ${currency}.`;
        details.latencyMs = Math.round(performance.now() - startTime);
        return details;
      } else {
        details.valid = false;
        details.subCategory = 'dead';
        details.extraInfo = stripeData.error?.message || 'Invalid Stripe secret key.';
        return details;
      }
    } catch (e) {
      details.valid = false;
      details.subCategory = 'dead';
      details.extraInfo = e.message;
      return details;
    }
  }

  // 8. HUGGING FACE TOKENS
  if (/^hf_[a-zA-Z0-9]{34,}$/.test(keyClean)) {
    details.provider = 'Hugging Face';
    try {
      const hfRes = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: { 'Authorization': `Bearer ${keyClean}` }
      });
      const hfData = await hfRes.json();
      if (hfRes.ok && hfData.name) {
        details.valid = true;
        details.subCategory = 'ai';
        details.subService = 'Hugging Face User Access Token';
        details.plan = `User: @${hfData.name} (${hfData.type || 'Account'})`;
        details.extraInfo = 'Authenticated access to Hugging Face Model Hub & Endpoints.';
        details.latencyMs = Math.round(performance.now() - startTime);
        return details;
      }
    } catch (e) {}
  }

  // 9. UNKNOWN / UNVERIFIED
  details.valid = false;
  details.subCategory = 'unknown';
  details.subService = 'Unidentified Token';
  details.extraInfo = 'Pattern does not match known provider signatures or verification endpoint rejected access.';
  return details;
};

// Sub-Category metadata for tabs & sorting
const SUB_CATEGORIES = [
  { id: 'all_valid', label: 'All Active Keys', icon: CheckCircle, color: '#10b981' },
  { id: 'ai', label: 'AI ("Hi" Verified)', icon: Bot, color: '#06b6d4' },
  { id: 'google_maps', label: 'Google Maps Keys', icon: MapPin, color: '#38bdf8' },
  { id: 'weather', label: 'Weather Services', icon: CloudSun, color: '#f59e0b' },
  { id: 'developer', label: 'GitHub & Dev Keys', icon: Terminal, color: '#a855f7' },
  { id: 'payments', label: 'Stripe Payments', icon: CreditCard, color: '#ec4899' },
  { id: 'dead', label: 'Dead / Quota Exceeded', icon: XCircle, color: '#ef4444' },
  { id: 'unknown', label: 'Unknown / Generic', icon: AlertTriangle, color: '#94a3b8' }
];

const APIKeyLaboratory = () => {
  // Input & Mode States
  const [mode, setMode] = useState('mass'); // 'single' | 'mass'
  const [singleKeyInput, setSingleKeyInput] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('auto');
  const [sendHiMessage, setSendHiMessage] = useState(true);

  // Execution & Progress States
  const [analyzing, setAnalyzing] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [showKeys, setShowKeys] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all_valid');
  const [copiedKeyIndex, setCopiedKeyIndex] = useState(null);

  // File Upload & Compression Guide
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCompressionGuide, setShowCompressionGuide] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = useToast();
  const showSupport = useSupport();

  const handleFileUpload = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setInputText('');
    showToast(`File ${file.name} queued for processing. Click Analyze.`, 'success');
  };

  // Single Key Immediate Probe Handler
  const handleSingleProbe = async () => {
    if (!singleKeyInput.trim()) {
      showToast('Please enter an API key to probe.', 'error');
      return;
    }

    setAnalyzing(true);
    setResults([]);

    const keyClean = singleKeyInput.trim();
    showToast(`Probing key & sending automated "Hi" sandbox message...`, 'info');

    const diag = await probeKeyDiagnostics(keyClean, selectedProviderId, sendHiMessage);

    const singleResult = {
      key: keyClean,
      provider: { id: selectedProviderId, name: diag.provider },
      status: 'tested',
      details: diag
    };

    setResults([singleResult]);
    setAnalyzing(false);

    if (diag.valid) {
      showToast(`Key Verified: ${diag.subService}!`, 'success');
      setActiveCategoryFilter(diag.subCategory === 'ai' ? 'ai' : diag.subCategory);
    } else {
      showToast(`Probe failed: ${diag.extraInfo}`, 'warning');
      setActiveCategoryFilter('dead');
    }
  };

  // Mass Analysis Handler
  const handleAnalyze = async () => {
    if (mode === 'single') {
      await handleSingleProbe();
      return;
    }

    if (!inputText.trim() && !selectedFile) {
      showToast('Please paste keys or upload a file.', 'error');
      return;
    }

    setAnalyzing(true);
    setExtractionProgress(0);
    setResults([]);

    // Broad regex capturing AI keys, Google keys, Anthropic, Groq, GitHub, Stripe, and 32-char hex Weather keys
    const keyRegex = /(?:sk-(?:proj-)?[a-zA-Z0-9_-]{32,}|AIza[0-9A-Za-z-_]{35}|sk-ant-[a-zA-Z0-9_-]+|gsk_[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}|sk_(?:live|test)_[a-zA-Z0-9]{24,}|hf_[a-zA-Z0-9]{34,}|[a-f0-9]{32})/gi;
    const keySet = new Set();

    if (selectedFile) {
      const isGzip = selectedFile.name.endsWith('.gz');

      if (isGzip) {
        showToast('Decompressing and streaming keys from GZIP dump...', 'info');
        try {
          let compressedBytesRead = 0;
          const progressStream = new TransformStream({
            transform(chunk, controller) {
              compressedBytesRead += chunk.byteLength;
              controller.enqueue(chunk);
            }
          });

          const ds = new DecompressionStream('gzip');
          const stream = selectedFile.stream().pipeThrough(progressStream).pipeThrough(ds);
          const reader = stream.getReader();
          const decoder = new TextDecoder('utf-8');
          
          let tail = "";
          let lastYield = performance.now();

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              const matches = tail.match(keyRegex) || [];
              for (const m of matches) keySet.add(m);
              break;
            }
            
            const chunkText = decoder.decode(value, { stream: true });
            const textToProcess = tail + chunkText;
            
            const matches = textToProcess.match(keyRegex) || [];
            for (const m of matches) keySet.add(m);
            
            if (keySet.size >= 100000) {
              showToast('Reached 100,000 unique keys limit to prevent browser memory crash.', 'warning');
              break;
            }
            
            tail = textToProcess.slice(-150);
            
            if (performance.now() - lastYield > 100) {
              setExtractionProgress(Math.floor((compressedBytesRead / selectedFile.size) * 100));
              await new Promise(r => setTimeout(r, 0));
              lastYield = performance.now();
            }
          }
          setExtractionProgress(100);
        } catch (err) {
          showToast(`Error decompressing GZIP: ${err.message}`, 'error');
          setAnalyzing(false);
          return;
        }
      } else {
        const CHUNK_SIZE = 10 * 1024 * 1024;
        let offset = 0;
        
        showToast('Extracting keys from large file...', 'info');
        while (offset < selectedFile.size) {
          const chunk = selectedFile.slice(offset, offset + CHUNK_SIZE);
          const text = await chunk.text();
          const matches = text.match(keyRegex) || [];
          for (const m of matches) keySet.add(m);
          
          if (keySet.size >= 100000) {
            showToast('Reached 100,000 unique keys limit to prevent browser memory crash.', 'warning');
            break;
          }

          offset += CHUNK_SIZE;
          setExtractionProgress(Math.floor(Math.min((offset / selectedFile.size) * 100, 100)));
          await new Promise(r => setTimeout(r, 10));
        }
      }
    } else {
      const matches = inputText.match(keyRegex) || [];
      for (const m of matches) keySet.add(m);
    }

    const uniqueKeys = Array.from(keySet);

    if (uniqueKeys.length === 0) {
      showToast('No recognizable API keys found in input.', 'warning');
      setAnalyzing(false);
      return;
    }

    showToast(`Extracted ${uniqueKeys.length} unique keys. Running deep probes & live sandbox checks...`, 'success');

    // Step 1: Initial detected items
    const initialResults = uniqueKeys.map(k => {
      const prov = selectedProviderId === 'auto' 
        ? detectProviderHeuristic(k) 
        : PROVIDERS_LIST.find(p => p.id === selectedProviderId) || { id: 'unknown', name: 'Unknown' };

      return {
        key: k,
        provider: prov,
        status: 'pending',
        details: null
      };
    });

    setResults([...initialResults]);
    await new Promise(r => setTimeout(r, 100));

    // Step 2: Concurrently probe keys with batching
    const concurrency = 15;
    let currentResults = [...initialResults];

    for (let i = 0; i < initialResults.length; i += concurrency) {
      const chunk = initialResults.slice(i, i + concurrency);
      
      const promises = chunk.map(async (item) => {
        const testDetails = await probeKeyDiagnostics(item.key, item.provider.id, sendHiMessage);
        return {
          ...item,
          status: 'tested',
          details: testDetails
        };
      });

      const completedChunk = await Promise.all(promises);
      
      completedChunk.forEach(updatedItem => {
        const idx = currentResults.findIndex(r => r.key === updatedItem.key);
        if (idx !== -1) currentResults[idx] = updatedItem;
      });
      
      setResults([...currentResults]);
    }

    setAnalyzing(false);
    showToast('All probes complete! Keys sorted by service.', 'success');
    if (Math.random() < 0.25) setTimeout(showSupport, 2000);
  };

  // Filtered keys based on selected sub-category
  const getFilteredKeys = () => {
    return results.filter(r => {
      if (r.status !== 'tested' || !r.details) return false;
      if (activeCategoryFilter === 'all_valid') return r.details.valid;
      if (activeCategoryFilter === 'dead') return !r.details.valid && r.details.subCategory !== 'unknown';
      if (activeCategoryFilter === 'unknown') return r.details.subCategory === 'unknown';
      return r.details.subCategory === activeCategoryFilter;
    });
  };

  const filteredKeys = getFilteredKeys();

  // Helper to count keys per sub-category
  const getCategoryCount = (catId) => {
    return results.filter(r => {
      if (r.status !== 'tested' || !r.details) return false;
      if (catId === 'all_valid') return r.details.valid;
      if (catId === 'dead') return !r.details.valid && r.details.subCategory !== 'unknown';
      if (catId === 'unknown') return r.details.subCategory === 'unknown';
      return r.details.subCategory === catId;
    }).length;
  };

  const maskKey = (key) => showKeys ? key : `${key.substring(0, 7)}••••••••${key.substring(key.length - 4)}`;

  const handleCopySingleKey = (key, idx) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyIndex(idx);
    showToast('Copied key to clipboard', 'success');
    setTimeout(() => setCopiedKeyIndex(null), 2000);
  };

  // Copy all keys in current filtered tab
  const handleCopyCategoryKeys = () => {
    if (filteredKeys.length === 0) return;
    const text = filteredKeys.map(k => k.key).join('\n');
    navigator.clipboard.writeText(text);
    showToast(`Copied ${filteredKeys.length} keys to clipboard!`, 'success');
  };

  // Export keys by category as TXT / JSON / CSV
  const handleExportCategory = (format = 'txt') => {
    if (filteredKeys.length === 0) return;

    let content = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      content = JSON.stringify(filteredKeys.map(k => ({
        key: k.key,
        provider: k.details.provider,
        subService: k.details.subService,
        plan: k.details.plan,
        latencyMs: k.details.latencyMs,
        hiResponse: k.details.hiResponse,
        extraInfo: k.details.extraInfo
      })), null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (format === 'csv') {
      const headers = 'Key,Provider,SubService,Plan,LatencyMs,HiResponse,ExtraInfo\n';
      const rows = filteredKeys.map(k => 
        `"${k.key}","${k.details.provider}","${k.details.subService}","${k.details.plan}","${k.details.latencyMs || ''}","${(k.details.hiResponse || '').replace(/"/g, '""')}","${(k.details.extraInfo || '').replace(/"/g, '""')}"`
      ).join('\n');
      content = headers + rows;
      mimeType = 'text/csv';
      ext = 'csv';
    } else {
      content = filteredKeys.map(k => k.key).join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sakrypt_${activeCategoryFilter}_keys.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredKeys.length} keys as .${ext}`, 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '10s', maxWidth: '1240px' }}
    >
      <ToolHeader 
        title="API Key Laboratory & Sandbox Tester" 
        subtitle="Universal sandbox tester: Enter single or mass keys, automatically send live 'Hi' test messages, and sort Google Maps, Weather, AI, & Developer sub-keys." 
      />

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Mode Selector & Sandbox Settings Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              className={`category-pill ${mode === 'single' ? 'active' : ''}`}
              onClick={() => { setMode('single'); setResults([]); }}
            >
              <Zap size={15} />
              <span>Single Key Sandbox Probe</span>
            </button>
            <button
              type="button"
              className={`category-pill ${mode === 'mass' ? 'active' : ''}`}
              onClick={() => { setMode('mass'); setResults([]); }}
            >
              <Layers size={15} />
              <span>Mass Batch & File Dump</span>
            </button>
          </div>

          {/* Automatic "Hi" Message Sandbox Verification Toggle */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.45rem 0.9rem', borderRadius: '10px' }}>
            <input 
              type="checkbox" 
              checked={sendHiMessage} 
              onChange={(e) => setSendHiMessage(e.target.checked)}
              style={{ accentColor: '#10b981', width: 16, height: 16 }}
            />
            <span style={{ fontSize: '0.84rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Send size={13} /> Auto-Send "Hi" Live Verification Message
            </span>
          </label>
        </div>

        {/* Target Provider Preset Selector */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>
            TARGET SERVICE / ROUTING HEURISTIC
          </label>
          <select 
            className="input-glass" 
            value={selectedProviderId} 
            onChange={(e) => setSelectedProviderId(e.target.value)}
            style={{ width: '100%', cursor: 'pointer', padding: '0.85rem 1rem', fontSize: '0.95rem' }}
          >
            {PROVIDERS_LIST.map(p => (
              <option key={p.id} value={p.id} style={{ background: '#0a0d16', color: '#fff' }}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Mode 1: Single Key Sandbox Probe Input */}
        {mode === 'single' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <label style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
              ENTER API KEY TO PROBE & TEST
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input 
                type="text" 
                className="input-glass" 
                placeholder="e.g. AIzaSy..., sk-proj-..., gsk_..., or 32-char hex Weather key..."
                value={singleKeyInput}
                onChange={(e) => setSingleKeyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
                style={{ flex: 1, padding: '1rem', fontFamily: 'var(--font-mono)' }}
              />
              <button 
                className="btn-primary" 
                onClick={handleAnalyze}
                disabled={analyzing || !singleKeyInput.trim()}
                style={{ height: '52px', padding: '0 1.8rem', whiteSpace: 'nowrap' }}
              >
                {analyzing ? <><RefreshCw className="spin icon-sm" /> Probing...</> : <><Zap size={16} /> Probe Key</>}
              </button>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Automatically detects whether this key belongs to Google Maps, Gemini AI, OpenWeatherMap, OpenAI, Groq, GitHub, or Stripe, and sends a live test message.
            </span>
          </div>
        ) : (
          /* Mode 2: Mass Batch & File Upload Input */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <span>PASTE KEYS (TEXT / JSON / ENV DUMP)</span>
              </label>
              <textarea 
                className="textarea-glass"
                placeholder={"AIzaSy...\nsk-proj-...\ngsk_...\nPaste raw logs, environment files, or key lists here. The Laboratory extracts and probes every key."}
                value={inputText}
                disabled={!!selectedFile}
                onChange={(e) => setInputText(e.target.value)}
                style={{ flex: 1, minHeight: '160px', fontFamily: 'var(--font-mono)', opacity: selectedFile ? 0.5 : 1, padding: '1rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div 
                style={{ 
                  border: `2px dashed ${selectedFile ? 'var(--success)' : 'rgba(94, 106, 210, 0.4)'}`, 
                  borderRadius: '12px', 
                  padding: '1.5rem 1rem', 
                  textAlign: 'center', 
                  background: selectedFile ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.25)', 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  flex: 1
                }}
                onClick={() => {
                  if (selectedFile) setSelectedFile(null);
                  else fileInputRef.current.click();
                }}
              >
                {selectedFile ? (
                  <>
                    <CheckCircle size={40} style={{ color: 'var(--success)' }} />
                    <div>
                      <h4 style={{ color: 'var(--success)', margin: '0 0 0.35rem 0' }}>File Ready</h4>
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.82rem' }}>{selectedFile.name}</p>
                      <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0 0', fontSize: '0.72rem' }}>(Click to remove)</p>
                    </div>
                  </>
                ) : (
                  <>
                    <UploadCloud size={40} style={{ color: 'var(--primary)' }} />
                    <div>
                      <h4 style={{ color: 'var(--primary)', margin: '0 0 0.35rem 0' }}>Upload Key Dump</h4>
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem' }}>Supports .txt, .csv, and .gz</p>
                    </div>
                  </>
                )}
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".txt,.csv,.json,.gz" onChange={(e) => handleFileUpload(e.target.files[0])} />
              </div>

              <button 
                type="button"
                onClick={() => setShowCompressionGuide(true)}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--accent)', padding: '0.45rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', width: '100%', textAlign: 'center' }}
              >
                GZIP Compression Guide (.gz for 7GB+ files)
              </button>
            </div>
          </div>
        )}

        {/* Action Button for Mass Mode */}
        {mode === 'mass' && (
          <button 
            className="btn-primary" 
            onClick={handleAnalyze}
            disabled={analyzing || (!inputText.trim() && !selectedFile)}
            style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
          >
            {analyzing && extractionProgress > 0 && extractionProgress < 100 && (
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'rgba(255,255,255,0.12)', width: `${extractionProgress}%`, transition: 'width 0.1s' }} />
            )}
            {analyzing ? (
              <>
                <RefreshCw className="spin icon-sm" style={{ position: 'relative', zIndex: 1 }} /> 
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {extractionProgress > 0 && extractionProgress < 100 ? `Decompressing & Extracting... ${extractionProgress}%` : 'Executing Live Probes & "Hi" Tests...'}
                </span>
              </>
            ) : (
              <>
                <Stethoscope className="icon-sm" /> Analyze, Probe & Sort All Keys
              </>
            )}
          </button>
        )}

        {/* Results Dashboard & Categorization Tabs */}
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '0.5rem' }}>
            
            {/* Header with reveal & batch actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                <Server size={20} /> Probed Keys ({results.filter(r => r.status === 'tested').length} of {results.length})
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="view-toggle-btn"
                >
                  {showKeys ? <><EyeOff size={14}/> Hide Secret Keys</> : <><Eye size={14}/> Reveal Full Keys</>}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCategoryKeys}
                  className="view-toggle-btn"
                  title="Copy all keys currently displayed in this category"
                >
                  <Copy size={14} /> Copy Category Keys ({filteredKeys.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCategory('json')}
                  className="view-toggle-btn"
                  title="Export sorted report as JSON"
                >
                  <Download size={14} /> Export JSON
                </button>
              </div>
            </div>

            {/* Categorization & Sub-Key Filter Tabs */}
            <div className="key-lab-tabs-nav">
              {SUB_CATEGORIES.map(cat => {
                const count = getCategoryCount(cat.id);
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`key-lab-tab ${activeCategoryFilter === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategoryFilter(cat.id)}
                  >
                    <IconComponent size={14} style={{ color: cat.color }} />
                    <span>{cat.label}</span>
                    <span className="key-tab-count" style={{ color: count > 0 ? '#fff' : 'var(--text-muted)' }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Keys Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
              {filteredKeys.slice(0, 100).map((item, idx) => (
                <div key={idx} className="key-probe-card">
                  
                  {/* Top: Service Badge & Latency */}
                  <div className="key-probe-header">
                    <span 
                      className="sub-key-badge" 
                      style={{ 
                        background: item.details.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: item.details.valid ? '#10b981' : '#ef4444',
                        border: `1px solid ${item.details.valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}
                    >
                      {item.details.subCategory === 'google_maps' && <MapPin size={12} />}
                      {item.details.subCategory === 'weather' && <CloudSun size={12} />}
                      {item.details.subCategory === 'ai' && <Bot size={12} />}
                      {item.details.subCategory === 'developer' && <Terminal size={12} />}
                      {item.details.subCategory === 'payments' && <CreditCard size={12} />}
                      <span>{item.details.subService}</span>
                    </span>

                    {item.details.latencyMs && (
                      <span style={{ fontSize: '0.74rem', color: '#10b981', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Zap size={12} /> {item.details.latencyMs}ms
                      </span>
                    )}
                  </div>

                  {/* Key String Display */}
                  <div style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '0.86rem', 
                    color: item.details.valid ? '#fff' : '#f87171',
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    wordBreak: 'break-all',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    {maskKey(item.key)}
                  </div>

                  {/* Live "Hi" Response Bubble (When Model Responded!) */}
                  {item.details.hiResponse && (
                    <div className="hi-response-bubble">
                      <div className="hi-bubble-header">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Sparkles size={12} /> LIVE SANDBOX "HI" RESPONSE
                        </span>
                        <span>STATUS: ACTIVE 200 OK</span>
                      </div>
                      <div style={{ fontStyle: 'italic', color: '#ecfdf5' }}>
                        "{item.details.hiResponse}"
                      </div>
                    </div>
                  )}

                  {/* Plan & Extra Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--secondary)' }}>
                      <span>Tier / Scope:</span>
                      <strong style={{ color: '#fff' }}>{item.details.plan}</strong>
                    </div>
                    <div style={{ color: item.details.valid ? 'var(--text-muted)' : '#fca5a5', lineHeight: 1.4 }}>
                      {item.details.extraInfo}
                    </div>
                  </div>

                  {/* Card Action Bar */}
                  <div className="key-card-action-bar">
                    <button
                      type="button"
                      onClick={() => handleCopySingleKey(item.key, idx)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: copiedKeyIndex === idx ? '#10b981' : 'var(--text-muted)', 
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.78rem'
                      }}
                    >
                      {copiedKeyIndex === idx ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKeyIndex === idx ? 'Copied!' : 'Copy Key'}</span>
                    </button>

                    {/* Quick Launch into Chat Sandbox if AI key is active */}
                    {item.details.valid && item.details.subCategory === 'ai' && (
                      <Link 
                        to="/llm-chat" 
                        style={{ 
                          textDecoration: 'none', 
                          color: 'var(--accent)', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.3rem', 
                          fontWeight: 600,
                          fontSize: '0.78rem'
                        }}
                        onClick={() => {
                          // Pre-fill localStorage key for seamless transition
                          if (item.details.subService.toLowerCase().includes('gemini')) {
                            localStorage.setItem('sakrypt_llm_key_google', item.key);
                          } else if (item.details.subService.toLowerCase().includes('openai')) {
                            localStorage.setItem('sakrypt_llm_key_openai', item.key);
                          } else if (item.details.subService.toLowerCase().includes('groq')) {
                            localStorage.setItem('sakrypt_llm_key_groq', item.key);
                          } else if (item.details.subService.toLowerCase().includes('claude')) {
                            localStorage.setItem('sakrypt_llm_key_anthropic', item.key);
                          }
                        }}
                      >
                        <MessageSquare size={13} /> Test in Chat Sandbox →
                      </Link>
                    )}
                  </div>

                </div>
              ))}
            </div>

            {/* Zero State for Category */}
            {filteredKeys.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <p style={{ margin: 0 }}>No keys found in this category.</p>
              </div>
            )}

            {filteredKeys.length > 100 && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Showing first 100 keys. Click "Export JSON / CSV" to download all {filteredKeys.length} keys in this category.
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* GZIP Compression Guide Modal */}
      <AnimatePresence>
        {showCompressionGuide && (
          <div className="modal-overlay" onClick={() => setShowCompressionGuide(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '520px', textAlign: 'left' }}
            >
              <button className="close-btn" onClick={() => setShowCompressionGuide(false)}>&times;</button>
              <h2 style={{ color: '#fff', marginTop: 0 }}>GZIP Compression Guide</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                If you have massive key dumps (e.g., 7GB+ of text files), uploading raw text can crash browsers. You can natively upload highly compact <strong>.gz</strong> files, and the Laboratory will decompress and stream them without freezing!
              </p>
              
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                <div style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 'bold' }}>Mac / Linux (Terminal) - Max Compression</div>
                <code style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>gzip -9 keys_dump.txt</code>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.4rem 0 0 0' }}>Creates a compressed <code>keys_dump.txt.gz</code> file with maximum compression ratio.</p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                <div style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 'bold' }}>Split Huge Dumps Without Breaking Keys</div>
                <code style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>split -l 1000000 keys_dump.txt part_</code>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.4rem 0 0 0' }}>Splits by exact line counts, preventing keys from being cut in half.</p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 'bold' }}>Windows (PowerShell)</div>
                <code style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  $in = [IO.File]::OpenRead("keys.txt"); $out = [IO.File]::Create("keys.gz"); $gz = New-Object IO.Compression.GZipStream($out, [IO.Compression.CompressionMode]::Compress); $in.CopyTo($gz); $gz.Close(); $out.Close(); $in.Close();
                </code>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default APIKeyLaboratory;
