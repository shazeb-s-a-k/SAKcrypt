import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Copy } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const LOREM_WORDS = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "reprehenderit", "in", "voluptate", "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"];

const LoremIpsum = () => {
  const [paragraphs, setParagraphs] = useState(3);
  const [text, setText] = useState('');
  const showToast = useToast();
  const showSupport = useSupport();

  const generate = () => {
    let result = [];
    for (let p = 0; p < paragraphs; p++) {
      let sentences = [];
      const numSentences = Math.floor(Math.random() * 5) + 4; // 4-8 sentences per paragraph
      
      for (let s = 0; s < numSentences; s++) {
        const numWords = Math.floor(Math.random() * 10) + 8; // 8-17 words per sentence
        let sentenceWords = [];
        for (let w = 0; w < numWords; w++) {
          sentenceWords.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
        }
        let sentence = sentenceWords.join(' ');
        sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
        sentences.push(sentence);
      }
      result.push(sentences.join(' '));
    }
    setText(result.join('\n\n'));
  };

  // Generate initial
  React.useEffect(() => {
    generate();
    // eslint-disable-next-line
  }, [paragraphs]);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
    setTimeout(showSupport, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Lorem Ipsum Generator" subtitle="Generate realistic placeholder text instantly" />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>PARAGRAPHS</label>
            <input 
              type="number" 
              className="input-glass"
              value={paragraphs}
              onChange={(e) => setParagraphs(Math.max(1, Math.min(50, Number(e.target.value))))}
              style={{ width: '80px' }}
              min="1" max="50"
            />
          </div>
          <button className="btn-primary" onClick={handleCopy} style={{ background: 'transparent', border: '1px solid var(--border)' }}>
            <Copy size={16} /> Copy Text
          </button>
        </div>

        <textarea 
          className="textarea-glass"
          value={text}
          readOnly
          style={{ minHeight: '400px', lineHeight: '1.6', fontSize: '1.05rem', color: 'var(--secondary)' }}
        />

      </div>
    </motion.div>
  );
};

export default LoremIpsum;
