import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, UploadCloud, FileText, CheckCircle, XCircle, AlertTriangle, RefreshCw, Download, Server, Key, Eye, EyeOff } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const PROVIDERS_LIST = [
  { id: 'auto', name: 'Auto-Detect (Smart Routing)' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'google', name: 'Google (Gemini / GCP)' },
  { id: 'anthropic', name: 'Anthropic (Claude)' },
  { id: 'groq', name: 'Groq' },
  { id: 'github', name: 'GitHub Personal Access Token' },
  { id: 'stripe', name: 'Stripe' },
  { id: 'unknown', name: 'Unknown / Custom Provider' }
];

// --- KEY RECOGNITION HEURISTICS ---
const detectProvider = (key) => {
  if (/^sk-ant-[a-zA-Z0-9_-]+$/.test(key)) return { id: 'anthropic', name: 'Anthropic (Claude)' };
  if (/^sk-(proj-)?[a-zA-Z0-9_-]{32,}$/.test(key)) return { id: 'openai', name: 'OpenAI' };
  if (/^AIza[0-9A-Za-z-_]{35}$/.test(key)) return { id: 'google', name: 'Google (Gemini / GCP)' };
  if (/^gsk_[a-zA-Z0-9]{32,}$/.test(key)) return { id: 'groq', name: 'Groq' };
  if (/^ghp_[a-zA-Z0-9]{36}$/.test(key) || /^github_pat_[a-zA-Z0-9_]{82}$/.test(key)) return { id: 'github', name: 'GitHub Personal Access Token' };
  if (/^sk_(live|test)_[a-zA-Z0-9]{24,}$/.test(key)) return { id: 'stripe', name: 'Stripe' };
  return { id: 'unknown', name: 'Unknown / Custom Provider' };
};

// --- TESTING LOGIC ---
const testKey = async (key, providerId) => {
  try {
    let response;
    let details = { valid: false, plan: 'Unknown', models: [], extraInfo: '' };

    if (providerId === 'openai') {
      // Test basic connection
      response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      const data = await response.json();
      if (response.ok) {
        details.valid = true;
        details.models = data.data.map(m => m.id);
        
        // Check for premium models to guess tier
        if (details.models.includes('gpt-4') || details.models.includes('gpt-4-turbo')) {
          details.plan = 'Premium / Funded (Tier 1+)';
        } else {
          details.plan = 'Free Tier / Unfunded';
        }
        details.extraInfo = `Access to ${details.models.length} models.`;
      } else {
        details.extraInfo = data.error?.message || 'Invalid key or quota exceeded.';
      }
    } 
    else if (providerId === 'google') {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      const data = await response.json();
      if (response.ok) {
        details.valid = true;
        details.models = data.models.map(m => m.name.replace('models/', ''));
        details.plan = 'Standard (Free/Pay-as-you-go)';
        details.extraInfo = `Access to ${details.models.length} generative models.`;
      } else {
        details.extraInfo = data.error?.message || 'Invalid key.';
      }
    }
    else if (providerId === 'groq') {
      response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      const data = await response.json();
      if (response.ok) {
        details.valid = true;
        details.models = data.data.map(m => m.id);
        details.plan = 'Groq Developer Tier';
        details.extraInfo = `Access to ${details.models.length} high-speed models.`;
      } else {
        details.extraInfo = data.error?.message || 'Invalid key.';
      }
    }
    else {
      // For Unknown or un-testable providers in browser, just mark as unverified
      details.extraInfo = 'Browser testing not supported for this provider type yet. Test backend manually.';
    }

    return details;

  } catch (err) {
    return { valid: false, plan: 'Unknown', models: [], extraInfo: err.message === 'Failed to fetch' ? 'Network/CORS blocked' : err.message };
  }
};

