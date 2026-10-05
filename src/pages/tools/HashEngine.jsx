import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Copy, RefreshCw, FileText } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const HashEngine = () => {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState({
    'SHA-1': '',
    'SHA-256': '',
    'SHA-384': '',
    'SHA-512': ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const showToast = useToast();
  const showSupport = useSupport();

  // Helper to convert buffer to hex string
  const bufferToHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const generateHashes = async (text) => {
    if (!text) {
      setHashes({
        'SHA-1': '',
        'SHA-256': '',
        'SHA-384': '',
        'SHA-512': ''
      });
      return;
    }

    setIsProcessing(true);
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);

      const [sha1, sha256, sha384, sha512] = await Promise.all([
        crypto.subtle.digest('SHA-1', data),
        crypto.subtle.digest('SHA-256', data),
        crypto.subtle.digest('SHA-384', data),
        crypto.subtle.digest('SHA-512', data)
      ]);

      setHashes({
        'SHA-1': bufferToHex(sha1),
        'SHA-256': bufferToHex(sha256),
        'SHA-384': bufferToHex(sha384),
        'SHA-512': bufferToHex(sha512)
      });
    } catch (err) {
      console.error(err);
      showToast('Error generating hashes', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      generateHashes(input);
    }, 300); // Debounce to prevent lag on huge texts

    return () => clearTimeout(timer);
  }, [input]);

  const handleCopy = (hashValue, hashName) => {
    if (!hashValue) return;
    navigator.clipboard.writeText(hashValue);
    showToast(`${hashName} copied to clipboard!`, 'success');
    setTimeout(showSupport, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '9s' }}
    >
      <ToolHeader title="Hash Engine" subtitle="Instantly generate secure cryptographic hashes from text" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} /> INPUT TEXT
            </label>
            {isProcessing && <RefreshCw size={14} className="spin text-primary" />}
          </div>
          <textarea 
            className="textarea-glass"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste the text you want to hash..."
            style={{ minHeight: '150px', fontFamily: 'var(--font-mono)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(hashes).map(([name, value]) => (
            <div key={name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{name}</label>
                <button 
                  className="icon-btn" 
                  onClick={() => handleCopy(value, name)}
                  disabled={!value}
                  title={`Copy ${name}`}
                  style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', opacity: value ? 1 : 0.3 }}
                >
                  <Copy size={14} />
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={value} 
                  placeholder={input ? 'Calculating...' : 'Awaiting input...'}
                  className="input-glass"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    color: value ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.9rem',
                    background: 'rgba(0,0,0,0.2)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </motion.div>
  );
};

export default HashEngine;
