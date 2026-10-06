import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, ArrowRight, Download, Copy, AlertCircle } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const JSONToCSV = () => {
  const [jsonInput, setJsonInput] = useState('[\n  {\n    "id": 1,\n    "name": "John Doe",\n    "role": "Developer"\n  },\n  {\n    "id": 2,\n    "name": "Jane Smith",\n    "role": "Designer"\n  }\n]');
  const [csvOutput, setCsvOutput] = useState('');
  const [error, setError] = useState(null);

  const showToast = useToast();

  const handleConvert = () => {
    try {
      if (!jsonInput.trim()) {
        setCsvOutput('');
        setError(null);
        return;
      }

      let data = JSON.parse(jsonInput);
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        if (typeof data === 'object') {
          data = [data]; // wrap single object in array
        } else {
          throw new Error('Input must be a JSON array of objects.');
        }
      }

      if (data.length === 0) {
        setCsvOutput('');
        setError(null);
        return;
      }

      // Get all unique headers
      const headersSet = new Set();
      data.forEach(obj => {
        if (typeof obj !== 'object' || obj === null) return;
        Object.keys(obj).forEach(key => headersSet.add(key));
      });
      const headers = Array.from(headersSet);

      if (headers.length === 0) {
        throw new Error('No valid fields found to create CSV columns.');
      }

      const csvRows = [];
      csvRows.push(headers.join(',')); // Add header row

      data.forEach(row => {
        if (typeof row !== 'object' || row === null) return;
        
        const values = headers.map(header => {
          let val = row[header];
          
          if (val === null || val === undefined) {
            val = '';
          } else if (typeof val === 'object') {
            val = JSON.stringify(val);
          } else {
            val = String(val);
          }

          // Escape quotes and wrap in quotes if necessary
          val = val.replace(/"/g, '""');
          if (val.search(/("|,|\n)/g) >= 0) {
            val = `"${val}"`;
          }
          return val;
        });

        csvRows.push(values.join(','));
      });

      setCsvOutput(csvRows.join('\n'));
      setError(null);
      showToast('Successfully converted JSON to CSV', 'success');
    } catch (err) {
      setCsvOutput('');
      setError(err.message);
    }
  };

  const handleCopy = () => {
    if (!csvOutput) return;
    navigator.clipboard.writeText(csvOutput);
    showToast('CSV Copied!', 'success');
  };

  const handleDownload = () => {
    if (!csvOutput) return;
    const blob = new Blob([csvOutput], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloading CSV file', 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="JSON to CSV Converter" subtitle="Convert JSON data arrays to downloadable CSV spreadsheets instantly" />

      <div className="glass-card" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: '#f59e0b', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>INPUT JSON (ARRAY OF OBJECTS)</span>
            </label>
            <textarea 
              className="textarea-glass"
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setError(null);
              }}
              style={{ height: '400px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}
              placeholder={`[\n  { "key": "value" }\n]`}
            />
            {error && (
              <div style={{ color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>

          <button className="icon-btn" onClick={handleConvert} style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--accent)', color: '#fff' }} title="Convert to CSV">
            <ArrowRight size={24} />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>OUTPUT CSV</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="icon-btn" onClick={handleCopy} disabled={!csvOutput} style={{ padding: 0 }} title="Copy">
                  <Copy size={16} />
                </button>
                <button className="icon-btn" onClick={handleDownload} disabled={!csvOutput} style={{ padding: 0 }} title="Download">
                  <Download size={16} />
                </button>
              </div>
            </label>
            <textarea 
              className="textarea-glass"
              readOnly
              value={csvOutput}
              style={{ height: '400px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', whiteSpace: 'pre' }}
              placeholder="id,name,role..."
            />
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default JSONToCSV;
