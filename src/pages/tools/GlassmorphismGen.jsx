import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplet, Copy, CheckCircle, Sliders, Monitor } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const GlassmorphismGen = () => {
  const [blur, setBlur] = useState(10);
  const [opacity, setOpacity] = useState(0.2);
  const [borderOpacity, setBorderOpacity] = useState(0.3);
  const [color, setColor] = useState('#ffffff');
  const [isCopied, setIsCopied] = useState(false);

  const showToast = useToast();

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
  };

  const rgbColor = hexToRgb(color);

  const cssCode = `/* Glassmorphism Effect */
background: rgba(${rgbColor}, ${opacity});
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: 1px solid rgba(${rgbColor}, ${borderOpacity});
border-radius: 16px;
box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssCode);
    setIsCopied(true);
    showToast('CSS copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container"
      style={{ maxWidth: '1200px' }}
    >
      <ToolHeader 
        title="Glassmorphism Generator" 
        subtitle="Create stunning frosted-glass CSS effects instantly."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Controls Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <Sliders size={20} />
            <h3 style={{ margin: 0 }}>Adjust Parameters</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Blur Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Blur Value</label>
                <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{blur}px</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="50" 
                value={blur} 
                onChange={(e) => setBlur(e.target.value)} 
                style={{ width: '100%', accentColor: 'var(--primary)' }} 
              />
            </div>

            {/* Opacity Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Background Opacity</label>
                <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{opacity}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={opacity} 
                onChange={(e) => setOpacity(e.target.value)} 
                style={{ width: '100%', accentColor: 'var(--primary)' }} 
              />
            </div>

            {/* Border Opacity Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Border Opacity</label>
                <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{borderOpacity}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={borderOpacity} 
                onChange={(e) => setBorderOpacity(e.target.value)} 
                style={{ width: '100%', accentColor: 'var(--primary)' }} 
              />
            </div>

            {/* Color Picker */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Base Color</label>
                <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{color}</span>
              </div>
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent' }} 
              />
            </div>

          </div>
        </div>

        {/* Live Preview Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '300px',
            background: 'url("https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop") center/cover no-repeat',
            borderRadius: '16px'
          }}>
            {/* The Glass Element */}
            <div style={{
              width: '250px',
              height: '250px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '1rem',
              color: '#fff',
              background: `rgba(${rgbColor}, ${opacity})`,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              border: `1px solid rgba(${rgbColor}, ${borderOpacity})`,
              borderRadius: '16px',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
            }}>
              <Monitor size={48} style={{ opacity: 0.8 }} />
              <div style={{ fontWeight: 'bold', letterSpacing: '2px', opacity: 0.9 }}>LIVE PREVIEW</div>
            </div>
          </div>

          {/* CSS Output */}
          <div className="glass-card" style={{ padding: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>CSS</span>
              <button 
                onClick={copyToClipboard}
                style={{ background: 'transparent', border: 'none', color: isCopied ? 'var(--success)' : 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {isCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                {isCopied ? 'Copied' : 'Copy CSS'}
              </button>
            </div>
            <pre style={{ padding: '1rem', margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#e2e8f0', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
              {cssCode}
            </pre>
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default GlassmorphismGen;
