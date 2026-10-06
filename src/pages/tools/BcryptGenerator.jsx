import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Copy, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import bcrypt from 'bcryptjs';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const BcryptGenerator = () => {
  const [password, setPassword] = useState('');
  const [rounds, setRounds] = useState(10);
  const [hash, setHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);

  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState(null); // null, true, false

  const showToast = useToast();
  const showSupport = useSupport();

  const handleGenerate = () => {
    if (!password) return;
    setIsHashing(true);
    // Use timeout to allow UI to update to "Processing..." since bcrypt is sync here
    setTimeout(() => {
      try {
        const salt = bcrypt.genSaltSync(rounds);
        const generatedHash = bcrypt.hashSync(password, salt);
        setHash(generatedHash);
        showToast('Bcrypt hash generated!', 'success');
      } catch (err) {
        showToast('Error generating hash', 'error');
      }
      setIsHashing(false);
    }, 50);
  };

  const handleVerify = () => {
    if (!verifyPassword || !verifyHash) return;
    try {
      const match = bcrypt.compareSync(verifyPassword, verifyHash);
      setVerifyResult(match);
      if (match) {
        showToast('Password matches hash!', 'success');
        setTimeout(showSupport, 1000);
      } else {
        showToast('Password does NOT match', 'error');
      }
    } catch (err) {
      setVerifyResult(false);
      showToast('Invalid hash format', 'error');
    }
  };

  const handleCopy = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    showToast('Copied to clipboard!', 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Bcrypt Hash Generator" subtitle="Generate and verify secure bcrypt hashes locally" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* GENERATOR SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>1. Generate Hash</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>PASSWORD STRING</label>
              <input 
                type="text" 
                className="input-glass" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter string to hash..."
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ROUNDS (COST)</label>
              <input 
                type="number" 
                className="input-glass" 
                value={rounds}
                onChange={(e) => setRounds(Math.min(20, Math.max(4, Number(e.target.value))))}
                min="4" max="20"
                style={{ width: '100px' }}
              />
            </div>
          </div>

          <button className="btn-primary" onClick={handleGenerate} disabled={!password || isHashing} style={{ alignSelf: 'flex-start' }}>
            <Lock size={18} /> {isHashing ? 'Hashing...' : 'Generate Bcrypt Hash'}
          </button>

          {hash && (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: 'var(--secondary)' }}>{hash}</span>
              <button className="icon-btn" onClick={handleCopy}><Copy size={18} /></button>
            </div>
          )}
        </div>

        {/* VERIFIER SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>2. Verify Hash</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              className="input-glass" 
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.target.value)}
              placeholder="Paste bcrypt hash here..."
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <input 
              type="text" 
              className="input-glass" 
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              placeholder="Enter password to test against hash..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className="btn-primary" onClick={handleVerify} disabled={!verifyHash || !verifyPassword} style={{ background: 'transparent', border: '1px solid var(--border)' }}>
              <RefreshCw size={18} /> Verify Match
            </button>
            
            {verifyResult !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: verifyResult ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                {verifyResult ? <CheckCircle size={20} /> : <XCircle size={20} />}
                {verifyResult ? 'Match!' : 'No Match'}
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default BcryptGenerator;
