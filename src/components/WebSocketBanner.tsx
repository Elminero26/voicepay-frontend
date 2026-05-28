import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { useCallStore } from '../stores/useCallStore';
import { Button } from './Button';

export const WebSocketBanner: React.FC = () => {
  const { 
    connectionState, 
    secondsRemaining, 
    reconnectAttempts, 
    reconnectManual 
  } = useCallStore();

  if (connectionState === 'connected') {
    return null; // Don't show a giant banner if successfully connected
  }

  // Determine styles and info based on state
  const config = {
    connecting: {
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-200 shadow-blue-500/5',
      icon: <Loader2 size={18} className="animate-spin text-blue-400" />,
      title: 'Conectando...',
      desc: 'Estableciendo conexión en tiempo real con el servidor de llamadas (ivr-service)...',
      actionText: 'Conectar ahora',
    },
    reconnecting: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-200 shadow-amber-500/5',
      icon: <RefreshCw size={18} className="animate-spin text-amber-400" style={{ animationDuration: '3s' }} />,
      title: `Reconectando automáticamente`,
      desc: `Conexión perdida. Intento nº ${reconnectAttempts}. Reintentando en ${secondsRemaining}s...`,
      actionText: 'Reconectar ya',
    },
    failed: {
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-200 shadow-rose-500/5',
      icon: <AlertCircle size={18} className="text-rose-400 animate-pulse" />,
      title: 'Error de Conexión',
      desc: 'El servidor de llamadas no responde. Revisa si ivr-service está activo.',
      actionText: 'Reintentar conexión',
    },
    disconnected: {
      bg: 'bg-zinc-800/60 border-zinc-700/50 text-zinc-300 shadow-black/10',
      icon: <WifiOff size={18} className="text-zinc-400" />,
      title: 'Sin Conexión',
      desc: 'La transmisión en tiempo real de llamadas activas está pausada.',
      actionText: 'Activar conexión',
    }
  };

  const current = config[connectionState] || config.disconnected;

  // Calculate backoff progress percentage (starts from 100% and goes down)
  // Max delay at attempt is based on Math.min(30000, 2000 * 2^attempts)
  // We can approximate the original delay to show a progress bar
  const originalDelay = Math.min(30, Math.ceil((2000 * Math.pow(2, Math.max(0, reconnectAttempts - 1))) / 1000));
  const progressPercent = originalDelay > 0 ? (secondsRemaining / originalDelay) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full overflow-hidden"
      >
        <div className="px-1 py-3">
          <div className={`glass border rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md transition-all duration-300 ${current.bg}`}>
            
            {/* Left Content */}
            <div className="flex items-center space-x-3.5 flex-1 min-w-0">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center shrink-0">
                {current.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm tracking-wide capitalize">{current.title}</h3>
                  {connectionState === 'reconnecting' && (
                    <span className="text-xs bg-amber-500/20 text-amber-300 font-medium px-2 py-0.5 rounded-full border border-amber-500/30">
                      {secondsRemaining}s
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60 mt-0.5 truncate leading-relaxed">
                  {current.desc}
                </p>
              </div>
            </div>

            {/* Right Action & Progress bar container */}
            <div className="flex items-center space-x-4 shrink-0 w-full md:w-auto justify-end">
              {connectionState === 'reconnecting' && originalDelay > 0 && (
                <div className="hidden lg:block w-28 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    className="bg-amber-500 h-full rounded-full"
                    initial={{ width: `${progressPercent}%` }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
              )}
              
              <Button
                variant="secondary"
                size="sm"
                onClick={reconnectManual}
                className="font-semibold text-xs tracking-wider uppercase px-4 py-2 hover:scale-[1.02] active:scale-[0.98] transition-all bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <RefreshCw size={12} className={connectionState === 'connecting' ? 'animate-spin' : ''} />
                {current.actionText}
              </Button>
            </div>
            
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
