import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, XCircle, RefreshCw, Server, 
  UploadCloud, FileText, Download, Play, Send, Sparkles, 
  MessageSquare, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const PROVIDERS = {
  OPENAI: 'OpenAI (GPT-4o / mini)',
  GOOGLE: 'Google Gemini AI',
  GOOGLE_MAPS: 'Google Maps (Geocoding / Places)',
  WEATHER: 'Weather API (OpenWeather / WeatherAPI)',
  GROQ: 'Groq Cloud (Llama 3.1)',
  ANTHROPIC: 'Anthropic Claude',
  GITHUB: 'GitHub Token',
  STRIPE: 'Stripe Secret Key',
  CUSTOM: 'Custom Endpoint'
};

const APIKeyTester = () => {
  const [provider, setProvider] = useState(PROVIDERS.OPENAI);
  const [mode, setMode] = useState('single'); // 'single' or 'batch'
  const [sendHiMessage, setSendHiMessage] = useState(true);
  
  // Single Mode State
  const [apiKey, setApiKey] = useState('');
  const [singleStatus, setSingleStatus] = useState(null);
  const [singleMsg, setSingleMsg] = useState('');
  const [singleHiResponse, setSingleHiResponse] = useState(null);
  const [singleLatencyMs, setSingleLatencyMs] = useState(null);
  
  // Batch Mode State
  const [batchKeys, setBatchKeys] = useState([]);
  const [isTestingBatch, setIsTestingBatch] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [batchResults, setBatchResults] = useState([]); // { key, status, msg, hiResponse, latencyMs, subType }
  const [isDragging, setIsDragging] = useState(false);
  const [selectedBatchFile, setSelectedBatchFile] = useState(null);
  const [inputBatchText, setInputBatchText] = useState('');
  const fileInputRef = useRef(null);

  // Custom Fields
  const [customUrl, setCustomUrl] = useState('');
  const [customHeader, setCustomHeader] = useState('Authorization');
  const [customPrefix, setCustomPrefix] = useState('Bearer ');

  const showToast = useToast();
  const showSupport = useSupport();

  // Core test function for a single key with live "Hi" sandbox message
  const testKey = async (keyToTest) => {
    const keyClean = keyToTest.trim();
    const startTime = performance.now();

    try {
      // 1. OPENAI
      if (provider === PROVIDERS.OPENAI) {
        if (sendHiMessage) {
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
            return {
              success: true,
              msg: 'Verified active OpenAI account (gpt-4o-mini)',
              hiResponse: chatData.choices[0].message.content.trim(),
              latencyMs: Math.round(performance.now() - startTime),
              subType: 'OpenAI AI'
            };
          } else if (chatData.error?.code === 'insufficient_quota') {
            return {
              success: false,
              msg: 'Quota Exceeded: Key is valid, but billing quota has run out.',
              subType: 'OpenAI'
            };
          }
        }

        // Fallback models check
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${keyClean}` }
        });
        const data = await response.json();
        if (response.ok) {
          return {
            success: true,
            msg: `Valid OpenAI key. Access to ${data.data?.length || 0} models.`,
            latencyMs: Math.round(performance.now() - startTime),
            subType: 'OpenAI AI'
          };
        } else {
          return { success: false, msg: data.error?.message || `Error ${response.status}`, subType: 'OpenAI' };
        }
      } 
      // 2. GOOGLE GEMINI AI
      else if (provider === PROVIDERS.GOOGLE) {
        if (sendHiMessage) {
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
            return {
              success: true,
              msg: 'Verified Google Gemini AI key (gemini-1.5-flash)',
              hiResponse: geminiData.candidates[0].content.parts[0].text.trim(),
              latencyMs: Math.round(performance.now() - startTime),
              subType: 'Google Gemini AI'
            };
          }
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyClean}`);
        const data = await response.json();
        if (response.ok) {
          return {
            success: true,
            msg: `Valid Gemini AI key. Access to ${data.models?.length || 0} models.`,
            latencyMs: Math.round(performance.now() - startTime),
            subType: 'Google Gemini AI'
          };
        } else {
          return { success: false, msg: data.error?.message || `Error ${response.status}`, subType: 'Google Gemini AI' };
        }
      }
      // 3. GOOGLE MAPS API
      else if (provider === PROVIDERS.GOOGLE_MAPS) {
        const mapsRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Paris&key=${keyClean}`);
        const mapsData = await mapsRes.json();
        if (mapsData.status === 'OK') {
          const formatted = mapsData.results?.[0]?.formatted_address || 'Paris, France';
          return {
            success: true,
            msg: `Active Google Maps Geocoding Key! Resolved address: "${formatted}"`,
            latencyMs: Math.round(performance.now() - startTime),
            subType: 'Google Maps'
          };
        } else if (mapsData.status === 'REQUEST_DENIED' && !mapsData.error_message?.toLowerCase().includes('api key is invalid')) {
          return {
            success: false,
            msg: `Google Cloud Key recognized, but Maps Geocoding API is not enabled: ${mapsData.error_message}`,
            subType: 'Google Cloud (Maps Disabled)'
          };
        } else {
          return { success: false, msg: mapsData.error_message || 'Invalid Google Maps API key.', subType: 'Google Maps' };
        }
      }
      // 4. WEATHER SERVICES
      else if (provider === PROVIDERS.WEATHER) {
        // Probe OpenWeatherMap
        try {
          const owmRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=London&appid=${keyClean}`);
          const owmData = await owmRes.json();
          if (owmRes.ok && owmData.main) {
            const tempC = Math.round(owmData.main.temp - 273.15);
            return {
              success: true,
              msg: `Active OpenWeatherMap Key! ${owmData.name}: ${tempC}°C, ${owmData.weather?.[0]?.description || 'Clear'}.`,
              latencyMs: Math.round(performance.now() - startTime),
              subType: 'OpenWeatherMap'
            };
          }
        } catch (e) {}

        // Probe WeatherAPI
        try {
          const wapiRes = await fetch(`https://api.weatherapi.com/v1/current.json?key=${keyClean}&q=London`);
          const wapiData = await wapiRes.json();
          if (wapiRes.ok && wapiData.current) {
            return {
              success: true,
              msg: `Active WeatherAPI.com Key! ${wapiData.location?.name}: ${wapiData.current.temp_c}°C, ${wapiData.current.condition?.text}.`,
              latencyMs: Math.round(performance.now() - startTime),
              subType: 'WeatherAPI.com'
            };
          }
        } catch (e) {}

        return { success: false, msg: 'Invalid Weather key for OpenWeatherMap and WeatherAPI.', subType: 'Weather' };
      }
      // 5. GROQ CLOUD
      else if (provider === PROVIDERS.GROQ) {
        if (sendHiMessage) {
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
            return {
              success: true,
              msg: 'Verified Groq Cloud LPU key (llama-3.1-8b)',
              hiResponse: groqData.choices[0].message.content.trim(),
              latencyMs: Math.round(performance.now() - startTime),
              subType: 'Groq Cloud'
            };
          }
        }

        const response = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${keyClean}` }
        });
        const data = await response.json();
        if (response.ok) {
          return {
            success: true,
            msg: `Valid Groq key. Access to ${data.data?.length || 0} models.`,
            latencyMs: Math.round(performance.now() - startTime),
            subType: 'Groq Cloud'
          };
        } else {
          return { success: false, msg: data.error?.message || `Error ${response.status}`, subType: 'Groq' };
        }
      }
      // 6. ANTHROPIC CLAUDE
      else if (provider === PROVIDERS.ANTHROPIC) {
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
          return {
            success: true,
            msg: 'Verified Anthropic Claude key (claude-3-5-haiku)',
            hiResponse: claudeData.content[0].text.trim(),
            latencyMs: Math.round(performance.now() - startTime),
            subType: 'Anthropic Claude'
          };
        } else {
          return { success: false, msg: claudeData.error?.message || `Error ${claudeRes.status}`, subType: 'Anthropic' };
        }
      }
      // 7. GITHUB
      else if (provider === PROVIDERS.GITHUB) {
        const ghRes = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${keyClean}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        const ghData = await ghRes.json();
        if (ghRes.ok && ghData.login) {
          return {
            success: true,
            msg: `Verified GitHub PAT! User: @${ghData.login}, Public Repos: ${ghData.public_repos}.`,
            latencyMs: Math.round(performance.now() - startTime),
            subType: 'GitHub PAT'
          };
        } else {
          return { success: false, msg: ghData.message || 'Invalid GitHub token.', subType: 'GitHub' };
        }
      }
      // 8. STRIPE
      else if (provider === PROVIDERS.STRIPE) {
        const isLive = keyClean.startsWith('sk_live_');
        const stripeRes = await fetch('https://api.stripe.com/v1/balance', {
          headers: { 'Authorization': `Bearer ${keyClean}` }
        });
        const stripeData = await stripeRes.json();
        if (stripeRes.ok) {
          const curr = stripeData.available?.[0]?.currency?.toUpperCase() || 'USD';
          return {
            success: true,
            msg: `Verified Stripe key (${isLive ? 'LIVE' : 'TEST'})! Balance currency: ${curr}.`,
            latencyMs: Math.round(performance.now() - startTime),
            subType: isLive ? 'Stripe LIVE' : 'Stripe Test'
          };
        } else {
          return { success: false, msg: stripeData.error?.message || 'Invalid Stripe key.', subType: 'Stripe' };
        }
      }
      // 9. CUSTOM ENDPOINT
      else if (provider === PROVIDERS.CUSTOM) {
        const headers = {};
        if (customHeader) {
          headers[customHeader] = `${customPrefix}${keyClean}`;
        }
        const response = await fetch(customUrl, {
          method: 'GET',
          headers: Object.keys(headers).length > 0 ? headers : undefined
        });
        const data = await response.json();
        if (response.ok) {
          return {
            success: true,
            msg: `Custom Endpoint responded HTTP 200 OK`,
            latencyMs: Math.round(performance.now() - startTime),
            subType: 'Custom Endpoint'
          };
        } else {
          return { success: false, msg: data.error?.message || data.message || `Error ${response.status}`, subType: 'Custom' };
        }
      }

      return { success: false, msg: 'Unknown provider', subType: 'Unknown' };
    } catch (err) {
      return { 
        success: false, 
        msg: err.message === 'Failed to fetch' ? 'Network/CORS error' : err.message,
        subType: 'Network Error' 
      };
    }
  };

  const handleSingleTest = async () => {
    if (!apiKey.trim()) { showToast('Please enter an API Key', 'error'); return; }
    if (provider === PROVIDERS.CUSTOM && !customUrl) { showToast('Please enter a custom URL', 'error'); return; }
    
    setSingleStatus('loading');
    setSingleMsg('');
    setSingleHiResponse(null);
    setSingleLatencyMs(null);
    
    const result = await testKey(apiKey.trim());
    if (result.success) {
      setSingleStatus('success');
      setSingleMsg(result.msg);
      setSingleHiResponse(result.hiResponse || null);
      setSingleLatencyMs(result.latencyMs || null);
      setTimeout(showSupport, 1500);
    } else {
      setSingleStatus('error');
      setSingleMsg(result.msg);
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    setSelectedBatchFile(file);
    setInputBatchText('');
    showToast(`File ${file.name} ready for batch test`, 'success');
  };

  const handleBatchTest = async () => {
    if (!inputBatchText.trim() && !selectedBatchFile) { showToast('No keys or file provided', 'error'); return; }
    if (provider === PROVIDERS.CUSTOM && !customUrl) { showToast('Please enter a custom URL', 'error'); return; }

    setIsTestingBatch(true);
    setExtractionProgress(0);
    setBatchResults([]);
    
    const tokenRegex = /[a-zA-Z0-9_-]{15,}/g;
    const keySet = new Set();
    
    if (selectedBatchFile) {
      const CHUNK_SIZE = 10 * 1024 * 1024;
      let offset = 0;
      showToast('Extracting keys from large file...', 'info');
      while (offset < selectedBatchFile.size) {
        const chunk = selectedBatchFile.slice(offset, offset + CHUNK_SIZE);
        const text = await chunk.text();
        const matches = text.match(tokenRegex) || [];
        for (const m of matches) keySet.add(m);
        offset += CHUNK_SIZE;
        setExtractionProgress(Math.floor(Math.min((offset / selectedBatchFile.size) * 100, 100)));
        await new Promise(r => setTimeout(r, 10));
      }
    } else {
      const matches = inputBatchText.match(tokenRegex) || [];
      for (const m of matches) keySet.add(m);
    }
    
    const uniqueKeys = Array.from(keySet);
    if (uniqueKeys.length === 0) {
      showToast('No valid keys found to test.', 'error');
      setIsTestingBatch(false);
      return;
    }
    
    setBatchKeys(uniqueKeys);
    showToast(`Testing ${uniqueKeys.length} unique keys...`, 'success');

    await new Promise(r => setTimeout(r, 100));

    const concurrency = 15;
    let localResults = [];
    
    for (let i = 0; i < uniqueKeys.length; i += concurrency) {
      const chunk = uniqueKeys.slice(i, i + concurrency);
      const chunkPromises = chunk.map(async (key) => {
        const res = await testKey(key);
        return { 
          key, 
          status: res.success ? 'success' : 'error', 
          msg: res.msg,
          hiResponse: res.hiResponse || null,
          latencyMs: res.latencyMs || null,
          subType: res.subType || 'Key'
        };
      });
      
      const completedChunk = await Promise.all(chunkPromises);
      localResults = localResults.concat(completedChunk);
      setBatchResults([...localResults]);
    }
    
    setIsTestingBatch(false);
    showToast('Batch testing complete!', 'success');
    setTimeout(showSupport, 2000);
  };

  const workingKeys = batchResults.filter(r => r.status === 'success');
  const deadKeys = batchResults.filter(r => r.status === 'error');

  const exportKeys = (keysArray, type) => {
    if (keysArray.length === 0) return;
    const text = keysArray.map(k => k.key).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${provider.replace(/\s+/g, '_')}_${type}_keys.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${keysArray.length} ${type} keys`, 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '9s', maxWidth: '1100px' }}
    >
      <ToolHeader 
        title="API Key Tester & Sandbox Prober" 
        subtitle="Verify single or massive batches of API keys instantly with live 'Hi' message verification." 
      />

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Provider Selection */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>
              TARGET PROVIDER & SUB-KEY ENGINE
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
              <input 
                type="checkbox" 
                checked={sendHiMessage} 
                onChange={(e) => setSendHiMessage(e.target.checked)}
                style={{ accentColor: '#10b981' }}
              />
              <Send size={13} /> Auto-Send "Hi" Verification
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
            {Object.values(PROVIDERS).map(prov => (
              <button
                key={prov}
                className="btn-primary"
                onClick={() => { setProvider(prov); setSingleStatus(null); setBatchResults([]); }}
                style={{ 
                  background: provider === prov ? 'rgba(94, 106, 210, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${provider === prov ? 'var(--accent)' : 'rgba(255, 255, 255, 0.08)'}`,
                  color: provider === prov ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.86rem',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '10px'
                }}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Provider Fields */}
        {provider === PROVIDERS.CUSTOM && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ENDPOINT URL</label>
              <input type="text" className="input-glass" placeholder="https://api.example.com/v1/models" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>AUTH HEADER</label>
                <input type="text" className="input-glass" placeholder="Authorization" value={customHeader} onChange={(e) => setCustomHeader(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>PREFIX</label>
                <input type="text" className="input-glass" placeholder="Bearer " value={customPrefix} onChange={(e) => setCustomPrefix(e.target.value)} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Mode Switcher */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <button 
            onClick={() => setMode('single')}
            style={{ background: 'transparent', border: 'none', color: mode === 'single' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1rem', fontWeight: mode === 'single' ? 'bold' : 'normal', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: mode === 'single' ? '2px solid var(--primary)' : '2px solid transparent' }}
          >
            Single Key Mode
          </button>
          <button 
            onClick={() => setMode('batch')}
            style={{ background: 'transparent', border: 'none', color: mode === 'batch' ? '#ec4899' : 'var(--text-muted)', fontSize: '1rem', fontWeight: mode === 'batch' ? 'bold' : 'normal', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: mode === 'batch' ? '2px solid #ec4899' : '2px solid transparent' }}
          >
            Mass Batch Dump Mode (.txt)
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'single' ? (
            <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>API KEY</label>
                <input 
                  type="password" 
                  className="input-glass" 
                  placeholder={`Enter your ${provider} key...`} 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  style={{ fontFamily: 'var(--font-mono)' }} 
                />
              </div>

              <button 
                className="btn-primary" 
                onClick={handleSingleTest} 
                disabled={singleStatus === 'loading'} 
                style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', fontSize: '1rem' }}
              >
                {singleStatus === 'loading' ? (
                  <><RefreshCw className="icon-sm spin" /> Probing & Testing Connection...</>
                ) : (
                  <><Server className="icon-sm" /> Test & Probe Key</>
                )}
              </button>

              {singleStatus && singleStatus !== 'loading' && (
                <div style={{ 
                  padding: '1.25rem', 
                  borderRadius: '12px', 
                  background: singleStatus === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                  border: `1px solid ${singleStatus === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {singleStatus === 'success' ? <CheckCircle size={22} style={{ color: 'var(--success)' }} /> : <XCircle size={22} style={{ color: 'var(--danger)' }} />}
                      <h4 style={{ margin: 0, color: singleStatus === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: '1.05rem' }}>
                        {singleStatus === 'success' ? 'Key Verified & Operational' : 'Connection Failed'}
                      </h4>
                    </div>

                    {singleLatencyMs && (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Zap size={13} /> {singleLatencyMs}ms
                      </span>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc', lineHeight: 1.4 }}>{singleMsg}</p>

                  {/* Live "Hi" Response Bubble */}
                  {singleHiResponse && (
                    <div className="hi-response-bubble">
                      <div className="hi-bubble-header">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Sparkles size={12} /> LIVE MODEL "HI" RESPONSE
                        </span>
                        <span>HTTP 200 OK</span>
                      </div>
                      <div style={{ fontStyle: 'italic', color: '#ecfdf5' }}>
                        "{singleHiResponse}"
                      </div>
                    </div>
                  )}

                  {singleStatus === 'success' && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
                      <Link 
                        to="/llm-chat" 
                        style={{ color: 'var(--accent)', fontSize: '0.84rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}
                      >
                        <MessageSquare size={14} /> Open in LLM Chat Sandbox →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="batch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <span>PASTE KEYS (OR UPLOAD DUMP)</span>
                  </label>
                  <textarea 
                    className="textarea-glass"
                    placeholder={`Paste raw ${provider} keys here. Auto-extraction will extract all tokens.`}
                    value={inputBatchText}
                    disabled={!!selectedBatchFile}
                    onChange={(e) => setInputBatchText(e.target.value)}
                    style={{ flex: 1, minHeight: '150px', fontFamily: 'var(--font-mono)', opacity: selectedBatchFile ? 0.5 : 1 }}
                  />
                </div>

                <div 
                  style={{ 
                    border: `2px dashed ${selectedBatchFile ? 'var(--success)' : (isDragging ? '#ec4899' : 'rgba(236,72,153,0.3)')}`, 
                    borderRadius: '12px', 
                    padding: '2rem', 
                    textAlign: 'center', 
                    background: selectedBatchFile ? 'rgba(16, 185, 129, 0.1)' : (isDragging ? 'rgba(236,72,153,0.05)' : 'rgba(0,0,0,0.2)'), 
                    transition: 'all 0.2s', 
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem'
                  }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files[0]); }}
                  onClick={() => {
                    if (selectedBatchFile) setSelectedBatchFile(null);
                    else fileInputRef.current.click();
                  }}
                >
                  {selectedBatchFile ? (
                    <>
                      <CheckCircle size={48} style={{ color: 'var(--success)' }} />
                      <div>
                        <h4 style={{ color: 'var(--success)', margin: '0 0 0.5rem 0' }}>File Ready</h4>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>{selectedBatchFile.name}</p>
                        <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0', fontSize: '0.75rem' }}>(Click to clear)</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={48} style={{ color: isDragging ? '#ec4899' : 'var(--text-muted)' }} />
                      <div>
                        <h4 style={{ color: '#ec4899', margin: '0 0 0.5rem 0' }}>Upload Keys File</h4>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>No size limit (safely streams GBs)</p>
                      </div>
                    </>
                  )}
                  <input type="file" accept=".txt,.json,.csv" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e.target.files[0])} />
                </div>
              </div>

              {((batchKeys.length > 0) || inputBatchText.trim() || selectedBatchFile) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <FileText size={24} style={{ color: '#ec4899' }} />
                    <div>
                      <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{batchKeys.length} Keys Loaded</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ready for batch testing</div>
                    </div>
                  </div>
                  <button 
                    className="btn-primary" 
                    onClick={handleBatchTest}
                    disabled={isTestingBatch}
                    style={{ background: '#ec4899', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}
                  >
                    {isTestingBatch && extractionProgress > 0 && extractionProgress < 100 && (
                      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'rgba(255,255,255,0.2)', width: `${extractionProgress}%`, transition: 'width 0.1s' }} />
                    )}
                    {isTestingBatch ? (
                      <>
                        <RefreshCw className="icon-sm spin" style={{ position: 'relative', zIndex: 1 }} /> 
                        <span style={{ position: 'relative', zIndex: 1 }}>
                          {extractionProgress > 0 && extractionProgress < 100 ? `Extracting... ${extractionProgress}%` : 'Testing with "Hi" Probes...'}
                        </span>
                      </>
                    ) : (
                      <><Play className="icon-sm" /> Start Batch Test</>
                    )}
                  </button>
                </div>
              )}

              {batchResults.length > 0 && (
                <div>
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>
                      Results ({batchResults.length} / {batchKeys.length})
                    </h3>
                    {isTestingBatch && <span style={{ color: '#ec4899', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><RefreshCw className="spin" size={14}/> Processing...</span>}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Working Keys Column */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle size={18} /> Verified Active ({workingKeys.length})
                        </div>
                        <button className="icon-btn" onClick={() => exportKeys(workingKeys, 'working')} title="Export Working Keys" disabled={workingKeys.length === 0} style={{ color: 'var(--success)' }}>
                          <Download size={16} />
                        </button>
                      </div>
                      <div style={{ padding: '1rem', height: '350px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {workingKeys.slice(0, 100).map((r, i) => (
                          <div key={i} style={{ color: 'var(--success)', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)', wordBreak: 'break-all' }}>
                            <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                              <span>{r.key.substring(0, 8)}...{r.key.substring(r.key.length - 8)}</span>
                              {r.latencyMs && <span style={{ fontSize: '0.72rem', color: '#10b981' }}>{r.latencyMs}ms</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.msg}</div>
                            {r.hiResponse && (
                              <div style={{ fontSize: '0.72rem', color: '#ecfdf5', fontStyle: 'italic', marginTop: '0.2rem' }}>
                                "{r.hiResponse.substring(0, 80)}..."
                              </div>
                            )}
                          </div>
                        ))}
                        {workingKeys.length > 100 && (
                          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.85rem' }}>
                            + {workingKeys.length - 100} more (Export to view)
                          </div>
                        )}
                        {workingKeys.length === 0 && <div style={{ color: 'rgba(16,185,129,0.5)', textAlign: 'center', marginTop: '2rem' }}>No working keys yet</div>}
                      </div>
                    </div>

                    {/* Dead Keys Column */}
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: 'var(--danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <XCircle size={18} /> Dead / Quota Exceeded ({deadKeys.length})
                        </div>
                        <button className="icon-btn" onClick={() => exportKeys(deadKeys, 'dead')} title="Export Dead Keys" disabled={deadKeys.length === 0} style={{ color: 'var(--danger)' }}>
                          <Download size={16} />
                        </button>
                      </div>
                      <div style={{ padding: '1rem', height: '350px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {deadKeys.slice(0, 100).map((r, i) => (
                          <div key={i} style={{ padding: '0.6rem', borderBottom: '1px solid rgba(239,68,68,0.1)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ color: 'var(--danger)', wordBreak: 'break-all' }}>{r.key.substring(0, 8)}...{r.key.substring(r.key.length - 8)}</div>
                            <div style={{ color: 'rgba(239,68,68,0.7)', fontSize: '0.75rem' }}>{r.msg}</div>
                          </div>
                        ))}
                        {deadKeys.length > 100 && (
                          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.85rem' }}>
                            + {deadKeys.length - 100} more (Export to view)
                          </div>
                        )}
                        {deadKeys.length === 0 && <div style={{ color: 'rgba(239,68,68,0.5)', textAlign: 'center', marginTop: '2rem' }}>No dead keys yet</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};

export default APIKeyTester;
