import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Copy, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const PayloadObfuscator = () => {
  const [input, setInput] = useState('<script>alert("XSS")</script>');
  const [copiedId, setCopiedId] = useState(null);
  const showToast = useToast();

  const toHex = (str) => {
    return Array.from(str).map(c => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  };

  const toUrl = (str) => {
    return Array.from(str).map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  };

  const toHtmlEntities = (str) => {
    return Array.from(str).map(c => '&#' + c.charCodeAt(0) + ';').join('');
  };

  const toCharCodeArray = (str) => {
    const arr = Array.from(str).map(c => c.charCodeAt(0));
    return `String.fromCharCode(${arr.join(', ')})`;
  };

  const toBase64Eval = (str) => {
    const b64 = btoa(str);
    return `eval(atob("${b64}"))`;
  };

  const toOctal = (str) => {
    return Array.from(str).map(c => '\\' + c.charCodeAt(0).toString(8).padStart(3, '0')).join('');
  };

  const obfuscated = {
    hex: toHex(input),
    url: toUrl(input),
    html: toHtmlEntities(input),
    charcode: toCharCodeArray(input),
    base64eval: toBase64Eval(input),
    octal: toOctal(input)
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container"
      style={{ maxWidth: '1000px' }}
    >
      <ToolHeader 
        title="Payload Obfuscator" 
        subtitle="Obfuscate and encode payloads for WAF bypass and security testing."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Input Area */}
        <div className="glass-card">
          <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span>RAW PAYLOAD (TEXT / SCRIPT)</span>
            <button onClick={() => setInput('')} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <RotateCcw size={14} /> Clear
            </button>
          </label>
          <textarea 
            className="input-glass" 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="<script>alert(1)</script>"
            style={{ width: '100%', height: '120px', resize: 'vertical', fontFamily: 'var(--font-mono)' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <AlertTriangle size={24} />
          <span style={{ fontSize: '0.9rem' }}><strong>Disclaimer:</strong> Only use these payloads on systems you have explicit permission to test. Unauthorized access is illegal.</span>
        </div>

        {/* Output Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          
          {[
            { id: 'hex', title: 'Hex Encoding (\\x)', desc: 'Useful for bypassing basic string filters in JS/SQL', data: obfuscated.hex, color: '#f59e0b' },
            { id: 'url', title: 'URL Encoding (%)', desc: 'Full URL encoding for HTTP requests', data: obfuscated.url, color: '#0ea5e9' },
            { id: 'html', title: 'HTML Entities (&#)', desc: 'Bypass XSS filters inside HTML contexts', data: obfuscated.html, color: '#10b981' },
            { id: 'charcode', title: 'String.fromCharCode', desc: 'Executes JS without using quotes', data: obfuscated.charcode, color: '#a855f7' },
            { id: 'base64eval', title: 'Base64 Eval Wrapper', desc: 'Wraps payload in an eval(atob()) call', data: obfuscated.base64eval, color: '#ec4899' },
            { id: 'octal', title: 'Octal Encoding (\\)', desc: 'Legacy encoding sometimes overlooked by WAFs', data: obfuscated.octal, color: '#64748b' },
          ].map(section => (
            <div key={section.id} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: section.color, fontSize: '1.1rem' }}>{section.title}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{section.desc}</div>
                </div>
                <button 
                  onClick={() => copyToClipboard(section.data, section.id)}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: copiedId === section.id ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px' }}
                >
                  {copiedId === section.id ? <CheckCircle size={16} /> : <Copy size={16} />}
                  {copiedId === section.id ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#e2e8f0', wordBreak: 'break-all', maxHeight: '150px', overflowY: 'auto' }}>
                {section.data || <span style={{ color: 'var(--text-muted)' }}>No input provided...</span>}
              </div>
            </div>
          ))}

        </div>
      </div>
    </motion.div>
  );
};

export default PayloadObfuscator;
