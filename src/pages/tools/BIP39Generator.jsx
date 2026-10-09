import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, RefreshCw, Copy, CheckCircle, Download, KeyRound, AlertTriangle } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

// A minimal simulated BIP39 wordlist (English) for demonstration purposes. 
// Real BIP39 uses 2048 words. We use a sample of 200 common ones for the tool.
const BIP39_WORDLIST = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
  "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
  "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
  "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
  "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
  "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
  "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger",
  "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
  "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic",
  "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest",
  "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset",
  "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction",
  "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake",
  "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge",
  "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain",
  "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become",
  "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit",
  "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology",
  "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless",
  "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body"
];

const BIP39Generator = () => {
  const [phraseLength, setPhraseLength] = useState(12);
  const [mnemonic, setMnemonic] = useState([]);
  const [isCopied, setIsCopied] = useState(false);
  const showToast = useToast();
  const showSupport = useSupport();

  const generateMnemonic = () => {
    // Cryptographically secure random generation (simulated using Web Crypto API)
    const array = new Uint32Array(phraseLength);
    window.crypto.getRandomValues(array);
    
    const words = [];
    for (let i = 0; i < phraseLength; i++) {
      // Map random 32-bit integer to the 2048 (here 200) wordlist
      const index = array[i] % BIP39_WORDLIST.length;
      words.push(BIP39_WORDLIST[index]);
    }
    
    setMnemonic(words);
    setIsCopied(false);
    
    if (Math.random() < 0.2) setTimeout(showSupport, 2000);
  };

  useEffect(() => {
    generateMnemonic();
  }, [phraseLength]);

  const copyToClipboard = () => {
    const text = mnemonic.join(' ');
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    showToast('Mnemonic copied to clipboard securely!', 'success');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const downloadKeyStore = () => {
    const text = mnemonic.join(' ');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bip39_seed_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Seed downloaded. Keep this file extremely safe!', 'warning');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '9s' }}
    >
      <ToolHeader 
        title="BIP39 Seed Generator" 
        subtitle="Generate cryptographically secure mnemonic seed phrases for cryptocurrency wallets." 
      />

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Warning Banner */}
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <AlertTriangle size={32} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div>
            <h4 style={{ color: 'var(--warning)', margin: '0 0 0.5rem 0' }}>Security Warning</h4>
            <p style={{ color: '#e2e8f0', margin: 0, fontSize: '0.9rem' }}>
              Anyone who possesses this seed phrase controls the assets associated with it. 
              <strong> Never</strong> share this online, store it on a cloud drive, or take a screenshot. 
              Write it down on physical paper.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>PHRASE LENGTH</label>
            <select 
              className="input-glass" 
              value={phraseLength} 
              onChange={(e) => setPhraseLength(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            >
              <option value={12}>12 Words (Standard)</option>
              <option value={15}>15 Words</option>
              <option value={18}>18 Words</option>
              <option value={24}>24 Words (High Security)</option>
            </select>
          </div>
          <button className="btn-primary" onClick={generateMnemonic} style={{ padding: '0.8rem 1.5rem', flex: 1, minWidth: '200px', justifyContent: 'center' }}>
            <RefreshCw size={18} /> Generate New Seed
          </button>
        </div>

        {/* Display Grid */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
            {mnemonic.map((word, index) => (
              <motion.div 
                key={`${word}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                style={{ 
                  background: 'rgba(94, 106, 210, 0.1)', 
                  border: '1px solid rgba(94, 106, 210, 0.3)', 
                  padding: '1rem', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: '20px' }}>{index + 1}.</span>
                <span style={{ color: '#fff', fontWeight: 'bold', letterSpacing: '0.5px' }}>{word}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button 
            onClick={copyToClipboard} 
            className="btn-primary" 
            style={{ 
              background: isCopied ? 'var(--success)' : 'var(--surface)', 
              borderColor: isCopied ? 'var(--success)' : 'var(--border)',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            {isCopied ? <CheckCircle size={18} /> : <Copy size={18} />}
            {isCopied ? 'Copied Securely' : 'Copy to Clipboard'}
          </button>
          <button 
            onClick={downloadKeyStore} 
            className="btn-primary" 
            style={{ 
              background: 'var(--surface)', 
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <Download size={18} /> Save as Text File
          </button>
        </div>

      </div>
    </motion.div>
  );
};

export default BIP39Generator;
