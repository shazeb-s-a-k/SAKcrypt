import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, Play, Lock } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const SSLChecker = () => {
  const [host, setHost] = useState('');
  const [certInfo, setCertInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const showToast = useToast();

  const handleCheck = async (e) => {
    if (e) e.preventDefault();
    let cleanHost = host.trim().replace(/^https?:\/\//, '').split('/')[0];
    if (!cleanHost) return;

    setHost(cleanHost);
    setLoading(true);
    setCertInfo(null);
    setError(null);

    try {
      const response = await fetch('/api/ssl-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: cleanHost })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve SSL info');
      }

      setCertInfo(data.certificate);
      showToast('SSL Info Retrieved', 'success');
    } catch (err) {
      setError(err.message);
      showToast('SSL Check Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  const getDaysRemaining = (validTo) => {
    const remaining = new Date(validTo).getTime() - new Date().getTime();
    return Math.floor(remaining / (1000 * 60 * 60 * 24));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="SSL Certificate Checker" subtitle="Inspect SSL/TLS certificates and expiration dates (Uses Vercel Backend API)" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <form onSubmit={handleCheck} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text"
            className="input-glass"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="example.com"
            style={{ flex: 1, fontSize: '1.2rem', padding: '1rem' }}
          />
          <button type="submit" className="btn-primary" disabled={loading || !host} style={{ padding: '0 2rem' }}>
            {loading ? <Loader2 className="spin" size={24} /> : <Play size={24} />} 
            <span style={{ marginLeft: '0.5rem' }}>Check SSL</span>
          </button>
        </form>

        {error && (
          <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--primary)', gap: '1rem' }}>
            <Loader2 className="spin" size={48} />
            <div>Handshaking with {host}...</div>
          </div>
        )}

        {!loading && certInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', padding: '1.5rem', borderRadius: '12px' }}>
              <Lock size={48} style={{ color: 'var(--success)' }} />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--success)' }}>Connection is Secure</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Certificate is valid and trusted.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 1rem 0' }}>ISSUED TO</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Common Name (CN):</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{certInfo.subject?.CN || 'N/A'}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Organization (O):</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{certInfo.subject?.O || 'N/A'}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 1rem 0' }}>ISSUED BY</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Common Name (CN):</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{certInfo.issuer?.CN || 'N/A'}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Organization (O):</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{certInfo.issuer?.O || 'N/A'}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 1rem 0' }}>VALIDITY</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Issued On:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatDate(certInfo.valid_from)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Expires On:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatDate(certInfo.valid_to)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Days Remaining:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: getDaysRemaining(certInfo.valid_to) < 30 ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold' }}>
                    {getDaysRemaining(certInfo.valid_to)} days
                  </span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 1rem 0' }}>FINGERPRINTS</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>SHA-256:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{certInfo.fingerprint}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Serial Number:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{certInfo.serialNumber}</span>
                </div>
              </div>

            </div>

          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default SSLChecker;
