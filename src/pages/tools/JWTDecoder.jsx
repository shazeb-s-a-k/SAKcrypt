import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileLock2, Copy, AlertTriangle } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const JWTDecoder = () => {
  const [token, setToken] = useState('');
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [error, setError] = useState(null);

  const showToast = useToast();

  const handleDecode = (val) => {
    setToken(val);
    if (!val.trim()) {
      setHeader('');
      setPayload('');
      setError(null);
      return;
    }

    try {
      const decodedHeader = jwtDecode(val, { header: true });
      const decodedPayload = jwtDecode(val);
      
      setHeader(JSON.stringify(decodedHeader, null, 2));
      setPayload(JSON.stringify(decodedPayload, null, 2));
      setError(null);
    } catch (err) {
      setHeader('');
      setPayload('');
      setError('Invalid JWT Token format');
    }
  };

  const handleCopy = (text, name) => {
    navigator.clipboard.writeText(text);
    showToast(`${name} Copied!`, 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="JWT Decoder" subtitle="Decode and inspect JSON Web Tokens securely offline" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>ENCODED TOKEN</label>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Decoding happens purely in your browser.</span>
          </div>
          <textarea 
            className="textarea-glass"
            value={token}
            onChange={(e) => handleDecode(e.target.value)}
            placeholder="Paste your JWT token here (eyJhbGciOi...)"
            style={{ minHeight: '150px', background: 'rgba(0,0,0,0.5)', wordBreak: 'break-all' }}
          />
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginTop: '0.5rem' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: '#ef4444', fontWeight: 'bold' }}>HEADER (ALGORITHM & TOKEN TYPE)</label>
              <button className="icon-btn" onClick={() => handleCopy(header, 'Header')} disabled={!header}><Copy size={16}/></button>
            </div>
            <textarea 
              className="textarea-glass"
              value={header}
              readOnly
              placeholder="Header JSON"
              style={{ height: '300px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: '#8b5cf6', fontWeight: 'bold' }}>PAYLOAD (DATA)</label>
              <button className="icon-btn" onClick={() => handleCopy(payload, 'Payload')} disabled={!payload}><Copy size={16}/></button>
            </div>
            <textarea 
              className="textarea-glass"
              value={payload}
              readOnly
              placeholder="Payload JSON"
              style={{ height: '300px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)' }}
            />
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default JWTDecoder;
