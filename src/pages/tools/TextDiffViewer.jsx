import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileDiff, ArrowRightLeft, RefreshCcw } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';

const TextDiffViewer = () => {
  const [textA, setTextA] = useState('function calculateSum(a, b) {\n  return a + b;\n}\n\nconsole.log(calculateSum(5, 10));');
  const [textB, setTextB] = useState('function calculateSum(a, b) {\n  // Returns the sum of two numbers\n  return a + b;\n}\n\nconsole.log(calculateSum(5, 20));');
  
  // A naive but fast line-by-line diff algorithm for demonstration
  const generateDiff = () => {
    const linesA = textA.split('\\n');
    const linesB = textB.split('\\n');
    const result = [];
    
    let i = 0;
    let j = 0;
    
    while (i < linesA.length || j < linesB.length) {
      if (i < linesA.length && j < linesB.length && linesA[i] === linesB[j]) {
        result.push({ type: 'unchanged', text: linesA[i] });
        i++; j++;
      } else if (j < linesB.length && !linesA.includes(linesB[j])) {
        result.push({ type: 'added', text: linesB[j] });
        j++;
      } else if (i < linesA.length && !linesB.includes(linesA[i])) {
        result.push({ type: 'removed', text: linesA[i] });
        i++;
      } else {
        // Fallback for modifications on the same line (treated as remove then add)
        if (i < linesA.length) { result.push({ type: 'removed', text: linesA[i] }); i++; }
        if (j < linesB.length) { result.push({ type: 'added', text: linesB[j] }); j++; }
      }
    }
    return result;
  };

  const clearAll = () => {
    setTextA('');
    setTextB('');
  };

  const diffResult = generateDiff();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container"
      style={{ maxWidth: '1200px' }}
    >
      <ToolHeader 
        title="Text Diff Viewer" 
        subtitle="Compare two blocks of text or code to instantly spot differences."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Input Areas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
          
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Original Text (A)
            </div>
            <textarea 
              className="input-glass"
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              placeholder="Paste original text here..."
              style={{ width: '100%', height: '200px', border: 'none', borderRadius: 0, fontFamily: 'var(--font-mono)', resize: 'vertical' }}
            />
          </div>

          <button onClick={clearAll} style={{ background: 'var(--surface-color)', border: '1px solid var(--border)', color: 'var(--danger)', padding: '0.8rem', borderRadius: '50%', cursor: 'pointer' }} title="Clear Both">
            <RefreshCcw size={20} />
          </button>

          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Modified Text (B)
            </div>
            <textarea 
              className="input-glass"
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              placeholder="Paste modified text here..."
              style={{ width: '100%', height: '200px', border: 'none', borderRadius: 0, fontFamily: 'var(--font-mono)', resize: 'vertical' }}
            />
          </div>

        </div>

        {/* Diff Output */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <FileDiff size={18} /> <span>Diff Analysis</span>
          </div>
          <div style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', lineHeight: '1.6', overflowX: 'auto', background: '#0f172a' }}>
            {diffResult.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No differences found.</span>}
            
            {diffResult.map((line, idx) => {
              let bgColor = 'transparent';
              let color = '#cbd5e1';
              let prefix = '  ';

              if (line.type === 'added') {
                bgColor = 'rgba(16, 185, 129, 0.15)'; // Green
                color = '#10b981';
                prefix = '+ ';
              } else if (line.type === 'removed') {
                bgColor = 'rgba(239, 68, 68, 0.15)'; // Red
                color = '#ef4444';
                prefix = '- ';
              }

              return (
                <div key={idx} style={{ background: bgColor, color: color, padding: '0 0.5rem', display: 'flex', whiteSpace: 'pre' }}>
                  <span style={{ userSelect: 'none', opacity: 0.5, marginRight: '1rem', width: '20px' }}>{prefix}</span>
                  <span>{line.text || ' '}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default TextDiffViewer;
