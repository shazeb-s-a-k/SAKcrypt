import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Key, HelpCircle, Loader2, Info } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const AICodeExplainer = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const showToast = useToast();

  const handleSaveKey = (e) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const explainCode = async () => {
    if (!apiKey) {
      showToast('Please enter your Gemini API Key first', 'error');
      return;
    }
    if (!code) return;

    setLoading(true);
    setError(null);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const systemInstruction = `You are an expert Senior Software Engineer. The user will provide a snippet of code. Your job is to explain what the code does in a clear, concise, and educational manner. Break down complex logic step-by-step. If there are potential bugs or security issues, point them out briefly. Use markdown formatting.`;

      const result = await model.generateContent([systemInstruction, `Code to explain:\n\n${code}`]);
      setExplanation(result.response.text());
      showToast('Code Explained!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to connect to AI. Check your API key.');
      showToast('AI Generation Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="AI Code Explainer" subtitle="Paste any complex or obfuscated code and let AI explain exactly how it works" />

      <div className="glass-card" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <Key size={24} style={{ color: 'var(--primary)' }} />
          <div style={{ flex: 1 }}>
            <input 
              type="password"
              className="input-glass"
              value={apiKey}
              onChange={handleSaveKey}
              placeholder="Enter your Gemini API Key (Stored securely in your local browser storage)"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', minHeight: '500px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>CODE SNIPPET</label>
            </div>
            <textarea 
              className="textarea-glass"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste code here..."
              style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
            />
            <button className="btn-primary" onClick={explainCode} disabled={loading || !code} style={{ marginTop: '1rem', background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)' }}>
              {loading ? <Loader2 className="spin" size={20} /> : <HelpCircle size={20} />} Explain This Code
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>AI EXPLANATION</label>
            </div>
            <div 
              className="glass-card markdown-body" 
              style={{ flex: 1, background: 'rgba(0,0,0,0.2)', overflowY: 'auto', padding: '1.5rem', color: 'var(--text)' }}
            >
              {explanation ? (
                <ReactMarkdown>{explanation}</ReactMarkdown>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  Explanation will appear here...
                </div>
              )}
            </div>
          </div>

        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
            <Info size={20} />
            {error}
          </div>
        )}

      </div>
      <style>{`
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { border-bottom: 1px solid var(--border); padding-bottom: 0.3em; margin-bottom: 1rem; color: var(--primary); }
        .markdown-body p { margin-bottom: 1rem; line-height: 1.6; }
        .markdown-body code { background: rgba(255,255,255,0.1); padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; }
        .markdown-body pre { background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1rem; border: 1px solid var(--border); }
        .markdown-body pre code { background: transparent; padding: 0; }
      `}</style>
    </motion.div>
  );
};

export default AICodeExplainer;
