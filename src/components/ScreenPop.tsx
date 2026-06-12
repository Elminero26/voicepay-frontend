import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, CreditCard, Activity, Phone, PhoneOff } from 'lucide-react';
import { useAgentStore } from '../stores/useAgentStore';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from './Button';
import { cn } from '../utils/cn';

export const ScreenPop: React.FC = () => {
  const { t } = useLanguage();
  const {
    screenPopOpen,
    activeCall,
    callState,
    setScreenPopOpen,
    acceptCall,
    declineCall,
    hangUp
  } = useAgentStore();

  if (!screenPopOpen || !activeCall) return null;

  // Format currency helper (defaults to EUR as in customer simulations, falls back to locales)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  // Determine VIP status dynamically based on simulated content or field values
  const isVip = activeCall.customerName.toLowerCase().includes('vip') || 
                activeCall.customerName.toLowerCase().includes('carlos');

  // Human-readable option label mapping
  const getOptionLabel = (option?: string) => {
    if (!option) return t('screen_pop.no_option', 'Ninguna opción');
    if (option === '1') return t('screen_pop.option_payment', 'Opción 1 - Pago seguro con tarjeta');
    if (option === '2') return t('screen_pop.option_agent', 'Opción 2 - Soporte / Transferencia a agente');
    return option;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="fixed bottom-6 right-6 lg:right-[23rem] z-50 w-[calc(100vw-3rem)] sm:w-96 glass rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-border/50 bg-background/90 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-secondary/10">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="font-bold text-xs uppercase tracking-wider text-text-secondary">
              {t('screen_pop.title', 'Ventana Emergente de Contexto del Cliente')}
            </span>
          </div>
          <button 
            onClick={() => setScreenPopOpen(false)}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
            title={t('screen_pop.close', 'Cerrar')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Client Identity Details */}
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/30 to-indigo-500/30 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
              <User size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <h3 className="text-base font-black text-white leading-tight truncate">
                  {activeCall.customerName}
                </h3>
                {isVip ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                    {t('screen_pop.vip_status', 'Cliente VIP')}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {t('screen_pop.regular_status', 'Cliente Regular')}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary font-mono flex items-center mt-1">
                <Phone size={12} className="mr-1 text-text-secondary/60" />
                {activeCall.phoneNumber}
              </p>
            </div>
          </div>

          {/* Pending Invoice Info */}
          <div className="rounded-2xl border border-border/50 bg-white/5 p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
              {t('screen_pop.pending_invoice', 'Factura Pendiente')}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                {formatCurrency(activeCall.amount)}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {t('common.status', 'Estado')}: Pending
              </span>
            </div>
          </div>

          {/* Selected Option Badge */}
          <div className="rounded-2xl border border-border/50 bg-white/5 p-4 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
              {t('screen_pop.selected_option', 'Opción Seleccionada')}
            </span>
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-secondary/25 border border-border/30">
              {activeCall.selectedOption === '1' ? (
                <CreditCard size={14} className="text-primary shrink-0" />
              ) : (
                <Activity size={14} className="text-primary shrink-0" />
              )}
              <span className="text-xs font-semibold text-text-primary">
                {getOptionLabel(activeCall.selectedOption)}
              </span>
            </div>
          </div>

          {/* IVR Route Timeline */}
          {activeCall.callEvents && activeCall.callEvents.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary block">
                {t('screen_pop.ivr_route', 'Ruta en el IVR')}
              </span>
              
              <div className="relative pl-3 border-l border-border/60 ml-2 space-y-3">
                {activeCall.callEvents.map((event, index) => {
                  const isLast = index === activeCall.callEvents!.length - 1;
                  return (
                    <div key={index} className="relative text-left">
                      {/* Timeline Bullet node */}
                      <span className={cn(
                        "absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full border border-background",
                        isLast 
                          ? "bg-primary shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" 
                          : "bg-text-secondary/50"
                      )} />
                      <span className={cn(
                        "text-[10.5px] leading-relaxed block",
                        isLast ? "text-text-primary font-semibold" : "text-text-secondary"
                      )}>
                        {event}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-secondary/10 border-t border-border/50 flex gap-2">
          {callState === 'ringing' ? (
            <>
              <Button 
                variant="danger" 
                className="flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center text-xs" 
                onClick={declineCall}
              >
                <PhoneOff size={14} className="mr-1.5" />
                {t('agent.decline', 'Rechazar')}
              </Button>
              <Button 
                variant="primary" 
                className="flex-1 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 border-0 flex items-center justify-center text-xs" 
                onClick={acceptCall}
              >
                <Phone size={14} className="mr-1.5" />
                {t('agent.accept', 'Aceptar')}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="flex-1 py-2.5 rounded-xl font-bold text-xs" 
                onClick={() => setScreenPopOpen(false)}
              >
                {t('screen_pop.close', 'Cerrar')}
              </Button>
              {callState === 'active' && (
                <Button 
                  variant="danger" 
                  className="flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center text-xs" 
                  onClick={hangUp}
                >
                  <PhoneOff size={14} className="mr-1.5" />
                  {t('agent.hangup', 'Colgar')}
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
