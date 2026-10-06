import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const WiFiQRGenerator = () => {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [encryption, setEncryption] = useState('WPA');
  const [hidden, setHidden] = useState(false);
  
  const qrRef = useRef();
  const showToast = useToast();
  const showSupport = useSupport();

  const getWiFiString = () => {
    // Format: WIFI:T:WPA;S:mynetwork;P:mypass;H:false;;
    return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`;
  };

  const downloadQR = () => {
    if (!ssid) {
      showToast('Please enter a Network Name (SSID)', 'error');
      return;
    }
    
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Add padding and white background
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `WiFi_QR_${ssid}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      showToast('QR Code Downloaded!', 'success');
      setTimeout(showSupport, 1000);
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="WiFi QR Generator" subtitle="Create secure QR codes to instantly connect to WiFi networks" />

      <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>NETWORK NAME (SSID)</label>
            <input 
              type="text" 
              className="input-glass"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              placeholder="e.g. Guest Network"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>PASSWORD</label>
            <input 
              type="text" 
              className="input-glass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="e.g. supersecret123"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-muted)' }}>ENCRYPTION</label>
              <select className="input-glass" value={encryption} onChange={(e) => setEncryption(e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="WPA">WPA/WPA2/WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None (Open)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-muted)' }}>HIDDEN NETWORK?</label>
              <select className="input-glass" value={hidden.toString()} onChange={(e) => setHidden(e.target.value === 'true')} style={{ cursor: 'pointer' }}>
                <option value="false">No (Visible)</option>
                <option value="true">Yes (Hidden)</option>
              </select>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', background: 'rgba(0,0,0,0.4)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(0,255,255,0.2)' }}>
          <div 
            ref={qrRef} 
            style={{ 
              background: '#fff', 
              padding: '1.5rem', 
              borderRadius: '16px',
              opacity: ssid ? 1 : 0.2,
              transition: 'opacity 0.3s',
              boxShadow: '0 0 30px rgba(0,255,255,0.3)'
            }}
          >
            <QRCodeSVG 
              value={getWiFiString()} 
              size={220} 
              level="H" 
              includeMargin={false}
            />
          </div>
          
          <button className="btn-primary" onClick={downloadQR} disabled={!ssid} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={20} /> Download QR Code
          </button>
          
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Scan this QR code with iOS or Android to connect instantly.
          </p>
        </div>

      </div>
    </motion.div>
  );
};

export default WiFiQRGenerator;
