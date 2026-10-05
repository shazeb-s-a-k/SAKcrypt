import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileCode, ArrowRight, ArrowLeft, Copy, Trash2 } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const Base64Converter = () => {
  const [text, setText] = useState('');
  const [base64, setBase64] = useState('');
  const showToast = useToast();
  const showSupport = useSupport();

  const handleEncode = (val) => {
    setText(val);
    try {
      setBase64(btoa(unescape(encodeURIComponent(val))));
    } catch (e) {
      setBase64('Error encoding text');
    }
  };

  const handleDecode = (val) => {
    setBase64(val);
    try {
      setText(decodeURIComponent(escape(atob(val))));
    } catch (e) {
      setText('Invalid Base64 string');
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
      style={{ animationDuration: '8s' }}
    >
      <ToolHeader title="Base64 Converter" subtitle="Encode and decode Base64 strings instantly" />

      <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ color: 'var(--text-muted)' }}>PLAIN TEXT</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="icon-btn" onClick={() => handleCopy(text)} title="Copy Text"><Copy size={16} /></button>
                <button className="icon-btn" onClick={() => {setText(''); setBase64('');}} title="Clear"><Trash2 size={16} /></button>
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
              <label style={{ color: 'var(--text-muted)' }}>BASE64 ENCODED</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="icon-btn" onClick={() => handleCopy(base64)} title="Copy Base64"><Copy size={16} /></button>
                <button className="icon-btn" onClick={() => {setText(''); setBase64('');}} title="Clear"><Trash2 size={16} /></button>
              </div>
            </div>
            <textarea 
              className="textarea-glass"
              value={base64}
              onChange={(e) => handleDecode(e.target.value)}
              placeholder="Enter Base64 here..."
              style={{ minHeight: '300px', fontFamily: 'var(--font-mono)' }}
            />
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default Base64Converter;
