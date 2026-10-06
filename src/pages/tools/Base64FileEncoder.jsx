import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileArchive, UploadCloud, Copy, FileIcon, ImageIcon, CheckCircle } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const Base64FileEncoder = () => {
  const [file, setFile] = useState(null);
  const [base64, setBase64] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const showToast = useToast();
  const showSupport = useSupport();

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB', 'error');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64(reader.result);
      showToast('File Encoded Successfully!', 'success');
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${type} Copied!`, 'success');
    setTimeout(showSupport, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Base64 File Encoder" subtitle="Convert images and files directly to Base64 data strings for inline usage" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div 
          style={{ 
            border: `2px dashed ${isDragging ? '#00ffff' : 'rgba(0,255,255,0.2)'}`,
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            background: isDragging ? 'rgba(0,255,255,0.05)' : 'rgba(0,0,0,0.4)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <UploadCloud size={48} style={{ color: isDragging ? '#00ffff' : 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>Drag & Drop any file here</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>or click to browse (Max 5MB)</p>
          <input 
            type="file" 
            id="file-upload" 
            style={{ display: 'none' }} 
            onChange={(e) => handleFileChange(e.target.files[0])}
          />
        </div>

        {file && base64 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ padding: '0.8rem', background: 'rgba(0,255,255,0.1)', borderRadius: '8px' }}>
                {file.type.startsWith('image/') ? <ImageIcon size={24} color="#00ffff" /> : <FileIcon size={24} color="#00ffff" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{file.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{(file.size / 1024).toFixed(2)} KB • {file.type || 'Unknown Type'}</div>
              </div>
              <CheckCircle size={24} color="var(--success)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>DATA URL (FOR IMG SRC)</label>
                  <button className="icon-btn" onClick={() => handleCopy(base64, 'Data URL')}><Copy size={16}/></button>
                </div>
                <textarea 
                  className="textarea-glass"
                  readOnly
                  value={base64}
                  style={{ height: '150px', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ color: '#ec4899', fontWeight: 'bold' }}>RAW BASE64 STRING</label>
                  <button className="icon-btn" onClick={() => handleCopy(base64.split(',')[1], 'Raw Base64')}><Copy size={16}/></button>
                </div>
                <textarea 
                  className="textarea-glass"
                  readOnly
                  value={base64.split(',')[1]}
                  style={{ height: '150px', fontSize: '0.8rem', color: '#ec4899', border: '1px solid rgba(236,72,153,0.2)' }}
                />
              </div>

            </div>

          </div>
        )}

      </div>
    </motion.div>
  );
};

export default Base64FileEncoder;
