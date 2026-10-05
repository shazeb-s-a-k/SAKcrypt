import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Type, Copy, Trash2 } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const TextTools = () => {
  const [input, setInput] = useState('');
  const showToast = useToast();
  const showSupport = useSupport();

  const handleCopy = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    showToast('Copied to clipboard!', 'success');
    setTimeout(showSupport, 1000);
  };

  const transform = (type) => {
    if (!input) return;
    let result = input;
    switch (type) {
      case 'upper': result = input.toUpperCase(); break;
      case 'lower': result = input.toLowerCase(); break;
      case 'title': result = input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()); break;
      case 'reverse': result = input.split('').reverse().join(''); break;
      case 'nospace': result = input.replace(/\s+/g, ''); break;
      default: break;
    }
    setInput(result);
  };

  const getStats = () => {
    const chars = input.length;
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const lines = input ? input.split(/\r\n|\r|\n/).length : 0;
    return { chars, words, lines };
  };

  const stats = getStats();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Text Tools" subtitle="Quickly manipulate, transform, and analyze text" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span>Words: <strong style={{color: '#fff'}}>{stats.words}</strong></span>
            <span>Chars: <strong style={{color: '#fff'}}>{stats.chars}</strong></span>
            <span>Lines: <strong style={{color: '#fff'}}>{stats.lines}</strong></span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="icon-btn" onClick={handleCopy} title="Copy Text"><Copy size={16} /></button>
            <button className="icon-btn" onClick={() => setInput('')} title="Clear"><Trash2 size={16} /></button>
          </div>
        </div>

        <textarea 
          className="textarea-glass"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter or paste text here..."
          style={{ minHeight: '300px', marginBottom: '1rem' }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)' }} onClick={() => transform('upper')}>UPPERCASE</button>
          <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)' }} onClick={() => transform('lower')}>lowercase</button>
          <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)' }} onClick={() => transform('title')}>Title Case</button>
          <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)' }} onClick={() => transform('reverse')}>Reverse</button>
          <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)' }} onClick={() => transform('nospace')}>Remove Spaces</button>
        </div>

      </div>
    </motion.div>
  );
};

export default TextTools;
