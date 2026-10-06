import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileCode, Copy, Trash2, AlignLeft, Minimize2 } from 'lucide-react';
import xmlFormat from 'xml-formatter';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const XMLFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  
  const showToast = useToast();
  const showSupport = useSupport();

  const handleFormat = () => {
    if (!input) return;
    try {
      const formatted = xmlFormat(input, {
        indentation: '  ',
        collapseContent: true,
        lineSeparator: '\n'
      });
      setOutput(formatted);
      setError(null);
      showToast('XML Formatted!', 'success');
    } catch (err) {
      setError(err.message);
      showToast('Invalid XML', 'error');
    }
  };

  const handleMinify = () => {
    if (!input) return;
    try {
      // Basic minify strategy
      const minified = xmlFormat(input, {
        indentation: '',
        collapseContent: true,
        lineSeparator: ''
      });
      setOutput(minified);
      setError(null);
      showToast('XML Minified!', 'success');
    } catch (err) {
      setError(err.message);
      showToast('Invalid XML', 'error');
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
      <ToolHeader title="XML Formatter" subtitle="Format, minify, and validate XML payloads instantly" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>INPUT XML</label>
              <button className="icon-btn" onClick={() => {setInput(''); setOutput(''); setError(null);}} title="Clear">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="<root><child>value</child></root>"
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
            <AlignLeft size={18} /> Format XML
          </button>
          <button className="btn-primary" onClick={handleMinify} disabled={!input} style={{ background: 'transparent', border: '1px solid var(--border)' }}>
            <Minimize2 size={18} /> Minify XML
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default XMLFormatter;
