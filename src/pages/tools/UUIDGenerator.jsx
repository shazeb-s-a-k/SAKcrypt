import React, { useState } from 'react';
import { Fingerprint, Copy, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { v4 as uuidv4 } from 'uuid';

const UUIDGenerator = () => {
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState(() => Array.from({ length: 5 }, () => uuidv4()));
  const showToast = useToast();

  const handleGenerate = () => {
    const num = Math.min(Math.max(parseInt(count) || 1, 1), 100);
    setUuids(Array.from({ length: num }, () => uuidv4()));
    setCount(num);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
    showToast('Copied all UUIDs to clipboard!', 'success');
  };

  const handleCopySingle = (uuid) => {
    navigator.clipboard.writeText(uuid);
    showToast('Copied UUID to clipboard!', 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '9s' }}
    >
      <ToolHeader title="UUID Generator" subtitle="Generate random v4 UUIDs instantly" />

      <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Quantity (1-100):</label>
            <input 
              type="number"
              className="input-glass"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min="1"
              max="100"
              style={{ maxWidth: '100px' }}
            />
          </div>
          
          <button className="btn-primary" onClick={handleGenerate}>
            <RefreshCw size={16} /> Generate
          </button>
          <button className="btn-secondary" onClick={handleCopyAll}>
            <Copy size={16} /> Copy All
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {uuids.map((id, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                {id}
              </span>
              <button className="btn-icon" onClick={() => handleCopySingle(id)} title="Copy">
                <Copy size={16} />
              </button>
            </div>
          ))}
        </div>

      </div>
    </motion.div>
  );
};

export default UUIDGenerator;
