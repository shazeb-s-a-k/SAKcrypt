import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Copy, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const JWTInspector = () => {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState('');
  
  const showToast = useToast();
  const showSupport = useSupport();

  // Helper to safely decode base64url to JSON object
  const decodeBase64Url = (str) => {
    try {
      // Replace non-url compatible chars with base64 standard chars
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      
      // Pad with '=' to make length a multiple of 4
      const pad = base64.length % 4;
      if (pad) {
        if (pad === 1) throw new Error('Invalid base64 string');
        base64 += new Array(5 - pad).join('=');
      }
      
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (err) {
      throw new Error('Invalid JWT format');
    }
  };

  useEffect(() => {
    if (!token) {
      setDecoded(null);
      setError('');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('A JWT must have exactly 3 parts separated by dots.');
      }

      const header = decodeBase64Url(parts[0]);
      const payload = decodeBase64Url(parts[1]);
      
      let status = 'valid';
      let expiryDate = null;
      
      if (payload.exp) {
        expiryDate = new Date(payload.exp * 1000);
        if (expiryDate < new Date()) {
          status = 'expired';
        }
      }

      setDecoded({
        header,
        payload,
        signature: parts[2],
        status,
        expiryDate
      });
      setError('');
    } catch (err) {
      setDecoded(null);
      setError(err.message || 'Invalid Token');
    }
  }, [token]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
    setTimeout(showSupport, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '8s' }}
    >
      <ToolHeader title="JWT Inspector" subtitle="Decode and inspect JSON Web Tokens securely offline" />

      <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* Input Section */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>ENCODED TOKEN</label>
            <textarea 
              className="textarea-glass"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your JWT here (e.g. eyJhbGci...)"
              style={{ minHeight: '180px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}
            />
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginTop: '0.8rem', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px' }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}
          </div>

          {/* Decoded Section */}
          {decoded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Status Banner */}
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '8px',
                background: decoded.status === 'valid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${decoded.status === 'valid' ? 'var(--success)' : 'var(--danger)'}`
              }}>
                {decoded.status === 'valid' ? <CheckCircle size={24} color="var(--success)" /> : <Clock size={24} color="var(--danger)" />}
                <div>
                  <h4 style={{ margin: '0 0 0.2rem 0', color: decoded.status === 'valid' ? 'var(--success)' : 'var(--danger)' }}>
                    {decoded.status === 'valid' ? 'Token is Valid' : 'Token Expired'}
                  </h4>
                  {decoded.expiryDate && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Expires: {decoded.expiryDate.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Decoded Data Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                
                {/* Header */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#fb923c' }}>HEADER (Algorithm & Type)</h4>
                    <button className="icon-btn" onClick={() => handleCopy(JSON.stringify(decoded.header, null, 2), 'Header')} title="Copy JSON">
                      <Copy size={16} />
                    </button>
                  </div>
                  <pre style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
                    {JSON.stringify(decoded.header, null, 2)}
                  </pre>
                </div>

                {/* Payload */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#c084fc' }}>PAYLOAD (Data)</h4>
                    <button className="icon-btn" onClick={() => handleCopy(JSON.stringify(decoded.payload, null, 2), 'Payload')} title="Copy JSON">
                      <Copy size={16} />
                    </button>
                  </div>
                  <pre style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
                    {JSON.stringify(decoded.payload, null, 2)}
                  </pre>
                </div>
              </div>
              
              {/* Signature Info */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8' }}>SIGNATURE</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                  {decoded.signature}
                </p>
                <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--warning)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertTriangle size={14} /> Note: Signature verification requires the secret key on a secure backend.
                </div>
              </div>

            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  );
};

export default JWTInspector;
