import React, { useState } from 'react';
import { Shield, Radio, QrCode, Key, Regex, Hash, ArrowRight, Heart, KeyRound, Fingerprint, Code, FileCode, Braces, Link2, Type, Binary, ShieldAlert, Cpu, FileLock, Network, FileImage, ImageMinus, Loader2, FileText, Minimize2, Clock, Database, ArrowLeftRight, Settings, FileJson, Globe, Shuffle, Palette, Fingerprint as HmacIcon, ShieldCheck, LockKeyhole, Wand2, HelpCircle, Calculator, Image as ImageIcon, Wifi, Users, Baseline, Calendar, FileLock2, Tags, TestTube, FileArchive, Table, Code2, Terminal, BookTemplate, FileType2, Bot, Search, Stethoscope, Monitor, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useSupport } from '../components/SupportProvider';

const features = [
  {
    title: 'JSON Formatter', category: 'Web Dev Tools',
    desc: 'Format, minify, and validate JSON payloads instantly.',
    icon: <Braces size={32} style={{ color: '#fcd34d' }} />,
    path: '/json',
    color: '#fcd34d'
  },
  {
    title: 'JWT Inspector', category: 'Security & Cryptography',
    desc: 'Decode, verify, and inspect JSON Web Tokens securely right in your browser.',
    icon: <Code size={32} style={{ color: '#c084fc' }} />,
    path: '/jwt',
    color: '#c084fc'
  },
  {
    title: 'Regex Sandbox', category: 'Utilities & Generators',
    desc: 'A live playground to test, debug, and execute Regular Expressions on the fly.',
    icon: <Regex size={32} style={{ color: '#8b5cf6' }} />,
    path: '/regex',
    color: '#8b5cf6'
  },
  {
    title: 'UUID Generator', category: 'Utilities & Generators',
    desc: 'Instantly generate universally unique identifiers (v4) for your database records.',
    icon: <Hash size={32} style={{ color: '#0ea5e9' }} />,
    path: '/uuid',
    color: '#0ea5e9'
  },
  {
    title: 'Base64 Converter', category: 'Utilities & Generators',
    desc: 'Instantly encode and decode strings to and from Base64 format.',
    icon: <FileCode size={32} style={{ color: '#60a5fa' }} />,
    path: '/base64',
    color: '#60a5fa'
  },
  {
    title: 'URL Encoder', category: 'Web Dev Tools',
    desc: 'Safely encode and decode URL components and query parameters.',
    icon: <Link2 size={32} style={{ color: '#38bdf8' }} />,
    path: '/url',
    color: '#38bdf8'
  },
  {
    title: 'Hash Engine', category: 'Security & Cryptography',
    desc: 'Generate highly secure cryptographic hashes (SHA-256, SHA-512) instantly.',
    icon: <Fingerprint size={32} style={{ color: '#10b981' }} />,
    path: '/hash',
    color: '#10b981'
  },
  {
    title: 'CRON Job Generator', category: 'Utilities & Generators',
    desc: 'Generate and explain complex CRON schedule expressions.',
    icon: <Calendar size={32} style={{ color: '#ec4899' }} />,
    path: '/cron',
    color: '#ec4899'
  },
  {
    title: 'SQL Formatter', category: 'Utilities & Generators',
    desc: 'Beautify and format complex SQL queries for readability.',
    icon: <Database size={32} style={{ color: '#38bdf8' }} />,
    path: '/sql',
    color: '#38bdf8'
  },
  {
    title: 'Meta Tag Generator', category: 'Utilities & Generators',
    desc: 'Generate optimized SEO and Social Media meta tags.',
    icon: <Tags size={32} style={{ color: '#0ea5e9' }} />,
    path: '/meta',
    color: '#0ea5e9'
  },
  {
    title: 'Port Scanner', category: 'Web Dev Tools',
    desc: 'Scan domains and IPs for open ports and vulnerabilities.',
    icon: <Network size={32} style={{ color: '#14b8a6' }} />,
    path: '/port-scanner',
    color: '#14b8a6'
  },
  {
    title: 'SSL Checker', category: 'Security & Cryptography',
    desc: 'Inspect SSL/TLS certificates and check expiration dates.',
    icon: <ShieldCheck size={32} style={{ color: '#0ea5e9' }} />,
    path: '/ssl',
    color: '#0ea5e9'
  },
  {
    title: 'Network Scanner', category: 'Web Dev Tools',
    desc: 'Ping endpoints, scan open ports, and trace IP geolocations.',
    icon: <Network size={32} style={{ color: '#94a3b8' }} />,
    path: '/network',
    color: '#94a3b8'
  },
  {
    title: 'DNS Lookup', category: 'Web Dev Tools',
    desc: 'Query DNS records (A, AAAA, MX, TXT) for any domain.',
    icon: <Globe size={32} style={{ color: '#6366f1' }} />,
    path: '/dns',
    color: '#6366f1'
  },
  {
    title: 'API Key Tester', category: 'AI Tools',
    desc: 'Securely validate API keys for AI models and custom endpoints before deployment.',
    icon: <KeyRound size={32} style={{ color: '#fb923c' }} />,
    path: '/apikey',
    color: '#fb923c'
  },
  {
    title: 'API Key Laboratory', category: 'AI Tools',
    desc: 'Deep-scan, auto-detect providers, and identify tiers for massive lists of API keys.',
    icon: <Stethoscope size={32} style={{ color: '#f43f5e' }} />,
    path: '/api-lab',
    color: '#f43f5e'
  },
  {
    title: 'Password Strength', category: 'Security & Cryptography',
    desc: 'Test how long it would take hackers to crack your password.',
    icon: <ShieldAlert size={32} style={{ color: '#ef4444' }} />,
    path: '/pwdstrength',
    color: '#ef4444'
  },
  {
    title: 'Cyber Vault', category: 'Security & Cryptography',
    desc: 'Generate cryptographically secure, unbreakable passwords with highly customizable parameters.',
    icon: <Key size={32} style={{ color: '#ec4899' }} />,
    path: '/vault',
    color: '#ec4899'
  },
  {
    title: 'YAML to JSON', category: 'Web Dev Tools',
    desc: 'Instantly convert YAML configurations into valid JSON.',
    icon: <FileJson size={32} style={{ color: '#10b981' }} />,
    path: '/yaml',
    color: '#10b981'
  },
  {
    title: 'JSON to YAML', category: 'Web Dev Tools',
    desc: 'Convert massive JSON structures into clean YAML.',
    icon: <FileCode size={32} style={{ color: '#0ea5e9' }} />,
    path: '/json2yaml',
    color: '#0ea5e9'
  },
  {
    title: 'JSON to CSV', category: 'Web Dev Tools',
    desc: 'Convert JSON data arrays to downloadable CSV spreadsheets.',
    icon: <Table size={32} style={{ color: '#10b981' }} />,
    path: '/json2csv',
    color: '#10b981'
  },
  {
    title: 'HTML to JSX Converter', category: 'Web Dev Tools',
    desc: 'Instantly convert raw HTML code into React-ready JSX syntax.',
    icon: <Code2 size={32} style={{ color: '#06b6d4' }} />,
    path: '/html2jsx',
    color: '#06b6d4'
  },
  {
    title: 'Markdown to HTML', category: 'Web Dev Tools',
    desc: 'Convert Markdown strings into raw HTML markup.',
    icon: <ArrowLeftRight size={32} style={{ color: '#f472b6' }} />,
    path: '/mdhtml',
    color: '#f472b6'
  },
  {
    title: 'Markdown Previewer', category: 'Web Dev Tools',
    desc: 'Live editor to write, preview, and export Markdown documents.',
    icon: <Type size={32} style={{ color: '#ec4899' }} />,
    path: '/markdown',
    color: '#ec4899'
  },
  {
    title: 'CSS Minifier', category: 'Web Dev Tools',
    desc: 'Compress and optimize CSS stylesheets for production.',
    icon: <Minimize2 size={32} style={{ color: '#0ea5e9' }} />,
    path: '/css',
    color: '#0ea5e9'
  },
  {
    title: 'XML Formatter', category: 'Web Dev Tools',
    desc: 'Format, minify, and validate XML payloads instantly.',
    icon: <FileCode size={32} style={{ color: '#ec4899' }} />,
    path: '/xml',
    color: '#ec4899'
  },
  {
    title: 'Fake Data Generator', category: 'Utilities & Generators',
    desc: 'Generate large datasets of realistic mock user data.',
    icon: <Users size={32} style={{ color: '#f59e0b' }} />,
    path: '/fake-data',
    color: '#f59e0b'
  },
  {
    title: 'Base Converter', category: 'Web Dev Tools',
    desc: 'Instantly convert numbers between Binary, Octal, Decimal, and Hex.',
    icon: <Binary size={32} style={{ color: '#4ade80' }} />,
    path: '/base',
    color: '#4ade80'
  },
  {
    title: 'Text Tools', category: 'Utilities & Generators',
    desc: 'Quickly manipulate, transform, and analyze text strings.',
    icon: <Type size={32} style={{ color: '#a78bfa' }} />,
    path: '/text',
    color: '#a78bfa'
  },
  {
    title: 'Lorem Ipsum Generator', category: 'Utilities & Generators',
    desc: 'Generate realistic placeholder text instantly.',
    icon: <FileText size={32} style={{ color: '#fbbf24' }} />,
    path: '/lorem',
    color: '#fbbf24'
  },
  {
    title: 'Color Palette Gen', category: 'Utilities & Generators',
    desc: 'Generate perfect UI color palettes and gradients.',
    icon: <Palette size={32} style={{ color: '#a855f7' }} />,
    path: '/palette',
    color: '#a855f7'
  },
  {
    title: 'SVG Placeholder Gen', category: 'Utilities & Generators',
    desc: 'Generate dynamic SVG placeholder images for development.',
    icon: <ImageIcon size={32} style={{ color: '#f43f5e' }} />,
    path: '/svg',
    color: '#f43f5e'
  },
  {
    title: 'ASCII Art Generator', category: 'Utilities & Generators',
    desc: 'Convert any text into retro ASCII banner art.',
    icon: <Baseline size={32} style={{ color: '#8b5cf6' }} />,
    path: '/ascii',
    color: '#8b5cf6'
  },
  {
    title: 'HTTP Status Codes', category: 'Web Dev Tools',
    desc: 'Quickly lookup HTTP status codes and their detailed meanings.',
    icon: <Code size={32} style={{ color: '#10b981' }} />,
    path: '/http',
    color: '#10b981'
  },
  {
    title: 'Chmod Calculator', category: 'Utilities & Generators',
    desc: 'Convert Linux file permissions between octal and symbolic.',
    icon: <Calculator size={32} style={{ color: '#10b981' }} />,
    path: '/chmod',
    color: '#10b981'
  },
  {
    title: 'IP Subnet Calculator', category: 'Web Dev Tools',
    desc: 'Calculate IPv4 subnets, CIDR, and usable host ranges.',
    icon: <Globe size={32} style={{ color: '#3b82f6' }} />,
    path: '/subnet',
    color: '#3b82f6'
  },
  {
    title: 'AI Prompt Optimizer', category: 'AI Tools',
    desc: 'Let AI rewrite and structure your prompts for max performance.',
    icon: <Wand2 size={32} style={{ color: '#6366f1' }} />,
    path: '/ai-prompt',
    color: '#6366f1'
  },
  {
    title: 'AI Code Explainer', category: 'AI Tools',
    desc: 'Paste complex code and let AI explain exactly how it works.',
    icon: <HelpCircle size={32} style={{ color: '#8b5cf6' }} />,
    path: '/ai-code',
    color: '#8b5cf6'
  },
  {
    title: 'AI Regex Generator', category: 'AI Tools',
    desc: 'Describe text to extract, and AI builds the Regex for you.',
    icon: <Regex size={32} style={{ color: '#ec4899' }} />,
    path: '/ai-regex',
    color: '#ec4899'
  },
  {
    title: 'LLM Chat Sandbox', category: 'AI Tools',
    desc: 'Test raw prompts across OpenAI, Gemini, and Groq directly from your browser.',
    icon: <Bot size={32} style={{ color: '#10b981' }} />,
    path: '/llm-chat',
    color: '#10b981'
  },
  {
    title: 'Phantom Text', category: 'Security & Cryptography',
    desc: 'Encode messages and files into completely invisible zero-width characters for ultimate stealth.',
    icon: <Shield size={32} style={{ color: 'var(--accent)' }} />,
    path: '/phantom',
    color: 'var(--accent)'
  },
  {
    title: 'Sonic Transfer', category: 'Utilities & Generators',
    desc: 'Transmit text payloads over-the-air to nearby devices using high-frequency sound waves.',
    icon: <Radio size={32} style={{ color: '#10b981' }} />,
    path: '/sonic',
    color: '#10b981'
  },
  {
    title: 'QR Code Engine', category: 'Utilities & Generators',
    desc: 'Generate custom, high-res QR codes instantly with customizable foregrounds and backgrounds.',
    icon: <QrCode size={32} style={{ color: '#f59e0b' }} />,
    path: '/qrcode',
    color: '#f59e0b'
  },
  {
    title: 'WiFi QR Generator', category: 'Utilities & Generators',
    desc: 'Create secure QR codes to instantly connect to WiFi networks.',
    icon: <Wifi size={32} style={{ color: '#10b981' }} />,
    path: '/wifi-qr',
    color: '#10b981'
  },
  {
    title: 'EXIF Scrubber', category: 'Utilities & Generators',
    desc: 'Strip GPS and metadata from images to protect your privacy.',
    icon: <ImageMinus size={32} style={{ color: '#94a3b8' }} />,
    path: '/exif',
    color: '#94a3b8'
  },
  {
    title: 'File Encryptor', category: 'Security & Cryptography',
    desc: 'Encrypt and decrypt any file locally using military-grade AES-256.',
    icon: <FileLock size={32} style={{ color: '#f87171' }} />,
    path: '/encryptor',
    color: '#f87171'
  },
  {
    title: 'Bcrypt Generator', category: 'Security & Cryptography',
    desc: 'Generate and verify secure bcrypt hashes locally.',
    icon: <Fingerprint size={32} style={{ color: '#6366f1' }} />,
    path: '/bcrypt',
    color: '#6366f1'
  },
  {
    title: 'JWT Generator', category: 'Security & Cryptography',
    desc: 'Create and sign custom JSON Web Tokens instantly.',
    icon: <Settings size={32} style={{ color: '#fb923c' }} />,
    path: '/jwtgen',
    color: '#fb923c'
  },
  {
    title: 'HMAC Generator', category: 'Security & Cryptography',
    desc: 'Generate Hash-based Message Authentication Codes.',
    icon: <HmacIcon size={32} style={{ color: '#f43f5e' }} />,
    path: '/hmac',
    color: '#f43f5e'
  },
  {
    title: 'RSA Key Generator', category: 'Utilities & Generators',
    desc: 'Generate secure RSA public and private key pairs locally.',
    icon: <LockKeyhole size={32} style={{ color: '#f59e0b' }} />,
    path: '/rsa',
    color: '#f59e0b'
  },
  {
    title: 'Base64 File Encoder', category: 'Utilities & Generators',
    desc: 'Convert images and files to Base64 strings instantly.',
    icon: <FileArchive size={32} style={{ color: '#8b5cf6' }} />,
    path: '/base64file',
    color: '#8b5cf6'
  },
  {
    title: 'JWT Decoder', category: 'Utilities & Generators',
    desc: 'Decode and inspect JSON Web Tokens securely offline.',
    icon: <FileLock2 size={32} style={{ color: '#14b8a6' }} />,
    path: '/jwt',
    color: '#14b8a6'
  },
  {
    title: 'Cron Job Parser', category: 'Utilities & Generators',
    desc: 'Convert complex cron expressions into human-readable text.',
    icon: <Clock size={32} style={{ color: '#8b5cf6' }} />,
    path: '/cron',
    color: '#8b5cf6'
  },
  {
    title: 'Random String Gen', category: 'Utilities & Generators',
    desc: 'Generate secure random strings for secrets and passwords.',
    icon: <Shuffle size={32} style={{ color: '#f59e0b' }} />,
    path: '/random',
    color: '#f59e0b'
  },
  {
    title: 'Glassmorphism Generator', category: 'Web Dev Tools',
    desc: 'Create stunning frosted-glass CSS effects instantly.',
    icon: <Palette size={32} style={{ color: '#0ea5e9' }} />,
    path: '/glassmorphism',
    color: '#0ea5e9'
  },
  {
    title: 'Device Fingerprint', category: 'Security & Cryptography',
    desc: 'Extract hardware, software, network, and canvas fingerprinting data.',
    icon: <Monitor size={32} style={{ color: '#f87171' }} />,
    path: '/fingerprint',
    color: '#f87171'
  },
  {
    title: 'Payload Obfuscator', category: 'Security & Cryptography',
    desc: 'Obfuscate and encode payloads for WAF bypass and security testing.',
    icon: <ShieldAlert size={32} style={{ color: '#ef4444' }} />,
    path: '/payload-obfuscator',
    color: '#ef4444'
  },
  {
    title: 'Color Contrast Checker', category: 'Web Dev Tools',
    desc: 'Verify WCAG accessibility compliance for your color combinations.',
    icon: <Eye size={32} style={{ color: '#3b82f6' }} />,
    path: '/color-contrast',
    color: '#3b82f6'
  },
  {
    title: 'Code to Image', category: 'Utilities & Generators',
    desc: 'Create stunning, shareable images of your source code.',
    icon: <Code2 size={32} style={{ color: '#ec4899' }} />,
    path: '/code-to-image',
    color: '#ec4899'
  },
  {
    title: 'AI Persona Gen', category: 'AI Tools',
    desc: 'Craft precise system prompts to enforce strict LLM behavior and tone.',
    icon: <Bot size={32} style={{ color: '#8b5cf6' }} />,
    path: '/ai-persona',
    color: '#8b5cf6'
  },
  {
    title: 'Text Diff Viewer', category: 'Utilities & Generators',
    desc: 'Compare two blocks of text or code to instantly spot differences.',
    icon: <ArrowLeftRight size={32} style={{ color: '#14b8a6' }} />,
    path: '/text-diff',
    color: '#14b8a6'
  },
  {
    title: 'CORS Tester', category: 'Web Dev Tools',
    desc: 'Test Cross-Origin Resource Sharing headers directly from the browser.',
    icon: <Network size={32} style={{ color: '#eab308' }} />,
    path: '/cors-tester',
    color: '#eab308'
  },
  {
    title: 'Markdown Table Gen', category: 'Utilities & Generators',
    desc: 'Visually create and format Github-flavored markdown tables.',
    icon: <Table size={32} style={{ color: '#6366f1' }} />,
    path: '/md-table',
    color: '#6366f1'
  },
  {
    title: 'Keypair Generator', category: 'Security & Cryptography',
    desc: 'Securely generate asymmetric EC/RSA keys directly in the browser.',
    icon: <KeyRound size={32} style={{ color: '#10b981' }} />,
    path: '/keypair-gen',
    color: '#10b981'
  },
  // --- COMING SOON TOOLS ---,
  {
    title: 'CSV to JSON', category: 'Utilities & Generators',
    desc: 'Convert CSV spreadsheets back to nested JSON structures.',
    icon: <FileType2 size={32} style={{ color: '#94a3b8' }} />,
    path: '#',
    color: '#94a3b8',
    comingSoon: true
  },
  {
    title: 'Github Readme Gen', category: 'Utilities & Generators',
    desc: 'Create beautiful, standardized Github README.md files visually.',
    icon: <BookTemplate size={32} style={{ color: '#94a3b8' }} />,
    path: '#',
    color: '#94a3b8',
    comingSoon: true
  },
  {
    title: 'Curl Command Gen', category: 'Utilities & Generators',
    desc: 'Generate fetch and axios code from complex curl requests.',
    icon: <Terminal size={32} style={{ color: '#94a3b8' }} />,
    path: '#',
    color: '#94a3b8',
    comingSoon: true
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const LandingPage = () => {
  const showSupport = useSupport();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFeatures = features.filter(feat => 
    feat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    feat.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ width: '100%' }}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }}
      >
        <Logo size={80} style={{ margin: '0 auto', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 20px rgba(94, 106, 210, 0.4))' }} />
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #a0a0a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome to SAKrypt Suite
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', marginBottom: '2rem' }}>
          A professional, hyper-secure collection of cryptography and developer utilities. 
          Operate in absolute stealth.
        </p>
        
        <button 
          onClick={showSupport}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Heart size={16} style={{ color: '#ef4444' }} /> Support the Developer
        </button>

        <div style={{ marginTop: '3rem', maxWidth: '600px', margin: '3rem auto 0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={20} />
          </div>
          <input 
            type="text" 
            className="input-glass" 
            placeholder="Search for tools... (e.g. JSON, JWT, API)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '1rem 1rem 1rem 3rem', 
              fontSize: '1.1rem', 
              borderRadius: '12px',
              border: '1px solid rgba(94, 106, 210, 0.3)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}
          />
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}
      >
        {['AI Tools', 'Security & Cryptography', 'Web Dev Tools', 'Utilities & Generators'].map(cat => {
          const catFeatures = filteredFeatures.filter(f => f.category === cat);
          if (catFeatures.length === 0) return null;
          return (
            <div key={cat} style={{ marginTop: '2rem' }}>
              <h2 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {cat}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
              }}>
                {catFeatures.map((feat, index) => (
                  <motion.div key={feat.title} variants={itemVariants}>
                    <Link to={feat.comingSoon ? '#' : feat.path} style={{ textDecoration: 'none', height: '100%', display: 'block', pointerEvents: feat.comingSoon ? 'none' : 'auto' }}>
                      <div 
                        className="glass-card"
                        style={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                          position: 'relative',
                          overflow: 'hidden',
                          opacity: feat.comingSoon ? 0.7 : 1,
                          filter: feat.comingSoon ? 'grayscale(0.5)' : 'none'
                        }}
                        onMouseOver={e => {
                          if (feat.comingSoon) return;
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = `0 10px 30px ${feat.color}20`;
                          e.currentTarget.style.borderColor = `${feat.color}50`;
                        }}
                        onMouseOut={e => {
                          if (feat.comingSoon) return;
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        {feat.comingSoon && (
                          <div style={{ position: 'absolute', top: '15px', right: '-30px', background: 'rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 35px', transform: 'rotate(45deg)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            SOON
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ padding: '12px', background: `${feat.color}15`, borderRadius: '12px', display: 'inline-flex' }}>
                            {feat.icon}
                          </div>
                          {feat.comingSoon ? (
                            <Loader2 size={20} style={{ color: 'var(--text-muted)' }} />
                          ) : (
                            <ArrowRight size={20} style={{ color: 'var(--text-muted)' }} />
                          )}
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '1.2rem', margin: '0.5rem 0 0 0' }}>{feat.title}</h3>
                        <p style={{ color: 'var(--secondary)', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                          {feat.desc}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
        {filteredFeatures.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <Search size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: 0 }}>No tools found</h3>
            <p>Try adjusting your search query.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LandingPage;
