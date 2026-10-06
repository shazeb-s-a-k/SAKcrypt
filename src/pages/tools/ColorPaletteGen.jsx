import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, RefreshCw, Copy } from 'lucide-react';
import chroma from 'chroma-js';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const ColorPaletteGen = () => {
  const [baseColor, setBaseColor] = useState('#5E6AD2');
  const [paletteType, setPaletteType] = useState('analogous');
  const [palette, setPalette] = useState([]);

  const showToast = useToast();
  const showSupport = useSupport();

  const generatePalette = (color, type) => {
    let colors = [];
    try {
      const base = chroma(color);
      switch(type) {
        case 'analogous':
          colors = [
            base.set('hsl.h', '-30').hex(),
            base.set('hsl.h', '-15').hex(),
            base.hex(),
            base.set('hsl.h', '+15').hex(),
            base.set('hsl.h', '+30').hex()
          ];
          break;
        case 'monochromatic':
          colors = chroma.scale([base.brighten(2), base, base.darken(2)]).colors(5);
          break;
        case 'complementary':
          colors = [
            base.brighten(1).hex(),
            base.hex(),
            base.darken(1).hex(),
            base.set('hsl.h', '+180').hex(),
            base.set('hsl.h', '+180').darken(1).hex()
          ];
          break;
        case 'triadic':
          colors = [
            base.brighten(1).hex(),
            base.hex(),
            base.set('hsl.h', '+120').hex(),
            base.set('hsl.h', '+240').hex(),
            base.darken(1).hex()
          ];
          break;
        default:
          colors = [base.hex(), base.hex(), base.hex(), base.hex(), base.hex()];
      }
      setPalette(colors);
    } catch (err) {
      // Invalid color
    }
  };

  useEffect(() => {
    generatePalette(baseColor, paletteType);
  }, [baseColor, paletteType]);

  const handleRandom = () => {
    setBaseColor(chroma.random().hex());
  };

  const handleCopy = (color) => {
    navigator.clipboard.writeText(color);
    showToast(`Copied ${color}`, 'success');
    setTimeout(showSupport, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Color Palette Generator" subtitle="Generate mathematical color harmonies and UI palettes" />

      <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
            <label style={{ color: 'var(--text-muted)' }}>BASE COLOR (HEX)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="color" 
                value={baseColor} 
                onChange={(e) => setBaseColor(e.target.value)}
                style={{ height: '45px', width: '45px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px' }}
              />
              <input 
                type="text" 
                className="input-glass"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                style={{ flex: 1, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
            <label style={{ color: 'var(--text-muted)' }}>HARMONY TYPE</label>
            <select 
              className="input-glass"
              value={paletteType}
              onChange={(e) => setPaletteType(e.target.value)}
              style={{ cursor: 'pointer', height: '45px' }}
            >
              <option value="analogous">Analogous</option>
              <option value="monochromatic">Monochromatic</option>
              <option value="complementary">Complementary</option>
              <option value="triadic">Triadic</option>
            </select>
          </div>

          <button className="icon-btn" onClick={handleRandom} style={{ height: '45px', width: '45px', background: 'var(--surface)', border: '1px solid var(--border)' }} title="Random Color">
            <RefreshCw size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', height: '250px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {palette.map((color, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              style={{ 
                flex: 1, 
                background: color, 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: '1rem',
                cursor: 'pointer',
                transition: 'flex 0.3s'
              }}
              onClick={() => handleCopy(color)}
              title="Click to copy HEX"
            >
              <div style={{ 
                background: chroma(color).luminance() > 0.5 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
                color: chroma(color).luminance() > 0.5 ? '#fff' : '#000',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {color.toUpperCase()} <Copy size={14} />
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {palette.map((color, idx) => (
            <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ width: '100%', height: '40px', background: color, borderRadius: '4px' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>HEX</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{color.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RGB</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{chroma(color).rgb().join(', ')}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </motion.div>
  );
};

export default ColorPaletteGen;
