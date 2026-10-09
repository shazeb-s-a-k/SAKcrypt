import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Server, Database, Container, Play, Copy, CheckCircle, Download, Plus, Trash2 } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const SERVICE_TEMPLATES = {
  node: {
    image: 'node:18-alpine',
    ports: ['3000:3000'],
    environment: ['NODE_ENV=production', 'PORT=3000'],
    volumes: ['./src:/usr/src/app/src'],
    command: 'npm start'
  },
  postgres: {
    image: 'postgres:15-alpine',
    ports: ['5432:5432'],
    environment: ['POSTGRES_USER=myuser', 'POSTGRES_PASSWORD=secret', 'POSTGRES_DB=mydb'],
    volumes: ['postgres_data:/var/lib/postgresql/data']
  },
  redis: {
    image: 'redis:7-alpine',
    ports: ['6379:6379'],
    command: 'redis-server --requirepass secret'
  },
  nginx: {
    image: 'nginx:alpine',
    ports: ['80:80', '443:443'],
    volumes: ['./nginx.conf:/etc/nginx/nginx.conf:ro']
  }
};

const DockerComposeGen = () => {
  const [services, setServices] = useState([
    { id: Date.now().toString(), name: 'api', type: 'node', config: { ...SERVICE_TEMPLATES.node } }
  ]);
  const [output, setOutput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const showToast = useToast();

  const addService = (type) => {
    const newService = {
      id: Date.now().toString() + Math.random(),
      name: `${type}_${services.length + 1}`,
      type: type,
      config: JSON.parse(JSON.stringify(SERVICE_TEMPLATES[type])) // deep copy
    };
    setServices([...services, newService]);
  };

  const removeService = (id) => {
    setServices(services.filter(s => s.id !== id));
  };

  const updateConfig = (id, field, value) => {
    setServices(services.map(s => {
      if (s.id === id) {
        if (field === 'name') return { ...s, name: value };
        return { ...s, config: { ...s.config, [field]: value } };
      }
      return s;
    }));
  };

  const generateYAML = () => {
    let yaml = `version: '3.8'\n\nservices:\n`;
    
    let hasNamedVolumes = false;
    let namedVolumes = new Set();

    services.forEach(s => {
      yaml += `  ${s.name}:\n`;
      yaml += `    image: ${s.config.image}\n`;
      
      if (s.config.ports && s.config.ports.length > 0) {
        yaml += `    ports:\n`;
        s.config.ports.forEach(p => yaml += `      - "${p}"\n`);
      }
      
      if (s.config.environment && s.config.environment.length > 0) {
        yaml += `    environment:\n`;
        s.config.environment.forEach(e => yaml += `      - ${e}\n`);
      }

      if (s.config.volumes && s.config.volumes.length > 0) {
        yaml += `    volumes:\n`;
        s.config.volumes.forEach(v => {
          yaml += `      - ${v}\n`;
          const volName = v.split(':')[0];
          if (!volName.startsWith('.') && !volName.startsWith('/')) {
            hasNamedVolumes = true;
            namedVolumes.add(volName);
          }
        });
      }

      if (s.config.command) {
        yaml += `    command: ${s.config.command}\n`;
      }
      
      yaml += `    restart: unless-stopped\n\n`;
    });

    if (hasNamedVolumes) {
      yaml += `volumes:\n`;
      namedVolumes.forEach(v => {
        yaml += `  ${v}:\n`;
      });
    }

    setOutput(yaml.trim());
  };

  useEffect(() => {
    generateYAML();
  }, [services]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setIsCopied(true);
    showToast('docker-compose.yml copied!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '8s', maxWidth: '1200px' }}
    >
      <ToolHeader 
        title="Docker Compose Builder" 
        subtitle="Visually construct multi-container docker-compose.yml files." 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Left: Builder Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Add Service Buttons */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', width: '100%', marginBottom: '0.5rem' }}>ADD SERVICE</span>
            <button className="btn-primary" onClick={() => addService('node')} style={{ background: 'var(--surface)', padding: '0.5rem 1rem' }}><Container size={14} /> Node.js</button>
            <button className="btn-primary" onClick={() => addService('postgres')} style={{ background: 'var(--surface)', padding: '0.5rem 1rem' }}><Database size={14} /> PostgreSQL</button>
            <button className="btn-primary" onClick={() => addService('redis')} style={{ background: 'var(--surface)', padding: '0.5rem 1rem' }}><Database size={14} /> Redis</button>
            <button className="btn-primary" onClick={() => addService('nginx')} style={{ background: 'var(--surface)', padding: '0.5rem 1rem' }}><Server size={14} /> Nginx</button>
          </div>

          {/* Service List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AnimatePresence>
              {services.map(s => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', borderLeft: '4px solid var(--accent)' }}>
                    
                    <button 
                      onClick={() => removeService(s.id)}
                      style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>SERVICE NAME</label>
                        <input className="input-glass" value={s.name} onChange={(e) => updateConfig(s.id, 'name', e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>IMAGE</label>
                        <input className="input-glass" value={s.config.image} onChange={(e) => updateConfig(s.id, 'image', e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PORTS (comma separated)</label>
                        <input className="input-glass" value={s.config.ports ? s.config.ports.join(', ') : ''} onChange={(e) => updateConfig(s.id, 'ports', e.target.value.split(',').map(x => x.trim()).filter(x => x))} style={{ width: '100%', padding: '0.5rem' }} />
                      </div>
                      
                      {s.config.environment && (
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ENVIRONMENT (comma separated)</label>
                          <input className="input-glass" value={s.config.environment.join(', ')} onChange={(e) => updateConfig(s.id, 'environment', e.target.value.split(',').map(x => x.trim()).filter(x => x))} style={{ width: '100%', padding: '0.5rem' }} />
                        </div>
                      )}
                      
                      {s.config.volumes && (
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VOLUMES (comma separated)</label>
                          <input className="input-glass" value={s.config.volumes.join(', ')} onChange={(e) => updateConfig(s.id, 'volumes', e.target.value.split(',').map(x => x.trim()).filter(x => x))} style={{ width: '100%', padding: '0.5rem' }} />
                        </div>
                      )}
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {services.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Add a service to start building.
              </div>
            )}
          </div>
        </div>

        {/* Right: YAML Output */}
        <div className="glass-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>docker-compose.yml</span>
            <button 
              onClick={copyToClipboard} 
              style={{ background: 'transparent', border: 'none', color: isCopied ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              {isCopied ? <CheckCircle size={14} /> : <Copy size={14} />} {isCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea 
            className="textarea-glass"
            value={output}
            readOnly
            spellCheck="false"
            style={{ flex: 1, minHeight: '500px', border: 'none', borderRadius: 0, padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#e2e8f0', background: 'transparent' }}
          />
        </div>

      </div>
    </motion.div>
  );
};

export default DockerComposeGen;
