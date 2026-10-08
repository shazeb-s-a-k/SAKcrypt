import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Copy, CheckCircle, Wand2, User } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const AIPersonaGen = () => {
  const [role, setRole] = useState('Senior Software Engineer');
  const [tone, setTone] = useState('Professional & Concise');
  const [expertise, setExpertise] = useState('React, Node.js, Cloud Architecture');
  const [constraints, setConstraints] = useState('Never use deprecated APIs, always include comments in code blocks.');
  
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const showToast = useToast();

  const generatePrompt = () => {
    const prompt = `You are a ${role}. 
Your tone should be ${tone}.
You possess deep expertise in the following areas: ${expertise}.

When responding to queries, you must adhere strictly to these constraints:
- ${constraints.split(',').join('\n- ')}

Your goal is to provide highly accurate, actionable, and structured responses based on your persona. Do not break character.`;

    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    showToast('Persona prompt copied!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container"
      style={{ maxWidth: '900px' }}
    >
      <ToolHeader 
        title="AI Persona Generator" 
        subtitle="Craft precise system prompts to enforce strict LLM behavior and tone."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Input Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <User size={16} /> Persona Role
            </label>
            <input 
              type="text" 
              className="input-glass"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Cyber Security Analyst"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Communication Tone</label>
            <select 
              className="input-glass"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="Professional & Concise">Professional & Concise</option>
              <option value="Friendly & Explanatory">Friendly & Explanatory</option>
              <option value="Academic & Rigorous">Academic & Rigorous</option>
              <option value="Sarcastic & Witty">Sarcastic & Witty</option>
              <option value="Authoritative & Direct">Authoritative & Direct</option>
            </select>
          </div>

          <div>
            <label style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Areas of Expertise (Comma separated)</label>
            <input 
              type="text" 
              className="input-glass"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              placeholder="e.g., Penetration testing, Cryptography"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Behavioral Constraints</label>
            <textarea 
              className="input-glass"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g., Never provide malicious code, always cite sources."
              style={{ width: '100%', height: '80px', resize: 'vertical' }}
            />
          </div>

          <button className="btn-primary" onClick={generatePrompt} style={{ width: '100%', justifyContent: 'center' }}>
            <Wand2 size={18} /> Generate System Prompt
          </button>
        </div>

        {/* Output Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={18} /> System Prompt
            </span>
            <button 
              onClick={copyToClipboard}
              disabled={!generatedPrompt}
              style={{ background: 'transparent', border: 'none', color: isCopied ? 'var(--success)' : 'var(--text-muted)', cursor: generatedPrompt ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          <div style={{ padding: '1.5rem', flex: 1, position: 'relative' }}>
            {!generatedPrompt ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.5 }}>
                Click Generate to create persona...
              </div>
            ) : (
              <pre style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'var(--font-mono)', 
                color: '#e2e8f0', 
                fontSize: '0.95rem',
                lineHeight: '1.6'
              }}>
                {generatedPrompt}
              </pre>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default AIPersonaGen;
