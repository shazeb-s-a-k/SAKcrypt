import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Loader2, Play } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const COMMON_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 993, 995, 3306, 5432, 8080];

const PortScanner = () => {
  const [host, setHost] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const showToast = useToast();

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!host) return;

    setLoading(true);
    setResults([]);
    setError(null);

    try {
      const response = await fetch('/api/port-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, ports: COMMON_PORTS })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan ports');
      }

      setResults(data.results.sort((a, b) => a.port - b.port));
      showToast('Scan Completed', 'success');
    } catch (err) {
      setError(err.message);
      showToast('Scan Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Port Scanner" subtitle="Scan domains or IPs for common open ports (Uses Vercel Backend API)" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <form onSubmit={handleScan} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text"
            className="input-glass"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="example.com or 192.168.1.1"
            style={{ flex: 1, fontSize: '1.2rem', padding: '1rem' }}
          />
          <button type="submit" className="btn-primary" disabled={loading || !host} style={{ padding: '0 2rem' }}>
            {loading ? <Loader2 className="spin" size={24} /> : <Play size={24} />} 
            <span style={{ marginLeft: '0.5rem' }}>Scan</span>
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
            <div>Scanning ports on {host}...</div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {results.map((res, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem', 
                  background: 'rgba(0,0,0,0.2)', 
                  borderRadius: '8px', 
                  border: `1px solid ${res.status === 'open' ? 'var(--success)' : 'var(--border)'}` 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Network size={16} style={{ color: res.status === 'open' ? 'var(--success)' : 'var(--text-muted)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>Port {res.port}</span>
                  </div>
                  <span style={{ 
                    color: res.status === 'open' ? 'var(--success)' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    padding: '0.2rem 0.5rem',
                    background: res.status === 'open' ? 'rgba(16,185,129,0.1)' : 'transparent',
                    borderRadius: '4px'
                  }}>
                    {res.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default PortScanner;
