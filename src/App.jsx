import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
const PhantomText = React.lazy(() => import('./pages/tools/PhantomText'));
const CyberVault = React.lazy(() => import('./pages/tools/CyberVault'));
const RegexTester = React.lazy(() => import('./pages/tools/RegexTester'));
const UUIDGenerator = React.lazy(() => import('./pages/tools/UUIDGenerator'));
const QRCodeGenerator = React.lazy(() => import('./pages/tools/QRCodeGenerator'));
const SonicTransfer = React.lazy(() => import('./pages/tools/SonicTransfer'));
const AIImageGenerator = React.lazy(() => import('./pages/tools/AIImageGenerator'));
const APIKeyTester = React.lazy(() => import('./pages/tools/APIKeyTester'));
const HashEngine = React.lazy(() => import('./pages/tools/HashEngine'));
const JWTInspector = React.lazy(() => import('./pages/tools/JWTInspector'));
const Base64Converter = React.lazy(() => import('./pages/tools/Base64Converter'));
const JSONFormatter = React.lazy(() => import('./pages/tools/JSONFormatter'));
const URLEncoder = React.lazy(() => import('./pages/tools/URLEncoder'));
const TextTools = React.lazy(() => import('./pages/tools/TextTools'));
const NumberBaseConverter = React.lazy(() => import('./pages/tools/NumberBaseConverter'));
const PasswordStrength = React.lazy(() => import('./pages/tools/PasswordStrength'));
const EXIFScrubber = React.lazy(() => import('./pages/tools/EXIFScrubber'));
const NetworkScanner = React.lazy(() => import('./pages/tools/NetworkScanner'));
const FileEncryptor = React.lazy(() => import('./pages/tools/FileEncryptor'));
const BcryptGenerator = React.lazy(() => import('./pages/tools/BcryptGenerator'));
const LoremIpsum = React.lazy(() => import('./pages/tools/LoremIpsum'));
const MarkdownPreviewer = React.lazy(() => import('./pages/tools/MarkdownPreviewer'));
const CronJobParser = React.lazy(() => import('./pages/tools/CronJobParser'));
const CSSMinifier = React.lazy(() => import('./pages/tools/CSSMinifier'));
const HTTPStatusCodes = React.lazy(() => import('./pages/tools/HTTPStatusCodes'));
const MetaTagGenerator = React.lazy(() => import('./pages/tools/MetaTagGenerator'));
const XMLFormatter = React.lazy(() => import('./pages/tools/XMLFormatter'));
const SQLFormatter = React.lazy(() => import('./pages/tools/SQLFormatter'));
const MarkdownToHTML = React.lazy(() => import('./pages/tools/MarkdownToHTML'));
const JWTGenerator = React.lazy(() => import('./pages/tools/JWTGenerator'));
const YAMLToJSON = React.lazy(() => import('./pages/tools/YAMLToJSON'));
const DNSLookup = React.lazy(() => import('./pages/tools/DNSLookup'));
const RandomStringGen = React.lazy(() => import('./pages/tools/RandomStringGen'));
const JSONToYAML = React.lazy(() => import('./pages/tools/JSONToYAML'));
const HMACGenerator = React.lazy(() => import('./pages/tools/HMACGenerator'));
const ColorPaletteGen = React.lazy(() => import('./pages/tools/ColorPaletteGen'));
const AIPromptOptimizer = React.lazy(() => import('./pages/tools/AIPromptOptimizer'));
const AICodeExplainer = React.lazy(() => import('./pages/tools/AICodeExplainer'));
const AIRegexGenerator = React.lazy(() => import('./pages/tools/AIRegexGenerator'));
const PortScanner = React.lazy(() => import('./pages/tools/PortScanner'));
const SSLChecker = React.lazy(() => import('./pages/tools/SSLChecker'));
const RSAKeyGenerator = React.lazy(() => import('./pages/tools/RSAKeyGenerator'));
const ChmodCalculator = React.lazy(() => import('./pages/tools/ChmodCalculator'));
const IPSubnetCalculator = React.lazy(() => import('./pages/tools/IPSubnetCalculator'));
const SVGPlaceholderGen = React.lazy(() => import('./pages/tools/SVGPlaceholderGen'));
const ASCIIArtGenerator = React.lazy(() => import('./pages/tools/ASCIIArtGenerator'));
const WiFiQRGenerator = React.lazy(() => import('./pages/tools/WiFiQRGenerator'));
const FakeDataGenerator = React.lazy(() => import('./pages/tools/FakeDataGenerator'));
const CRONJobGenerator = React.lazy(() => import('./pages/tools/CRONJobGenerator'));
const JWTDecoder = React.lazy(() => import('./pages/tools/JWTDecoder'));
const Base64FileEncoder = React.lazy(() => import('./pages/tools/Base64FileEncoder'));
const JSONToCSV = React.lazy(() => import('./pages/tools/JSONToCSV'));
const HTMLToJSXConverter = React.lazy(() => import('./pages/tools/HTMLToJSXConverter'));
const LLMChatSandbox = React.lazy(() => import('./pages/tools/LLMChatSandbox'));
const GlassmorphismGen = React.lazy(() => import('./pages/tools/GlassmorphismGen'));
const BrowserFingerprint = React.lazy(() => import('./pages/tools/BrowserFingerprint'));
const PayloadObfuscator = React.lazy(() => import('./pages/tools/PayloadObfuscator'));
const ColorContrastChecker = React.lazy(() => import('./pages/tools/ColorContrastChecker'));
const CodeToImage = React.lazy(() => import('./pages/tools/CodeToImage'));
const AIPersonaGen = React.lazy(() => import('./pages/tools/AIPersonaGen'));
const TextDiffViewer = React.lazy(() => import('./pages/tools/TextDiffViewer'));
const CORSTester = React.lazy(() => import('./pages/tools/CORSTester'));
const MarkdownTableGen = React.lazy(() => import('./pages/tools/MarkdownTableGen'));
const KeypairGen = React.lazy(() => import('./pages/tools/KeypairGen'));
const BIP39Generator = React.lazy(() => import('./pages/tools/BIP39Generator'));
const GraphQLPlayground = React.lazy(() => import('./pages/tools/GraphQLPlayground'));
const AES256GCMEncryptor = React.lazy(() => import('./pages/tools/AES256GCMEncryptor'));
const DockerComposeGen = React.lazy(() => import('./pages/tools/DockerComposeGen'));
const SQLQueryBuilder = React.lazy(() => import('./pages/tools/SQLQueryBuilder'));
const APIKeyLaboratory = React.lazy(() => import('./pages/tools/APIKeyLaboratory'));
import LandingPage from './pages/LandingPage';
import { Shield, Key, Regex, Hash, QrCode, Heart, Radio, KeyRound, Fingerprint, Code, FileCode, Braces, Link2, Type, Binary, ShieldAlert, ImageMinus, Network, FileLock, FileText, Clock, Minimize2, Database, ArrowLeftRight, Settings, FileJson, Globe, Shuffle, Palette, Fingerprint as HmacIcon, Wand2, HelpCircle, ShieldCheck, LockKeyhole, Server, Calculator, Image as ImageIcon, Wifi, Users, Baseline, Calendar, FileLock2, FileArchive, Table, Code2, Bot, Stethoscope, Home, LayoutGrid, Sparkles } from 'lucide-react';
import Logo from './components/Logo';
import { ToastProvider } from './components/ToastProvider';
import { SupportProvider, useSupport } from './components/SupportProvider';
import './index.css';

