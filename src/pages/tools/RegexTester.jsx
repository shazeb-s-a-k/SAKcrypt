import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import ToolHeader from '../../components/ToolHeader';

const RegexTester = () => {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pattern) {
      setMatches([]);
      setError(null);
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      setError(null);
      
      if (!testString) {
        setMatches([]);
        return;
      }

      if (flags.includes('g')) {
        const matchesArray = [...testString.matchAll(regex)];
        setMatches(matchesArray.map(m => m[0]));
      } else {
        const match = testString.match(regex);
        setMatches(match ? [match[0]] : []);
      }
    } catch (e) {
      setError(e.message);
      setMatches([]);
    }
  }, [pattern, flags, testString]);

  const renderHighlightedText = () => {
    if (!pattern || error || !testString) return testString;

    try {
      const regex = new RegExp(`(${pattern})`, flags);
      const parts = testString.split(regex);
      
      return parts.map((part, i) => {
        // If it's a match (based on standard split behavior with capture groups)
        const isMatch = matches.includes(part);
        return isMatch ? (
          <span key={i} style={{ backgroundColor: 'rgba(6, 182, 212, 0.4)', borderRadius: '2px', color: 'white' }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        );
      });
    } catch {
      return testString;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '9s' }}
    >
      <ToolHeader title="Regex Tester" subtitle="Test regular expressions in real-time" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {error && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--danger)'
          }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', borderRight: '1px solid var(--border-glass)' }}>
              /
            </div>
            <input 
              type="text"
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              placeholder="Enter regex pattern..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '0.75rem', outline: 'none', fontFamily: 'var(--font-mono)' }}
            />
            <div style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', borderLeft: '1px solid var(--border-glass)' }}>
              /
            </div>
            <input 
              type="text"
              value={flags}
              onChange={e => setFlags(e.target.value)}
              placeholder="flags"
              style={{ width: '60px', background: 'transparent', border: 'none', color: 'var(--secondary)', padding: '0.75rem', outline: 'none', fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>TEST STRING</label>
            <div style={{ position: 'relative' }}>
              <textarea 
                className="textarea-glass"
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="Enter string to test..."
                style={{ 
                  minHeight: '200px', 
                  color: 'transparent', 
                  caretColor: 'white',
                  background: 'transparent',
                  position: 'relative',
                  zIndex: 2
                }}
                spellCheck={false}
              />
              <div 
                className="textarea-glass"
                style={{ 
                  position: 'absolute', 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  minHeight: '200px', 
                  zIndex: 1, 
                  pointerEvents: 'none',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  color: 'var(--text-muted)'
                }}
              >
                {testString ? renderHighlightedText() : 'Enter string to test...'}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={16} /> MATCHES ({matches.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {matches.length === 0 ? (
                <span style={{ color: 'var(--text-muted)' }}>No matches found.</span>
              ) : (
                matches.map((match, i) => (
                  <span key={i} style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    color: 'var(--secondary)'
                  }}>
                    {match}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default RegexTester;
