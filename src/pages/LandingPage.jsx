import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, Radio, QrCode, Key, Regex, Hash, Heart, KeyRound, Fingerprint, 
  Code, FileCode, Braces, Link2, Type, Binary, ShieldAlert, Cpu, FileLock, 
  Network, ImageMinus, Loader2, FileText, Minimize2, Clock, Database, 
  ArrowLeftRight, Settings, FileJson, Globe, Shuffle, Palette, 
  Fingerprint as HmacIcon, ShieldCheck, LockKeyhole, Server, Wand2, 
  HelpCircle, Calculator, Image as ImageIcon, Wifi, Users, Baseline, 
  Calendar, FileLock2, Tags, FileArchive, Table, Code2, Terminal, 
  BookTemplate, FileType2, Bot, Search, Stethoscope, Monitor, Eye, 
  ChevronLeft, ChevronRight, LayoutGrid, SlidersHorizontal, ArrowUpRight, 
  Layers, X, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useSupport } from '../components/SupportProvider';

// Curated high-tech categories
const CATEGORIES = [
  {
    id: 'ai',
    name: 'A.I & Neural Intelligence',
    shortName: 'A.I',
    code: '01 // NEURAL',
    badge: 'NEURAL ENGINES',
    color: '#06b6d4',
    desc: 'Autonomous LLM sandboxes, prompt optimizers, neural regex generators & API key lab',
    icon: Bot
  },
  {
    id: 'encryption',
    name: 'Cyber Security & Encryption',
    shortName: 'Encryption',
    code: '02 // CIPHERS',
    badge: 'DEFENSE PROTOCOLS',
    color: '#10b981',
    desc: 'Military-grade AES-256-GCM, RSA/EC keypairs, BIP39 seed wallets, JWTs & cryptographic ciphers',
    icon: ShieldCheck
  },
  {
    id: 'web',
    name: 'Web & Network Protocols',
    shortName: 'Web & Net',
    code: '03 // NETWORK',
    badge: 'PROTOCOL STACK',
    color: '#3b82f6',
    desc: 'GraphQL playground, port & network scanners, DNS diagnostics, CORS & subnet engines',
    icon: Globe
  },
  {
    id: 'stealth',
    name: 'Stealth & Covert Systems',
    shortName: 'Stealth',
    code: '04 // COVERT',
    badge: 'ZERO FOOTPRINT',
    color: '#a855f7',
    desc: 'Inaudible acoustic data transmission, zero-width steganography & privacy EXIF scrubbers',
    icon: Shield
  },
  {
    id: 'transformers',
    name: 'Code & Data Transformers',
    shortName: 'Transformers',
    code: '05 // SYNTAX',
    badge: 'CONVERSION PIPELINES',
    color: '#f59e0b',
    desc: 'Bidirectional JSON/YAML/CSV/XML format translators, HTML to JSX, Base64 & SQL builders',
    icon: ArrowLeftRight
  },
  {
    id: 'utilities',
    name: 'System Utilities & Generators',
    shortName: 'Utilities',
    code: '06 // UTILITY',
    badge: 'CORE GENERATORS',
    color: '#ec4899',
    desc: 'Cryptographic UUIDs, regex sandboxes, mock data synthesizers, QR systems & dev visualizers',
    icon: Cpu
  }
];

