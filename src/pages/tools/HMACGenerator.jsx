import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Copy } from 'lucide-react';
import CryptoJS from 'crypto-js';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const HMACGenerator = () => {
  const [message, setMessage] = useState('Hello World');
  const [secret, setSecret] = useState('secret-key');
  const [algorithm, setAlgorithm] = useState('SHA256');
  const [outputHex, setOutputHex] = useState('');
  const [outputBase64, setOutputBase64] = useState('');

  const showToast = useToast();
  const showSupport = useSupport();

  const generateHMAC = () => {
    if (!message || !secret) {
      setOutputHex('');
      setOutputBase64('');
      return;
    }

    try {
      let hmac;
      switch (algorithm) {
        case 'SHA256': hmac = CryptoJS.HmacSHA256(message, secret); break;
        case 'SHA512': hmac = CryptoJS.HmacSHA512(message, secret); break;
        case 'SHA1': hmac = CryptoJS.HmacSHA1(message, secret); break;
        case 'MD5': hmac = CryptoJS.HmacMD5(message, secret); break;
        default: hmac = CryptoJS.HmacSHA256(message, secret);
      }
      
      setOutputHex(hmac.toString(CryptoJS.enc.Hex));
      setOutputBase64(hmac.toString(CryptoJS.enc.Base64));
    } catch (err) {
      setOutputHex('Error generating HMAC');
      setOutputBase64('');
    }
  };

  useEffect(() => {
    generateHMAC();
    // eslint-disable-next-line
  }, [message, secret, algorithm]);

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
    setTimeout(showSupport, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="HMAC Generator" subtitle="Generate Hash-based Message Authentication Codes instantly" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>MESSAGE</label>
            <textarea 
              className="textarea-glass"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message to sign..."
              style={{ minHeight: '120px', fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 2, minWidth: '200px' }}>
              <label style={{ color: 'var(--text-muted)' }}>SECRET KEY</label>
              <input 
                type="text" 
                className="input-glass"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter secret key..."
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
              <label style={{ color: 'var(--text-muted)' }}>ALGORITHM</label>
              <select 
                className="input-glass"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="SHA256">HMAC-SHA256</option>
                <option value="SHA512">HMAC-SHA512</option>
                <option value="SHA1">HMAC-SHA1</option>
                <option value="MD5">HMAC-MD5</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>HMAC (HEX)</label>
              <button className="icon-btn" onClick={() => handleCopy(outputHex)} title="Copy Hex">
                <Copy size={16} />
              </button>
            </div>
            <div style={{ wordBreak: 'break-all', fontFamily: 'var(--font-mono)', color: 'var(--text)', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
              {outputHex || '...'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>HMAC (BASE64)</label>
              <button className="icon-btn" onClick={() => handleCopy(outputBase64)} title="Copy Base64">
                <Copy size={16} />
              </button>
            </div>
            <div style={{ wordBreak: 'break-all', fontFamily: 'var(--font-mono)', color: 'var(--text)', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
              {outputBase64 || '...'}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default HMACGenerator;
