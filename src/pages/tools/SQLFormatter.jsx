import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Copy, Trash2, AlignLeft } from 'lucide-react';
import { format } from 'sql-formatter';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const SQLFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  
  const showToast = useToast();
  const showSupport = useSupport();

  const handleFormat = () => {
    if (!input) return;
    try {
      const formatted = format(input, {
        language: 'sql',
        keywordCase: 'upper',
        linesBetweenQueries: 2
      });
      setOutput(formatted);
      setError(null);
      showToast('SQL Formatted!', 'success');
      setTimeout(showSupport, 1500);
    } catch (err) {
      setError(err.message);
      showToast('Invalid SQL Syntax', 'error');
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast('Copied to clipboard!', 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="SQL Formatter" subtitle="Beautify and format complex SQL queries for maximum readability" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>RAW SQL</label>
              <button className="icon-btn" onClick={() => {setInput(''); setOutput(''); setError(null);}} title="Clear">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="SELECT * FROM users WHERE id = 1"
              style={{ minHeight: '400px', fontFamily: 'var(--font-mono)' }}
            />
            {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Error: {error}</div>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>FORMATTED OUTPUT</label>
              <button className="icon-btn" onClick={handleCopy} title="Copy Output" disabled={!output}>
                <Copy size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={output}
              readOnly
              placeholder="Formatted query will appear here..."
              style={{ minHeight: '400px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)' }}
            />
          </div>

        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={handleFormat} disabled={!input}>
            <AlignLeft size={18} /> Format SQL
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SQLFormatter;