// All 72 tools mapped with precision
const features = [
  // --- 01: A.I & NEURAL INTELLIGENCE ---
  {
    title: 'API Key Tester',
    categoryId: 'ai',
    tag: 'VALIDATE',
    desc: 'Securely validate API keys for AI models and custom endpoints before deployment.',
    icon: <KeyRound />,
    path: '/apikey',
    color: '#fb923c'
  },
  {
    title: 'API Key Laboratory',
    categoryId: 'ai',
    tag: 'DEEP SCAN',
    desc: 'Deep-scan, auto-detect providers, and identify tiers for massive lists of API keys.',
    icon: <Stethoscope />,
    path: '/api-lab',
    color: '#f43f5e'
  },
  {
    title: 'AI Prompt Optimizer',
    categoryId: 'ai',
    tag: 'NEURAL',
    desc: 'Let AI rewrite and structure your prompts for maximum performance and precision.',
    icon: <Wand2 />,
    path: '/ai-prompt',
    color: '#6366f1'
  },
  {
    title: 'AI Code Explainer',
    categoryId: 'ai',
    tag: 'ANALYSIS',
    desc: 'Paste complex code and let AI explain exactly how the logic works under the hood.',
    icon: <HelpCircle />,
    path: '/ai-code',
    color: '#8b5cf6'
  },
  {
    title: 'AI Regex Generator',
    categoryId: 'ai',
    tag: 'SYNTHESIS',
    desc: 'Describe the pattern you want to match, and neural models synthesize the regex.',
    icon: <Regex />,
    path: '/ai-regex',
    color: '#ec4899'
  },
  {
    title: 'LLM Chat Sandbox',
    categoryId: 'ai',
    tag: 'SANDBOX',
    desc: 'Test raw prompts across OpenAI, Gemini, and Groq directly from your browser.',
    icon: <Bot />,
    path: '/llm-chat',
    color: '#10b981'
  },
  {
    title: 'AI Persona Gen',
    categoryId: 'ai',
    tag: 'SYSTEM PROMPT',
    desc: 'Craft precise system prompts to enforce strict LLM behavior and conversational persona.',
    icon: <Bot />,
    path: '/ai-persona',
    color: '#8b5cf6'
  },

  // --- 02: CYBER SECURITY & ENCRYPTION ---
  {
    title: 'AES-256-GCM Encryptor',
    categoryId: 'encryption',
    tag: 'WEB CRYPTO',
    desc: 'Military-grade authenticated encryption and decryption using the Web Crypto API.',
    icon: <LockKeyhole />,
    path: '/aes-gcm',
    color: '#10b981'
  },
  {
    title: 'Cyber Vault',
    categoryId: 'encryption',
    tag: 'PASSWORDS',
    desc: 'Generate cryptographically secure passwords with customizable entropy settings.',
    icon: <Key />,
    path: '/vault',
    color: '#ec4899'
  },
  {
    title: 'File Encryptor',
    categoryId: 'encryption',
    tag: 'AES-256',
    desc: 'Encrypt and decrypt any file locally in your browser using military-grade AES-256.',
    icon: <FileLock />,
    path: '/encryptor',
    color: '#f87171'
  },
  {
    title: 'Hash Engine',
    categoryId: 'encryption',
    tag: 'SHA-256/512',
    desc: 'Generate highly secure cryptographic hashes (SHA-256, SHA-512, MD5) instantly.',
    icon: <Fingerprint />,
    path: '/hash',
    color: '#10b981'
  },
  {
    title: 'Bcrypt Generator',
    categoryId: 'encryption',
    tag: 'HASH & VERIFY',
    desc: 'Generate and verify salted bcrypt password hashes locally in memory.',
    icon: <Fingerprint />,
    path: '/bcrypt',
    color: '#6366f1'
  },
  {
    title: 'HMAC Generator',
    categoryId: 'encryption',
    tag: 'AUTH CODE',
    desc: 'Generate Hash-based Message Authentication Codes with custom secret keys.',
    icon: <HmacIcon />,
    path: '/hmac',
    color: '#f43f5e'
  },
  {
    title: 'Keypair Generator',
    categoryId: 'encryption',
    tag: 'EC / RSA',
    desc: 'Securely generate asymmetric Elliptic Curve and RSA public/private key pairs.',
    icon: <KeyRound />,
    path: '/keypair-gen',
    color: '#10b981'
  },
  {
    title: 'BIP39 Seed Generator',
    categoryId: 'encryption',
    tag: 'MNEMONIC',
    desc: 'Generate cryptographically secure mnemonic seed phrases for crypto hardware wallets.',
    icon: <KeyRound />,
    path: '/bip39',
    color: '#f59e0b'
  },
  {
    title: 'RSA Key Generator',
    categoryId: 'encryption',
    tag: 'ASYMMETRIC',
    desc: 'Generate secure RSA public and private key pairs locally without leaving browser.',
    icon: <LockKeyhole />,
    path: '/rsa',
    color: '#f59e0b'
  },
  {
    title: 'JWT Inspector',
    categoryId: 'encryption',
    tag: 'OFFLINE',
    desc: 'Decode, verify, and inspect JSON Web Tokens securely right in your browser.',
    icon: <Code />,
    path: '/jwt',
    color: '#c084fc'
  },
  {
    title: 'JWT Generator',
    categoryId: 'encryption',
    tag: 'SIGNING',
    desc: 'Create, customize headers, and sign JSON Web Tokens with local secret keys.',
    icon: <Settings />,
    path: '/jwtgen',
    color: '#fb923c'
  },
  {
    title: 'JWT Decoder',
    categoryId: 'encryption',
    tag: 'DECODE',
    desc: 'Decode and inspect JSON Web Token payloads offline without sharing secret.',
    icon: <FileLock2 />,
    path: '/jwt',
    color: '#14b8a6'
  },
  {
    title: 'Password Strength',
    categoryId: 'encryption',
    tag: 'ENTROPY',
    desc: 'Test password entropy and calculate estimated cracking time against brute force.',
    icon: <ShieldAlert />,
    path: '/pwdstrength',
    color: '#ef4444'
  },
  {
    title: 'SSL Checker',
    categoryId: 'encryption',
    tag: 'TLS CERTS',
    desc: 'Inspect SSL/TLS certificates, cipher suites, and verify expiration dates.',
    icon: <ShieldCheck />,
    path: '/ssl',
    color: '#0ea5e9'
  },
  {
    title: 'Payload Obfuscator',
    categoryId: 'encryption',
    tag: 'WAF BYPASS',
    desc: 'Obfuscate and encode payloads for WAF bypass and security penetration testing.',
    icon: <ShieldAlert />,
    path: '/payload-obfuscator',
    color: '#ef4444'
  },
  {
    title: 'Device Fingerprint',
    categoryId: 'encryption',
    tag: 'TELEMETRY',
    desc: 'Extract hardware, software, canvas, and WebGL fingerprinting identifiers.',
    icon: <Monitor />,
    path: '/fingerprint',
    color: '#f87171'
  },

  // --- 03: WEB & NETWORK PROTOCOLS ---
  {
    title: 'GraphQL Playground',
    categoryId: 'web',
    tag: 'GRAPHQL',
    desc: 'A sleek, browser-based GraphQL client to query APIs directly with custom headers.',
    icon: <Database />,
    path: '/graphql',
    color: '#e11d48'
  },
  {
    title: 'Port Scanner',
    categoryId: 'web',
    tag: 'NET SCAN',
    desc: 'Scan domains and IPs for open common ports and vulnerable service endpoints.',
    icon: <Network />,
    path: '/port-scanner',
    color: '#14b8a6'
  },
  {
    title: 'Network Scanner',
    categoryId: 'web',
    tag: 'IP TRACE',
    desc: 'Ping endpoints, scan open ports, and trace IP geolocations across global routes.',
    icon: <Network />,
    path: '/network',
    color: '#94a3b8'
  },
  {
    title: 'DNS Lookup',
    categoryId: 'web',
    tag: 'RECORDS',
    desc: 'Query DNS records (A, AAAA, MX, TXT, NS, CNAME) for any domain worldwide.',
    icon: <Globe />,
    path: '/dns',
    color: '#6366f1'
  },
  {
    title: 'CORS Tester',
    categoryId: 'web',
    tag: 'SECURITY',
    desc: 'Test Cross-Origin Resource Sharing headers and preflight requests directly.',
    icon: <Network />,
    path: '/cors-tester',
    color: '#eab308'
  },
  {
    title: 'IP Subnet Calculator',
    categoryId: 'web',
    tag: 'CIDR',
    desc: 'Calculate IPv4 subnets, network masks, CIDR ranges, and usable host addresses.',
    icon: <Globe />,
    path: '/subnet',
    color: '#3b82f6'
  },
  {
    title: 'HTTP Status Codes',
    categoryId: 'web',
    tag: 'RFC LOOKUP',
    desc: 'Quickly lookup standard and non-standard HTTP status codes and specifications.',
    icon: <Code />,
    path: '/http',
    color: '#10b981'
  },
  {
    title: 'JSON Formatter',
    categoryId: 'web',
    tag: 'BEAUTIFY',
    desc: 'Format, minify, and validate JSON payloads with syntax error detection.',
    icon: <Braces />,
    path: '/json',
    color: '#fcd34d'
  },
  {
    title: 'URL Encoder',
    categoryId: 'web',
    tag: 'ENCODE',
    desc: 'Safely encode and decode URL components and RFC query string parameters.',
    icon: <Link2 />,
    path: '/url',
    color: '#38bdf8'
  },
  {
    title: 'CSS Minifier',
    categoryId: 'web',
    tag: 'OPTIMIZE',
    desc: 'Compress and optimize CSS stylesheets for lightning-fast production load times.',
    icon: <Minimize2 />,
    path: '/css',
    color: '#0ea5e9'
  },
  {
    title: 'Glassmorphism Generator',
    categoryId: 'web',
    tag: 'CSS3',
    desc: 'Visually configure stunning frosted-glass CSS effects with backdrop blur and border glow.',
    icon: <Palette />,
    path: '/glassmorphism',
    color: '#0ea5e9'
  },
  {
    title: 'Color Contrast Checker',
    categoryId: 'web',
    tag: 'WCAG',
    desc: 'Verify WCAG 2.1 accessibility compliance ratios for foreground and background colors.',
    icon: <Eye />,
    path: '/color-contrast',
    color: '#3b82f6'
  },
  {
    title: 'Meta Tag Generator',
    categoryId: 'web',
    tag: 'SEO',
    desc: 'Generate optimized SEO, OpenGraph, and Twitter Card social media meta tags.',
    icon: <Tags />,
    path: '/meta',
    color: '#0ea5e9'
  },

  // --- 04: STEALTH & COVERT PROTOCOLS ---
  {
    title: 'Phantom Text',
    categoryId: 'stealth',
    tag: 'ZERO-WIDTH',
    desc: 'Encode secret messages into completely invisible zero-width characters for covert stealth.',
    icon: <Shield />,
    path: '/phantom',
    color: '#a855f7'
  },
  {
    title: 'Sonic Transfer',
    categoryId: 'stealth',
    tag: 'ULTRASOUND',
    desc: 'Transmit text payloads over-the-air to nearby devices using high-frequency ultrasound waves.',
    icon: <Radio />,
    path: '/sonic',
    color: '#10b981'
  },
  {
    title: 'EXIF Scrubber',
    categoryId: 'stealth',
    tag: 'PRIVACY',
    desc: 'Strip GPS coordinates, camera serials, and privacy metadata from images completely.',
    icon: <ImageMinus />,
    path: '/exif',
    color: '#94a3b8'
  },

  // --- 05: CODE & DATA TRANSFORMERS ---
  {
    title: 'YAML to JSON',
    categoryId: 'transformers',
    tag: 'CONVERT',
    desc: 'Instantly convert complex YAML configurations into valid formatted JSON.',
    icon: <FileJson />,
    path: '/yaml',
    color: '#10b981'
  },
  {
    title: 'JSON to YAML',
    categoryId: 'transformers',
    tag: 'CONVERT',
    desc: 'Convert massive JSON structures into clean, human-readable YAML configurations.',
    icon: <FileCode />,
    path: '/json2yaml',
    color: '#0ea5e9'
  },
  {
    title: 'JSON to CSV',
    categoryId: 'transformers',
    tag: 'SPREADSHEET',
    desc: 'Convert JSON data arrays to downloadable CSV tabular spreadsheets.',
    icon: <Table />,
    path: '/json2csv',
    color: '#10b981'
  },
  {
    title: 'HTML to JSX Converter',
    categoryId: 'transformers',
    tag: 'REACT',
    desc: 'Instantly convert raw HTML code into React-ready JSX syntax with camelCase props.',
    icon: <Code2 />,
    path: '/html2jsx',
    color: '#06b6d4'
  },
  {
    title: 'Markdown to HTML',
    categoryId: 'transformers',
    tag: 'MARKDOWN',
    desc: 'Convert Markdown strings into raw HTML markup with live preview.',
    icon: <ArrowLeftRight />,
    path: '/mdhtml',
    color: '#f472b6'
  },
  {
    title: 'XML Formatter',
    categoryId: 'transformers',
    tag: 'FORMAT',
    desc: 'Format, minify, and validate XML payloads with syntax coloring instantly.',
    icon: <FileCode />,
    path: '/xml',
    color: '#ec4899'
  },
  {
    title: 'Base64 Converter',
    categoryId: 'transformers',
    tag: 'B64',
    desc: 'Instantly encode and decode UTF-8 strings to and from Base64 format.',
    icon: <FileCode />,
    path: '/base64',
    color: '#60a5fa'
  },
  {
    title: 'Base64 File Encoder',
    categoryId: 'transformers',
    tag: 'BINARY',
    desc: 'Convert images and binary files directly into Base64 Data URI strings.',
    icon: <FileArchive />,
    path: '/base64file',
    color: '#8b5cf6'
  },
  {
    title: 'Base Converter',
    categoryId: 'transformers',
    tag: 'HEX/BIN',
    desc: 'Instantly convert numbers between Binary, Octal, Decimal, and Hexadecimal.',
    icon: <Binary />,
    path: '/base',
    color: '#4ade80'
  },
  {
    title: 'SQL Formatter',
    categoryId: 'transformers',
    tag: 'FORMAT',
    desc: 'Beautify and indent complex SQL queries for standard database engines.',
    icon: <Database />,
    path: '/sql',
    color: '#38bdf8'
  },
  {
    title: 'Visual SQL Builder',
    categoryId: 'transformers',
    tag: 'QUERY',
    desc: 'Quickly construct standard SQL SELECT queries visually without syntax errors.',
    icon: <Database />,
    path: '/sql-builder',
    color: '#8b5cf6'
  },
  {
    title: 'Docker Compose Gen',
    categoryId: 'transformers',
    tag: 'CONTAINERS',
    desc: 'Visually construct multi-container docker-compose.yml configuration files.',
    icon: <Server />,
    path: '/docker-compose',
    color: '#3b82f6'
  },
  {
    title: 'CSV to JSON',
    categoryId: 'transformers',
    tag: 'SOON',
    desc: 'Convert CSV spreadsheets back to nested JSON structures.',
    icon: <FileType2 />,
    path: '#',
    color: '#94a3b8',
    comingSoon: true
  },
  {
    title: 'Curl Command Gen',
    categoryId: 'transformers',
    tag: 'SOON',
    desc: 'Generate fetch and axios code from complex curl requests.',
    icon: <Terminal />,
    path: '#',
    color: '#94a3b8',
    comingSoon: true
  },

  // --- 06: SYSTEM UTILITIES & GENERATORS ---
  {
    title: 'Regex Sandbox',
    categoryId: 'utilities',
    tag: 'TESTER',
    desc: 'A live playground to test, debug, and execute Regular Expressions on the fly.',
    icon: <Regex />,
    path: '/regex',
    color: '#8b5cf6'
  },
  {
    title: 'UUID Generator',
    categoryId: 'utilities',
    tag: 'UUID v4',
    desc: 'Instantly generate universally unique identifiers (v4) for your database records.',
    icon: <Hash />,
    path: '/uuid',
    color: '#0ea5e9'
  },
  {
    title: 'CRON Job Generator',
    categoryId: 'utilities',
    tag: 'SCHEDULE',
    desc: 'Generate and explain complex CRON schedule expressions with human text.',
    icon: <Calendar />,
    path: '/cron',
    color: '#ec4899'
  },
  {
    title: 'Cron Job Parser',
    categoryId: 'utilities',
    tag: 'EXPLAIN',
    desc: 'Convert complex cron expressions into human-readable schedule explanations.',
    icon: <Clock />,
    path: '/cron',
    color: '#8b5cf6'
  },
  {
    title: 'Fake Data Generator',
    categoryId: 'utilities',
    tag: 'MOCK DATA',
    desc: 'Generate large datasets of realistic mock user names, emails, and addresses.',
    icon: <Users />,
    path: '/fake-data',
    color: '#f59e0b'
  },
  {
    title: 'Lorem Ipsum Generator',
    categoryId: 'utilities',
    tag: 'PLACEHOLDER',
    desc: 'Generate custom paragraphs, sentences, or words of placeholder filler text.',
    icon: <FileText />,
    path: '/lorem',
    color: '#fbbf24'
  },
  {
    title: 'Color Palette Gen',
    categoryId: 'utilities',
    tag: 'PALETTES',
    desc: 'Generate harmonious UI color schemes, shades, and gradients for design.',
    icon: <Palette />,
    path: '/palette',
    color: '#a855f7'
  },
  {
    title: 'SVG Placeholder Gen',
    categoryId: 'utilities',
    tag: 'SVG',
    desc: 'Generate dynamic, lightweight SVG placeholder images for web development.',
    icon: <ImageIcon />,
    path: '/svg',
    color: '#f43f5e'
  },
  {
    title: 'ASCII Art Generator',
    categoryId: 'utilities',
    tag: 'RETRO',
    desc: 'Convert plain text into stylized retro terminal ASCII banner art fonts.',
    icon: <Baseline />,
    path: '/ascii',
    color: '#8b5cf6'
  },
  {
    title: 'Chmod Calculator',
    categoryId: 'utilities',
    tag: 'PERMISSIONS',
    desc: 'Convert Linux file permissions between octal numbers (e.g. 755) and symbolic flags.',
    icon: <Calculator />,
    path: '/chmod',
    color: '#10b981'
  },
  {
    title: 'QR Code Engine',
    categoryId: 'utilities',
    tag: 'HIGH RES',
    desc: 'Generate high-res QR codes instantly with customizable colors and error correction.',
    icon: <QrCode />,
    path: '/qrcode',
    color: '#f59e0b'
  },
  {
    title: 'WiFi QR Generator',
    categoryId: 'utilities',
    tag: 'CONNECT',
    desc: 'Create secure WiFi connect QR codes for automatic instant device connection.',
    icon: <Wifi />,
    path: '/wifi-qr',
    color: '#10b981'
  },
  {
    title: 'Random String Gen',
    categoryId: 'utilities',
    tag: 'ENTROPY',
    desc: 'Generate high-entropy random strings, hex keys, and custom alphanumeric tokens.',
    icon: <Shuffle />,
    path: '/random',
    color: '#f59e0b'
  },
  {
    title: 'Code to Image',
    categoryId: 'utilities',
    tag: 'EXPORT',
    desc: 'Create stunning, shareable aesthetic images of your source code snippets.',
    icon: <Code2 />,
    path: '/code-to-image',
    color: '#ec4899'
  },
  {
    title: 'Text Tools',
    categoryId: 'utilities',
    tag: 'MANIPULATE',
    desc: 'Manipulate text strings: word counts, case transforms, sorting, and deduplication.',
    icon: <Type />,
    path: '/text',
    color: '#a78bfa'
  },
  {
    title: 'Text Diff Viewer',
    categoryId: 'utilities',
    tag: 'COMPARE',
    desc: 'Compare two text blocks or code files side-by-side to highlight differences.',
    icon: <ArrowLeftRight />,
    path: '/text-diff',
    color: '#14b8a6'
  },
  {
    title: 'Markdown Table Gen',
    categoryId: 'utilities',
    tag: 'TABLES',
    desc: 'Visually edit and format Github-flavored markdown tables with custom columns.',
    icon: <Table />,
    path: '/md-table',
    color: '#6366f1'
  },
  {
    title: 'Markdown Previewer',
    categoryId: 'utilities',
    tag: 'LIVE PREVIEW',
    desc: 'Real-time Markdown editor to compose, render, preview, and export documents.',
    icon: <Type />,
    path: '/markdown',
    color: '#ec4899'
  },
  {
    title: 'Github Readme Gen',
    categoryId: 'utilities',
    tag: 'SOON',
    desc: 'Create beautiful, standardized Github README.md project files visually.',
    icon: <BookTemplate />,
    path: '#',
    color: '#94a3b8',
    comingSoon: true
  }
];

