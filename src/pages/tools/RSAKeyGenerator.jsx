import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LockKeyhole, Loader2, Copy, Download } from 'lucide-react';
import forge from 'node-forge';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const RSAKeyGenerator = () => {
  const [keySize, setKeySize] = useState(2048);
  const [keys, setKeys] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = useToast();
  const showSupport = useSupport();

  const generateKeys = () => {
    setLoading(true);
    setKeys(null);
    
    // We use setTimeout to allow UI to update to loading state because key generation is CPU intensive
    setTimeout(() => {
      try {
        const keypair = forge.pki.rsa.generateKeyPair({ bits: keySize, e: 0x10001 });
        const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
        const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
        
        setKeys({ publicKey, privateKey });
        showToast('RSA Keys Generated', 'success');
      } catch (err) {
        showToast('Failed to generate keys', 'error');
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    showToast(`${type} copied!`, 'success');
    setTimeout(showSupport, 1000);
  };

  const handleDownload = (text, type) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rsa_${type}_${keySize}bit.pem`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloading ${type}`, 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="RSA Key Generator" subtitle="Generate secure RSA public and private key pairs entirely in your browser" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ color: 'var(--text-muted)' }}>KEY SIZE (BITS):</label>
            <select 
              className="input-glass"
              value={keySize}
              onChange={(e) => setKeySize(parseInt(e.target.value))}
              style={{ width: '150px', cursor: 'pointer' }}
            >
              <option value={1024}>1024</option>
              <option value={2048}>2048 (Recommended)</option>
              <option value={4096}>4096 (Very Slow)</option>
            </select>
          </div>
          <button className="btn-primary" onClick={generateKeys} disabled={loading} style={{ padding: '1rem 3rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {loading ? <Loader2 className="spin" size={24} /> : <LockKeyhole size={24} />} 
            <span style={{ marginLeft: '0.5rem', fontSize: '1.1rem' }}>{loading ? 'Generating...' : 'Generate Key Pair'}</span>
          </button>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Keys are generated securely on your device. They are never sent to a server.</p>
        </div>

        {keys && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--success)', fontWeight: 'bold' }}>PUBLIC KEY</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="icon-btn" onClick={() => handleCopy(keys.publicKey, 'Public Key')} title="Copy">
                    <Copy size={16} />
                  </button>
                  <button className="icon-btn" onClick={() => handleDownload(keys.publicKey, 'public')} title="Download">
                    <Download size={16} />
                  </button>
                </div>
              </div>
              <textarea 
                className="textarea-glass"
                value={keys.publicKey}
                readOnly
                style={{ height: '300px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--danger)', fontWeight: 'bold' }}>PRIVATE KEY</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="icon-btn" onClick={() => handleCopy(keys.privateKey, 'Private Key')} title="Copy">
                    <Copy size={16} />
                  </button>
                  <button className="icon-btn" onClick={() => handleDownload(keys.privateKey, 'private')} title="Download">
                    <Download size={16} />
                  </button>
                </div>
              </div>
              <textarea 
                className="textarea-glass"
                value={keys.privateKey}
                readOnly
                style={{ height: '300px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'rgba(239,68,68,0.05)' }}
              />
            </motion.div>

          </div>
        )}

      </div>
    </motion.div>
  );
};

export default RSAKeyGenerator;
