import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Droplet, RefreshCcw, Type } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';

const ColorContrastChecker = () => {
  const [fgColor, setFgColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#1e293b');
  const [contrastRatio, setContrastRatio] = useState(0);

  // Helper: Convert hex to RGB
  const hexToRgb = (hex) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return { r, g, b };
  };

  // Helper: Calculate relative luminance
  const luminance = (r, g, b) => {
    const a = [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  // Helper: Calculate contrast ratio
  const calculateRatio = (l1, l2) => {
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  useEffect(() => {
    if (/^#([0-9A-F]{3}){1,2}$/i.test(fgColor) && /^#([0-9A-F]{3}){1,2}$/i.test(bgColor)) {
      const rgb1 = hexToRgb(fgColor);
      const rgb2 = hexToRgb(bgColor);
      const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
      const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
      const ratio = calculateRatio(lum1, lum2);
      setContrastRatio(ratio.toFixed(2));
    }
  }, [fgColor, bgColor]);

  const swapColors = () => {
    const temp = fgColor;
    setFgColor(bgColor);
    setBgColor(temp);
  };

  const ResultBadge = ({ text, pass }) => (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.25rem 0.75rem',
      borderRadius: '999px',
      background: pass ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      color: pass ? '#10b981' : '#ef4444',
      fontWeight: 'bold',
      fontSize: '0.8rem'
    }}>
      {pass ? 'PASS' : 'FAIL'} • {text}
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container"
      style={{ maxWidth: '900px' }}
    >
      <ToolHeader 
        title="Color Contrast Checker" 
        subtitle="Verify WCAG accessibility compliance for your color combinations."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Controls */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Foreground (Text) Color</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                type="color" 
                value={fgColor} 
                onChange={(e) => setFgColor(e.target.value)}
                style={{ width: '50px', height: '50px', cursor: 'pointer', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent' }}
              />
              <input 
                type="text" 
                className="input-glass"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={swapColors}
              style={{ background: 'var(--surface-color)', border: '1px solid var(--border)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RefreshCcw size={18} />
            </button>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Background Color</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)}
                style={{ width: '50px', height: '50px', cursor: 'pointer', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent' }}
              />
              <input 
                type="text" 
                className="input-glass"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Contrast Score */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Contrast Ratio</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: contrastRatio >= 4.5 ? '#10b981' : (contrastRatio >= 3 ? '#f59e0b' : '#ef4444') }}>
                {contrastRatio}:1
              </div>
            </div>
            <Eye size={48} style={{ color: 'var(--surface-color)', opacity: 0.5 }} />
          </div>

          {/* WCAG Badges */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Type size={18} /> WCAG 2.0 Compliance
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--secondary)' }}>Normal Text (14pt)</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <ResultBadge text="AA (4.5:1)" pass={contrastRatio >= 4.5} />
                <ResultBadge text="AAA (7.0:1)" pass={contrastRatio >= 7} />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--secondary)' }}>Large Text (18pt+)</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <ResultBadge text="AA (3.0:1)" pass={contrastRatio >= 3} />
                <ResultBadge text="AAA (4.5:1)" pass={contrastRatio >= 4.5} />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div style={{ 
            padding: '2rem', 
            borderRadius: '16px', 
            background: bgColor, 
            color: fgColor,
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            transition: 'all 0.3s'
          }}>
            <h2 style={{ margin: 0, fontSize: '2rem', color: fgColor }}>Live Preview</h2>
            <p style={{ margin: 0, fontSize: '1.2rem', lineHeight: '1.5' }}>
              This is what normal body text looks like. Ensure this is highly readable for all users.
            </p>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default ColorContrastChecker;
