import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Binary, Copy, Trash2, Repeat } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const NumberBaseConverter = () => {
  const [value, setValue] = useState('');
  const [base, setBase] = useState(10);
  const showToast = useToast();
  const showSupport = useSupport();

  // Convert to BigInt safely or fallback to Number for simple logic
  const getDecimal = (val, fromBase) => {
    if (!val) return null;
    try {
      const parsed = parseInt(val, fromBase);
      if (isNaN(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const handleInputChange = (e) => {
    setValue(e.target.value.replace(/\s/g, ''));
  };

  const dec = getDecimal(value, base);

  const getConverted = (targetBase) => {
    if (dec === null) return '';
    return dec.toString(targetBase).toUpperCase();
  };

  const handleCopy = (content) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    showToast('Copied to clipboard!', 'success');
    setTimeout(showSupport, 1000);
  };

  const formats = [
    { name: 'Binary (Base 2)', target: 2 },
    { name: 'Octal (Base 8)', target: 8 },
    { name: 'Decimal (Base 10)', target: 10 },
    { name: 'Hexadecimal (Base 16)', target: 16 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Base Converter" subtitle="Instantly convert numbers between Binary, Octal, Decimal, and Hex" />

      <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>INPUT VALUE</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select 
              className="input-glass" 
              style={{ width: '150px' }}
              value={base}
              onChange={(e) => {setBase(Number(e.target.value)); setValue('');}}
            >
              <option value={2} style={{color: '#000'}}>Binary</option>
              <option value={8} style={{color: '#000'}}>Octal</option>
              <option value={10} style={{color: '#000'}}>Decimal</option>
              <option value={16} style={{color: '#000'}}>Hex</option>
            </select>
            <input 
              type="text" 
              className="input-glass" 
              value={value}
              onChange={handleInputChange}
              placeholder={`Enter Base ${base} value...`}
              style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
            />
            <button className="icon-btn" onClick={() => setValue('')}><Trash2 size={18} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {formats.map(format => (
            <div key={format.target} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{format.name}</span>
                <button className="icon-btn" onClick={() => handleCopy(getConverted(format.target))} disabled={!value || dec === null}>
                  <Copy size={14} />
                </button>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: dec !== null ? 'var(--primary)' : 'var(--text-muted)' }}>
                {value ? (dec !== null ? getConverted(format.target) : 'Invalid Input') : '-'}
              </div>
            </div>
          ))}
        </div>

      </div>
    </motion.div>
  );
};

export default NumberBaseConverter;
