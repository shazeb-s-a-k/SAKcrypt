import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Activity, Globe, CheckCircle, XCircle } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const CORSTester = () => {
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts');
  const [method, setMethod] = useState('GET');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const showToast = useToast();

  const testCORS = async () => {
    if (!url.trim()) {
      showToast('Please enter a URL to test', 'error');
      return;
    }
    if (!url.startsWith('http')) {
      showToast('URL must start with http:// or https://', 'error');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // We will perform a real fetch from the browser to test CORS.
      const startTime = performance.now();
      const response = await fetch(url, {
        method: method,
        headers: {
          'Accept': 'application/json, text/plain, */*'
        }
      });
      const endTime = performance.now();

      setResult({
        success: true,
        status: response.status,
        statusText: response.statusText,
        time: Math.round(endTime - startTime),
        corsHeader: response.headers.get('access-control-allow-origin') || 'Not Set (But allowed by browser)',
        message: 'Request succeeded! The endpoint allows CORS requests from this domain.'
      });
      showToast('CORS test passed!', 'success');
    } catch (err) {
      // A TypeError on fetch usually means a CORS failure (or network error).
      setResult({
        success: false,
        error: err.message,
        message: 'Request failed! This is typically caused by the server not returning an Access-Control-Allow-Origin header.'
      });
      showToast('CORS test failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container"
      style={{ maxWidth: '800px' }}
    >
      <ToolHeader 
        title="CORS Tester" 
        subtitle="Test Cross-Origin Resource Sharing directly from your browser."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Input Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <Globe size={16} /> Target API URL
              </label>
              <input 
                type="text" 
                className="input-glass"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/data"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ width: '120px' }}>
              <label style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Method</label>
              <select 
                className="input-glass"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
            </div>
          </div>

          <button className="btn-primary" onClick={testCORS} disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? <Activity className="spin" size={18} /> : <Network size={18} />}
            {loading ? 'Testing CORS...' : 'Send Test Request'}
          </button>
        </div>

        {/* Result Area */}
        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card" 
            style={{ 
              borderColor: result.success ? 'var(--success)' : 'var(--danger)',
              background: result.success ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              {result.success ? <CheckCircle size={32} style={{ color: 'var(--success)' }} /> : <XCircle size={32} style={{ color: 'var(--danger)' }} />}
              <div>
                <h2 style={{ margin: 0, color: result.success ? 'var(--success)' : 'var(--danger)' }}>
                  {result.success ? 'CORS Allowed' : 'CORS Blocked'}
                </h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{result.message}</p>
              </div>
            </div>

            {result.success ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>HTTP Status</div>
                  <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 'bold' }}>{result.status} {result.statusText}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Response Time</div>
                  <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 'bold' }}>{result.time} ms</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', gridColumn: '1 / -1' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Access-Control-Allow-Origin</div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{result.corsHeader}</div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--danger)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Error Details</div>
                <code style={{ color: '#ef4444', fontFamily: 'var(--font-mono)' }}>{result.error}</code>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem', marginBottom: 0 }}>
                  * The browser blocked the request because the server did not explicitly allow this origin (https://your-domain.com).
                </p>
              </div>
            )}
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default CORSTester;
