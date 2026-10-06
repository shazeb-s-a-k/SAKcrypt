import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Copy } from 'lucide-react';
import * as IpSubnetCalculator from 'ip-subnet-calculator';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const IPSubnetCalculator = () => {
  const [ip, setIp] = useState('192.168.1.1');
  const [cidr, setCidr] = useState(24);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const showToast = useToast();
  const showSupport = useSupport();

  const calculate = () => {
    try {
      if (!ip) return;
      const res = IpSubnetCalculator.calculateSubnetMask(ip, cidr);
      if (res) {
        setResult(res);
        setError(null);
      } else {
        setError('Invalid IP Address');
        setResult(null);
      }
    } catch (err) {
      setError('Invalid input');
      setResult(null);
    }
  };

  useEffect(() => {
    calculate();
    // eslint-disable-next-line
  }, [ip, cidr]);

  const handleCopy = (text) => {
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
      <ToolHeader title="IP Subnet Calculator" subtitle="Calculate IPv4 subnets, CIDR notation, masks, and usable host ranges" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 2, minWidth: '200px' }}>
            <label style={{ color: 'var(--text-muted)' }}>IP ADDRESS</label>
            <input 
              type="text" 
              className="input-glass"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g. 192.168.1.1"
              style={{ fontSize: '1.2rem', padding: '1rem', fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '100px' }}>
            <label style={{ color: 'var(--text-muted)' }}>CIDR (/{cidr})</label>
            <select 
              className="input-glass"
              value={cidr}
              onChange={(e) => setCidr(parseInt(e.target.value))}
              style={{ fontSize: '1.2rem', padding: '1rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
            >
              {[...Array(32)].map((_, i) => (
                <option key={i+1} value={32-i}>/{32-i}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>NETWORK ADDRESS</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--primary)' }}>{result.ipLowStr}</div>
              </div>
              <button className="icon-btn" onClick={() => handleCopy(result.ipLowStr)}><Copy size={16} /></button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>BROADCAST ADDRESS</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--primary)' }}>{result.ipHighStr}</div>
              </div>
              <button className="icon-btn" onClick={() => handleCopy(result.ipHighStr)}><Copy size={16} /></button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>SUBNET MASK</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--primary)' }}>{result.prefixMaskStr}</div>
              </div>
              <button className="icon-btn" onClick={() => handleCopy(result.prefixMaskStr)}><Copy size={16} /></button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>TOTAL HOSTS (USABLE)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--success)' }}>
                  {result.prefixSize === 32 || result.prefixSize === 31 ? 0 : Math.pow(2, 32 - result.prefixSize) - 2}
                </div>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--success)', fontSize: '0.8rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>USABLE HOST RANGE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: '#fff' }}>
                  {result.prefixSize === 32 || result.prefixSize === 31 
                    ? 'N/A' 
                    : `${IpSubnetCalculator.calculateSubnetMask(result.ipLowStr, 32).ipLowStr.replace(/\d+$/, (m) => parseInt(m)+1)} - ${result.ipHighStr.replace(/\d+$/, (m) => parseInt(m)-1)}`
                  }
                </div>
              </div>
            </div>

          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default IPSubnetCalculator;