const APIKeyLaboratory = () => {
  const [inputText, setInputText] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('auto');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState([]); // Array of { key, provider, status: 'pending'|'tested', details: {} }
  const [showKeys, setShowKeys] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = useToast();
  const showSupport = useSupport();

  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setInputText(e.target.result);
      showToast('File loaded. Click Analyze.', 'success');
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      showToast('Please enter keys or upload a file.', 'error');
      return;
    }

    setAnalyzing(true);
    setResults([]);

    // Extract potential keys from text using basic whitespace splitting
    // (A more advanced regex could extract keys hidden inside json files)
    const rawLines = inputText.split(/\r?\n/).join(' ').split(/\s+/);
    
    // Filter and unique
    const uniqueKeys = [...new Set(rawLines.filter(k => k.trim().length > 15))];

    if (uniqueKeys.length === 0) {
      showToast('No recognizable keys found.', 'warning');
      setAnalyzing(false);
      return;
    }

    // Step 1: Detect Providers
    const initialResults = uniqueKeys.map(k => {
      const prov = selectedProviderId === 'auto' 
        ? detectProvider(k) 
        : PROVIDERS_LIST.find(p => p.id === selectedProviderId) || { id: 'unknown', name: 'Unknown' };

      return {
        key: k,
        provider: prov,
        status: 'pending',
        details: null
      };
    });

    setResults([...initialResults]);

    // Step 2: Test Keys Concurrently (Batched)
    const concurrency = 20; // Increased concurrency
    for (let i = 0; i < initialResults.length; i += concurrency) {
      const chunk = initialResults.slice(i, i + concurrency);
      
      const promises = chunk.map(async (item) => {
        const testDetails = await testKey(item.key, item.provider.id);
        const updatedItem = {
          ...item,
          status: 'tested',
          details: testDetails
        };
        
        // Update UI progressively the exact millisecond this specific key finishes
        setResults(prev => {
          const newResults = [...prev];
          const idx = newResults.findIndex(r => r.key === updatedItem.key);
          if (idx !== -1) newResults[idx] = updatedItem;
          return newResults;
        });

        return updatedItem;
      });

      await Promise.all(promises); // Wait for the chunk to clear rate-limiting hurdles before moving to next batch
    }

    setAnalyzing(false);
    showToast('Analysis Complete!', 'success');
    if (Math.random() < 0.3) setTimeout(showSupport, 2000);
  };

  // Grouping results for UI
  const workingKeys = results.filter(r => r.status === 'tested' && r.details?.valid);
  const deadKeys = results.filter(r => r.status === 'tested' && !r.details?.valid && r.provider.id !== 'unknown');
  const unknownKeys = results.filter(r => r.provider.id === 'unknown' || (r.status === 'tested' && !r.details?.valid && r.provider.id === 'unknown'));

  const maskKey = (key) => showKeys ? key : `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '10s', maxWidth: '1200px' }}
    >
      <ToolHeader title="API Key Laboratory" subtitle="Deep-scan, auto-detect providers, and identify tiers for massive lists of API keys." />

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Input Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              TARGET PROVIDER
            </label>
            <select 
              className="input-glass" 
              value={selectedProviderId} 
              onChange={(e) => setSelectedProviderId(e.target.value)}
              style={{ width: '100%', cursor: 'pointer', padding: '1rem', fontSize: '1rem' }}
            >
              {PROVIDERS_LIST.map(p => (
                <option key={p.id} value={p.id} style={{ background: '#111' }}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span>PASTE KEYS (OR JSON/TEXT DUMP)</span>
              </label>
              <textarea 
                className="textarea-glass"
                placeholder="sk-...\nAIza...\nPaste raw text here. The Laboratory will auto-extract and analyze."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ flex: 1, minHeight: '150px', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div 
              style={{ 
                border: `2px dashed rgba(94, 106, 210, 0.4)`, 
                borderRadius: '12px', 
                padding: '2rem', 
                textAlign: 'center', 
                background: 'rgba(0,0,0,0.2)', 
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}
              onClick={() => fileInputRef.current.click()}
            >
              <UploadCloud size={48} style={{ color: 'var(--primary)' }} />
              <div>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>Upload Dump File</h4>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>.txt, .csv, .json</p>
              </div>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e.target.files[0])} />
            </div>
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleAnalyze}
          disabled={analyzing || !inputText.trim()}
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', justifyContent: 'center' }}
        >
          {analyzing ? (
            <><RefreshCw className="spin icon-sm" /> Running Diagnostics...</>
          ) : (
            <><Stethoscope className="icon-sm" /> Analyze & Test Keys</>
          )}
        </button>

        {/* Results Area */}
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '1rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Server /> Laboratory Results ({results.filter(r => r.status === 'tested').length}/{results.length})
              </h3>
              <button 
                onClick={() => setShowKeys(!showKeys)}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                {showKeys ? <><EyeOff size={16}/> Hide Keys</> : <><Eye size={16}/> Reveal Keys</>}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
              
              {/* Working Keys Panel */}
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} /> Active & Verified ({workingKeys.length})
                </div>
                <div style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {workingKeys.map((item, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{item.provider.name}</span>
                        <span style={{ color: 'var(--accent)', fontSize: '0.8rem', background: 'rgba(236, 72, 153, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                          {item.details.plan}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#e2e8f0', wordBreak: 'break-all', marginBottom: '0.5rem' }}>
                        {maskKey(item.key)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {item.details.extraInfo}
                      </div>
                    </div>
                  ))}
                  {workingKeys.length === 0 && <div style={{ color: 'rgba(16,185,129,0.5)', textAlign: 'center', padding: '2rem 0' }}>No active keys found.</div>}
                </div>
              </div>

              {/* Dead Keys Panel */}
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <XCircle size={18} /> Expired / Invalid ({deadKeys.length})
                </div>
                <div style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {deadKeys.map((item, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>{item.provider.name}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#e2e8f0', wordBreak: 'break-all', marginBottom: '0.5rem', opacity: 0.6 }}>
                        {maskKey(item.key)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                        {item.details.extraInfo}
                      </div>
                    </div>
                  ))}
                  {deadKeys.length === 0 && <div style={{ color: 'rgba(239,68,68,0.5)', textAlign: 'center', padding: '2rem 0' }}>No dead keys found.</div>}
                </div>
              </div>

              {/* Unknown / Unverified Panel */}
              <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} /> Unknown / Unverified ({unknownKeys.length})
                </div>
                <div style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {unknownKeys.map((item, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#e2e8f0', wordBreak: 'break-all', marginBottom: '0.5rem' }}>
                        {maskKey(item.key)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>
                        {item.provider.name !== 'Unknown / Custom Provider' 
                          ? `Identified as ${item.provider.name}, but could not verify tier in browser.` 
                          : 'Could not auto-detect provider format.'}
                      </div>
                    </div>
                  ))}
                  {unknownKeys.length === 0 && <div style={{ color: 'rgba(245,158,11,0.5)', textAlign: 'center', padding: '2rem 0' }}>All keys recognized!</div>}
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default APIKeyLaboratory;