// Reusable Tool Card Component
// Note: Per user request, the Tool Title is at the top, and its glowing Icon is directly below it!
const ToolCard = ({ tool }) => {
  return (
    <Link 
      to={tool.comingSoon ? '#' : tool.path} 
      className="tool-row-card"
      style={{
        pointerEvents: tool.comingSoon ? 'none' : 'auto',
        opacity: tool.comingSoon ? 0.75 : 1,
        filter: tool.comingSoon ? 'grayscale(0.3)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!tool.comingSoon) {
          e.currentTarget.style.borderColor = `${tool.color}70`;
          e.currentTarget.style.boxShadow = `0 12px 30px ${tool.color}25, 0 0 15px ${tool.color}15`;
        }
      }}
      onMouseLeave={(e) => {
        if (!tool.comingSoon) {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        }
      }}
    >
      {/* Background glow radial */}
      <div 
        className="tool-card-glow-bg" 
        style={{ background: `radial-gradient(circle at 50% 20%, ${tool.color}, transparent 70%)` }} 
      />

      <div className="tool-card-content">
        {/* Top: Status / Tag & Indicator */}
        <div className="tool-card-top">
          <span 
            className="tool-card-badge" 
            style={{ 
              background: tool.comingSoon ? 'rgba(255, 255, 255, 0.08)' : `${tool.color}20`, 
              color: tool.comingSoon ? '#888' : tool.color,
              border: `1px solid ${tool.comingSoon ? 'rgba(255, 255, 255, 0.1)' : `${tool.color}40`}` 
            }}
          >
            {tool.comingSoon ? 'SOON' : (tool.tag || 'READY')}
          </span>
          <div className="tool-card-arrow">
            {tool.comingSoon ? <Loader2 size={16} /> : <ArrowUpRight size={16} />}
          </div>
        </div>

        {/* 1. Tool Title */}
        <h3 className="tool-card-title">{tool.title}</h3>

        {/* 2. Glowing Icon Below the Tool Title (as requested) */}
        <div 
          className="tool-card-icon-container"
          style={{
            background: `radial-gradient(circle, ${tool.color}22 0%, rgba(255, 255, 255, 0.02) 80%)`,
            borderColor: `${tool.color}35`,
            boxShadow: `0 0 16px ${tool.color}18`
          }}
        >
          {React.cloneElement(tool.icon, { size: 30, style: { color: tool.color } })}
        </div>

        {/* 3. Description */}
        <p className="tool-card-desc">{tool.desc}</p>

        {/* 4. Action Bar */}
        <div className="tool-card-action">
          <span>{tool.comingSoon ? 'IN LAB' : 'ACCESS MODULE'}</span>
          <span style={{ color: tool.color }}>→</span>
        </div>
      </div>
    </Link>
  );
};

