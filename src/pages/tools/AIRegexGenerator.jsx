import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Regex, Loader2, Info, Copy } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const AIRegexGenerator = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [prompt, setPrompt] = useState('');
  const [regex, setRegex] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const showToast = useToast();
  const showSupport = useSupport();

  const handleSaveKey = (e) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const generateRegex = async () => {
    if (!apiKey) {
      showToast('Please enter your Gemini API Key first', 'error');
      return;
    }
    if (!prompt) return;

    setLoading(true);
    setError(null);
    setRegex('');
    setExplanation('');
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const systemInstruction = `You are an expert Regular Expression engineer. The user will describe a pattern they want to match in plain English.
      You must respond with EXACTLY a JSON object containing two keys:
      1. "regex": The raw regular expression pattern (do NOT include enclosing slashes / / unless they are part of the pattern, but usually it's just the string).
      2. "explanation": A brief, clear explanation of how the regex works.
      Respond ONLY with the JSON object. Do not use markdown blocks (\`\`\`json) around the response. Just pure JSON.`;

      const result = await model.generateContent([systemInstruction, `Desired Pattern: ${prompt}`]);
      let text = result.response.text().trim();
      
      // Clean up if it returned markdown
      if (text.startsWith('```json')) text = text.substring(7);
      if (text.startsWith('```')) text = text.substring(3);
      if (text.endsWith('```')) text = text.substring(0, text.length - 3);
      
      const parsed = JSON.parse(text.trim());
      
      setRegex(parsed.regex);
      setExplanation(parsed.explanation);
      showToast('Regex Generated!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to parse AI response. Try rephrasing.');
      showToast('AI Generation Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!regex) return;
    navigator.clipboard.writeText(regex);
    showToast('Regex copied!', 'success');
    setTimeout(showSupport, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="AI Regex Generator" subtitle="Describe the text you want to extract in plain English and let AI build the Regex" />

      <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ color: 'var(--text-muted)' }}>DESCRIBE YOUR PATTERN</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text"
              className="input-glass"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Match a valid IPv4 address..."
              style={{ flex: 1, fontSize: '1.1rem' }}
              onKeyDown={(e) => e.key === 'Enter' && generateRegex()}
            />
            <button className="btn-primary" onClick={generateRegex} disabled={loading || !prompt} style={{ padding: '0 2rem', background: 'linear-gradient(135deg, #10b981, #38bdf8)' }}>
              {loading ? <Loader2 className="spin" size={20} /> : <Regex size={20} />} Generate
            </button>
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
            <Info size={20} />
            {error}
          </div>
        )}

        {regex && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: 'var(--primary)', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>GENERATED REGEX</label>
                <code style={{ fontSize: '1.5rem', color: '#fff', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', display: 'block', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  {regex}
                </code>
              </div>
              <button className="icon-btn" onClick={handleCopy} title="Copy Regex" style={{ marginTop: '2rem', marginLeft: '1rem' }}>
                <Copy size={24} />
              </button>
            </div>

            <div>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>EXPLANATION</label>
              <p style={{ color: 'var(--secondary)', lineHeight: '1.6', margin: 0 }}>{explanation}</p>
            </div>

          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default AIRegexGenerator;
