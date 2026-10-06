import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Copy, RefreshCw } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const RandomStringGen = () => {
  const [length, setLength] = useState(32);
  const [charset, setCharset] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
    hexOnly: false
  });
  const [output, setOutput] = useState('');
  
  const showToast = useToast();
  const showSupport = useSupport();

  const generateString = () => {
    let chars = '';
    
    if (charset.hexOnly) {
      chars = '0123456789abcdef';
    } else {
      if (charset.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (charset.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
      if (charset.numbers) chars += '0123456789';
      if (charset.symbols) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    }

    if (!chars) {
      setOutput('Please select at least one character set.');
      return;
    }

    let result = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    
    setOutput(result);
  };

  useEffect(() => {
    generateString();
    // eslint-disable-next-line
  }, [length, charset]);

  const handleCopy = () => {
    if (!output || output.startsWith('Please')) return;
    navigator.clipboard.writeText(output);
    showToast('Copied to clipboard!', 'success');
    setTimeout(showSupport, 1000);
  };

  const toggleOption = (opt) => {
    if (opt === 'hexOnly') {
      setCharset({ ...charset, hexOnly: !charset.hexOnly });
    } else {
      setCharset({ ...charset, [opt]: !charset[opt], hexOnly: false });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Random String Generator" subtitle="Generate cryptographically secure random strings for secrets and tokens" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '100%', wordBreak: 'break-all', textAlign: 'center', fontSize: length > 64 ? '1.2rem' : '1.8rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {output}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" onClick={handleCopy} style={{ padding: '0.5rem 1.5rem', background: 'var(--surface)' }}>
              <Copy size={18} /> Copy String
            </button>
            <button className="icon-btn" onClick={generateString} style={{ background: 'var(--accent)', color: '#fff' }} title="Regenerate">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ color: 'var(--text-muted)' }}>LENGTH: {length}</label>
          <input 
            type="range" 
            min="8" 
            max="256" 
            value={length} 
            onChange={(e) => setLength(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: charset.hexOnly ? 'var(--text-muted)' : '#fff' }}>
            <input type="checkbox" checked={charset.uppercase} onChange={() => toggleOption('uppercase')} disabled={charset.hexOnly} /> Uppercase (A-Z)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: charset.hexOnly ? 'var(--text-muted)' : '#fff' }}>
            <input type="checkbox" checked={charset.lowercase} onChange={() => toggleOption('lowercase')} disabled={charset.hexOnly} /> Lowercase (a-z)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: charset.hexOnly ? 'var(--text-muted)' : '#fff' }}>
            <input type="checkbox" checked={charset.numbers} onChange={() => toggleOption('numbers')} disabled={charset.hexOnly} /> Numbers (0-9)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: charset.hexOnly ? 'var(--text-muted)' : '#fff' }}>
            <input type="checkbox" checked={charset.symbols} onChange={() => toggleOption('symbols')} disabled={charset.hexOnly} /> Symbols (!@#$)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold' }}>
            <input type="checkbox" checked={charset.hexOnly} onChange={() => toggleOption('hexOnly')} /> Hex Only (0-f)
          </label>
        </div>

      </div>
    </motion.div>
  );
};

export default RandomStringGen;
