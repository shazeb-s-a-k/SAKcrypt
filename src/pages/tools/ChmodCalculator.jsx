import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Copy } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const ChmodCalculator = () => {
  const [permissions, setPermissions] = useState({
    owner: { read: true, write: true, execute: false },
    group: { read: true, write: false, execute: false },
    public: { read: true, write: false, execute: false }
  });

  const [octal, setOctal] = useState('644');
  const [symbolic, setSymbolic] = useState('-rw-r--r--');

  const showToast = useToast();

  const calculatePermissions = () => {
    let oct = '';
    let sym = '-';

    ['owner', 'group', 'public'].forEach(role => {
      let value = 0;
      if (permissions[role].read) { value += 4; sym += 'r'; } else { sym += '-'; }
      if (permissions[role].write) { value += 2; sym += 'w'; } else { sym += '-'; }
      if (permissions[role].execute) { value += 1; sym += 'x'; } else { sym += '-'; }
      oct += value.toString();
    });

    setOctal(oct);
    setSymbolic(sym);
  };

  useEffect(() => {
    calculatePermissions();
    // eslint-disable-next-line
  }, [permissions]);

  const togglePermission = (role, type) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [type]: !prev[role][type]
      }
    }));
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${text}`, 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Chmod Calculator" subtitle="Convert Linux file permissions between octal and symbolic formats" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {['owner', 'group', 'public'].map(role => (
            <div key={role} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ textTransform: 'uppercase', color: 'var(--primary)', marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>{role}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={permissions[role].read} onChange={() => togglePermission(role, 'read')} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
                  <span>Read (4)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={permissions[role].write} onChange={() => togglePermission(role, 'write')} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
                  <span>Write (2)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={permissions[role].execute} onChange={() => togglePermission(role, 'execute')} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
                  <span>Execute (1)</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem' }}>OCTAL</div>
              <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{octal}</div>
            </div>
            <button className="icon-btn" onClick={() => handleCopy(octal)} title="Copy Octal">
              <Copy size={24} />
            </button>
          </div>

          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#818cf8', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem' }}>SYMBOLIC</div>
              <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', letterSpacing: '2px' }}>{symbolic}</div>
            </div>
            <button className="icon-btn" onClick={() => handleCopy(symbolic)} title="Copy Symbolic">
              <Copy size={24} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'bold' }}>COMMON COMMANDS</label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '0.5rem 0' }}>
            <code style={{ fontFamily: 'var(--font-mono)' }}>chmod {octal} file.txt</code>
            <button className="icon-btn" onClick={() => handleCopy(`chmod ${octal} file.txt`)}><Copy size={14}/></button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
            <code style={{ fontFamily: 'var(--font-mono)' }}>chmod -R {octal} directory/</code>
            <button className="icon-btn" onClick={() => handleCopy(`chmod -R ${octal} directory/`)}><Copy size={14}/></button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default ChmodCalculator;
