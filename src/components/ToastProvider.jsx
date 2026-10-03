import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        pointerEvents: 'none'
      }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              style={{
                background: 'rgba(11, 15, 25, 0.95)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--danger)' : 'var(--primary)'}`,
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: `0 4px 20px ${toast.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                fontFamily: 'var(--font-heading)',
                pointerEvents: 'auto'
              }}
            >
              {toast.type === 'success' && <CheckCircle size={18} color="var(--success)" />}
              {toast.type === 'error' && <AlertTriangle size={18} color="var(--danger)" />}
              {toast.type === 'info' && <Info size={18} color="var(--primary)" />}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
