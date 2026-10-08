import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Table, Plus, Minus, Copy, CheckCircle } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const MarkdownTableGen = () => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [data, setData] = useState(Array(3).fill('').map(() => Array(3).fill('')));
  const [alignments, setAlignments] = useState(Array(3).fill('left'));
  
  const [mdCode, setMdCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const showToast = useToast();

  // Resize the data array when rows or cols change
  useEffect(() => {
    const newData = Array(rows).fill('').map((_, rIndex) => {
      return Array(cols).fill('').map((_, cIndex) => {
        return data[rIndex] && data[rIndex][cIndex] !== undefined ? data[rIndex][cIndex] : '';
      });
    });
    setData(newData);

    const newAlign = Array(cols).fill('').map((_, cIndex) => {
      return alignments[cIndex] || 'left';
    });
    setAlignments(newAlign);
  }, [rows, cols]);

  // Generate MD code whenever data or alignments change
  useEffect(() => {
    if (data.length === 0 || data[0].length === 0) return;

    let md = '';
    
    // Header Row
    md += '| ' + data[0].join(' | ') + ' |\\n';
    
    // Alignment Row
    const alignRow = alignments.map(a => {
      if (a === 'left') return ':---';
      if (a === 'center') return ':---:';
      if (a === 'right') return '---:';
      return '---';
    });
    md += '| ' + alignRow.join(' | ') + ' |\\n';

    // Data Rows
    for (let i = 1; i < data.length; i++) {
      md += '| ' + data[i].join(' | ') + ' |\\n';
    }

    setMdCode(md);
  }, [data, alignments]);

  const updateCell = (r, c, val) => {
    const newData = [...data];
    newData[r][c] = val;
    setData(newData);
  };

  const updateAlignment = (c, val) => {
    const newAlign = [...alignments];
    newAlign[c] = val;
    setAlignments(newAlign);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mdCode);
    setIsCopied(true);
    showToast('Markdown table copied!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container"
      style={{ maxWidth: '1000px' }}
    >
      <ToolHeader 
        title="Markdown Table Generator" 
        subtitle="Visually create and format Github-flavored markdown tables."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Controls */}
        <div className="glass-card" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div>
            <label style={{ color: 'var(--text-muted)', marginRight: '1rem' }}>Rows</label>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setRows(Math.max(1, rows - 1))} className="btn-primary" style={{ padding: '0.5rem' }}><Minus size={16}/></button>
              <span style={{ fontFamily: 'var(--font-mono)', minWidth: '30px', textAlign: 'center' }}>{rows}</span>
              <button onClick={() => setRows(rows + 1)} className="btn-primary" style={{ padding: '0.5rem' }}><Plus size={16}/></button>
            </div>
          </div>
          <div>
            <label style={{ color: 'var(--text-muted)', marginRight: '1rem' }}>Columns</label>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setCols(Math.max(1, cols - 1))} className="btn-primary" style={{ padding: '0.5rem' }}><Minus size={16}/></button>
              <span style={{ fontFamily: 'var(--font-mono)', minWidth: '30px', textAlign: 'center' }}>{cols}</span>
              <button onClick={() => setCols(cols + 1)} className="btn-primary" style={{ padding: '0.5rem' }}><Plus size={16}/></button>
            </div>
          </div>
        </div>

        {/* Visual Table */}
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {/* Alignment Controls */}
              <tr>
                {alignments.map((align, cIndex) => (
                  <td key={cIndex} style={{ padding: '0.5rem' }}>
                    <select 
                      className="input-glass" 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem' }}
                      value={align}
                      onChange={(e) => updateAlignment(cIndex, e.target.value)}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </td>
                ))}
              </tr>
              {/* Headers */}
              <tr>
                {data.length > 0 && data[0].map((cell, cIndex) => (
                  <th key={cIndex} style={{ padding: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="input-glass" 
                      value={cell} 
                      onChange={(e) => updateCell(0, cIndex, e.target.value)}
                      placeholder={`Header ${cIndex + 1}`}
                      style={{ width: '100%', fontWeight: 'bold', background: 'rgba(255,255,255,0.05)' }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(1).map((row, rIndex) => (
                <tr key={rIndex + 1}>
                  {row.map((cell, cIndex) => (
                    <td key={cIndex} style={{ padding: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="input-glass" 
                        value={cell} 
                        onChange={(e) => updateCell(rIndex + 1, cIndex, e.target.value)}
                        placeholder={`Row ${rIndex + 1}`}
                        style={{ width: '100%' }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Output */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Markdown Output</span>
            <button 
              onClick={copyToClipboard}
              style={{ background: 'transparent', border: 'none', color: isCopied ? 'var(--success)' : 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
              {isCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre style={{ padding: '1rem', margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#e2e8f0', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {mdCode}
          </pre>
        </div>

      </div>
    </motion.div>
  );
};

export default MarkdownTableGen;
