import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, CheckCircle, XCircle, RefreshCw, Server, AlertTriangle, UploadCloud, FileText, Copy, Download, Play } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const PROVIDERS = {
  OPENAI: 'OpenAI',
  GOOGLE: 'Google AI (Gemini)',
  NVIDIA: 'Nvidia NIM',
  CUSTOM: 'Custom Endpoint'
};

const APIKeyTester = () => {
  const [provider, setProvider] = useState(PROVIDERS.OPENAI);
  const [mode, setMode] = useState('single'); // 'single' or 'batch'
  
  // Single Mode State
  const [apiKey, setApiKey] = useState('');
  const [singleStatus, setSingleStatus] = useState(null);
  const [singleMsg, setSingleMsg] = useState('');
  
  // Batch Mode State
  const [batchKeys, setBatchKeys] = useState([]);
  const [isTestingBatch, setIsTestingBatch] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [batchResults, setBatchResults] = useState([]); // { key, status, msg }
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

  // Core test function for a single key
  const testKey = async (keyToTest) => {
    try {
      let response;
      if (provider === PROVIDERS.OPENAI) {
        response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${keyToTest}` }
        });
      } else if (provider === PROVIDERS.GOOGLE) {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyToTest}`, {
          method: 'GET'
        });
      } else if (provider === PROVIDERS.NVIDIA) {
        response = await fetch('https://integrate.api.nvidia.com/v1/models', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${keyToTest}` }
        });
      } else if (provider === PROVIDERS.CUSTOM) {
        const headers = {};
        if (customHeader) {
          headers[customHeader] = `${customPrefix}${keyToTest}`;
        }
        response = await fetch(customUrl, {
          method: 'GET',
          headers: Object.keys(headers).length > 0 ? headers : undefined
        });
      }

      const data = await response.json();
      if (response.ok) {
        return { success: true, msg: `Valid key for ${provider}` };
      } else {
        return { success: false, msg: data.error?.message || data.message || `Error ${response.status}` };
      }
    } catch (err) {
      return { success: false, msg: err.message === 'Failed to fetch' ? 'Network/CORS error' : err.message };
    }
  };

  const handleSingleTest = async () => {
    if (!apiKey.trim()) { showToast('Please enter an API Key', 'error'); return; }
    if (provider === PROVIDERS.CUSTOM && !customUrl) { showToast('Please enter a custom URL', 'error'); return; }
    
    setSingleStatus('loading');
    setSingleMsg('');
    
    const result = await testKey(apiKey.trim());
    if (result.success) {
      setSingleStatus('success');
      setSingleMsg(result.msg);
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
    
    // Robust extraction: matches anything that looks like an API key token
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
        await new Promise(r => setTimeout(r, 10)); // Yield
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

    // Yield to let React render the "X Keys Loaded" text before locking into the heavy loop
    await new Promise(r => setTimeout(r, 100));

    // Process concurrently with a concurrency limit to avoid browser stalling
    const concurrency = 20;
    let localResults = [];
    
    for (let i = 0; i < uniqueKeys.length; i += concurrency) {
      const chunk = uniqueKeys.slice(i, i + concurrency);
      const chunkPromises = chunk.map(async (key) => {
        const res = await testKey(key);
        return { key, status: res.success ? 'success' : 'error', msg: res.msg };
      });
      
      const completedChunk = await Promise.all(chunkPromises);
      localResults = localResults.concat(completedChunk);
      
      // Update UI once per chunk to prevent React array-copying death spiral on 800k keys
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
      style={{ animationDuration: '9s', maxWidth: '1000px' }}
    >
      <ToolHeader title="API Key Tester" subtitle="Verify single or massive batches of API keys instantly" />

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Provider Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>TARGET PROVIDER</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.8rem' }}>
            {Object.values(PROVIDERS).map(prov => (
              <button
                key={prov}
                className={`btn-primary`}
                onClick={() => { setProvider(prov); setSingleStatus(null); setBatchResults([]); }}
                style={{ 
                  background: provider === prov ? 'rgba(94, 106, 210, 0.2)' : 'transparent',
                  border: `1px solid ${provider === prov ? 'var(--accent)' : 'var(--border)'}`,
                  color: provider === prov ? '#fff' : 'var(--text-muted)'
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
            style={{ background: 'transparent', border: 'none', color: mode === 'single' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1.1rem', fontWeight: mode === 'single' ? 'bold' : 'normal', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: mode === 'single' ? '2px solid var(--primary)' : '2px solid transparent' }}
          >
            Single Key Mode
          </button>
          <button 
            onClick={() => setMode('batch')}
            style={{ background: 'transparent', border: 'none', color: mode === 'batch' ? '#ec4899' : 'var(--text-muted)', fontSize: '1.1rem', fontWeight: mode === 'batch' ? 'bold' : 'normal', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: mode === 'batch' ? '2px solid #ec4899' : '2px solid transparent' }}
          >
            Mass Batch Mode (.txt)
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'single' ? (
            <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>API KEY</label>
                <input type="password" className="input-glass" placeholder={`Enter your ${provider} key...`} value={apiKey} onChange={(e) => setApiKey(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
              </div>
              <button className="btn-primary" onClick={handleSingleTest} disabled={singleStatus === 'loading'} style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', fontSize: '1rem' }}>
                {singleStatus === 'loading' ? <><RefreshCw className="icon-sm spin" /> Testing Connection...</> : <><Server className="icon-sm" /> Test API Key</>}
              </button>
              {singleStatus && singleStatus !== 'loading' && (
                <div style={{ padding: '1.2rem', borderRadius: '8px', background: singleStatus === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${singleStatus === 'success' ? 'var(--success)' : 'var(--danger)'}`, display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {singleStatus === 'success' ? <CheckCircle size={24} style={{ color: 'var(--success)' }} /> : <XCircle size={24} style={{ color: 'var(--danger)' }} />}
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem 0', color: singleStatus === 'success' ? 'var(--success)' : 'var(--danger)' }}>{singleStatus === 'success' ? 'Connection Successful' : 'Connection Failed'}</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>{singleMsg}</p>
                  </div>
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
                    placeholder={`sk-...\nAIza...\nPaste raw ${provider} keys here. Auto-extraction will ignore spaces/garbage.`}
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
                          {extractionProgress > 0 && extractionProgress < 100 ? `Extracting... ${extractionProgress}%` : 'Testing...'}
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
                          <CheckCircle size={18} /> Working ({workingKeys.length})
                        </div>
                        <button className="icon-btn" onClick={() => exportKeys(workingKeys, 'working')} title="Export Working Keys" disabled={workingKeys.length === 0} style={{ color: 'var(--success)' }}>
                          <Download size={16} />
                        </button>
                      </div>
                      <div style={{ padding: '1rem', height: '300px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {workingKeys.slice(0, 100).map((r, i) => (
                          <div key={i} style={{ color: 'var(--success)', padding: '0.5rem', borderBottom: '1px solid rgba(16,185,129,0.1)', wordBreak: 'break-all' }}>
                            {r.key.substring(0, 8)}...{r.key.substring(r.key.length - 8)}
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
                          <XCircle size={18} /> Dead ({deadKeys.length})
                        </div>
                        <button className="icon-btn" onClick={() => exportKeys(deadKeys, 'dead')} title="Export Dead Keys" disabled={deadKeys.length === 0} style={{ color: 'var(--danger)' }}>
                          <Download size={16} />
                        </button>
                      </div>
                      <div style={{ padding: '1rem', height: '300px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {deadKeys.slice(0, 100).map((r, i) => (
                          <div key={i} style={{ padding: '0.5rem', borderBottom: '1px solid rgba(239,68,68,0.1)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
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
