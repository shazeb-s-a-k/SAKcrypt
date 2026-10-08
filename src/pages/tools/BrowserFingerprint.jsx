import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Monitor, ShieldAlert, Cpu, Globe, Activity, EyeOff, Hash, Download } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const BrowserFingerprint = () => {
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);
  const showToast = useToast();

  useEffect(() => {
    const gatherData = async () => {
      try {
        const fp = {};

        // 1. Basic Navigator Info
        fp.userAgent = navigator.userAgent;
        fp.language = navigator.language;
        fp.languages = navigator.languages.join(', ');
        fp.platform = navigator.platform;
        fp.vendor = navigator.vendor;
        fp.doNotTrack = navigator.doNotTrack === '1' ? 'Enabled' : 'Disabled';
        fp.cookieEnabled = navigator.cookieEnabled;
        
        // 2. Hardware Info
        fp.cores = navigator.hardwareConcurrency || 'Unknown';
        fp.memory = navigator.deviceMemory ? `${navigator.deviceMemory}GB+` : 'Unknown';
        
        // 3. Screen Info
        fp.screenWidth = window.screen.width;
        fp.screenHeight = window.screen.height;
        fp.colorDepth = window.screen.colorDepth;
        fp.pixelRatio = window.devicePixelRatio;

        // 4. Timezone
        fp.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        fp.timezoneOffset = new Date().getTimezoneOffset();

        // 5. IP & Location (via public API)
        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          const ipData = await ipRes.json();
          fp.ip = ipData.ip;
          fp.location = `${ipData.city}, ${ipData.region}, ${ipData.country_name}`;
          fp.isp = ipData.org;
        } catch (e) {
          fp.ip = 'Blocked/Failed';
          fp.location = 'Unknown';
          fp.isp = 'Unknown';
        }

        // 6. Canvas Fingerprinting (hash generation)
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = '#f60';
          ctx.fillRect(125,1,62,20);
          ctx.fillStyle = '#069';
          ctx.fillText('Browser Fingerprint Matrix', 2, 15);
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.fillText('Browser Fingerprint Matrix', 4, 17);
          
          const dataURI = canvasRef.current.toDataURL();
          
          // Simple hash function for the dataURI
          let hash = 0;
          for (let i = 0; i < dataURI.length; i++) {
            const char = dataURI.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit int
          }
          fp.canvasHash = Math.abs(hash).toString(16);
        }

        setFingerprint(fp);
      } catch (err) {
        showToast('Error gathering fingerprint data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    gatherData();
  }, []);

  const exportReport = () => {
    if (!fingerprint) return;
    const blob = new Blob([JSON.stringify(fingerprint, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `browser_fingerprint_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Fingerprint report exported', 'success');
  };

  const renderSection = (title, icon, data) => (
    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        {icon} {title}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', textAlign: 'right', wordBreak: 'break-all' }}>
              {value?.toString() || 'N/A'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container"
      style={{ maxWidth: '1000px' }}
    >
      <ToolHeader 
        title="Device Fingerprint Analyzer" 
        subtitle="Extract detailed hardware, software, network, and canvas fingerprinting data."
      />

      {/* Hidden Canvas for Fingerprinting */}
      <canvas ref={canvasRef} width="200" height="40" style={{ display: 'none' }}></canvas>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem', color: 'var(--primary)' }}>
            <Activity className="spin" size={48} />
            <h2>Scanning Device Profile...</h2>
          </div>
        ) : fingerprint ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ShieldAlert size={32} style={{ color: 'var(--danger)' }} />
                <div>
                  <h2 style={{ margin: 0, color: '#fff' }}>Unique Trace Found</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Websites can track you using this exact profile across the web.</p>
                </div>
              </div>
              <button className="btn-primary" onClick={exportReport} style={{ background: 'transparent', border: '1px solid var(--border)' }}>
                <Download size={18} /> Export JSON
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
              
              {renderSection('Software & Browser', <Globe size={20} />, {
                BrowserEngine: fingerprint.vendor,
                PlatformOS: fingerprint.platform,
                Language: fingerprint.language,
                UserAgent: fingerprint.userAgent,
                CookiesEnabled: fingerprint.cookieEnabled,
                DoNotTrack: fingerprint.doNotTrack
              })}

              {renderSection('Hardware & Display', <Monitor size={20} />, {
                CPU_Cores: fingerprint.cores,
                RAM_Estimate: fingerprint.memory,
                Resolution: `${fingerprint.screenWidth}x${fingerprint.screenHeight}`,
                ColorDepth: `${fingerprint.colorDepth}-bit`,
                PixelRatio: fingerprint.pixelRatio
              })}

              {renderSection('Network & Location', <Activity size={20} />, {
                IP_Address: fingerprint.ip,
                ISP_Organization: fingerprint.isp,
                Location: fingerprint.location,
                Timezone: fingerprint.timezone,
                TimezoneOffset: fingerprint.timezoneOffset
              })}

              {renderSection('Advanced Tracing', <Fingerprint size={20} />, {
                CanvasHash: fingerprint.canvasHash,
                WebRTC_Leak: 'Check Pending',
                FontsScanned: 'Hidden',
              })}

            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--danger)', padding: '3rem' }}>
            Failed to gather fingerprint data.
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default BrowserFingerprint;
