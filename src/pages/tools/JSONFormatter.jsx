import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Braces, Copy, Trash2, AlignLeft, Minimize2 } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const JSONFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  
  const showToast = useToast();
  const showSupport = useSupport();

  const handleFormat = () => {
    if (!input) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError(null);
      showToast('JSON Formatted!', 'success');
    } catch (err) {
      setError(err.message);
      showToast('Invalid JSON', 'error');
    }
  };

  const handleMinify = () => {
    if (!input) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
      showToast('JSON Minified!', 'success');
    } catch (err) {
      setError(err.message);
      showToast('Invalid JSON', 'error');
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
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
      <ToolHeader title="JSON Formatter" subtitle="Format, minify, and validate JSON payloads instantly" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>INPUT JSON</label>
              <button className="icon-btn" onClick={() => {setInput(''); setOutput(''); setError(null);}} title="Clear">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"key": "value"}'
              style={{ minHeight: '400px', fontFamily: 'var(--font-mono)' }}
            />
            {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Error: {error}</div>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>OUTPUT</label>
              <button className="icon-btn" onClick={handleCopy} title="Copy Output" disabled={!output}>
                <Copy size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={output}
              readOnly
              placeholder="Formatted output will appear here..."
              style={{ minHeight: '400px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)' }}
            />
          </div>

        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={handleFormat} disabled={!input}>
            <AlignLeft size={18} /> Format JSON
          </button>
          <button className="btn-primary" onClick={handleMinify} disabled={!input} style={{ background: 'transparent', border: '1px solid var(--border)' }}>
            <Minimize2 size={18} /> Minify JSON
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default JSONFormatter;
