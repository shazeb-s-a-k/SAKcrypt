import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ImageMinus, Upload, Download, Trash2, CheckCircle } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const EXIFScrubber = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scrubbedUrl, setScrubbedUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef(null);
  const showToast = useToast();
  const showSupport = useSupport();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (!selectedFile.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setScrubbedUrl(null);
  };

  const handleScrub = () => {
    if (!file) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // Drawing to a canvas and exporting natively strips ALL EXIF data (GPS, camera info, etc)
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const newUrl = URL.createObjectURL(blob);
        setScrubbedUrl(newUrl);
        setIsProcessing(false);
        showToast('Metadata successfully stripped!', 'success');
        setTimeout(showSupport, 1500);
      }, file.type);
    };
    img.onerror = () => {
      setIsProcessing(false);
      showToast('Error processing image', 'error');
    };
    img.src = preview;
  };

  const clearAll = () => {
    setFile(null);
    setPreview(null);
    setScrubbedUrl(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="EXIF Scrubber" subtitle="Instantly strip GPS location, camera data, and hidden metadata from images" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        
        {!file ? (
          <div 
            style={{ 
              border: '2px dashed var(--border)', 
              borderRadius: '12px', 
              padding: '4rem 2rem', 
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageMinus size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Select an Image to Scrub</h3>
            <p style={{ color: 'var(--text-muted)' }}>Supports JPG, PNG, WEBP. All processing happens locally.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>ORIGINAL (Contains EXIF)</span>
                <img src={preview} alt="Original" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: scrubbedUrl ? '#10b981' : 'var(--text-muted)' }}>{scrubbedUrl ? 'CLEANED (Safe to share)' : 'WAITING TO SCRUB'}</span>
                {scrubbedUrl ? (
                  <img src={scrubbedUrl} alt="Scrubbed" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '2px solid #10b981' }} />
                ) : (
                  <div style={{ width: '100%', height: '300px', border: '1px dashed var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>No Data</span>
                  </div>
                )}
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              {!scrubbedUrl ? (
                <button className="btn-primary" onClick={handleScrub} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Strip Metadata Now'}
                </button>
              ) : (
                <a href={scrubbedUrl} download={`scrubbed_${file.name}`} style={{ textDecoration: 'none' }}>
                  <button className="btn-primary" style={{ background: '#10b981', color: '#000' }}>
                    <Download size={18} /> Download Clean Image
                  </button>
                </a>
              )}
              <button className="icon-btn" onClick={clearAll} title="Clear">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*"
          onChange={handleFileChange}
        />
        
      </div>
    </motion.div>
  );
};

export default EXIFScrubber;
