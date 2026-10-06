import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Baseline, Copy } from 'lucide-react';
import figlet from 'figlet';
import Standard from 'figlet/importable-fonts/Standard.js';
import Ghost from 'figlet/importable-fonts/Ghost.js';
import Slant from 'figlet/importable-fonts/Slant.js';
import Isometric1 from 'figlet/importable-fonts/Isometric1.js';
import Doom from 'figlet/importable-fonts/Doom.js';

import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

// Register fonts
figlet.parseFont('Standard', Standard);
figlet.parseFont('Ghost', Ghost);
figlet.parseFont('Slant', Slant);
figlet.parseFont('Isometric1', Isometric1);
figlet.parseFont('Doom', Doom);

const ASCIIArtGenerator = () => {
  const [text, setText] = useState('SAKrypt');
  const [font, setFont] = useState('Standard');
  const [ascii, setAscii] = useState('');

  const showToast = useToast();
  const showSupport = useSupport();

  useEffect(() => {
    try {
      if (text.trim() === '') {
        setAscii('');
        return;
      }
      const result = figlet.textSync(text, { font: font });
      setAscii(result);
    } catch (e) {
      setAscii('Error generating ASCII art');
    }
  }, [text, font]);

  const handleCopy = () => {
    navigator.clipboard.writeText(ascii);
    showToast('ASCII Art Copied!', 'success');
    setTimeout(showSupport, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="ASCII Art Generator" subtitle="Convert text into retro ASCII banner art" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>ENTER TEXT</label>
            <input 
              type="text" 
              className="input-glass"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something..."
              style={{ fontSize: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.5)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>FONT</label>
            <select 
              className="input-glass"
              value={font}
              onChange={(e) => setFont(e.target.value)}
              style={{ padding: '1rem', cursor: 'pointer', height: '62px' }}
            >
              <option value="Standard">Standard</option>
              <option value="Ghost">Ghost</option>
              <option value="Slant">Slant</option>
              <option value="Doom">Doom</option>
              <option value="Isometric1">Isometric 3D</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>ASCII ART</label>
            <button className="icon-btn" onClick={handleCopy} title="Copy ASCII">
              <Copy size={16} />
            </button>
          </div>
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.6)', 
            border: '1px solid rgba(0, 255, 255, 0.2)', 
            borderRadius: '8px', 
            padding: '1.5rem',
            overflowX: 'auto',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
          }}>
            <pre style={{ 
              margin: 0, 
              color: '#00ffff', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '12px',
              lineHeight: '1.2',
              textShadow: '0 0 5px rgba(0,255,255,0.5)'
            }}>
              {ascii || '...'}
            </pre>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default ASCIIArtGenerator;