// Reusable Horizontal Section Component with Left/Right Scroll Controls & View Switcher
const HorizontalSection = ({
  category,
  tools,
  viewMode,
  onToggleViewMode
}) => {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = trackRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [tools, viewMode]);

  const scroll = (direction) => {
    if (!trackRef.current) return;
    const scrollAmount = 540; // Approx 2 cards
    trackRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const IconComponent = category.icon;

  return (
    <section id={`section-${category.id}`} className="horizontal-section">
      <div className="section-header">
        <div className="section-header-info">
          <div className="section-code-badge" style={{ color: category.color }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: category.color, boxShadow: `0 0 8px ${category.color}` }}></span>
            {category.code}
          </div>
          <div className="section-title-wrap">
            <h2 className="section-title">
              <IconComponent size={24} style={{ color: category.color }} />
              {category.name}
            </h2>
            <span className="section-badge-pill" style={{ background: `${category.color}18`, color: category.color, border: `1px solid ${category.color}35` }}>
              {tools.length} {tools.length === 1 ? 'TOOL' : 'TOOLS'}
            </span>
          </div>
          <p className="section-subtitle">{category.desc}</p>
        </div>

        <div className="section-controls">
          <button 
            type="button"
            className="view-toggle-btn"
            onClick={() => onToggleViewMode(category.id)}
            title={viewMode === 'grid' ? "Switch to Carousel Row" : "Expand to Full Grid"}
          >
            {viewMode === 'grid' ? <SlidersHorizontal size={14} /> : <LayoutGrid size={14} />}
            <span>{viewMode === 'grid' ? 'Row View' : 'Grid View'}</span>
          </button>

          {viewMode !== 'grid' && (
            <>
              <button
                type="button"
                className="section-nav-btn"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label={`Scroll ${category.name} left`}
                title="Scroll Left"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="section-nav-btn"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label={`Scroll ${category.name} right`}
                title="Scroll Right"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="tools-grid-expanded">
          {tools.map(tool => (
            <ToolCard key={tool.title} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="horizontal-scroll-track" ref={trackRef}>
          {tools.map(tool => (
            <ToolCard key={tool.title} tool={tool} />
          ))}
        </div>
      )}
    </section>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  const showSupport = useSupport();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [sectionViewModes, setSectionViewModes] = useState({}); // { [catId]: 'carousel' | 'grid' }
  const [globalViewMode, setGlobalViewMode] = useState('carousel'); // 'carousel' | 'grid'

  // Filter tools based on search query
  const filteredFeatures = features.filter(feat => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      feat.title.toLowerCase().includes(q) || 
      feat.desc.toLowerCase().includes(q) ||
      (feat.tag && feat.tag.toLowerCase().includes(q)) ||
      feat.categoryId.toLowerCase().includes(q)
    );
  });

  const toggleSectionViewMode = (catId) => {
    setSectionViewModes(prev => {
      const current = prev[catId] || globalViewMode;
      return {
        ...prev,
        [catId]: current === 'grid' ? 'carousel' : 'grid'
      };
    });
  };

  const handleGlobalViewModeToggle = () => {
    const nextMode = globalViewMode === 'carousel' ? 'grid' : 'carousel';
    setGlobalViewMode(nextMode);
    // Reset individual section overrides to match global
    const reset = {};
    CATEGORIES.forEach(c => { reset[c.id] = nextMode; });
    setSectionViewModes(reset);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Categories that have at least 1 matching tool
  const visibleCategories = CATEGORIES.filter(cat => {
    if (activeCategoryFilter !== 'all' && activeCategoryFilter !== cat.id) {
      return false;
    }
    const toolsInCat = filteredFeatures.filter(f => f.categoryId === cat.id);
    return toolsInCat.length > 0;
  });

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 1rem' }}>
      {/* Hero Presentation */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '1.5rem' }}
      >
        <Logo size={80} style={{ margin: '0 auto', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 25px rgba(94, 106, 210, 0.45))' }} />
        
        <h1 style={{ 
          fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', 
          fontWeight: 900,
          marginBottom: '1rem', 
          background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px'
        }}>
          Welcome to SAKrypt Suite
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '640px', margin: '0 auto 1.8rem auto', lineHeight: 1.6 }}>
          A professional, hyper-secure collection of cryptography, AI sandboxes, and developer utilities. 
          Operate in absolute stealth.
        </p>

        {/* Futuristic Cyber HUD */}
        <div className="cyber-hud">
          <div className="hud-pill">
            <span className="hud-dot"></span>
            <span style={{ color: '#fff' }}>SAKRYPT MATRIX v3.0</span>
          </div>
          <div className="hud-pill">
            <span>STATUS:</span>
            <span style={{ color: '#10b981' }}>SYSTEM ONLINE</span>
          </div>
          <div className="hud-pill">
            <span>ARMED PROTOCOLS:</span>
            <span style={{ color: '#06b6d4' }}>72 TOOLS</span>
          </div>
          <div className="hud-pill">
            <span>SECURITY:</span>
            <span style={{ color: '#a855f7' }}>CLIENT-SIDE ISOLATED</span>
          </div>
        </div>

        <button 
          onClick={showSupport}
          className="btn-primary"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '0.65rem 1.4rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <Heart size={16} style={{ color: '#ef4444' }} /> Support the Developer
        </button>

        {/* Search & Intelligence Field */}
        <div style={{ marginTop: '2.5rem', maxWidth: '680px', margin: '2.5rem auto 0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={20} />
          </div>

          <input 
            type="text" 
            className="input-glass" 
            placeholder="Search tools by name, tag or tech (e.g. AES, JWT, LLM, GraphQL, Port)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '1.1rem 3.5rem 1.1rem 3.2rem', 
              fontSize: '1.05rem', 
              borderRadius: '14px',
              border: '1px solid rgba(94, 106, 210, 0.35)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
              background: 'rgba(10, 12, 22, 0.75)'
            }}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '1.2rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Status / Counter */}
        {searchQuery && (
          <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Found <strong style={{ color: '#fff' }}>{filteredFeatures.length}</strong> matching {filteredFeatures.length === 1 ? 'tool' : 'tools'} across <strong style={{ color: '#fff' }}>{visibleCategories.length}</strong> {visibleCategories.length === 1 ? 'category' : 'categories'}.
          </div>
        )}
      </motion.div>

      {/* Category Quick Dock (Sticky Ribbon Navigation) */}
      <div className="category-dock-wrapper" id="browse-matrix">
        <div className="category-dock">
          <button
            type="button"
            className={`category-pill ${activeCategoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategoryFilter('all');
            }}
          >
            <Layers size={15} />
            <span>ALL PROTOCOLS</span>
            <span className="category-pill-count">{features.length}</span>
          </button>

          {CATEGORIES.map(cat => {
            const catCount = features.filter(f => f.categoryId === cat.id).length;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${activeCategoryFilter === cat.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategoryFilter(cat.id);
                  const el = document.getElementById(`section-${cat.id}`);
                  if (el) {
                    const yOffset = -140; 
                    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
              >
                <Icon size={15} style={{ color: cat.color }} />
                <span>{cat.shortName}</span>
                <span className="category-pill-count">{catCount}</span>
              </button>
            );
          })}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              className="view-toggle-btn"
              onClick={handleGlobalViewModeToggle}
              title={globalViewMode === 'carousel' ? "Expand all sections into grid matrix" : "Collapse all sections into horizontal rows"}
            >
              {globalViewMode === 'carousel' ? <LayoutGrid size={15} /> : <SlidersHorizontal size={15} />}
              <span>{globalViewMode === 'carousel' ? 'Expand All Rows' : 'Collapse to Rows'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Category Shelves / Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        {visibleCategories.map(cat => {
          const catTools = filteredFeatures.filter(f => f.categoryId === cat.id);
          const viewMode = sectionViewModes[cat.id] || globalViewMode;

          return (
            <HorizontalSection 
              key={cat.id}
              category={cat}
              tools={catTools}
              viewMode={viewMode}
              onToggleViewMode={toggleSectionViewMode}
            />
          );
        })}

        {/* Zero Results State */}
        {filteredFeatures.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '5rem 2rem', 
            color: 'var(--text-muted)',
            background: 'rgba(14, 17, 26, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            margin: '2rem 0'
          }}>
            <Search size={52} style={{ opacity: 0.25, margin: '0 auto 1.5rem auto' }} />
            <h3 style={{ color: '#fff', fontSize: '1.4rem', margin: '0 0 0.5rem 0' }}>No Protocols Match Your Query</h3>
            <p style={{ maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
              No tools matched "<span style={{ color: 'var(--accent)' }}>{searchQuery}</span>". Try searching for keywords like JSON, JWT, Hash, Scanner, or AI.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={clearSearch}
              style={{ padding: '0.6rem 1.5rem', borderRadius: '10px' }}
            >
              Reset Search Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
