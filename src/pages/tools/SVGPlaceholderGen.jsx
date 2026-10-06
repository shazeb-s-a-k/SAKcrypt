import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Copy, Download } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const SVGPlaceholderGen = () => {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [bgColor, setBgColor] = useState('#2a2a35');
  const [textColor, setTextColor] = useState('#ffffff');
  const [text, setText] = useState('800 x 600');
  const [svgCode, setSvgCode] = useState('');

  const showToast = useToast();
  const showSupport = useSupport();

  useEffect(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="${Math.min(width, height) / 10}px" fill="${textColor}">${text || `${width} x ${height}`}</text>
</svg>`;
    setSvgCode(svg);
  }, [width, height, bgColor, textColor, text]);

  const handleCopy = () => {
    navigator.clipboard.writeText(svgCode);
    showToast('SVG Copied!', 'success');
    setTimeout(showSupport, 1000);
  };

  const handleDownload = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `placeholder_${width}x${height}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloading SVG', 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="SVG Placeholder Generator" subtitle="Generate dynamic SVG placeholder images for development" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>WIDTH (PX)</label>
            <input 
              type="number" 
              className="input-glass"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>HEIGHT (PX)</label>
            <input 
              type="number" 
              className="input-glass"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>TEXT (OPTIONAL)</label>
            <input 
              type="text" 
              className="input-glass"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`${width} x ${height}`}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>BACKGROUND</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
              <input type="text" className="input-glass" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ flex: 1, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>TEXT COLOR</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
              <input type="text" className="input-glass" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ flex: 1, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>PREVIEW</label>
            <div style={{ 
              width: '100%', 
              height: '300px', 
              background: 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 20px 20px', 
              borderRadius: '8px', 
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden'
            }}>
              <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svgCode)}`} alt="SVG Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>SVG CODE</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="icon-btn" onClick={handleCopy} title="Copy SVG">
                  <Copy size={16} />
                </button>
                <button className="icon-btn" onClick={handleDownload} title="Download SVG">
                  <Download size={16} />
                </button>
              </div>
            </div>
            <textarea 
              className="textarea-glass"
              value={svgCode}
              readOnly
              style={{ height: '300px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)' }}
            />
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default SVGPlaceholderGen;
