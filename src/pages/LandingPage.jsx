import React from 'react';
import { Shield, Radio, QrCode, Key, Regex, Hash, ArrowRight, Heart, KeyRound, Fingerprint, Code, FileCode, Braces, Link2, Type, Binary, ShieldAlert, Cpu, FileLock, Network, FileImage, ImageMinus, Loader2, FileText, Minimize2, Clock, Database, ArrowLeftRight, Settings, FileJson, Globe, Shuffle, Palette, Fingerprint as HmacIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useSupport } from '../components/SupportProvider';

const features = [
  {
    title: 'Phantom Text',
    desc: 'Encode messages and files into completely invisible zero-width characters for ultimate stealth.',
    icon: <Shield size={32} style={{ color: 'var(--accent)' }} />,
    path: '/phantom',
    color: 'var(--accent)'
  },
  {
    title: 'Sonic Transfer',
    desc: 'Transmit text payloads over-the-air to nearby devices using high-frequency sound waves.',
    icon: <Radio size={32} style={{ color: '#10b981' }} />,
    path: '/sonic',
    color: '#10b981'
  },
  {
    title: 'QR Code Engine',
    desc: 'Generate custom, high-res QR codes instantly with customizable foregrounds and backgrounds.',
    icon: <QrCode size={32} style={{ color: '#f59e0b' }} />,
    path: '/qrcode',
    color: '#f59e0b'
  },
  {
    title: 'Cyber Vault',
    desc: 'Generate cryptographically secure, unbreakable passwords with highly customizable parameters.',
    icon: <Key size={32} style={{ color: '#ec4899' }} />,
    path: '/vault',
    color: '#ec4899'
  },
  {
    title: 'Regex Sandbox',
    desc: 'A live playground to test, debug, and execute Regular Expressions on the fly.',
    icon: <Regex size={32} style={{ color: '#8b5cf6' }} />,
    path: '/regex',
    color: '#8b5cf6'
  },
  {
    title: 'UUID Generator',
    desc: 'Instantly generate universally unique identifiers (v4) for your database records.',
    icon: <Hash size={32} style={{ color: '#0ea5e9' }} />,
    path: '/uuid',
    color: '#0ea5e9'
  },
  {
    title: 'API Key Tester',
    desc: 'Securely validate API keys for AI models and custom endpoints before deployment.',
    icon: <KeyRound size={32} style={{ color: '#fb923c' }} />,
    path: '/apikey',
    color: '#fb923c'
  },
  {
    title: 'Hash Engine',
    desc: 'Generate highly secure cryptographic hashes (SHA-256, SHA-512) instantly.',
    icon: <Fingerprint size={32} style={{ color: '#10b981' }} />,
    path: '/hash',
    color: '#10b981'
  },
  {
    title: 'JWT Inspector',
    desc: 'Decode, verify, and inspect JSON Web Tokens securely right in your browser.',
    icon: <Code size={32} style={{ color: '#c084fc' }} />,
    path: '/jwt',
    color: '#c084fc'
  },
  {
    title: 'Base64 Converter',
    desc: 'Instantly encode and decode strings to and from Base64 format.',
    icon: <FileCode size={32} style={{ color: '#60a5fa' }} />,
    path: '/base64',
    color: '#60a5fa'
  },
  {
    title: 'JSON Formatter',
    desc: 'Format, minify, and validate JSON payloads instantly.',
    icon: <Braces size={32} style={{ color: '#fcd34d' }} />,
    path: '/json',
    color: '#fcd34d'
  },
  {
    title: 'URL Encoder',
    desc: 'Safely encode and decode URL components and query parameters.',
    icon: <Link2 size={32} style={{ color: '#38bdf8' }} />,
    path: '/url',
    color: '#38bdf8'
  },
  {
    title: 'Text Tools',
    desc: 'Quickly manipulate, transform, and analyze text strings.',
    icon: <Type size={32} style={{ color: '#a78bfa' }} />,
    path: '/text',
    color: '#a78bfa'
  },
  {
    title: 'Base Converter',
    desc: 'Instantly convert numbers between Binary, Octal, Decimal, and Hex.',
    icon: <Binary size={32} style={{ color: '#4ade80' }} />,
    path: '/base',
    color: '#4ade80'
  },
  {
    title: 'Password Strength',
    desc: 'Test how long it would take hackers to crack your password.',
    icon: <ShieldAlert size={32} style={{ color: '#ef4444' }} />,
    path: '/pwdstrength',
    color: '#ef4444'
  },
  {
    title: 'EXIF Scrubber',
    desc: 'Strip GPS and metadata from images to protect your privacy.',
    icon: <ImageMinus size={32} style={{ color: '#94a3b8' }} />,
    path: '/exif',
    color: '#94a3b8'
  },
  {
    title: 'Network Scanner',
    desc: 'Ping endpoints, scan open ports, and trace IP geolocations.',
    icon: <Network size={32} style={{ color: '#94a3b8' }} />,
    path: '/network',
    color: '#94a3b8'
  },
  {
    title: 'File Encryptor',
    desc: 'Encrypt and decrypt any file locally using military-grade AES-256.',
    icon: <FileLock size={32} style={{ color: '#f87171' }} />,
    path: '/encryptor',
    color: '#f87171'
  },
  {
    title: 'Bcrypt Generator',
    desc: 'Generate and verify secure bcrypt hashes locally.',
    icon: <Fingerprint size={32} style={{ color: '#6366f1' }} />,
    path: '/bcrypt',
    color: '#6366f1'
  },
  {
    title: 'Lorem Ipsum Generator',
    desc: 'Generate realistic placeholder text instantly.',
    icon: <FileText size={32} style={{ color: '#fbbf24' }} />,
    path: '/lorem',
    color: '#fbbf24'
  },
  {
    title: 'Markdown Previewer',
    desc: 'Live editor to write, preview, and export Markdown documents.',
    icon: <Type size={32} style={{ color: '#ec4899' }} />,
    path: '/markdown',
    color: '#ec4899'
  },
  {
    title: 'Cron Job Parser',
    desc: 'Convert complex cron expressions into human-readable text.',
    icon: <Clock size={32} style={{ color: '#8b5cf6' }} />,
    path: '/cron',
    color: '#8b5cf6'
  },
  {
    title: 'CSS Minifier',
    desc: 'Compress and optimize CSS stylesheets for production.',
    icon: <Minimize2 size={32} style={{ color: '#0ea5e9' }} />,
    path: '/css',
    color: '#0ea5e9'
  },
  {
    title: 'HTTP Status Codes',
    desc: 'Quickly lookup HTTP status codes and their detailed meanings.',
    icon: <Code size={32} style={{ color: '#10b981' }} />,
    path: '/http',
    color: '#10b981'
  },
  {
    title: 'Meta Tag Generator',
    desc: 'Generate perfect SEO meta tags for any website.',
    icon: <Braces size={32} style={{ color: '#6366f1' }} />,
    path: '/meta',
    color: '#6366f1'
  },
  {
    title: 'XML Formatter',
    desc: 'Format, minify, and validate XML payloads instantly.',
    icon: <FileCode size={32} style={{ color: '#ec4899' }} />,
    path: '/xml',
    color: '#ec4899'
  },
  {
    title: 'SQL Formatter',
    desc: 'Beautify and format complex SQL queries for readability.',
    icon: <Database size={32} style={{ color: '#38bdf8' }} />,
    path: '/sql',
    color: '#38bdf8'
  },
  {
    title: 'Markdown to HTML',
    desc: 'Convert Markdown strings into raw HTML markup.',
    icon: <ArrowLeftRight size={32} style={{ color: '#f472b6' }} />,
    path: '/mdhtml',
    color: '#f472b6'
  },
  {
    title: 'JWT Generator',
    desc: 'Create and sign custom JSON Web Tokens instantly.',
    icon: <Settings size={32} style={{ color: '#fb923c' }} />,
    path: '/jwtgen',
    color: '#fb923c'
  },
  {
    title: 'YAML to JSON',
    desc: 'Instantly convert YAML configurations into valid JSON.',
    icon: <FileJson size={32} style={{ color: '#10b981' }} />,
    path: '/yaml',
    color: '#10b981'
  },
  {
    title: 'DNS Lookup',
    desc: 'Query DNS records (A, AAAA, MX, TXT) for any domain.',
    icon: <Globe size={32} style={{ color: '#6366f1' }} />,
    path: '/dns',
    color: '#6366f1'
  },
  {
    title: 'Random String Gen',
    desc: 'Generate secure random strings for secrets and passwords.',
    icon: <Shuffle size={32} style={{ color: '#f59e0b' }} />,
    path: '/random',
    color: '#f59e0b'
  },
  // --- COMING SOON TOOLS ---
  {
    title: 'JSON to YAML',
    desc: 'Convert massive JSON structures into clean YAML.',
    icon: <FileCode size={32} style={{ color: '#94a3b8' }} />,
    path: '#',
    color: '#94a3b8',
    comingSoon: true
  },
  {
    title: 'HMAC Generator',
    desc: 'Generate Hash-based Message Authentication Codes.',
    icon: <HmacIcon size={32} style={{ color: '#94a3b8' }} />,
    path: '#',
    color: '#94a3b8',
    comingSoon: true
  },
  {
    title: 'Color Palette Gen',
    desc: 'Generate perfect UI color palettes and gradients.',
    icon: <Palette size={32} style={{ color: '#94a3b8' }} />,
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
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}
      >
        {features.map((feat, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <Link to={feat.path} onClick={(e) => feat.comingSoon && e.preventDefault()} style={{ textDecoration: 'none', display: 'block', height: '100%', cursor: feat.comingSoon ? 'not-allowed' : 'pointer' }}>
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
      </motion.div>
    </div>
  );
};

export default LandingPage;
