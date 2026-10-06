import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Minimize2, Copy, Trash2, ArrowRight } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const CSSMinifier = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [stats, setStats] = useState(null);
  const showToast = useToast();
  const showSupport = useSupport();

  const minifyCSS = () => {
    if (!input.trim()) return;

    // Simple robust regex-based CSS minifier
    let minified = input
      .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
      .replace(/\s+/g, ' ') // collapse whitespace
      .replace(/\s*([\{\}\:\;\,])\s*/g, '$1') // remove space around delimiters
      .replace(/;\}/g, '}') // remove trailing semicolon
      .trim();

    setOutput(minified);
    
    // Calculate stats
    const originalSize = new Blob([input]).size;
    const minifiedSize = new Blob([minified]).size;
    const saved = originalSize - minifiedSize;
    const percent = originalSize > 0 ? ((saved / originalSize) * 100).toFixed(1) : 0;
    
    setStats({
      original: (originalSize / 1024).toFixed(2),
      minified: (minifiedSize / 1024).toFixed(2),
      percent
    });

    showToast('CSS Minified!', 'success');
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
      <ToolHeader title="CSS Minifier" subtitle="Compress and optimize CSS stylesheets to reduce payload size" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>ORIGINAL CSS</label>
              <button className="icon-btn" onClick={() => {setInput(''); setOutput(''); setStats(null);}} title="Clear">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste unminified CSS here..."
              style={{ minHeight: '400px', fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-primary" onClick={minifyCSS} disabled={!input} style={{ padding: '1rem', borderRadius: '50%' }}>
              <ArrowRight size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>MINIFIED CSS</label>
              <button className="icon-btn" onClick={handleCopy} disabled={!output} title="Copy">
                <Copy size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={output}
              readOnly
              placeholder="Minified output will appear here..."
              style={{ minHeight: '400px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)' }}
            />
          </div>

        </div>

        {stats && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Original Size</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{stats.original} KB</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Minified Size</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>{stats.minified} KB</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Saved</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#10b981' }}>{stats.percent}%</div>
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default CSSMinifier;
