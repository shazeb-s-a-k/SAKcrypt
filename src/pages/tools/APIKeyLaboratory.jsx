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
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [results, setResults] = useState([]); // Array of { key, provider, status: 'pending'|'tested', details: {} }
  const [showKeys, setShowKeys] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCompressionGuide, setShowCompressionGuide] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = useToast();
  const showSupport = useSupport();

  const handleFileUpload = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setInputText(''); // Clear text area to prevent double processing
    showToast(`File ${file.name} queued for processing. Click Analyze.`, 'success');
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && !selectedFile) {
      showToast('Please paste keys or upload a file.', 'error');
      return;
    }

    setAnalyzing(true);
    setExtractionProgress(0);
    setResults([]);

    const keyRegex = /(?:sk-(?:proj-)?[a-zA-Z0-9_-]{32,}|AIza[0-9A-Za-z-_]{35}|sk-ant-[a-zA-Z0-9_-]+|gsk_[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}|sk_(?:live|test)_[a-zA-Z0-9]{24,})/g;
    const keySet = new Set();

    if (selectedFile) {
      const isGzip = selectedFile.name.endsWith('.gz');

      if (isGzip) {
        showToast('Decompressing and extracting keys from massive GZIP file...', 'info');
        try {
          const ds = new DecompressionStream('gzip');
          const stream = selectedFile.stream().pipeThrough(ds);
          const reader = stream.getReader();
          const decoder = new TextDecoder('utf-8');
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            const matches = text.match(keyRegex) || [];
            for (const m of matches) keySet.add(m);
            setExtractionProgress(prev => (prev + 5) % 100); // Simulate progress for streaming decompression
            await new Promise(r => setTimeout(r, 5));
          }
          setExtractionProgress(100);
        } catch (err) {
          showToast(`Error decompressing GZIP: ${err.message}`, 'error');
          setAnalyzing(false);
          return;
        }
      } else {
        // Stream file in chunks to prevent crashing on massive (e.g. 3GB) dumps
        const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
        let offset = 0;
        
        showToast('Extracting keys from large file...', 'info');
        while (offset < selectedFile.size) {
          const chunk = selectedFile.slice(offset, offset + CHUNK_SIZE);
          const text = await chunk.text();
          const matches = text.match(keyRegex) || [];
          for (const m of matches) keySet.add(m);
          offset += CHUNK_SIZE;
          setExtractionProgress(Math.floor(Math.min((offset / selectedFile.size) * 100, 100)));
          // Yield to prevent UI freeze
          await new Promise(r => setTimeout(r, 10));
        }
      }
    } else {
      // Process raw text field
      const matches = inputText.match(keyRegex) || [];
      for (const m of matches) keySet.add(m);
    }

    const uniqueKeys = Array.from(keySet);

    if (uniqueKeys.length === 0) {
      showToast('No recognizable keys found. Ensure formats are correct.', 'warning');
      setAnalyzing(false);
      return;
    }

    showToast(`Extracted ${uniqueKeys.length} unique keys. Testing...`, 'success');

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

    // Yield to allow React to paint the extracted keys UI before locking the thread
    await new Promise(r => setTimeout(r, 100));

    // Step 2: Test Keys Concurrently (Batched)
    const concurrency = 20;
    let currentResults = [...initialResults];

    for (let i = 0; i < initialResults.length; i += concurrency) {
      const chunk = initialResults.slice(i, i + concurrency);
      
      const promises = chunk.map(async (item) => {
        const testDetails = await testKey(item.key, item.provider.id);
        return {
          ...item,
          status: 'tested',
          details: testDetails
        };
      });

      const completedChunk = await Promise.all(promises);
      
      // Merge results into our local array
      completedChunk.forEach(updatedItem => {
        const idx = currentResults.findIndex(r => r.key === updatedItem.key);
        if (idx !== -1) currentResults[idx] = updatedItem;
      });
      
      // Update UI once per chunk to prevent array-copying freezing on massive numbers
      setResults([...currentResults]);
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
                disabled={!!selectedFile}
                onChange={(e) => setInputText(e.target.value)}
                style={{ flex: 1, minHeight: '150px', fontFamily: 'var(--font-mono)', opacity: selectedFile ? 0.5 : 1 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div 
                style={{ 
                  border: `2px dashed ${selectedFile ? 'var(--success)' : 'rgba(94, 106, 210, 0.4)'}`, 
                  borderRadius: '12px', 
                  padding: '2rem', 
                  textAlign: 'center', 
                  background: selectedFile ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.2)', 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  position: 'relative',
                  flex: 1
                }}
                onClick={() => {
                  if (selectedFile) setSelectedFile(null); // click to remove
                  else fileInputRef.current.click();
                }}
              >
                {selectedFile ? (
                  <>
                    <CheckCircle size={48} style={{ color: 'var(--success)' }} />
                    <div>
                      <h4 style={{ color: 'var(--success)', margin: '0 0 0.5rem 0' }}>File Ready</h4>
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>{selectedFile.name}</p>
                      <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0', fontSize: '0.75rem' }}>(Click to clear)</p>
                    </div>
                  </>
                ) : (
                  <>
                    <UploadCloud size={48} style={{ color: 'var(--primary)' }} />
                    <div>
                      <h4 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>Upload Dump File</h4>
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Native support for .txt and .gz</p>
                    </div>
                  </>
                )}
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".txt,.csv,.json,.gz" onChange={(e) => handleFileUpload(e.target.files[0])} />
              </div>
              <button 
                onClick={() => setShowCompressionGuide(true)}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--accent)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', width: '100%', textAlign: 'center' }}
              >
                Upload huge files? (Convert to .gz format)
              </button>
            </div>
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleAnalyze}
          disabled={analyzing || (!inputText.trim() && !selectedFile)}
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
        >
          {analyzing && extractionProgress > 0 && extractionProgress < 100 && (
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'rgba(255,255,255,0.1)', width: `${extractionProgress}%`, transition: 'width 0.1s' }} />
          )}
          {analyzing ? (
            <><RefreshCw className="spin icon-sm" style={{ position: 'relative', zIndex: 1 }} /> 
            <span style={{ position: 'relative', zIndex: 1 }}>
              {extractionProgress > 0 && extractionProgress < 100 ? `Extracting... ${extractionProgress}%` : 'Running Diagnostics...'}
            </span>
            </>
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
                  {workingKeys.slice(0, 100).map((item, i) => (
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
                  {workingKeys.length > 100 && (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.85rem' }}>
                      + {workingKeys.length - 100} more keys (Export to view all)
                    </div>
                  )}
                  {workingKeys.length === 0 && <div style={{ color: 'rgba(16,185,129,0.5)', textAlign: 'center', padding: '2rem 0' }}>No active keys found.</div>}
                </div>
              </div>

              {/* Dead Keys Panel */}
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <XCircle size={18} /> Expired / Invalid ({deadKeys.length})
                </div>
                <div style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {deadKeys.slice(0, 100).map((item, i) => (
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
                  {deadKeys.length > 100 && (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.85rem' }}>
                      + {deadKeys.length - 100} more keys (Export to view all)
                    </div>
                  )}
                  {deadKeys.length === 0 && <div style={{ color: 'rgba(239,68,68,0.5)', textAlign: 'center', padding: '2rem 0' }}>No dead keys found.</div>}
                </div>
              </div>

              {/* Unknown / Unverified Panel */}
              <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} /> Unknown / Unverified ({unknownKeys.length})
                </div>
                <div style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {unknownKeys.slice(0, 100).map((item, i) => (
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
                  {unknownKeys.length > 100 && (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.85rem' }}>
                      + {unknownKeys.length - 100} more keys (Export to view all)
                    </div>
                  )}
                  {unknownKeys.length === 0 && <div style={{ color: 'rgba(245,158,11,0.5)', textAlign: 'center', padding: '2rem 0' }}>All keys recognized!</div>}
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </div>
      
      {/* Compression Guide Modal */}
      <AnimatePresence>
        {showCompressionGuide && (
          <div className="modal-overlay" onClick={() => setShowCompressionGuide(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '500px', textAlign: 'left' }}
            >
              <button className="close-btn" onClick={() => setShowCompressionGuide(false)}>&times;</button>
              <h2 style={{ color: '#fff', marginTop: 0 }}>GZIP Compression Guide</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                If you have a massive API key dump (e.g., 7GB+ of text files), uploading raw text can crash browsers. You can natively upload highly-compact <strong>.gz</strong> files, and the Laboratory will decompress and stream them on the fly!
              </p>
              
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                <div style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Mac / Linux (Terminal)</div>
                <code style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>gzip -k keys_dump.txt</code>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>This creates a highly compressed <code>keys_dump.txt.gz</code> file you can directly upload here.</p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Windows (PowerShell)</div>
                <code style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  $inFile = "keys_dump.txt"{"\n"}
                  $outFile = "keys_dump.gz"{"\n"}
                  $in = [IO.File]::OpenRead($inFile){"\n"}
                  $out = [IO.File]::Create($outFile){"\n"}
                  $gz = New-Object IO.Compression.GZipStream($out, [IO.Compression.CompressionMode]::Compress){"\n"}
                  $in.CopyTo($gz); $gz.Close(); $out.Close(); $in.Close();
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
