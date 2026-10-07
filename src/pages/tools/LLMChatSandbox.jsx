import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, KeyRound, Bot, User, Cpu, AlertTriangle, Settings2, Trash2 } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const PROVIDERS = {
  OPENAI: {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  GOOGLE: {
    id: 'google',
    name: 'Google Gemini',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
  },
  GROQ: {
    id: 'groq',
    name: 'Groq (Ultra-Fast)',
    models: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  }
};

const LLMChatSandbox = () => {
  const [provider, setProvider] = useState(PROVIDERS.OPENAI);
  const [model, setModel] = useState(PROVIDERS.OPENAI.models[0]);
  const [apiKey, setApiKey] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(true);

  const messagesEndRef = useRef(null);
  const showToast = useToast();
  const showSupport = useSupport();

  // Change model when provider changes
  useEffect(() => {
    setModel(provider.models[0]);
  }, [provider]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callOpenAICompatible = async (messagesHistory, prov, apiKeyToUse) => {
    const formattedMessages = messagesHistory.map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content
    }));

    const response = await fetch(prov.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyToUse}`
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    return data.choices[0].message.content;
  };

  const callGemini = async (messagesHistory, apiKeyToUse) => {
    // Gemini has a different format: { contents: [{ role: 'user'|'model', parts: [{ text }] }] }
    const formattedContents = messagesHistory.map(m => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const endpoint = provider.endpoint.replace('{model}', model) + `?key=${apiKeyToUse}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: formattedContents,
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    return data.candidates[0].content.parts[0].text;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!apiKey.trim()) {
      showToast('Please enter your API Key in the config panel.', 'error');
      setShowConfig(true);
      return;
    }

    const userMsg = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setShowConfig(false); // Hide config to give more space for chat

    try {
      let responseText = '';
      if (provider.id === 'google') {
        responseText = await callGemini(updatedMessages, apiKey.trim());
      } else {
        responseText = await callOpenAICompatible(updatedMessages, provider, apiKey.trim());
      }

      setMessages(prev => [...prev, { role: 'ai', content: responseText }]);
      
      // Randomly trigger support dialog after a few messages
      if (Math.random() < 0.2) setTimeout(showSupport, 2000);

    } catch (err) {
      showToast(err.message === 'Failed to fetch' ? 'Network/CORS error' : err.message, 'error');
      setMessages(prev => [...prev, { role: 'ai', content: `**Error:** ${err.message}`, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    showToast('Chat cleared', 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '9s', maxWidth: '1000px', height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}
    >
      <ToolHeader title="LLM Chat Sandbox" subtitle="Test raw prompts across OpenAI, Gemini, and Groq directly from your browser" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflow: 'hidden' }}>
        
        {/* Config Panel Toggle */}
        <button 
          onClick={() => setShowConfig(!showConfig)}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', cursor: 'pointer' }}
        >
          <Settings2 size={16} /> {showConfig ? 'Hide Configuration' : 'Show Configuration'}
        </button>

        {/* Configuration Panel */}
        <AnimatePresence>
          {showConfig && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>PROVIDER</label>
                  <select 
                    className="input-glass" 
                    value={provider.id} 
                    onChange={(e) => setProvider(Object.values(PROVIDERS).find(p => p.id === e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    {Object.values(PROVIDERS).map(p => <option key={p.id} value={p.id} style={{ background: '#111' }}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 'bold' }}>MODEL</label>
                  <select 
                    className="input-glass" 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    {provider.models.map(m => <option key={m} value={m} style={{ background: '#111' }}>{m}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#ec4899', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    <KeyRound size={14} /> API KEY (Stored locally in browser only)
                  </label>
                  <input 
                    type="password" 
                    className="input-glass" 
                    placeholder={`Enter your ${provider.name} API Key...`} 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <Cpu size={18} />
              <span style={{ fontWeight: 'bold' }}>{provider.name} - {model}</span>
            </div>
            <button className="icon-btn" onClick={clearChat} title="Clear Chat" style={{ color: 'var(--danger)' }}>
              <Trash2 size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {messages.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <MessageSquare size={48} style={{ opacity: 0.5 }} />
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>Initialize Sequence</h3>
                  <p style={{ margin: 0 }}>Configure your API key and send a message to begin.</p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  display: 'flex', 
                  gap: '1rem',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div style={{ 
                  width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: msg.role === 'user' ? 'var(--accent)' : (msg.isError ? 'var(--danger)' : 'var(--primary)'),
                  color: '#fff'
                }}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div style={{ 
                  background: msg.role === 'user' ? 'rgba(94, 106, 210, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(94, 106, 210, 0.3)' : 'var(--border)'}`,
                  padding: '1rem',
                  borderRadius: '12px',
                  borderTopRightRadius: msg.role === 'user' ? 0 : '12px',
                  borderTopLeftRadius: msg.role === 'user' ? '12px' : 0,
                  color: msg.isError ? 'var(--danger)' : '#e2e8f0',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: '#fff' }}>
                  <Bot size={20} />
                </div>
                <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }} />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }} />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }} />
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <textarea 
                className="textarea-glass"
                placeholder="Type your message here... (Shift+Enter for newline)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                style={{ flex: 1, minHeight: '60px', maxHeight: '150px', resize: 'y', padding: '1rem' }}
              />
              <button 
                className="btn-primary" 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                style={{ alignSelf: 'flex-end', height: '60px', width: '60px', padding: 0, justifyContent: 'center', borderRadius: '12px', background: !input.trim() ? 'var(--surface)' : 'var(--accent)' }}
              >
                <Send size={24} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default LLMChatSandbox;
