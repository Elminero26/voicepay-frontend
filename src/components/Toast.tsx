import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (title: string, message?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className={cn(
                'pointer-events-auto flex items-start p-4 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] max-w-[400px]',
                t.type === 'success' && 'bg-green-500/10 border-green-500/20 text-green-50',
                t.type === 'error' && 'bg-red-500/10 border-red-500/20 text-red-50',
                t.type === 'warning' && 'bg-amber-500/10 border-amber-500/20 text-amber-50',
                t.type === 'info' && 'bg-blue-500/10 border-blue-500/20 text-blue-50'
              )}
            >
              <div className="shrink-0 mr-3 mt-0.5">
                {t.type === 'success' && <CheckCircle className="text-green-500" size={20} />}
                {t.type === 'error' && <XCircle className="text-red-500" size={20} />}
                {t.type === 'warning' && <AlertCircle className="text-amber-500" size={20} />}
                {t.type === 'info' && <Info className="text-blue-500" size={20} />}
              </div>
              <div className="flex-1 mr-2">
                <h4 className="text-sm font-semibold">{t.title}</h4>
                {t.message && <p className="text-xs opacity-90 mt-1">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-white/50 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
