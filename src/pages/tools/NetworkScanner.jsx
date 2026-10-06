import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Search, MapPin, Server, ShieldAlert } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const NetworkScanner = () => {
  const [ip, setIp] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useToast();
  const showSupport = useSupport();

  const handleScan = async () => {
    if (!ip) return;
    setIsLoading(true);
    setResult(null);
    try {
      // Use ipapi.co which supports HTTPS and is free for small usage without API keys
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      
      if (data.error) {
        showToast(data.reason || 'Invalid IP or Rate Limited', 'error');
      } else {
        setResult(data);
        showToast('Trace complete!', 'success');
        setTimeout(showSupport, 1500);
      }
    } catch (err) {
      showToast('Network error while tracing', 'error');
    }
    setIsLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Network Scanner & IP Tracer" subtitle="Locate servers, trace IP geolocations, and identify ISPs globally" />

      <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input 
            type="text"
            className="input-glass"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="Enter an IPv4 or IPv6 address (e.g. 8.8.8.8)"
            style={{ flex: 1, fontSize: '1.1rem' }}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          />
          <button className="btn-primary" onClick={handleScan} disabled={isLoading || !ip}>
            <Search size={18} /> {isLoading ? 'Tracing...' : 'Trace IP'}
          </button>
        </div>

        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>IP ADDRESS</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{result.ip}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>LOCATION</span>
                <span style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} /> {result.city}, {result.region}, {result.country_name}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ISP / ORGANIZATION</span>
                <span style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Server size={16} /> {result.org || result.asn}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>COORDINATES</span>
                <span style={{ fontSize: '1.1rem' }}>Lat: {result.latitude}, Long: {result.longitude}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>TIMEZONE</span>
                <span style={{ fontSize: '1.1rem' }}>{result.timezone}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>POSTAL CODE</span>
                <span style={{ fontSize: '1.1rem' }}>{result.postal || 'Unknown'}</span>
              </div>

            </div>
          </motion.div>
        )}

        {!result && !isLoading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Network size={48} style={{ opacity: 0.5 }} />
            <p>Enter an IP address above to begin tracing its origin.</p>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default NetworkScanner;
