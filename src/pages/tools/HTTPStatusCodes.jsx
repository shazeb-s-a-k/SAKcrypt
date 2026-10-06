import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Search, Info } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';

const statusCodes = {
  // 1xx
  100: { type: "Informational", name: "Continue", desc: "The server has received the request headers and the client should proceed to send the request body." },
  101: { type: "Informational", name: "Switching Protocols", desc: "The requester has asked the server to switch protocols and the server has agreed to do so." },
  // 2xx
  200: { type: "Success", name: "OK", desc: "Standard response for successful HTTP requests." },
  201: { type: "Success", name: "Created", desc: "The request has been fulfilled, resulting in the creation of a new resource." },
  204: { type: "Success", name: "No Content", desc: "The server successfully processed the request and is not returning any content." },
  // 3xx
  301: { type: "Redirection", name: "Moved Permanently", desc: "This and all future requests should be directed to the given URI." },
  302: { type: "Redirection", name: "Found", desc: "Tells the client to look at (browse to) another URL. 302 has been superseded by 303 and 307." },
  304: { type: "Redirection", name: "Not Modified", desc: "Indicates that the resource has not been modified since the version specified by the request headers If-Modified-Since or If-None-Match." },
  // 4xx
  400: { type: "Client Error", name: "Bad Request", desc: "The server cannot or will not process the request due to an apparent client error (e.g., malformed request syntax)." },
  401: { type: "Client Error", name: "Unauthorized", desc: "Similar to 403 Forbidden, but specifically for use when authentication is required and has failed or has not yet been provided." },
  403: { type: "Client Error", name: "Forbidden", desc: "The request contained valid data and was understood by the server, but the server is refusing action. Authentication will not help." },
  404: { type: "Client Error", name: "Not Found", desc: "The requested resource could not be found but may be available in the future." },
  405: { type: "Client Error", name: "Method Not Allowed", desc: "A request method is not supported for the requested resource." },
  429: { type: "Client Error", name: "Too Many Requests", desc: "The user has sent too many requests in a given amount of time. Intended for use with rate-limiting schemes." },
  // 5xx
  500: { type: "Server Error", name: "Internal Server Error", desc: "A generic error message, given when an unexpected condition was encountered and no more specific message is suitable." },
  502: { type: "Server Error", name: "Bad Gateway", desc: "The server was acting as a gateway or proxy and received an invalid response from the upstream server." },
  503: { type: "Server Error", name: "Service Unavailable", desc: "The server cannot handle the request (because it is overloaded or down for maintenance)." },
  504: { type: "Server Error", name: "Gateway Timeout", desc: "The server was acting as a gateway or proxy and did not receive a timely response from the upstream server." }
};

const getColor = (code) => {
  if (code >= 200 && code < 300) return '#10b981';
  if (code >= 300 && code < 400) return '#3b82f6';
  if (code >= 400 && code < 500) return '#f59e0b';
  if (code >= 500) return '#ef4444';
  return '#94a3b8';
};

const HTTPStatusCodes = () => {
  const [search, setSearch] = useState('');

  const filteredCodes = Object.entries(statusCodes).filter(([code, data]) => {
    const q = search.toLowerCase();
    return code.includes(q) || data.name.toLowerCase().includes(q) || data.desc.toLowerCase().includes(q);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="HTTP Status Codes" subtitle="Quickly lookup HTTP status codes and their detailed meanings" />

      <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="input-glass"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search codes, names, or descriptions... (e.g. 404, Not Found)"
            style={{ width: '100%', paddingLeft: '3rem', fontSize: '1.1rem' }}
          />
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <AnimatePresence>
            {filteredCodes.map(([code, data]) => (
              <motion.div 
                key={code}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border)', 
                  borderLeft: `4px solid ${getColor(code)}`,
                  borderRadius: '8px', 
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '2rem', color: getColor(code) }}>{code}</h2>
                    <h3 style={{ margin: 0, color: '#fff' }}>{data.name}</h3>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                    {data.type}
                  </span>
                </div>
                <p style={{ margin: 0, color: 'var(--secondary)', lineHeight: '1.5' }}>
                  {data.desc}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredCodes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Info size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <p>No status codes found matching your search.</p>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};

export default HTTPStatusCodes;
