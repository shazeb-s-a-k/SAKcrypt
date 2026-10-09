import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Copy, Download, Upload, Shield, KeyRound, AlertTriangle, RefreshCw } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const AES256GCMEncryptor = () => {
  const [mode, setMode] = useState('encrypt'); // encrypt | decrypt
  const [inputText, setInputText] = useState('');
  const [password, setPassword] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = useToast();

  // Helper to derive a 256-bit key from a password using PBKDF2
  const deriveKey = async (passwordStr, salt) => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(passwordStr),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      [ "encrypt", "decrypt" ]
    );
  };

  const handleEncrypt = async () => {
    if (!inputText) return showToast('Please enter text to encrypt', 'error');
    if (!password) return showToast('Password is required', 'error');
    
    setIsProcessing(true);
    try {
      // Generate a random salt for key derivation
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      // Generate a random Initialization Vector (IV) for AES-GCM
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const key = await deriveKey(password, salt);
      const enc = new TextEncoder();
      
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(inputText)
      );
      
      // Combine salt + iv + ciphertext into one buffer
      const combined = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
      
      // Convert to Base64
      const base64Str = btoa(String.fromCharCode.apply(null, combined));
      setOutputText(base64Str);
      showToast('Encrypted successfully!', 'success');
    } catch (e) {
      showToast('Encryption failed', 'error');
    }
    setIsProcessing(false);
  };

  const handleDecrypt = async () => {
    if (!inputText) return showToast('Please enter cipher text', 'error');
    if (!password) return showToast('Password is required', 'error');
    
    setIsProcessing(true);
    try {
      // Decode Base64
      const binaryStr = atob(inputText.trim());
      const combined = new Uint8Array(binaryStr.length);
      for(let i = 0; i < binaryStr.length; i++) {
        combined[i] = binaryStr.charCodeAt(i);
      }
      
      // Extract salt, iv, and ciphertext
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const ciphertext = combined.slice(28);
      
      const key = await deriveKey(password, salt);
      
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
      );
      
      const dec = new TextDecoder();
      setOutputText(dec.decode(decryptedBuffer));
      showToast('Decrypted successfully!', 'success');
    } catch (e) {
      showToast('Decryption failed. Incorrect password or corrupted data.', 'error');
    }
    setIsProcessing(false);
  };

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let pwd = "";
    const randomVals = new Uint32Array(24);
    window.crypto.getRandomValues(randomVals);
    for (let i = 0; i < 24; i++) {
      pwd += chars[randomVals[i] % chars.length];
    }
    setPassword(pwd);
    showToast('Generated secure 24-character password', 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '10s' }}
    >
      <ToolHeader 
        title="AES-256-GCM Encryptor" 
        subtitle="Military-grade authenticated encryption using Web Crypto API. Everything stays in your browser." 
      />

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Mode Selector */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '12px', gap: '0.5rem' }}>
          <button 
            onClick={() => { setMode('encrypt'); setInputText(''); setOutputText(''); }}
            style={{ 
              flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
              background: mode === 'encrypt' ? 'var(--accent)' : 'transparent',
              color: mode === 'encrypt' ? '#fff' : 'var(--text-muted)'
            }}
          >
            <Lock size={18} /> Encrypt
          </button>
          <button 
            onClick={() => { setMode('decrypt'); setInputText(''); setOutputText(''); }}
            style={{ 
              flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
              background: mode === 'decrypt' ? 'var(--success)' : 'transparent',
              color: mode === 'decrypt' ? '#fff' : 'var(--text-muted)'
            }}
          >
            <Unlock size={18} /> Decrypt
          </button>
        </div>

        {/* Password */}
        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
            <span><KeyRound size={14} style={{ display: 'inline', marginRight: '4px' }}/> ENCRYPTION PASSWORD</span>
            {mode === 'encrypt' && (
              <button onClick={generateStrongPassword} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem' }}>Generate Strong</button>
            )}
          </label>
          <input 
            type="text" 
            className="input-glass" 
            placeholder="Enter a very strong password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
          />
        </div>

        {/* Input/Output Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {mode === 'encrypt' ? 'PLAIN TEXT' : 'CIPHER TEXT (Base64)'}
            </label>
            <textarea 
              className="textarea-glass"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode === 'encrypt' ? 'Enter secret message...' : 'Enter base64 ciphertext...'}
              style={{ minHeight: '200px', flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>{mode === 'encrypt' ? 'CIPHER TEXT (Base64)' : 'DECRYPTED PLAIN TEXT'}</span>
              {outputText && (
                <button onClick={() => { navigator.clipboard.writeText(outputText); showToast('Copied!', 'success'); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Copy size={12}/> Copy
                </button>
              )}
            </label>
            <textarea 
              className="textarea-glass"
              value={outputText}
              readOnly
              style={{ minHeight: '200px', flex: 1, color: mode === 'encrypt' ? '#10b981' : '#fff', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)' }}
            />
          </div>

        </div>

        {/* Action Button */}
        <button 
          className="btn-primary" 
          onClick={mode === 'encrypt' ? handleEncrypt : handleDecrypt}
          disabled={isProcessing}
          style={{ width: '100%', padding: '1rem', justifyContent: 'center', fontSize: '1.1rem', background: mode === 'encrypt' ? 'var(--accent)' : 'var(--success)' }}
        >
          {isProcessing ? <RefreshCw className="spin" size={20} /> : (mode === 'encrypt' ? <Lock size={20} /> : <Unlock size={20} />)}
          {isProcessing ? 'Processing...' : (mode === 'encrypt' ? 'Encrypt Text' : 'Decrypt Text')}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', justifyContent: 'center', marginTop: '-0.5rem' }}>
          <Shield size={14} /> Uses PBKDF2 (100k iterations) + AES-256-GCM
        </div>

      </div>
    </motion.div>
  );
};

export default AES256GCMEncryptor;
