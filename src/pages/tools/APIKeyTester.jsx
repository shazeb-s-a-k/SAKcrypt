import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, CheckCircle, XCircle, RefreshCw, Server, AlertTriangle } from 'lucide-react';
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
  const [apiKey, setApiKey] = useState('');
  
  // Custom Fields
  const [customUrl, setCustomUrl] = useState('');
  const [customHeader, setCustomHeader] = useState('Authorization');
  const [customPrefix, setCustomPrefix] = useState('Bearer ');

  const [status, setStatus] = useState(null); // 'loading', 'success', 'error', null
  const [responseMsg, setResponseMsg] = useState('');
  
  const showToast = useToast();
  const showSupport = useSupport();

  const handleTest = async () => {
    if (!apiKey) {
      showToast('Please enter an API Key', 'error');
      return;
    }
    
    if (provider === PROVIDERS.CUSTOM && !customUrl) {
      showToast('Please enter a custom URL', 'error');
      return;
    }

    setStatus('loading');
    setResponseMsg('');

    try {
      let response;

      if (provider === PROVIDERS.OPENAI) {
        response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
      } 
      else if (provider === PROVIDERS.GOOGLE) {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
          method: 'GET'
        });
      }
      else if (provider === PROVIDERS.NVIDIA) {
        response = await fetch('https://integrate.api.nvidia.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
      }
      else if (provider === PROVIDERS.CUSTOM) {
        const headers = {};
        if (customHeader) {
          headers[customHeader] = `${customPrefix}${apiKey}`;
        }
        response = await fetch(customUrl, {
          method: 'GET',
          headers: Object.keys(headers).length > 0 ? headers : undefined
        });
      }

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setResponseMsg(`Key is valid! Successfully connected to ${provider}.`);
        setTimeout(showSupport, 1500);
      } else {
        setStatus('error');
        setResponseMsg(data.error?.message || data.message || `Error ${response.status}: Invalid key or unauthorized access.`);
      }
    } catch (err) {
      setStatus('error');
      setResponseMsg(err.message === 'Failed to fetch' ? 'Network error or CORS policy blocked the request.' : err.message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '9s' }}
    >
      <ToolHeader title="API Key Tester" subtitle="Verify and validate your provider API keys securely" />

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Provider Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>PROVIDER</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
            {Object.values(PROVIDERS).map(prov => (
              <button
                key={prov}
                className={`btn-primary`}
                onClick={() => { setProvider(prov); setStatus(null); setResponseMsg(''); }}
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
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ENDPOINT URL</label>
              <input 
                type="text" 
                className="input-glass" 
                placeholder="https://api.example.com/v1/models" 
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>AUTH HEADER</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="Authorization" 
                  value={customHeader}
                  onChange={(e) => setCustomHeader(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>PREFIX</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="Bearer " 
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                />
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>* Note: Some custom APIs might block browser requests (CORS).</span>
          </motion.div>
        )}

        {/* API Key Input */}
        <div style={{ marginBottom: '1.5rem' }}>
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

        {/* Action Button */}
        <button 
          className="btn-primary" 
          onClick={handleTest}
          disabled={status === 'loading'}
          style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', fontSize: '1rem' }}
        >
          {status === 'loading' ? (
            <><RefreshCw className="icon-sm spin" /> Testing Connection...</>
          ) : (
            <><Server className="icon-sm" /> Test API Key</>
          )}
        </button>

        {/* Results Area */}
        {status && status !== 'loading' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              marginTop: '1.5rem',
              padding: '1.2rem',
              borderRadius: '8px',
              background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${status === 'success' ? 'var(--success)' : 'var(--danger)'}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}
          >
            <div style={{ marginTop: '0.2rem' }}>
              {status === 'success' ? (
                <CheckCircle size={24} style={{ color: 'var(--success)' }} />
              ) : (
                <XCircle size={24} style={{ color: 'var(--danger)' }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.2rem 0', color: status === 'success' ? 'var(--success)' : 'var(--danger)' }}>
                {status === 'success' ? 'Connection Successful' : 'Connection Failed'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc', lineHeight: 1.5 }}>
                {responseMsg}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default APIKeyTester;
