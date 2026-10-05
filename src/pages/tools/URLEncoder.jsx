import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, ArrowRight, ArrowLeft, Copy, Trash2 } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const URLEncoder = () => {
  const [text, setText] = useState('');
  const [encoded, setEncoded] = useState('');
  const showToast = useToast();
  const showSupport = useSupport();

  const handleEncode = (val) => {
    setText(val);
    try {
      setEncoded(encodeURIComponent(val));
    } catch (e) {
      setEncoded('Error encoding text');
    }
  };

  const handleDecode = (val) => {
    setEncoded(val);
    try {
      setText(decodeURIComponent(val));
    } catch (e) {
      setText('Invalid URL Encoded string');
    }
  };

  const handleCopy = (content) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
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
      <ToolHeader title="URL Encoder" subtitle="Safely encode and decode URL components" />

      <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ color: 'var(--text-muted)' }}>PLAIN TEXT</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="icon-btn" onClick={() => handleCopy(text)} title="Copy Text"><Copy size={16} /></button>
                <button className="icon-btn" onClick={() => {setText(''); setEncoded('');}} title="Clear"><Trash2 size={16} /></button>
              </div>
            </div>
            <textarea 
              className="textarea-glass"
              value={text}
              onChange={(e) => handleEncode(e.target.value)}
              placeholder="Enter plain text here..."
              style={{ minHeight: '300px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--primary)' }}>
            <ArrowRight size={24} />
            <ArrowLeft size={24} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ color: 'var(--text-muted)' }}>URL ENCODED</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="icon-btn" onClick={() => handleCopy(encoded)} title="Copy Encoded"><Copy size={16} /></button>
                <button className="icon-btn" onClick={() => {setText(''); setEncoded('');}} title="Clear"><Trash2 size={16} /></button>
              </div>
            </div>
            <textarea 
              className="textarea-glass"
              value={encoded}
              onChange={(e) => handleDecode(e.target.value)}
              placeholder="Enter URL encoded text here..."
              style={{ minHeight: '300px', fontFamily: 'var(--font-mono)' }}
            />
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default URLEncoder;
