import React, { useState, useRef } from 'react';
import { QrCode, Download, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import ToolHeader from '../../components/ToolHeader';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const QRCodeGenerator = () => {
  const [text, setText] = useState('');
  const [fgColor, setFgColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#000000');
  const svgRef = useRef(null);
  const showToast = useToast();
  const showSupport = useSupport();

  const MAX_QR_MEDIA_SIZE = 2048; // 2KB

  const handleFileDrop = (file) => {
    if (file.size > MAX_QR_MEDIA_SIZE) {
      showToast('File too large! QR Codes can only hold ~2KB of data.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setText(e.target.result);
      showToast('Media loaded into QR Code!', 'success');
    };
    reader.onerror = () => showToast('Failed to read file', 'error');
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!svgRef.current) return;
    
    // We get the SVG string and convert to a data URL to download
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    const svgBlob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      const a = document.createElement('a');
      a.download = 'qrcode.png';
      a.href = canvas.toDataURL("image/png");
      a.click();
      showToast('QR Code downloaded', 'success');
      setTimeout(showSupport, 1000);
    };
    img.src = url;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '9s' }}
    >
      <ToolHeader title="QR Code Generator" subtitle="Generate customizable QR codes instantly" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '3rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)', margin: 0 }}>CONTENT (URL, Text, or Tiny Media)</label>
                <button 
                  className="icon-btn" 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleFileDrop(e.target.files[0]);
                    input.click();
                  }} 
                  title="Upload Tiny Media (Max 2KB)"
                  style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}
                >
                  <ImageIcon className="icon-sm" />
                </button>
              </div>
              <textarea 
                className="textarea-glass"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Enter Your Text Or Link or Image here..."
                style={{ minHeight: '100px' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>FOREGROUND</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={fgColor} 
                    onChange={(e) => setFgColor(e.target.value)}
                    style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }}
                  />
                  <input className="input-glass" value={fgColor} onChange={(e) => setFgColor(e.target.value)} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>BACKGROUND</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)}
                    style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }}
                  />
                  <input className="input-glass" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div style={{ padding: '1rem', background: bgColor, borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {text ? (
                <QRCodeSVG 
                  value={text} 
                  size={200}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  ref={svgRef}
                  level="H"
                />
              ) : (
                <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: fgColor }}>
                  <QrCode size={48} opacity={0.5} />
                </div>
              )}
            </div>
            
            <button className="btn-primary" onClick={handleDownload} disabled={!text} style={{ width: '100%', justifyContent: 'center' }}>
              <Download size={18} /> Download PNG
            </button>
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default QRCodeGenerator;
