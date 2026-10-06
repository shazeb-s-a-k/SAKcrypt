import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileJson, Copy, Trash2, ArrowRight } from 'lucide-react';
import * as yaml from 'js-yaml';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const YAMLToJSON = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  
  const showToast = useToast();
  const showSupport = useSupport();

  const handleConvert = () => {
    if (!input) return;
    try {
      const parsed = yaml.load(input);
      const json = JSON.stringify(parsed, null, 2);
      setOutput(json);
      setError(null);
      showToast('Converted to JSON!', 'success');
    } catch (err) {
      setError(err.message);
      showToast('Invalid YAML Syntax', 'error');
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
      <ToolHeader title="YAML to JSON" subtitle="Instantly convert YAML configurations into valid JSON formatting" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>YAML INPUT</label>
              <button className="icon-btn" onClick={() => {setInput(''); setOutput(''); setError(null);}} title="Clear">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="name: John Doe&#10;age: 30&#10;skills:&#10;  - React&#10;  - Node.js"
              style={{ minHeight: '400px', fontFamily: 'var(--font-mono)' }}
            />
            {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Error: {error}</div>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-primary" onClick={handleConvert} disabled={!input} style={{ padding: '1rem', borderRadius: '50%' }}>
              <ArrowRight size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>JSON OUTPUT</label>
              <button className="icon-btn" onClick={handleCopy} title="Copy Output" disabled={!output}>
                <Copy size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={output}
              readOnly
              placeholder="JSON output will appear here..."
              style={{ minHeight: '400px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)' }}
            />
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default YAMLToJSON;
