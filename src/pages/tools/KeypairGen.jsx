import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Download, Copy, CheckCircle, ShieldAlert } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import * as jose from 'jose';

const KeypairGen = () => {
  const [algorithm, setAlgorithm] = useState('ES256');
  const [keyFormat, setKeyFormat] = useState('jwk'); // 'jwk' | 'pem' (WebCrypto allows exporting PKCS8/SPKI which we can format as PEM)
  const [loading, setLoading] = useState(false);
  
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  
  const [copiedPub, setCopiedPub] = useState(false);
  const [copiedPriv, setCopiedPriv] = useState(false);
  const showToast = useToast();

  const generateKeys = async () => {
    setLoading(true);
    setPublicKey('');
    setPrivateKey('');

    try {
      // Use jose library to generate keypair
      const { publicKey, privateKey } = await jose.generateKeyPair(algorithm, { extractable: true });

      if (keyFormat === 'jwk') {
        const pubJwk = await jose.exportJWK(publicKey);
        const privJwk = await jose.exportJWK(privateKey);
        setPublicKey(JSON.stringify(pubJwk, null, 2));
        setPrivateKey(JSON.stringify(privJwk, null, 2));
      } else {
        // PEM Format export (requires subtly formatting the exported SPKI/PKCS8 arrays)
        const exportPem = async (key, type) => {
          const format = type === 'public' ? 'spki' : 'pkcs8';
          const header = type === 'public' ? 'PUBLIC KEY' : 'PRIVATE KEY';
          const exported = await crypto.subtle.exportKey(format, key);
          const exportedAsString = String.fromCharCode.apply(null, new Uint8Array(exported));
          const exportedAsBase64 = btoa(exportedAsString);
          const pem = `-----BEGIN ${header}-----\\n${exportedAsBase64.replace(/(.{64})/g, '$1\\n')}\\n-----END ${header}-----`;
          return pem;
        };

        const pubPem = await exportPem(publicKey, 'public');
        const privPem = await exportPem(privateKey, 'private');
        setPublicKey(pubPem);
        setPrivateKey(privPem);
      }
      
      showToast('Keypair generated successfully!', 'success');
    } catch (err) {
      showToast(`Error generating keys: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'pub') {
      setCopiedPub(true);
      setTimeout(() => setCopiedPub(false), 2000);
    } else {
      setCopiedPriv(true);
      setTimeout(() => setCopiedPriv(false), 2000);
    }
    showToast(`${type === 'pub' ? 'Public' : 'Private'} key copied!`, 'success');
  };

  const downloadKey = (content, type) => {
    const ext = keyFormat === 'jwk' ? 'json' : 'pem';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_key_${algorithm}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container"
      style={{ maxWidth: '1000px' }}
    >
      <ToolHeader 
        title="Keypair Generator" 
        subtitle="Securely generate asymmetric Public/Private key pairs directly in your browser."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Controls */}
        <div className="glass-card" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Algorithm</label>
            <select 
              className="input-glass"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              style={{ width: '100%' }}
            >
              <optgroup label="Elliptic Curve (EC)">
                <option value="ES256">ES256 (P-256)</option>
                <option value="ES384">ES384 (P-384)</option>
                <option value="ES512">ES512 (P-521)</option>
              </optgroup>
              <optgroup label="EdDSA">
                <option value="EdDSA">EdDSA (Ed25519)</option>
              </optgroup>
              <optgroup label="RSA">
                <option value="RS256">RS256 (2048-bit)</option>
                <option value="PS256">PS256 (2048-bit)</option>
              </optgroup>
            </select>
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Export Format</label>
            <select 
              className="input-glass"
              value={keyFormat}
              onChange={(e) => setKeyFormat(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="jwk">JSON Web Key (JWK)</option>
              <option value="pem">PEM (X.509/PKCS8)</option>
            </select>
          </div>

          <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn-primary" onClick={generateKeys} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              <KeyRound size={18} className={loading ? 'spin' : ''} />
              {loading ? 'Generating...' : 'Generate Keypair'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <ShieldAlert size={24} />
          <span style={{ fontSize: '0.9rem' }}>Keys are generated securely in your browser using the Web Crypto API. Private keys never leave your device. Do not share your private key.</span>
        </div>

        {/* Outputs */}
        {(publicKey || privateKey) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            
            {/* Public Key */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>Public Key</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => copyToClipboard(publicKey, 'pub')} style={{ background: 'transparent', border: 'none', color: copiedPub ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer' }}>
                    {copiedPub ? <CheckCircle size={18} /> : <Copy size={18} />}
                  </button>
                  <button onClick={() => downloadKey(publicKey, 'public')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Download size={18} />
                  </button>
                </div>
              </div>
              <pre style={{ padding: '1rem', margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#e2e8f0', overflowX: 'auto', maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {publicKey}
              </pre>
            </div>

            {/* Private Key */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Private Key (SECRET)</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => copyToClipboard(privateKey, 'priv')} style={{ background: 'transparent', border: 'none', color: copiedPriv ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer' }}>
                    {copiedPriv ? <CheckCircle size={18} /> : <Copy size={18} />}
                  </button>
                  <button onClick={() => downloadKey(privateKey, 'private')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Download size={18} />
                  </button>
                </div>
              </div>
              <pre style={{ padding: '1rem', margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#e2e8f0', overflowX: 'auto', maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {privateKey}
              </pre>
            </div>

          </div>
        )}

      </div>
    </motion.div>
  );
};

export default KeypairGen;
