import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Copy, Info } from 'lucide-react';
import cronstrue from 'cronstrue';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const CronJobParser = () => {
  const [cronExp, setCronExp] = useState('*/5 * * * *');
  const showToast = useToast();
  const showSupport = useSupport();

  let explanation = '';
  let error = '';

  if (cronExp.trim()) {
    try {
      explanation = cronstrue.toString(cronExp.trim(), { use24HourTimeFormat: true });
    } catch (err) {
      error = err.toString();
    }
  }

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    showToast('Explanation copied!', 'success');
    setTimeout(showSupport, 1000);
  };

  const templates = [
    { label: 'Every 5 minutes', val: '*/5 * * * *' },
    { label: 'Every hour at minute 0', val: '0 * * * *' },
    { label: 'Every day at midnight', val: '0 0 * * *' },
    { label: 'Every Monday at 9AM', val: '0 9 * * 1' },
    { label: 'Every month on the 1st', val: '0 0 1 * *' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Cron Job Parser" subtitle="Translate complex cron schedule expressions into readable English" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>CRON EXPRESSION</label>
          <input 
            type="text"
            className="input-glass"
            value={cronExp}
            onChange={(e) => setCronExp(e.target.value)}
            placeholder="e.g. * * * * *"
            style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', letterSpacing: '2px', textAlign: 'center' }}
          />
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {error ? (
            <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={20} />
              <span>Invalid Cron Expression</span>
            </div>
          ) : explanation ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>"{explanation}"</span>
              <button className="btn-primary" onClick={handleCopy} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '0.4rem 1rem' }}>
                <Copy size={16} /> Copy Text
              </button>
            </motion.div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Enter an expression above to see its schedule.</span>
          )}
        </div>

        <div>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.85rem' }}>COMMON TEMPLATES</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {templates.map((t, i) => (
              <button 
                key={i} 
                className="btn-primary" 
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                onClick={() => setCronExp(t.val)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default CronJobParser;
