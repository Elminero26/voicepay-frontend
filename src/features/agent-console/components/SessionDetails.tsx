import React, { useEffect, useRef, useState } from 'react';
import { 
  User, CreditCard, Activity, Phone, 
  Terminal, FileText, Clock, HeartHandshake,
  ShieldCheck, CheckCircle2, AlertCircle, Globe,
  PhoneCall
} from 'lucide-react';
import { useAgentStore } from '../../../stores/useAgentStore';
import { useLanguage } from '../../../hooks/useLanguage';
import { Card } from '../../../components/Card';
import { cn } from '../../../utils/cn';

export const SessionDetails: React.FC = () => {
  const { t } = useLanguage();
  const {
    activeCall,
    callState,
    callDuration,
    transcriptionHistory,
    acceptCall,
    declineCall,
    hangUp,
    transferToIvr
  } = useAgentStore();

  const [notes, setNotes] = useState('');
  const transcriptionEndRef = useRef<HTMLDivElement>(null);

  const getTimelineEventIcon = (event: string) => {
    const text = event.toLowerCase();
    
    if (text.includes('autenticado') || text.includes('identificado') || text.includes('seguridad') || text.includes('cifrado') || text.includes('encriptado') || text.includes('verificando') || text.includes('autenticación') || text.includes('callerid') || text.includes('vip')) {
      return <ShieldCheck className="text-indigo-400 shrink-0" size={13} />;
    }
    if (text.includes('pago') || text.includes('factura') || text.includes('deuda') || text.includes('cobro') || text.includes('tarjeta') || text.includes('saldo') || text.includes('ciento cincuenta') || text.includes('billing')) {
      return <CreditCard className="text-emerald-400 shrink-0" size={13} />;
    }
    if (text.includes('éxito') || text.includes('aprobado') || text.includes('confirmado') || text.includes('correcto') || text.includes('completado') || text.includes('success')) {
      return <CheckCircle2 className="text-green-400 shrink-0" size={13} />;
    }
    if (text.includes('error') || text.includes('fallido') || text.includes('fallo') || text.includes('cancelado') || text.includes('failed') || text.includes('no contestado') || text.includes('perdida')) {
      return <AlertCircle className="text-red-400 shrink-0" size={13} />;
    }
    if (text.includes('notificación') || text.includes('sms') || text.includes('push') || text.includes('mensaje')) {
      return <Globe className="text-blue-400 shrink-0" size={13} />;
    }
    if (text.includes('llamada') || text.includes('dials') || text.includes('telefónica') || text.includes('entrante') || text.includes('marcando') || text.includes('calling') || text.includes('ringing')) {
      return <PhoneCall className="text-sky-400 shrink-0" size={13} />;
    }
    if (text.includes('usuario') || text.includes('cliente') || text.includes('carlos') || text.includes('pedro')) {
      return <User className="text-purple-400 shrink-0" size={13} />;
    }
    if (text.includes('dígito') || text.includes('dtmf') || text.includes('seleccionó') || text.includes('teclado') || text.includes('pulsó') || text.includes('marcó') || text.includes('opción')) {
      return <Terminal className="text-amber-400 shrink-0" size={13} />;
    }
    
    return <HeartHandshake className="text-zinc-400 shrink-0" size={13} />;
  };

  // Auto-scroll transcriptions
  useEffect(() => {
    if (transcriptionEndRef.current) {
      transcriptionEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptionHistory]);

  // Reset notes when call ends/starts
  useEffect(() => {
    if (callState === 'idle') {
      const timer = setTimeout(() => setNotes(''), 0);
      return () => clearTimeout(timer);
    }
  }, [callState]);

  // Format currency helper (EUR)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Check if client is VIP
  const isVip = activeCall?.customerName.toLowerCase().includes('vip') || 
                activeCall?.customerName.toLowerCase().includes('carlos');

  const getOptionLabel = (option?: string) => {
    if (!option) return t('screen_pop.no_option', 'Ninguna opción');
    if (option === '1') return t('screen_pop.option_payment', 'Opción 1 - Pago seguro con tarjeta');
    if (option === '2') return t('screen_pop.option_agent', 'Opción 2 - Soporte / Transferencia a agente');
    return option;
  };

  // 1. IDLE/WAITING STATE
  if (callState === 'idle' || !activeCall) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-16 text-center animate-fade-in relative min-h-[450px]">
        {/* Neon decorative background glow */}
        <div className="absolute w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative mb-6">
          {/* Radar animation */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-60 scale-150" />
          <div className="absolute inset-0 rounded-full border border-indigo-500/15 animate-ping opacity-45 scale-125" />
          <div className="w-20 h-20 bg-gradient-to-tr from-primary/15 to-indigo-500/15 border border-primary/20 rounded-full flex items-center justify-center text-primary shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <Activity className="w-8 h-8 animate-pulse text-indigo-400" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 tracking-wide">
          {t('agent.no_active_session', 'Awaiting Telephony Stream')}
        </h3>
        <p className="text-sm text-text-secondary max-w-md">
          {t('agent.waiting_for_calls', 'Awaiting encrypted voice signals from the telecom matrix. Keep your status set to "Available" to auto-receive transfers.')}
        </p>

        {/* Console Telemetry Grid mock for visual wow */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl px-6">
          {[
            { label: 'SIP Registrar', val: 'Online', green: true },
            { label: 'Voice Node', val: 'Active', green: true },
            { label: 'WebRTC Stack', val: 'Secure', green: true },
            { label: 'Encryption', val: 'AES-256', green: true }
          ].map((item, index) => (
            <div key={index} className="glass p-3.5 rounded-2xl border border-border/40 text-left flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">{item.label}</span>
              <div className="flex items-center space-x-1.5 mt-1.5">
                <span className={cn("w-2 h-2 rounded-full", item.green ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-zinc-500")} />
                <span className="text-xs font-black text-white">{item.val}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. ACTIVE SESSION VIEW
  return (
    <div className="flex-1 flex flex-col space-y-6 animate-slide-up">
      
      {/* Dynamic Call State Banner */}
      {callState === 'ringing' && (
        <div className="glass p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Phone className="animate-bounce" size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{t('agent.incoming_call', 'Incoming Call')}...</h4>
              <p className="text-xs text-text-secondary">El cliente está esperando en la línea. ¿Desea responder?</p>
            </div>
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            <button 
              onClick={declineCall}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-bold transition-all cursor-pointer"
            >
              {t('agent.decline', 'Rechazar')}
            </button>
            <button 
              onClick={acceptCall}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {t('agent.accept', 'Aceptar')}
            </button>
          </div>
        </div>
      )}

      {callState === 'calling' && (
        <div className="glass p-4 bg-primary/10 border border-primary/20 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary animate-pulse">
              <Phone size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{t('agent.calling', 'Calling')}...</h4>
              <p className="text-xs text-text-secondary">Iniciando canal seguro de voz WebRTC.</p>
            </div>
          </div>
          <button 
            onClick={hangUp}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-bold transition-all cursor-pointer"
          >
            {t('agent.hangup', 'Cancelar')}
          </button>
        </div>
      )}

      {callState === 'active' && (
        <div className="glass p-4 bg-zinc-800/40 border border-border/50 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Conexión Segura Establecida</h4>
              <p className="text-xs text-text-secondary">Canal de voz cifrado de extremo a extremo (AES-256).</p>
            </div>
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            <button 
              onClick={transferToIvr}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <ShieldCheck size={14} className="animate-pulse" />
              <span>{t('screen_pop.transfer_to_ivr', 'Transferir a IVR')}</span>
            </button>
            <button 
              onClick={hangUp}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-bold transition-all cursor-pointer"
            >
              {t('agent.hangup', 'Colgar')}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Central / Left Area (Client Profile & Transcriptions) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
          
          {/* Customer Identity Banner */}
          <div className="glass border border-border/50 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/30 to-indigo-500/30 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
                <User size={26} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                  <h3 className="text-xl font-black text-white leading-tight">
                    {activeCall.customerName}
                  </h3>
                  {isVip ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                      {t('screen_pop.vip_status', 'Cliente VIP')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {t('screen_pop.regular_status', 'Cliente Regular')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary font-mono flex items-center mt-1">
                  <Phone size={12} className="mr-1.5 text-text-secondary/60" />
                  {activeCall.phoneNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 md:text-right">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">{t('agent.active_call', 'Active Call')}</span>
                <div className="flex items-center space-x-1.5 mt-0.5 justify-end">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold text-white font-mono">{formatTime(callDuration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conversation Live Transcription */}
          <div className="glass border border-border/50 rounded-3xl p-6 flex flex-col flex-1 min-h-[300px] max-h-[500px]">
            <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal size={15} className="text-primary" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                  {t('agent.live_transcription', 'Live Session Transcription')}
                </h4>
              </div>
              <div className="flex items-center space-x-1">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wide">STREAMING LIVE</span>
              </div>
            </div>

            {/* Transcript bubble viewport */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar text-sm">
              {transcriptionHistory.map((item, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex flex-col max-w-[80%] rounded-2xl px-4 py-3 animate-bubble-in shadow-sm",
                    item.role === 'agent' 
                      ? "bg-primary/20 border border-primary/20 text-white ml-auto" 
                      : item.role === 'bot' 
                      ? "bg-white/5 text-zinc-300 mr-auto border border-white/5 italic" 
                      : "bg-secondary/35 border border-border/40 text-text-primary mr-auto"
                  )}
                >
                  <div className="flex items-center justify-between space-x-4 mb-1 border-b border-white/5 pb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                      {item.role === 'agent' 
                        ? t('common.role') 
                        : item.role === 'bot' 
                        ? 'VoicePay Bot' 
                        : 'Client'}
                    </span>
                    <span className="text-[9px] font-mono opacity-50">{item.timestamp}</span>
                  </div>
                  <p className="leading-relaxed text-xs">{item.text}</p>
                </div>
              ))}
              
              {transcriptionHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40 py-12">
                  <Clock className="w-8 h-8 mb-2 animate-pulse text-text-secondary" />
                  <span className="text-xs uppercase font-bold tracking-wider">{t('agent.no_transcription')}</span>
                </div>
              )}
              <div ref={transcriptionEndRef} />
            </div>
          </div>

          {/* Note-taking Section */}
          <div className="glass border border-border/50 rounded-3xl p-6">
            <div className="flex items-center space-x-2 mb-3">
              <FileText size={16} className="text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                {t('agent.agent_notes', 'Agent Session Notes')}
              </h4>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('agent.notes_placeholder', 'Write your session notes here...')}
              className="w-full bg-black/30 border border-border/40 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary/50 text-white min-h-[100px] resize-y placeholder:text-text-secondary/40 focus:ring-1 focus:ring-primary/20 transition-all font-sans"
            />
          </div>

        </div>

        {/* Right Area (Call Context Details & IVR Timeline) */}
        <div className="space-y-6 h-full flex flex-col">
          
          {/* Pending Invoice Box */}
          <Card 
            title={t('screen_pop.pending_invoice', 'Factura Pendiente')}
            className="bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5 rounded-3xl"
          >
            <div className="space-y-3 mt-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  {formatCurrency(activeCall.amount)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PENDING
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                This balance is currently locked inside the IVR Node checkout scope.
              </p>
            </div>
          </Card>

          {/* Chosen Option Box */}
          <div className="glass border border-border/50 rounded-3xl p-6 space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
              {t('screen_pop.selected_option', 'Opción Seleccionada')}
            </span>
            <div className="flex items-center space-x-2 px-3 py-2.5 rounded-xl bg-secondary/25 border border-border/30">
              {activeCall.selectedOption === '1' ? (
                <CreditCard size={15} className="text-primary shrink-0" />
              ) : (
                <Activity size={15} className="text-primary shrink-0" />
              )}
              <span className="text-xs font-semibold text-text-primary">
                {getOptionLabel(activeCall.selectedOption)}
              </span>
            </div>
          </div>

          {/* IVR Steps timeline */}
          <div className="glass border border-border/50 rounded-3xl p-6 flex-1 flex flex-col min-h-[200px] overflow-hidden">
            <div className="flex items-center space-x-2 mb-4">
              <HeartHandshake size={16} className="text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                {t('agent.ivr_timeline', 'IVR Event History')}
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar text-xs">
              {activeCall.callEvents && activeCall.callEvents.length > 0 ? (
                <div className="relative pl-5 border-l border-border/60 ml-3 space-y-5 py-1.5 text-left">
                  {activeCall.callEvents.map((event, index) => {
                    const isLast = index === activeCall.callEvents!.length - 1;
                    return (
                      <div key={index} className="relative pl-1.5">
                        {/* Timeline Icon Bullet node */}
                        <span className={cn(
                          "absolute -left-[28px] top-0.5 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center shadow-md z-10",
                          isLast && "border-primary/50 shadow-[0_0_8px_rgba(99,102,241,0.25)] bg-[#101014]"
                        )}>
                          {getTimelineEventIcon(event)}
                        </span>
                        <span className={cn(
                          "leading-relaxed block text-xs",
                          isLast ? "text-text-primary font-bold" : "text-text-secondary"
                        )}>
                          {event}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40 py-10">
                  <span className="text-xs">{t('screen_pop.no_option', 'No IVR event logs')}</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
