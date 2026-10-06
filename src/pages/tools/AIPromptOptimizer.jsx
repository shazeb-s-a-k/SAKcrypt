import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Copy, Key, Wand2, Loader2, Info } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const AIPromptOptimizer = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [inputPrompt, setInputPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const showToast = useToast();
  const showSupport = useSupport();

  const handleSaveKey = (e) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const optimizePrompt = async () => {
    if (!apiKey) {
      showToast('Please enter your Gemini API Key first', 'error');
      return;
    }
    if (!inputPrompt) return;

    setLoading(true);
    setError(null);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const systemInstruction = `You are an expert AI Prompt Engineer. Your task is to take the user's raw, unoptimized prompt and rewrite it into a highly professional, detailed, and structured prompt that will yield the best possible results from an LLM. Use best practices like setting context, assigning a persona, defining the desired output format, and removing ambiguity. ONLY return the optimized prompt, nothing else.`;

      const result = await model.generateContent([systemInstruction, `Raw Prompt:\n${inputPrompt}`]);
      setOptimizedPrompt(result.response.text());
      showToast('Prompt Optimized Successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to connect to AI. Check your API key.');
      showToast('AI Generation Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!optimizedPrompt) return;
    navigator.clipboard.writeText(optimizedPrompt);
    showToast('Copied to clipboard!', 'success');
    setTimeout(showSupport, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="AI Prompt Optimizer" subtitle="Let AI rewrite and structure your prompts for maximum performance" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>YOUR RAW PROMPT</label>
            <textarea 
              className="textarea-glass"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="e.g., Write a python script to scrape a website..."
              style={{ minHeight: '300px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-primary" onClick={optimizePrompt} disabled={loading || !inputPrompt} style={{ padding: '1.5rem', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
              {loading ? <Loader2 className="spin" size={24} /> : <Wand2 size={24} />}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>OPTIMIZED PROMPT</label>
              <button className="icon-btn" onClick={handleCopy} title="Copy Output" disabled={!optimizedPrompt}>
                <Copy size={16} />
              </button>
            </div>
            <textarea 
              className="textarea-glass"
              value={optimizedPrompt}
              readOnly
              placeholder="AI optimized prompt will appear here..."
              style={{ minHeight: '300px', background: 'rgba(0,0,0,0.2)', color: 'var(--text)' }}
            />
          </div>

        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
            <Info size={20} />
            {error}
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default AIPromptOptimizer;
