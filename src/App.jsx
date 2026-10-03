import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PhantomText from './pages/tools/PhantomText';
import CyberVault from './pages/tools/CyberVault';
import RegexTester from './pages/tools/RegexTester';
import UUIDGenerator from './pages/tools/UUIDGenerator';
import QRCodeGenerator from './pages/tools/QRCodeGenerator';
import SonicTransfer from './pages/tools/SonicTransfer';
import LandingPage from './pages/LandingPage';
import { Shield, Key, Regex, Hash, QrCode, Heart, Radio } from 'lucide-react';
import Logo from './components/Logo';
import { ToastProvider } from './components/ToastProvider';
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
      </Routes>
    </AnimatePresence>
  );
};

const Footer = () => (
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
      >
        <Heart size={14} className="heart-icon" />
      </motion.div>
      <span>By <strong className="author-name">Shazeb</strong></span>
    </div>
  </motion.footer>
);

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="app-layout">
          <TopBar />
          <div className="page-content">
            <AnimatedRoutes />
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
