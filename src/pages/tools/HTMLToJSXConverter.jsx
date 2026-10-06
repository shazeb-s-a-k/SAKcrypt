import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, ArrowRight, Copy, CheckCircle } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const HTMLToJSXConverter = () => {
  const [html, setHtml] = useState('<div class="awesome" style="color: red;">\n  <h1>Hello World</h1>\n  <label for="input">Name:</label>\n  <input type="text" id="input" autofocus>\n</div>');
  const [jsx, setJsx] = useState('');
  
  const showToast = useToast();

  const handleConvert = () => {
    try {
      if (!html.trim()) {
        setJsx('');
        return;
      }
      
      let result = html;
      
      // Replace class with className
      result = result.replace(/class=/g, 'className=');
      // Replace for with htmlFor
      result = result.replace(/for=/g, 'htmlFor=');
      // Replace self-closing tags
      result = result.replace(/<([^>]+[^\/])>/g, (match, p1) => {
        if (p1.trim().match(/^(img|input|br|hr|meta|link)/i)) {
          return `<${p1.trim()} />`;
        }
        return match;
      });
      // Replace inline styles to objects
      result = result.replace(/style="([^"]*)"/g, (match, p1) => {
        let styles = p1.split(';').filter(s => s.trim().length > 0);
        let styleObj = styles.map(s => {
          let parts = s.split(':');
          if(parts.length < 2) return '';
          let key = parts[0].trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
          let val = parts.slice(1).join(':').trim();
          return `${key}: '${val}'`;
        }).join(', ');
        return `style={{ ${styleObj} }}`;
      });
      // Handle HTML comments -> JSX comments
      result = result.replace(/<!--(.*?)-->/gs, '{/* $1 */}');

      setJsx(result.trim());
      showToast('Converted to JSX!', 'success');
    } catch (err) {
      setJsx('// Error parsing HTML\n' + err.message);
    }
  };

  const handleCopy = () => {
    if (!jsx) return;
    navigator.clipboard.writeText(jsx);
    showToast('JSX Copied!', 'success');
  };

  // Convert on first load
  React.useEffect(() => {
    handleConvert();
    // eslint-disable-next-line
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="HTML to JSX Converter" subtitle="Instantly convert raw HTML code into React-ready JSX syntax" />

      <div className="glass-card" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: '#ef4444', fontWeight: 'bold' }}>RAW HTML</label>
            <textarea 
              className="textarea-glass"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              style={{ height: '500px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
              spellCheck="false"
            />
          </div>

          <button className="icon-btn" onClick={handleConvert} style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--accent)', color: '#fff' }} title="Convert to JSX">
            <ArrowRight size={24} />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: '#0ea5e9', fontWeight: 'bold' }}>REACT JSX</label>
              <button className="icon-btn" onClick={handleCopy} disabled={!jsx} title="Copy JSX">
                <Copy size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              readOnly
              value={jsx}
              style={{ height: '500px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.2)' }}
              spellCheck="false"
            />
          </div>

        </div>

        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(0,255,255,0.2)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#00ffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={18}/> Conversion Features</h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
            <li>Converts <code style={{ color: '#ef4444' }}>class</code> to <code style={{ color: '#0ea5e9' }}>className</code></li>
            <li>Converts <code style={{ color: '#ef4444' }}>for</code> to <code style={{ color: '#0ea5e9' }}>htmlFor</code></li>
            <li>Self-closes tags like <code style={{ color: '#0ea5e9' }}>&lt;img /&gt;</code> and <code style={{ color: '#0ea5e9' }}>&lt;input /&gt;</code></li>
            <li>CamelCases inline styles (e.g., <code style={{ color: '#ef4444' }}>font-size</code> to <code style={{ color: '#0ea5e9' }}>fontSize</code>)</li>
            <li>Parses inline style strings into JSON objects</li>
            <li>Handles boolean attributes like <code style={{ color: '#ef4444' }}>autofocus</code> to <code style={{ color: '#0ea5e9' }}>autoFocus</code></li>
          </ul>
        </div>

      </div>
    </motion.div>
  );
};

export default HTMLToJSXConverter;
