import React, { createContext, useContext, useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { useToast } from './ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';

const SupportContext = createContext();

export const useSupport = () => useContext(SupportContext);

export const SupportProvider = ({ children }) => {
  const [showSupport, setShowSupport] = useState(false);
  const showToast = useToast();

  const triggerSupport = () => {
    setShowSupport(true);
  };

  // Exit intent for PC
  useEffect(() => {
    const handleMouseLeave = (e) => {
      // If the mouse leaves the top of the window (exit intent)
      if (e.clientY <= 0) {
        const hasShown = sessionStorage.getItem('supportExitShown');
        if (!hasShown) {
          setShowSupport(true);
          sessionStorage.setItem('supportExitShown', 'true');
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <SupportContext.Provider value={triggerSupport}>
      {children}
      <AnimatePresence>
        {showSupport && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setShowSupport(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setShowSupport(false)}>×</button>
              <h2 className="modal-title">Support the Project ❤️</h2>
              <p className="modal-desc">
                If you found SAKrypt Suite helpful, consider showing some love! Your support helps keep this tool ad-free and continuously improving.
              </p>
              <div className="qr-container">
                <img src="/qr.png" alt="Support QR Code" className="support-qr" />
              </div>
              <div className="upi-container">
                <span className="upi-label">UPI ID:</span>
                <strong className="upi-id">shazeb26@fam</strong>
                <button 
                  className="icon-btn copy-upi" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText("shazeb26@fam");
                    showToast("UPI ID Copied!");
                  }}
                  title="Copy UPI ID"
                >
                  <Copy className="icon-sm" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SupportContext.Provider>
  );
};
