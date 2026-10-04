import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const CyberVault = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [strength, setStrength] = useState(0);
  const showToast = useToast();
  const showSupport = useSupport();

  const generatePassword = () => {
    let charset = '';
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    if (charset === '') charset = 'abcdefghijklmnopqrstuvwxyz'; // fallback

    let newPassword = '';
    for (let i = 0, n = charset.length; i < length; ++i) {
      newPassword += charset.charAt(Math.floor(Math.random() * n));
    }
    setPassword(newPassword);
    evaluateStrength(newPassword);
  };

  const evaluateStrength = (pass) => {
    let score = 0;
    if (pass.length > 8) score += 1;
    if (pass.length > 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    setStrength(score);
  };

  useEffect(() => {
    generatePassword();
  }, [length, options]);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    showToast('Password copied to clipboard', 'success');
    setTimeout(showSupport, 1000);
  };

  const toggleOption = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getStrengthColor = () => {
    if (strength <= 2) return 'var(--danger)';
    if (strength <= 4) return 'var(--warning)';
    return 'var(--success)';
  };

  const getStrengthLabel = () => {
    if (strength <= 2) return { text: 'Weak', icon: <AlertTriangle size={16} /> };
    if (strength <= 4) return { text: 'Good', icon: <CheckCircle size={16} /> };
    return { text: 'Strong', icon: <Shield size={16} /> };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '8s' }}
    >
      <ToolHeader title="Cyber Vault" subtitle="Generate hyper-secure passwords" />

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Password Display */}
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <input 
            className="input-glass" 
            value={password} 
            readOnly 
            style={{ 
              fontSize: '1.5rem', 
              padding: '1.5rem', 
              textAlign: 'center',
              letterSpacing: '2px',
              fontFamily: 'var(--font-mono)'
            }} 
          />
          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.5rem' }}>
            <button className="btn-icon" onClick={generatePassword} title="Regenerate">
              <RefreshCw size={18} />
            </button>
            <button className="btn-icon" onClick={handleCopy} title="Copy">
              <Copy size={18} />
            </button>
          </div>
        </div>

        {/* Strength Indicator */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span>Password Strength</span>
            <span style={{ color: getStrengthColor(), display: 'flex', alignItems: 'center', gap: '4px' }}>
              {getStrengthLabel().icon} {getStrengthLabel().text}
            </span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${(strength / 5) * 100}%`, 
              background: getStrengthColor(),
              transition: 'all 0.3s ease'
            }} />
          </div>
        </div>

        {/* Length Slider */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <label>Length</label>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{length}</span>
          </div>
          <input 
            type="range" 
            min="8" 
            max="64" 
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
        </div>

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {Object.entries(options).map(([key, value]) => (
            <div 
              key={key}
              onClick={() => toggleOption(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: value ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${value ? 'var(--primary)' : 'var(--border-glass)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
            >
              <div style={{ 
                width: '18px', 
                height: '18px', 
                borderRadius: '4px', 
                background: value ? 'var(--primary)' : 'transparent',
                border: `2px solid ${value ? 'var(--primary)' : 'var(--text-muted)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {value && <CheckCircle size={12} color="white" />}
              </div>
              {key}
            </div>
          ))}
        </div>

      </div>
    </motion.div>
  );
};

export default CyberVault;
