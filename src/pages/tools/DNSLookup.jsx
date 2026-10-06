import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Search, Loader2 } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const DNSLookup = () => {
  const [domain, setDomain] = useState('');
  const [recordType, setRecordType] = useState('A');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const showToast = useToast();

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setResults(null);

    try {
      // Using Google DNS over HTTPS (DoH) API
      const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${recordType}`);
      const data = await response.json();
      
      if (data.Status !== 0) {
        showToast(`DNS Query Failed (Status: ${data.Status})`, 'error');
        setResults([]);
      } else {
        setResults(data.Answer || []);
        showToast('DNS Records Found', 'success');
      }
    } catch (err) {
      showToast('Network error occurred', 'error');
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
      <ToolHeader title="DNS Lookup" subtitle="Query DNS records (A, AAAA, MX, TXT, CNAME) for any domain via Google DoH" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1 }}>
            <input 
              type="text"
              className="input-glass"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              style={{ width: '100%', fontSize: '1.2rem', padding: '0.8rem 1rem' }}
            />
          </div>
          <select 
            className="input-glass" 
            value={recordType} 
            onChange={(e) => setRecordType(e.target.value)}
            style={{ width: '120px', fontSize: '1.1rem', cursor: 'pointer' }}
          >
            <option value="A">A</option>
            <option value="AAAA">AAAA</option>
            <option value="MX">MX</option>
            <option value="TXT">TXT</option>
            <option value="CNAME">CNAME</option>
            <option value="NS">NS</option>
          </select>
          <button type="submit" className="btn-primary" disabled={loading || !domain} style={{ padding: '0 2rem' }}>
            {loading ? <Loader2 className="spin" size={20} /> : <Search size={20} />}
          </button>
        </form>

        <div style={{ minHeight: '200px' }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--primary)' }}>
              <Loader2 className="spin" size={40} />
            </div>
          )}

          {!loading && results && results.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 3fr', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                  <div>Name</div>
                  <div>TTL</div>
                  <div>Data (IP / Target)</div>
                </div>
                {results.map((record, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 3fr', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border)', alignItems: 'center', wordBreak: 'break-all' }}>
                    <div style={{ color: '#fff' }}>{record.name}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{record.TTL}s</div>
                    <div style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{record.data}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {!loading && results && results.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
              <Globe size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No {recordType} records found for {domain}</p>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};

export default DNSLookup;