// A sleek Top Navigation Bar matching the new UI
const TopBar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => currentPath === path ? 'active-link' : '';

  return (
    <motion.nav 
      className="top-nav"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="nav-brand">
          <Logo size={28} className="brand-icon" />
          <span>SAKrypt Suite</span>
        </div>
      </Link>
      <div className="nav-primary-links">
        <Link to="/" className={`nav-primary-link ${isActive('/')}`}><Home size={16} /> Home</Link>
        <a href="/#browse-matrix" className="nav-primary-link"><LayoutGrid size={16} /> Browse tools</a>
        <a href="/#sak-ai" className="nav-primary-link"><Bot size={16} /> S.A.K AI</a>
        <Link to="/llm-chat" className={`nav-primary-link ${isActive('/llm-chat')}`}><Sparkles size={16} /> AI Chat</Link>
      </div>
      <div className="nav-links legacy-tool-nav">
        <Link to="/phantom" className={`nav-link ${isActive('/phantom')}`} title="Phantom Text (Stealth Morse)">
          <Shield className="icon-sm" /> Phantom
        </Link>
        <Link to="/sonic" className={`nav-link ${isActive('/sonic')}`} title="Sonic Transfer">
          <Radio className="icon-sm" /> Sonic
        </Link>
        <Link to="/qrcode" className={`nav-link ${isActive('/qrcode')}`} title="QR Code">
          <QrCode className="icon-sm" /> QR Code
        </Link>
        <Link to="/image" className={`nav-link ${isActive('/image')}`} title="AI Image Generator">
          <ImageIcon className="icon-sm" /> Image AI
        </Link>
        <Link to="/vault" className={`nav-link ${isActive('/vault')}`} title="Cyber Vault">
          <Key className="icon-sm" /> Vault
        </Link>
        <Link to="/regex" className={`nav-link ${isActive('/regex')}`} title="Regex Tester">
          <Regex className="icon-sm" /> Regex
        </Link>
        <Link to="/uuid" className={`nav-link ${isActive('/uuid')}`} title="UUID Gen">
          <Hash className="icon-sm" /> UUID
        </Link>
        <Link to="/apikey" className={`nav-link ${isActive('/apikey')}`} title="API Key Tester">
          <KeyRound className="icon-sm" /> API Keys
        </Link>
        <Link to="/api-lab" className={`nav-link ${isActive('/api-lab')}`} title="API Key Laboratory">
          <Stethoscope className="icon-sm" /> API Lab
        </Link>
        <Link to="/hash" className={`nav-link ${isActive('/hash')}`} title="Hash Engine">
          <Fingerprint className="icon-sm" /> Hash
        </Link>
        <Link to="/jwt" className={`nav-link ${isActive('/jwt')}`} title="JWT Inspector">
          <Code className="icon-sm" /> JWT
        </Link>
        <Link to="/base64" className={`nav-link ${isActive('/base64')}`} title="Base64 Converter">
          <FileCode className="icon-sm" /> Base64
        </Link>
        <Link to="/json" className={`nav-link ${isActive('/json')}`} title="JSON Formatter">
          <Braces className="icon-sm" /> JSON
        </Link>
        <Link to="/url" className={`nav-link ${isActive('/url')}`} title="URL Encoder">
          <Link2 className="icon-sm" /> URL
        </Link>
        <Link to="/text" className={`nav-link ${isActive('/text')}`} title="Text Tools">
          <Type className="icon-sm" /> Text
        </Link>
        <Link to="/base" className={`nav-link ${isActive('/base')}`} title="Base Converter">
          <Binary className="icon-sm" /> Base Conv
        </Link>
        <Link to="/pwdstrength" className={`nav-link ${isActive('/pwdstrength')}`} title="Password Strength">
          <ShieldAlert className="icon-sm" /> Pwd Test
        </Link>
        <Link to="/exif" className={`nav-link ${isActive('/exif')}`} title="EXIF Scrubber">
          <ImageMinus className="icon-sm" /> EXIF
        </Link>
        <Link to="/network" className={`nav-link ${isActive('/network')}`} title="Network Scanner">
          <Network className="icon-sm" /> IP Trace
        </Link>
        <Link to="/encryptor" className={`nav-link ${isActive('/encryptor')}`} title="File Encryptor Vault">
          <FileLock className="icon-sm" /> File Encrypt
        </Link>
        <Link to="/bcrypt" className={`nav-link ${isActive('/bcrypt')}`} title="Bcrypt Hash Generator">
          <Fingerprint className="icon-sm" /> Bcrypt
        </Link>
        <Link to="/lorem" className={`nav-link ${isActive('/lorem')}`} title="Lorem Ipsum">
          <FileText className="icon-sm" /> Lorem
        </Link>
        <Link to="/markdown" className={`nav-link ${isActive('/markdown')}`} title="Markdown Previewer">
          <Type className="icon-sm" /> Markdown
        </Link>
        <Link to="/cron" className={`nav-link ${isActive('/cron')}`} title="Cron Parser">
          <Clock className="icon-sm" /> Cron
        </Link>
        <Link to="/css" className={`nav-link ${isActive('/css')}`} title="CSS Minifier">
          <Minimize2 className="icon-sm" /> CSS Min
        </Link>
        <Link to="/http" className={`nav-link ${isActive('/http')}`} title="HTTP Status Codes">
          <Code className="icon-sm" /> HTTP Codes
        </Link>
        <Link to="/meta" className={`nav-link ${isActive('/meta')}`} title="Meta Tag Generator">
          <Braces className="icon-sm" /> Meta Tags
        </Link>
        <Link to="/xml" className={`nav-link ${isActive('/xml')}`} title="XML Formatter">
          <FileCode className="icon-sm" /> XML
        </Link>
        <Link to="/sql" className={`nav-link ${isActive('/sql')}`} title="SQL Formatter">
          <Database className="icon-sm" /> SQL Formatter
        </Link>
        <Link to="/mdhtml" className={`nav-link ${isActive('/mdhtml')}`} title="Markdown to HTML">
          <ArrowLeftRight className="icon-sm" /> MD to HTML
        </Link>
        <Link to="/jwtgen" className={`nav-link ${isActive('/jwtgen')}`} title="JWT Generator">
          <Settings className="icon-sm" /> JWT Gen
        </Link>
        <Link to="/yaml" className={`nav-link ${isActive('/yaml')}`} title="YAML to JSON">
          <FileJson className="icon-sm" /> YAML2JSON
        </Link>
        <Link to="/json2yaml" className={`nav-link ${isActive('/json2yaml')}`} title="JSON to YAML">
          <FileCode className="icon-sm" /> JSON2YAML
        </Link>
        <Link to="/dns" className={`nav-link ${isActive('/dns')}`} title="DNS Lookup">
          <Globe className="icon-sm" /> DNS Lookup
        </Link>
        <Link to="/random" className={`nav-link ${isActive('/random')}`} title="Random String">
          <Shuffle className="icon-sm" /> Random Str
        </Link>
        <Link to="/hmac" className={`nav-link ${isActive('/hmac')}`} title="HMAC Generator">
          <HmacIcon className="icon-sm" /> HMAC Gen
        </Link>
        <Link to="/palette" className={`nav-link ${isActive('/palette')}`} title="Color Palette">
          <Palette className="icon-sm" /> Colors
        </Link>
        <Link to="/ai-prompt" className={`nav-link ${isActive('/ai-prompt')}`} title="AI Prompt Optimizer">
          <Wand2 className="icon-sm" /> AI Prompts
        </Link>
        <Link to="/ai-code" className={`nav-link ${isActive('/ai-code')}`} title="AI Code Explainer">
          <HelpCircle className="icon-sm" /> AI Explainer
        </Link>
        <Link to="/ai-regex" className={`nav-link ${isActive('/ai-regex')}`} title="AI Regex Gen">
          <Regex className="icon-sm" /> AI Regex
        </Link>
        <Link to="/llm-chat" className={`nav-link ${isActive('/llm-chat')}`} title="LLM Chat Sandbox">
          <Bot className="icon-sm" /> LLM Chat
        </Link>
        <Link to="/port-scanner" className={`nav-link ${isActive('/port-scanner')}`} title="Port Scanner">
          <Network className="icon-sm" /> Port Scan
        </Link>
        <Link to="/ssl" className={`nav-link ${isActive('/ssl')}`} title="SSL Checker">
          <ShieldCheck className="icon-sm" /> SSL Check
        </Link>
        <Link to="/rsa" className={`nav-link ${isActive('/rsa')}`} title="RSA Key Generator">
          <LockKeyhole className="icon-sm" /> RSA Keys
        </Link>
        <Link to="/chmod" className={`nav-link ${isActive('/chmod')}`} title="Chmod Calculator">
          <Calculator className="icon-sm" /> Chmod
        </Link>
        <Link to="/subnet" className={`nav-link ${isActive('/subnet')}`} title="Subnet Calculator">
          <Globe className="icon-sm" /> Subnet
        </Link>
        <Link to="/svg" className={`nav-link ${isActive('/svg')}`} title="SVG Placeholder">
          <ImageIcon className="icon-sm" /> SVG Gen
        </Link>
        <Link to="/ascii" className={`nav-link ${isActive('/ascii')}`} title="ASCII Art Generator">
          <Baseline className="icon-sm" /> ASCII Art
        </Link>
        <Link to="/wifi-qr" className={`nav-link ${isActive('/wifi-qr')}`} title="WiFi QR Generator">
          <Wifi className="icon-sm" /> WiFi QR
        </Link>
        <Link to="/fake-data" className={`nav-link ${isActive('/fake-data')}`} title="Fake Data Generator">
          <Users className="icon-sm" /> Fake Data
        </Link>
        <Link to="/cron-generator" className={`nav-link ${isActive('/cron-generator')}`} title="CRON Generator">
          <Calendar className="icon-sm" /> CRON Gen
        </Link>
        <Link to="/jwt-decode" className={`nav-link ${isActive('/jwt-decode')}`} title="JWT Decoder">
          <FileLock2 className="icon-sm" /> JWT Decode
        </Link>
        <Link to="/base64file" className={`nav-link ${isActive('/base64file')}`} title="Base64 File Encoder">
          <FileArchive className="icon-sm" /> File to B64
        </Link>
        <Link to="/json2csv" className={`nav-link ${isActive('/json2csv')}`} title="JSON to CSV">
          <Table className="icon-sm" /> JSON2CSV
        </Link>
        <Link to="/html2jsx" className={`nav-link ${isActive('/html2jsx')}`} title="HTML to JSX">
          <Code2 className="icon-sm" /> HTML2JSX
        </Link>
        <Link to="/bip39" className={`nav-link ${isActive('/bip39')}`} title="BIP39 Generator">
          <KeyRound className="icon-sm" /> BIP39 Seed
        </Link>
        <Link to="/graphql" className={`nav-link ${isActive('/graphql')}`} title="GraphQL Playground">
          <Database className="icon-sm" /> GraphQL
        </Link>
        <Link to="/aes-gcm" className={`nav-link ${isActive('/aes-gcm')}`} title="AES-256-GCM Encryptor">
          <LockKeyhole className="icon-sm" /> AES-256
        </Link>
        <Link to="/docker-compose" className={`nav-link ${isActive('/docker-compose')}`} title="Docker Compose Builder">
          <Server className="icon-sm" /> Docker Gen
        </Link>
        <Link to="/sql-builder" className={`nav-link ${isActive('/sql-builder')}`} title="Visual SQL Builder">
          <Database className="icon-sm" /> SQL Builder
        </Link>
      </div>
    </motion.nav>
  );
};

