import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Download, RefreshCw } from 'lucide-react';
import { faker } from '@faker-js/faker';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const FakeDataGenerator = () => {
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState('JSON');
  const [data, setData] = useState('');

  const showToast = useToast();

  const generateData = () => {
    let mockData = [];
    for (let i = 0; i < count; i++) {
      mockData.push({
        id: faker.string.uuid(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        jobTitle: faker.person.jobTitle(),
        company: faker.company.name(),
        city: faker.location.city(),
        country: faker.location.country()
      });
    }

    if (format === 'JSON') {
      setData(JSON.stringify(mockData, null, 2));
    } else if (format === 'CSV') {
      const header = 'id,firstName,lastName,email,phone,jobTitle,company,city,country\n';
      const rows = mockData.map(row => 
        `${row.id},"${row.firstName}","${row.lastName}","${row.email}","${row.phone}","${row.jobTitle}","${row.company}","${row.city}","${row.country}"`
      ).join('\n');
      setData(header + rows);
    }
  };

  // Generate on first load
  React.useEffect(() => {
    generateData();
    // eslint-disable-next-line
  }, [format, count]);

  const handleCopy = () => {
    navigator.clipboard.writeText(data);
    showToast(`${format} Data Copied!`, 'success');
  };

  const handleDownload = () => {
    const mimeType = format === 'JSON' ? 'application/json' : 'text/csv';
    const ext = format === 'JSON' ? 'json' : 'csv';
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock_data_${count}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloading ${ext}`, 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Fake Data Generator" subtitle="Generate large datasets of realistic mock user data for testing" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1.5rem', alignItems: 'flex-end', background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,255,255,0.2)' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>NUMBER OF ROWS</label>
            <select className="input-glass" value={count} onChange={(e) => setCount(parseInt(e.target.value))} style={{ cursor: 'pointer' }}>
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>OUTPUT FORMAT</label>
            <select className="input-glass" value={format} onChange={(e) => setFormat(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="JSON">JSON</option>
              <option value="CSV">CSV</option>
            </select>
          </div>

          <button className="btn-primary" onClick={generateData} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '56px' }}>
            <RefreshCw size={20} /> Regenerate
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>MOCK DATA ({format})</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="icon-btn" onClick={handleCopy} title="Copy Data">
                <Copy size={16} />
              </button>
              <button className="icon-btn" onClick={handleDownload} title="Download File">
                <Download size={16} />
              </button>
            </div>
          </div>
          <textarea 
            className="textarea-glass"
            value={data}
            readOnly
            style={{ height: '400px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
          />
        </div>

      </div>
    </motion.div>
  );
};

export default FakeDataGenerator;
