import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Copy, Eye, EyeOff } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';

const PasswordStrength = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Very basic local entropy calculation (without installing zxcvbn)
  const calculateEntropy = (pwd) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'var(--text-muted)' };
    
    let pool = 0;
    if (/[a-z]/.test(pwd)) pool += 26;
    if (/[A-Z]/.test(pwd)) pool += 26;
    if (/[0-9]/.test(pwd)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) pool += 32;

    const entropy = pwd.length * Math.log2(pool || 1);
    
    if (entropy < 28) return { score: 1, label: 'Very Weak', color: '#ef4444', percent: 20 };
    if (entropy < 36) return { score: 2, label: 'Weak', color: '#f97316', percent: 40 };
    if (entropy < 60) return { score: 3, label: 'Reasonable', color: '#facc15', percent: 60 };
    if (entropy < 128) return { score: 4, label: 'Strong', color: '#4ade80', percent: 80 };
    return { score: 5, label: 'Very Strong', color: '#10b981', percent: 100 };
  };

  const getCrackTime = (pwd) => {
    if (!pwd) return 'Instant';
    let pool = 0;
    if (/[a-z]/.test(pwd)) pool += 26;
    if (/[A-Z]/.test(pwd)) pool += 26;
    if (/[0-9]/.test(pwd)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) pool += 32;
    
    // Assume 100 billion guesses per second (modern GPU cluster)
    const combinations = Math.pow(pool, pwd.length);
    const seconds = combinations / 1e11;
    
    if (seconds < 1) return 'Instantly';
    if (seconds < 60) return 'Seconds';
    if (seconds < 3600) return 'Minutes';
    if (seconds < 86400) return 'Hours';
    if (seconds < 31536000) return 'Days';
    if (seconds < 31536000 * 100) return 'Years';
    return 'Centuries';
  };

  const strength = calculateEntropy(password);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Password Strength Analyzer" subtitle="Test how long it would take hackers to crack your password" />

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <input 
            type={showPassword ? "text" : "password"}
            className="input-glass"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type a password to test..."
            style={{ width: '100%', fontSize: '1.2rem', paddingRight: '3rem' }}
          />
          <button 
            className="icon-btn" 
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {password && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Strength Score</span>
                <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.label}</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
                  transition={{ duration: 0.3 }}
                  style={{ height: '100%' }}
                />
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Time to crack (100B guesses/sec):</div>
              <div style={{ fontSize: '2rem', color: strength.color, fontWeight: 'bold' }}>
                {getCrackTime(password)}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', justifyContent: 'center' }}>
              <span>Length: {password.length}</span>
              <span>•</span>
              <span>Uppercase: {/[A-Z]/.test(password) ? 'Yes' : 'No'}</span>
              <span>•</span>
              <span>Numbers: {/[0-9]/.test(password) ? 'Yes' : 'No'}</span>
              <span>•</span>
              <span>Symbols: {/[^a-zA-Z0-9]/.test(password) ? 'Yes' : 'No'}</span>
            </div>

          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default PasswordStrength;
