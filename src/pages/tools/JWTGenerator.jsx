import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Copy } from 'lucide-react';
import * as jose from 'jose';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const JWTGenerator = () => {
  const [payload, setPayload] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "admin": true\n}');
  const [secret, setSecret] = useState('my-super-secret-key');
  const [output, setOutput] = useState('');
  
  const showToast = useToast();
  const showSupport = useSupport();

  const handleGenerate = async () => {
    if (!payload || !secret) return;
    try {
      const parsedPayload = JSON.parse(payload);
      const secretBytes = new TextEncoder().encode(secret);
      
      const jwt = await new jose.SignJWT(parsedPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secretBytes);
        
      setOutput(jwt);
      showToast('JWT Generated!', 'success');
      setTimeout(showSupport, 1000);
    } catch (err) {
      showToast('Invalid JSON Payload', 'error');
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast('Copied to clipboard!', 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="JWT Generator" subtitle="Create and sign custom JSON Web Tokens instantly (HS256)" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ color: 'var(--text-muted)' }}>PAYLOAD (JSON)</label>
          <textarea 
            className="textarea-glass"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            style={{ minHeight: '200px', fontFamily: 'var(--font-mono)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ color: 'var(--text-muted)' }}>SECRET KEY</label>
          <input 
            type="text" 
            className="input-glass"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>

        <button className="btn-primary" onClick={handleGenerate} disabled={!payload || !secret} style={{ alignSelf: 'center', padding: '0.8rem 3rem' }}>
          <Settings size={18} /> Generate Token
        </button>

        {output && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>GENERATED JWT (HS256)</label>
              <button className="icon-btn" onClick={handleCopy} title="Copy Output">
                <Copy size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={output}
              readOnly
              style={{ minHeight: '120px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', color: 'var(--primary)', wordBreak: 'break-all' }}
            />
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default JWTGenerator;
