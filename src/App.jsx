import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PhantomText from './pages/tools/PhantomText';
import CyberVault from './pages/tools/CyberVault';
import RegexTester from './pages/tools/RegexTester';
import UUIDGenerator from './pages/tools/UUIDGenerator';
import QRCodeGenerator from './pages/tools/QRCodeGenerator';
import SonicTransfer from './pages/tools/SonicTransfer';
import APIKeyTester from './pages/tools/APIKeyTester';
import HashEngine from './pages/tools/HashEngine';
import JWTInspector from './pages/tools/JWTInspector';
import Base64Converter from './pages/tools/Base64Converter';
import JSONFormatter from './pages/tools/JSONFormatter';
import URLEncoder from './pages/tools/URLEncoder';
import TextTools from './pages/tools/TextTools';
import NumberBaseConverter from './pages/tools/NumberBaseConverter';
import PasswordStrength from './pages/tools/PasswordStrength';
import LandingPage from './pages/LandingPage';
import { Shield, Key, Regex, Hash, QrCode, Heart, Radio, KeyRound, Fingerprint, Code, FileCode, Braces, Link2, Type, Binary, ShieldAlert } from 'lucide-react';
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
      <div className="nav-links">
        <Link to="/phantom" className={`nav-link ${isActive('/phantom')}`} title="Phantom Text (Stealth Morse)">
          <Shield className="icon-sm" /> Phantom
        </Link>
        <Link to="/sonic" className={`nav-link ${isActive('/sonic')}`} title="Sonic Transfer">
          <Radio className="icon-sm" /> Sonic
        </Link>
        <Link to="/qrcode" className={`nav-link ${isActive('/qrcode')}`} title="QR Code">
          <QrCode className="icon-sm" /> QR Code
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

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/phantom" element={<PageWrapper><PhantomText /></PageWrapper>} />
        <Route path="/sonic" element={<PageWrapper><SonicTransfer /></PageWrapper>} />
        <Route path="/qrcode" element={<PageWrapper><QRCodeGenerator /></PageWrapper>} />
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
      </Routes>
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