// Animated Page Wrapper for buttery smooth transitions
const PageWrapper = ({ children }) => {
  const location = useLocation();
  
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
};

class RouteErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="route-error" role="alert">
          <p>Could not load this page: {this.state.error.message}</p>
          <button type="button" onClick={() => window.location.reload()}>Reload page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <RouteErrorBoundary>
        <React.Suspense fallback={<div className="route-loading" role="status">Loading tool...</div>}>
          <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/phantom" element={<PageWrapper><PhantomText /></PageWrapper>} />
        <Route path="/sonic" element={<PageWrapper><SonicTransfer /></PageWrapper>} />
        <Route path="/qrcode" element={<PageWrapper><QRCodeGenerator /></PageWrapper>} />
        <Route path="/image" element={<PageWrapper><AIImageGenerator /></PageWrapper>} />
        <Route path="/vault" element={<PageWrapper><CyberVault /></PageWrapper>} />
        <Route path="/regex" element={<PageWrapper><RegexTester /></PageWrapper>} />
        <Route path="/uuid" element={<PageWrapper><UUIDGenerator /></PageWrapper>} />
        <Route path="/apikey" element={<PageWrapper><APIKeyTester /></PageWrapper>} />
        <Route path="/hash" element={<PageWrapper><HashEngine /></PageWrapper>} />
        <Route path="/jwt" element={<PageWrapper><JWTInspector /></PageWrapper>} />
        <Route path="/base64" element={<PageWrapper><Base64Converter /></PageWrapper>} />
        <Route path="/json" element={<PageWrapper><JSONFormatter /></PageWrapper>} />
        <Route path="/url" element={<PageWrapper><URLEncoder /></PageWrapper>} />
        <Route path="/text" element={<PageWrapper><TextTools /></PageWrapper>} />
        <Route path="/base" element={<PageWrapper><NumberBaseConverter /></PageWrapper>} />
        <Route path="/pwdstrength" element={<PageWrapper><PasswordStrength /></PageWrapper>} />
        <Route path="/exif" element={<PageWrapper><EXIFScrubber /></PageWrapper>} />
        <Route path="/network" element={<PageWrapper><NetworkScanner /></PageWrapper>} />
        <Route path="/encryptor" element={<PageWrapper><FileEncryptor /></PageWrapper>} />
        <Route path="/bcrypt" element={<PageWrapper><BcryptGenerator /></PageWrapper>} />
        <Route path="/lorem" element={<PageWrapper><LoremIpsum /></PageWrapper>} />
        <Route path="/markdown" element={<PageWrapper><MarkdownPreviewer /></PageWrapper>} />
        <Route path="/cron" element={<PageWrapper><CronJobParser /></PageWrapper>} />
        <Route path="/css" element={<PageWrapper><CSSMinifier /></PageWrapper>} />
        <Route path="/http" element={<PageWrapper><HTTPStatusCodes /></PageWrapper>} />
        <Route path="/meta" element={<PageWrapper><MetaTagGenerator /></PageWrapper>} />
        <Route path="/xml" element={<PageWrapper><XMLFormatter /></PageWrapper>} />
        <Route path="/sql" element={<PageWrapper><SQLFormatter /></PageWrapper>} />
        <Route path="/mdhtml" element={<PageWrapper><MarkdownToHTML /></PageWrapper>} />
        <Route path="/jwtgen" element={<PageWrapper><JWTGenerator /></PageWrapper>} />
        <Route path="/yaml" element={<PageWrapper><YAMLToJSON /></PageWrapper>} />
        <Route path="/dns" element={<PageWrapper><DNSLookup /></PageWrapper>} />
        <Route path="/random" element={<PageWrapper><RandomStringGen /></PageWrapper>} />
        <Route path="/json2yaml" element={<PageWrapper><JSONToYAML /></PageWrapper>} />
        <Route path="/hmac" element={<PageWrapper><HMACGenerator /></PageWrapper>} />
        <Route path="/palette" element={<PageWrapper><ColorPaletteGen /></PageWrapper>} />
        <Route path="/ai-prompt" element={<PageWrapper><AIPromptOptimizer /></PageWrapper>} />
        <Route path="/ai-code" element={<PageWrapper><AICodeExplainer /></PageWrapper>} />
        <Route path="/ai-regex" element={<PageWrapper><AIRegexGenerator /></PageWrapper>} />
        <Route path="/port-scanner" element={<PageWrapper><PortScanner /></PageWrapper>} />
        <Route path="/ssl" element={<PageWrapper><SSLChecker /></PageWrapper>} />
        <Route path="/rsa" element={<PageWrapper><RSAKeyGenerator /></PageWrapper>} />
        <Route path="/chmod" element={<PageWrapper><ChmodCalculator /></PageWrapper>} />
        <Route path="/subnet" element={<PageWrapper><IPSubnetCalculator /></PageWrapper>} />
        <Route path="/svg" element={<PageWrapper><SVGPlaceholderGen /></PageWrapper>} />
        <Route path="/ascii" element={<PageWrapper><ASCIIArtGenerator /></PageWrapper>} />
        <Route path="/wifi-qr" element={<PageWrapper><WiFiQRGenerator /></PageWrapper>} />
        <Route path="/fake-data" element={<PageWrapper><FakeDataGenerator /></PageWrapper>} />
        <Route path="/cron-generator" element={<PageWrapper><CRONJobGenerator /></PageWrapper>} />
        <Route path="/jwt-decode" element={<PageWrapper><JWTDecoder /></PageWrapper>} />
        <Route path="/base64file" element={<PageWrapper><Base64FileEncoder /></PageWrapper>} />
        <Route path="/json2csv" element={<PageWrapper><JSONToCSV /></PageWrapper>} />
        <Route path="/html2jsx" element={<PageWrapper><HTMLToJSXConverter /></PageWrapper>} />
        <Route path="/llm-chat" element={<PageWrapper><LLMChatSandbox /></PageWrapper>} />
        <Route path="/api-lab" element={<PageWrapper><APIKeyLaboratory /></PageWrapper>} />
        <Route path="/glassmorphism" element={<PageWrapper><GlassmorphismGen /></PageWrapper>} />
        <Route path="/fingerprint" element={<PageWrapper><BrowserFingerprint /></PageWrapper>} />
        <Route path="/payload-obfuscator" element={<PageWrapper><PayloadObfuscator /></PageWrapper>} />
        <Route path="/color-contrast" element={<PageWrapper><ColorContrastChecker /></PageWrapper>} />
        <Route path="/code-to-image" element={<PageWrapper><CodeToImage /></PageWrapper>} />
        <Route path="/ai-persona" element={<PageWrapper><AIPersonaGen /></PageWrapper>} />
        <Route path="/text-diff" element={<PageWrapper><TextDiffViewer /></PageWrapper>} />
        <Route path="/cors-tester" element={<PageWrapper><CORSTester /></PageWrapper>} />
        <Route path="/md-table" element={<PageWrapper><MarkdownTableGen /></PageWrapper>} />
        <Route path="/keypair-gen" element={<PageWrapper><KeypairGen /></PageWrapper>} />
        <Route path="/bip39" element={<PageWrapper><BIP39Generator /></PageWrapper>} />
        <Route path="/graphql" element={<PageWrapper><GraphQLPlayground /></PageWrapper>} />
        <Route path="/aes-gcm" element={<PageWrapper><AES256GCMEncryptor /></PageWrapper>} />
        <Route path="/docker-compose" element={<PageWrapper><DockerComposeGen /></PageWrapper>} />
        <Route path="/sql-builder" element={<PageWrapper><SQLQueryBuilder /></PageWrapper>} />
          </Routes>
        </React.Suspense>
      </RouteErrorBoundary>
    </AnimatePresence>
  );
};

const Footer = () => {
  const showSupport = useSupport();
  return (
    <motion.footer 
      className="global-footer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 1 }}
    >
      <div className="footer-content">
        <span>Made with</span>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          onClick={showSupport}
          style={{ cursor: 'pointer' }}
          title="Support the Project"
        >
          <Heart size={14} className="heart-icon" />
        </motion.div>
        <span>By <strong className="author-name">Shazeb</strong></span>
      </div>
      <button 
        onClick={showSupport}
        style={{ 
          marginTop: '1rem', 
          background: 'transparent', 
          border: '1px solid var(--border)', 
          color: 'var(--primary)', 
          padding: '0.4rem 1rem', 
          borderRadius: '8px', 
          cursor: 'pointer',
          fontSize: '0.85rem'
        }}
      >
        ❤️ Support the Project
      </button>
    </motion.footer>
  );
};

function App() {
  return (
    <ToastProvider>
      <SupportProvider>
        <BrowserRouter>
          <div className="app-layout">
            <TopBar />
            <div className="page-content">
              <AnimatedRoutes />
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </SupportProvider>
    </ToastProvider>
  );
}

export default App;
