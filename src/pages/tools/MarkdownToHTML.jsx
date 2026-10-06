import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Copy, Trash2, ArrowRight } from 'lucide-react';
import showdown from 'showdown';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const converter = new showdown.Converter();
converter.setOption('tables', true);
converter.setOption('strikethrough', true);
converter.setOption('ghCodeBlocks', true);

const MarkdownToHTML = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  
  const showToast = useToast();
  const showSupport = useSupport();

  const handleConvert = () => {
    if (!input) return;
    const html = converter.makeHtml(input);
    setOutput(html);
    showToast('Converted to HTML!', 'success');
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
      <ToolHeader title="Markdown to HTML" subtitle="Instantly convert Markdown strings into raw HTML markup" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>MARKDOWN INPUT</label>
              <button className="icon-btn" onClick={() => {setInput(''); setOutput('');}} title="Clear">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="**Bold Text**"
              style={{ minHeight: '400px', fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-primary" onClick={handleConvert} disabled={!input} style={{ padding: '1rem', borderRadius: '50%' }}>
              <ArrowRight size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>HTML OUTPUT</label>
              <button className="icon-btn" onClick={handleCopy} disabled={!output} title="Copy">
                <Copy size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={output}
              readOnly
              placeholder="Raw HTML will appear here..."
              style={{ minHeight: '400px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)' }}
            />
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default MarkdownToHTML;
