import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Type, Copy, Trash2, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const MarkdownPreviewer = () => {
  const [markdown, setMarkdown] = useState('# Hello Markdown\n\nWrite your markdown here, and it will be rendered live on the right.\n\n## Features\n- **Bold** and *Italic*\n- [Links](https://github.com)\n- `Inline code`\n\n```js\n// Code blocks\nconsole.log("Hello!");\n```');
  
  const showToast = useToast();
  const showSupport = useSupport();

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    showToast('Markdown source copied!', 'success');
    setTimeout(showSupport, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Markdown Previewer" subtitle="Live editor to write, preview, and export Markdown documents" />

      <div className="glass-card" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', minHeight: '600px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '0.5rem 1rem', borderRadius: '8px 8px 0 0', border: '1px solid var(--border)', borderBottom: 'none' }}>
              <label style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Type size={16} /> Markdown Source
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="icon-btn" onClick={handleCopy} title="Copy Source"><Copy size={16} /></button>
                <button className="icon-btn" onClick={() => setMarkdown('')} title="Clear"><Trash2 size={16} /></button>
              </div>
            </div>
            <textarea 
              className="textarea-glass"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Type markdown here..."
              style={{ flex: 1, borderRadius: '0 0 8px 8px', marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '0.5rem 1rem', borderRadius: '8px 8px 0 0', border: '1px solid var(--border)', borderBottom: 'none' }}>
              <label style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                <Eye size={16} /> Live Preview
              </label>
            </div>
            <div 
              className="glass-card" 
              style={{ 
                flex: 1, 
                borderRadius: '0 0 8px 8px', 
                borderTop: 'none', 
                borderTopLeftRadius: 0, 
                borderTopRightRadius: 0, 
                padding: '1.5rem', 
                background: 'rgba(0,0,0,0.3)',
                overflowY: 'auto'
              }}
            >
              <div className="markdown-body" style={{ color: 'var(--text)' }}>
                <ReactMarkdown>{markdown}</ReactMarkdown>
              </div>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.3em;
          margin-bottom: 1rem;
          color: var(--primary);
        }
        .markdown-body p { margin-bottom: 1rem; line-height: 1.6; }
        .markdown-body code { background: rgba(255,255,255,0.1); padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; }
        .markdown-body pre { background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1rem; border: 1px solid var(--border); }
        .markdown-body pre code { background: transparent; padding: 0; }
        .markdown-body a { color: var(--accent); text-decoration: none; }
        .markdown-body a:hover { text-decoration: underline; }
        .markdown-body ul, .markdown-body ol { margin-bottom: 1rem; padding-left: 2rem; }
        .markdown-body li { margin-bottom: 0.5rem; }
      `}</style>
    </motion.div>
  );
};

export default MarkdownPreviewer;
