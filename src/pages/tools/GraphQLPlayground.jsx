import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Code2, Server, Key, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const DEFAULT_QUERY = `query GetUser {
  user(id: "123") {
    id
    name
    email
    posts {
      title
      createdAt
    }
  }
}`;

const GraphQLPlayground = () => {
  const [endpoint, setEndpoint] = useState('https://countries.trevorblades.com/graphql');
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [headers, setHeaders] = useState('{"Content-Type": "application/json"}');
  const [variables, setVariables] = useState('{}');
  
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const showToast = useToast();
  const showSupport = useSupport();

  const handleExecute = async () => {
    if (!endpoint.trim()) {
      showToast('Please enter a GraphQL endpoint URL.', 'error');
      return;
    }

    setIsLoading(true);
    setResponse('Sending request...');

    try {
      let parsedHeaders = {};
      let parsedVariables = {};
      
      try { parsedHeaders = JSON.parse(headers); } catch (e) { throw new Error('Invalid Headers JSON'); }
      try { parsedVariables = JSON.parse(variables); } catch (e) { throw new Error('Invalid Variables JSON'); }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: parsedHeaders,
        body: JSON.stringify({
          query,
          variables: parsedVariables
        })
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      
      if (Math.random() < 0.2) setTimeout(showSupport, 2000);
      
    } catch (err) {
      setResponse(`Error: ${err.message}\n\nMake sure the endpoint supports CORS if calling directly from the browser.`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    if (!response || response === 'Sending request...') return;
    navigator.clipboard.writeText(response);
    setIsCopied(true);
    showToast('Response copied to clipboard', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const prettify = (setter, val, type) => {
    try {
      const obj = JSON.parse(val);
      setter(JSON.stringify(obj, null, 2));
      showToast(`${type} prettified!`, 'success');
    } catch {
      showToast(`Invalid JSON in ${type}`, 'error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '9s', maxWidth: '1200px' }}
    >
      <ToolHeader 
        title="GraphQL Playground" 
        subtitle="A sleek, browser-based GraphQL client to query APIs directly." 
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Endpoint Config */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
              <Server size={16} /> ENDPOINT URL
            </label>
            <input 
              type="text" 
              className="input-glass" 
              placeholder="https://api.example.com/graphql"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <button 
            className="btn-primary"
            onClick={handleExecute}
            disabled={isLoading}
            style={{ padding: '0.8rem 2rem', height: '48px', justifyContent: 'center' }}
          >
            {isLoading ? <RefreshCw className="spin" size={18} /> : <Play size={18} />}
            {isLoading ? 'Executing...' : 'Run Query'}
          </button>
        </div>

        {/* Main Editor Area */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          
          {/* Left Column: Query & Variables */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Code2 size={16} /> QUERY
                </span>
              </div>
              <textarea 
                className="textarea-glass"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ border: 'none', borderRadius: 0, minHeight: '300px', padding: '1rem', fontSize: '0.9rem', flex: 1 }}
                spellCheck="false"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>VARIABLES (JSON)</span>
                  <button onClick={() => prettify(setVariables, variables, 'Variables')} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem' }}>Prettify</button>
                </div>
                <textarea 
                  className="textarea-glass"
                  value={variables}
                  onChange={(e) => setVariables(e.target.value)}
                  style={{ border: 'none', borderRadius: 0, minHeight: '150px', padding: '1rem', fontSize: '0.85rem' }}
                  spellCheck="false"
                />
              </div>

              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>HEADERS (JSON)</span>
                  <button onClick={() => prettify(setHeaders, headers, 'Headers')} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem' }}>Prettify</button>
                </div>
                <textarea 
                  className="textarea-glass"
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  style={{ border: 'none', borderRadius: 0, minHeight: '150px', padding: '1rem', fontSize: '0.85rem' }}
                  spellCheck="false"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Response */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>RESPONSE</span>
              <button 
                onClick={copyResponse} 
                style={{ background: 'transparent', border: 'none', color: isCopied ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {isCopied ? <CheckCircle size={14} /> : <Copy size={14} />} {isCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            
            <div style={{ flex: 1, position: 'relative' }}>
              {!response && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <Play size={48} style={{ opacity: 0.2 }} />
                  <span>Hit "Run Query" to see results here.</span>
                </div>
              )}
              <textarea 
                className="textarea-glass"
                value={response}
                readOnly
                style={{ border: 'none', borderRadius: 0, height: '100%', minHeight: '500px', padding: '1rem', fontSize: '0.9rem', color: response.startsWith('Error') ? 'var(--danger)' : '#e2e8f0', background: 'transparent' }}
                spellCheck="false"
              />
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default GraphQLPlayground;
