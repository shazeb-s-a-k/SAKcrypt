import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileLock, Unlock, Upload, Download, Key } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const FileEncryptor = () => {
  const [mode, setMode] = useState('encrypt'); // 'encrypt' or 'decrypt'
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState(null);

  const fileInputRef = useRef(null);
  const showToast = useToast();
  const showSupport = useSupport();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setProcessedFile(null);
  };

  const deriveKey = async (pwd, salt) => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(pwd), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
    );
  };

  const handleEncrypt = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    
    try {
      const buffer = await file.arrayBuffer();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, key, buffer
      );

      // Package: salt (16) + iv (12) + encrypted buffer
      const payload = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      payload.set(salt, 0);
      payload.set(iv, salt.length);
      payload.set(new Uint8Array(encrypted), salt.length + iv.length);

      const blob = new Blob([payload], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      setProcessedFile({ url, name: `${file.name}.enc` });
      showToast('File encrypted securely!', 'success');
      setTimeout(showSupport, 1500);
    } catch (e) {
      showToast('Encryption failed', 'error');
    }
    setIsProcessing(false);
  };

  const handleDecrypt = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    
    try {
      const payload = new Uint8Array(await file.arrayBuffer());
      const salt = payload.slice(0, 16);
      const iv = payload.slice(16, 28);
      const encrypted = payload.slice(28);

      const key = await deriveKey(password, salt);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv }, key, encrypted
      );

      // Remove .enc from name if present
      const originalName = file.name.endsWith('.enc') ? file.name.slice(0, -4) : `decrypted_${file.name}`;
      const blob = new Blob([decrypted]);
      const url = URL.createObjectURL(blob);
      setProcessedFile({ url, name: originalName });
      showToast('File decrypted successfully!', 'success');
      setTimeout(showSupport, 1500);
    } catch (e) {
      showToast('Decryption failed. Incorrect password or corrupt file.', 'error');
    }
    setIsProcessing(false);
  };

  const execute = () => mode === 'encrypt' ? handleEncrypt() : handleDecrypt();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="File Encryptor Vault" subtitle="Encrypt and decrypt any file locally using military-grade AES-256" />

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            className={`btn-primary ${mode === 'encrypt' ? '' : 'inactive'}`} 
            style={{ flex: 1, background: mode === 'encrypt' ? 'var(--primary)' : 'transparent', border: '1px solid var(--primary)' }}
            onClick={() => {setMode('encrypt'); setProcessedFile(null);}}
          >
            <FileLock size={18} /> Encrypt File
          </button>
          <button 
            className={`btn-primary ${mode === 'decrypt' ? '' : 'inactive'}`} 
            style={{ flex: 1, background: mode === 'decrypt' ? 'var(--accent)' : 'transparent', border: '1px solid var(--accent)' }}
            onClick={() => {setMode('decrypt'); setProcessedFile(null);}}
          >
            <Unlock size={18} /> Decrypt File
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div 
            style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: file ? 'rgba(255,255,255,0.05)' : 'transparent' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <div>{file ? <strong style={{color: 'var(--primary)'}}>{file.name}</strong> : `Select File to ${mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}`}</div>
          </div>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

          {file && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="input-glass"
                  placeholder="Enter secret password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
              </div>

              {!processedFile ? (
                <button className="btn-primary" onClick={execute} disabled={!password || isProcessing} style={{ background: mode === 'encrypt' ? 'var(--primary)' : 'var(--accent)' }}>
                  {isProcessing ? 'Processing...' : (mode === 'encrypt' ? 'Encrypt Now' : 'Decrypt Now')}
                </button>
              ) : (
                <a href={processedFile.url} download={processedFile.name} style={{ textDecoration: 'none' }}>
                  <button className="btn-primary" style={{ width: '100%', background: '#10b981', color: '#000' }}>
                    <Download size={18} /> Download {mode === 'encrypt' ? 'Encrypted' : 'Decrypted'} File
                  </button>
                </a>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  );
};

export default FileEncryptor;
