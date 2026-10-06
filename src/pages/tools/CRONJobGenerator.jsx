import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Copy } from 'lucide-react';
import cronstrue from 'cronstrue';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const CRONJobGenerator = () => {
  const [cron, setCron] = useState('* * * * *');
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState(null);

  const [minute, setMinute] = useState('*');
  const [hour, setHour] = useState('*');
  const [dayOfMonth, setDayOfMonth] = useState('*');
  const [month, setMonth] = useState('*');
  const [dayOfWeek, setDayOfWeek] = useState('*');

  const showToast = useToast();
  const showSupport = useSupport();

  useEffect(() => {
    const newCron = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    setCron(newCron);
    try {
      setExplanation(cronstrue.toString(newCron));
      setError(null);
    } catch (e) {
      setExplanation('');
      setError('Invalid CRON expression format');
    }
  }, [minute, hour, dayOfMonth, month, dayOfWeek]);

  const handleCronInput = (e) => {
    const val = e.target.value;
    setCron(val);
    const parts = val.split(' ');
    if (parts.length >= 5) {
      setMinute(parts[0]);
      setHour(parts[1]);
      setDayOfMonth(parts[2]);
      setMonth(parts[3]);
      setDayOfWeek(parts[4]);
    }
    
    try {
      setExplanation(cronstrue.toString(val));
      setError(null);
    } catch (err) {
      setExplanation('');
      setError('Invalid CRON expression');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cron);
    showToast('CRON Copied!', 'success');
    setTimeout(showSupport, 1000);
  };

  const presets = [
    { label: 'Every Minute', value: '* * * * *' },
    { label: 'Every 5 Minutes', value: '*/5 * * * *' },
    { label: 'Every Hour', value: '0 * * * *' },
    { label: 'Every Day at Midnight', value: '0 0 * * *' },
    { label: 'Every Monday', value: '0 0 * * 1' },
    { label: '1st of Every Month', value: '0 0 1 * *' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="CRON Expression Generator" subtitle="Generate, decode, and explain complex CRON schedules in plain English" />

      <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ background: 'rgba(0, 255, 255, 0.05)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(0, 255, 255, 0.2)', textAlign: 'center' }}>
          <input 
            type="text" 
            className="input-glass"
            value={cron}
            onChange={handleCronInput}
            style={{ fontSize: '2.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)', letterSpacing: '4px', background: 'transparent', border: 'none', boxShadow: 'none', color: '#00ffff' }}
          />
          {error ? (
            <p style={{ color: 'var(--danger)', margin: '1rem 0 0 0', fontWeight: 'bold' }}>{error}</p>
          ) : (
            <p style={{ color: 'var(--primary)', margin: '1rem 0 0 0', fontSize: '1.2rem', fontWeight: 'bold' }}>"{explanation}"</p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>MINUTE (0-59)</label>
            <input type="text" className="input-glass" value={minute} onChange={e => setMinute(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>HOUR (0-23)</label>
            <input type="text" className="input-glass" value={hour} onChange={e => setHour(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>DAY OF MONTH (1-31)</label>
            <input type="text" className="input-glass" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>MONTH (1-12)</label>
            <input type="text" className="input-glass" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>DAY OF WEEK (0-6)</label>
            <input type="text" className="input-glass" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>COMMON PRESETS</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {presets.map(p => (
              <button 
                key={p.value} 
                className="btn-secondary" 
                onClick={() => {
                  const parts = p.value.split(' ');
                  setMinute(parts[0]); setHour(parts[1]); setDayOfMonth(parts[2]); setMonth(parts[3]); setDayOfWeek(parts[4]);
                }}
                style={{ fontSize: '0.85rem' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={handleCopy} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <Copy size={20} /> Copy CRON Expression
        </button>

      </div>
    </motion.div>
  );
};

export default CRONJobGenerator;
