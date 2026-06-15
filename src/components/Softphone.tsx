import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, 
  X, ChevronDown, Headset, Terminal, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { useAgentStore } from '../stores/useAgentStore';
import type { AgentStatus } from '../stores/useAgentStore';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from './Button';
import { cn } from '../utils/cn';

export const Softphone: React.FC = () => {
  const { t } = useLanguage();
  const {
    agentStatus,
    softphoneOpen,
    callState,
    activeCall,
    isMuted,
    isSpeakerOn,
    dialNumber,
    callDuration,
    transcriptionHistory,
    setAgentStatus,
    setSoftphoneOpen,
    dialDigit,
    clearDial,
    setDialNumber,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleSpeaker,
    incrementDuration,
    transferToIvr
  } = useAgentStore();

  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const [showStatusDropdown, setShowStatusDropdown] = React.useState(false);

  // Auto-scroll transcriptions
  useEffect(() => {
    if (transcriptionEndRef.current) {
      transcriptionEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptionHistory]);

  // Duration timer
  useEffect(() => {
    if (callState !== 'active') return;
    const timer = setInterval(() => {
      incrementDuration();
    }, 1000);
    return () => clearInterval(timer);
  }, [callState, incrementDuration]);

  // Ringtone synthesizer trigger
  useEffect(() => {
    if (callState !== 'ringing') return;

    let intervalId: any;
    const playRingTone = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        
        // Classic ring ring sound cadence
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
        
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.55);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.8);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        setTimeout(() => {
          osc.stop();
          ctx.close();
        }, 1100);
      } catch (e) {
        console.warn('Ringtone play failed:', e);
      }
    };

    playRingTone();
    intervalId = setInterval(playRingTone, 2500);

    return () => {
      clearInterval(intervalId);
    };
  }, [callState]);

  // DTMF Tone Generator
  const playDTMFTone = (digit: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const dtmfFreqs: Record<string, [number, number]> = {
        '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
        '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
        '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
        '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
      };

      const freqs = dtmfFreqs[digit];
      if (!freqs) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.frequency.value = freqs[0];
      osc2.frequency.value = freqs[1];

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.value = 0.08;

      osc1.start();
      osc2.start();

      setTimeout(() => {
        osc1.stop();
        osc2.stop();
        ctx.close();
      }, 150);
    } catch (err) {
      console.warn('DTMF sound error:', err);
    }
  };

  const handleKeyPress = (digit: string) => {
    playDTMFTone(digit);
    dialDigit(digit);
  };

  const handleDialInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDialNumber(e.target.value.replace(/[^0-9*#+]/g, ''));
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'available': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'busy': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
      case 'offline': return 'bg-zinc-500';
    }
  };

  if (!softphoneOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="fixed bottom-6 right-6 z-50 w-80 glass rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-border/50 bg-background/90 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-secondary/10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Headset size={16} className="text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-wide">{t('agent.title')}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Status Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-[11px] font-semibold text-text-secondary hover:text-text-primary transition-all duration-200"
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(agentStatus))} />
                <span className="capitalize">{t(`agent.${agentStatus}`)}</span>
                <ChevronDown size={10} className={cn("transition-transform duration-200", showStatusDropdown && "rotate-180")} />
              </button>

              <AnimatePresence>
                {showStatusDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-1.5 w-32 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-50"
                  >
                    {(['available', 'busy', 'offline'] as AgentStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setAgentStatus(status);
                          setShowStatusDropdown(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-[11px] font-medium hover:bg-white/5 transition-colors text-left"
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(status))} />
                        <span className="capitalize">{t(`agent.${status}`)}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setSoftphoneOpen(false)}
              className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Views */}
        <div className="flex-1 p-5 min-h-[360px] flex flex-col justify-between">
          
          {/* 1. RINGING STATE (INCOMING CALL) */}
          {callState === 'ringing' && activeCall && (
            <div className="flex-1 flex flex-col justify-between py-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  {/* Glowing Pulse Rings */}
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-emerald-500/10 animate-pulse-slow" />
                  <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Phone className="text-emerald-400 animate-bounce-slow" size={24} />
                  </div>
                </div>

                <div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
                    {t('agent.incoming_call')}
                  </span>
                  <h3 className="text-lg font-bold mt-1 text-white">{activeCall.customerName}</h3>
                  <p className="text-xs text-text-secondary font-mono mt-0.5">{activeCall.phoneNumber}</p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button 
                  variant="danger" 
                  className="flex-1 py-3 rounded-xl flex items-center justify-center font-bold" 
                  onClick={declineCall}
                >
                  <PhoneOff size={16} className="mr-2" />
                  {t('agent.decline')}
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1 py-3 rounded-xl flex items-center justify-center font-bold bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 border-0" 
                  onClick={acceptCall}
                >
                  <Phone size={16} className="mr-2" />
                  {t('agent.accept')}
                </Button>
              </div>
            </div>
          )}

          {/* 2. CALLING STATE (DIALING OUT) */}
          {callState === 'calling' && activeCall && (
            <div className="flex-1 flex flex-col justify-between py-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="relative w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Phone className="text-primary animate-pulse" size={24} />
                  </div>
                </div>

                <div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                    {t('agent.calling')}
                  </span>
                  <h3 className="text-lg font-bold mt-1 text-white">{activeCall.phoneNumber}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">{t('agent.webrtc_secure')}</p>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  variant="danger" 
                  className="w-full py-3 rounded-xl flex items-center justify-center font-bold" 
                  onClick={hangUp}
                >
                  <PhoneOff size={16} className="mr-2" />
                  {t('agent.hangup')}
                </Button>
              </div>
            </div>
          )}

          {/* 3. ACTIVE CALL STATE */}
          {callState === 'active' && activeCall && (
            <div className="flex-1 flex flex-col justify-between h-full">
              {/* Header Info */}
              <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-3 mb-3">
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight truncate max-w-[150px]">{activeCall.customerName}</h4>
                  <p className="text-[10px] text-text-secondary font-mono">{activeCall.phoneNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                    Live
                  </span>
                  <div className="text-xs font-bold font-mono text-white mt-1">
                    {formatTime(callDuration)}
                  </div>
                </div>
              </div>

              {/* Transcription Area */}
              <div className="flex-1 flex flex-col bg-black/30 rounded-2xl border border-border/40 overflow-hidden h-[180px] p-3 mb-3">
                <div className="flex items-center space-x-1.5 mb-2 px-1 border-b border-border/30 pb-1.5">
                  <Terminal size={11} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    {t('agent.transcription')}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar text-[11px]">
                  {transcriptionHistory.map((item, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "flex flex-col max-w-[85%] rounded-xl px-2.5 py-1.5 animate-bubble-in",
                        item.role === 'agent' ? "bg-primary/20 border border-primary/20 text-white ml-auto" :
                        item.role === 'bot' ? "bg-white/5 text-zinc-300 mr-auto border border-white/5 italic" :
                        "bg-secondary/40 border border-border/40 text-text-primary mr-auto"
                      )}
                    >
                      <span className="text-[9px] font-bold opacity-60 capitalize mb-0.5">
                        {item.role === 'agent' ? t('common.role') : item.role === 'bot' ? 'System' : 'Client'}
                      </span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                  {transcriptionHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40 py-8">
                      <div className="flex h-1.5 w-1.5 relative mb-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider">{t('agent.no_transcription')}</span>
                    </div>
                  )}
                  <div ref={transcriptionEndRef} />
                </div>
              </div>

              {/* Secure Transfer Action */}
              <div className="mb-3">
                <Button 
                  variant="primary" 
                  className="w-full py-2.5 rounded-xl flex items-center justify-center font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all text-xs" 
                  onClick={transferToIvr}
                >
                  <ShieldCheck size={14} className="mr-2 animate-pulse" />
                  {t('agent.transfer_to_ivr')}
                </Button>
              </div>

              {/* Call Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex space-x-2">
                  <Button 
                    variant={isMuted ? 'primary' : 'outline'} 
                    size="icon" 
                    onClick={toggleMute}
                    className={cn(
                      "w-9 h-9 rounded-xl", 
                      isMuted ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" : "text-text-secondary hover:text-text-primary"
                    )}
                    title={isMuted ? t('agent.unmute') : t('agent.mute')}
                  >
                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  </Button>

                  <Button 
                    variant={isSpeakerOn ? 'outline' : 'ghost'} 
                    size="icon" 
                    onClick={toggleSpeaker}
                    className="w-9 h-9 rounded-xl text-text-secondary hover:text-text-primary"
                    title={t('agent.speaker')}
                  >
                    {isSpeakerOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </Button>
                </div>

                <Button 
                  variant="danger" 
                  className="px-4 py-2.5 rounded-xl flex items-center font-bold text-xs" 
                  onClick={hangUp}
                >
                  <PhoneOff size={14} className="mr-1.5" />
                  {t('agent.hangup')}
                </Button>
              </div>
            </div>
          )}

          {/* 4. IDLE DIALER STATE */}
          {callState === 'idle' && (
            <div className="flex-grow flex flex-col justify-between">
              
              {/* Dial Display */}
              <div className="relative mb-4">
                <input 
                  type="text" 
                  value={dialNumber}
                  onChange={handleDialInputChange}
                  placeholder={t('agent.dial_placeholder')}
                  className="w-full bg-black/40 border border-border/50 rounded-xl px-3 py-3 text-center text-base font-bold font-mono tracking-wider focus:outline-none focus:border-primary/50 text-white"
                />
                {dialNumber && (
                  <button 
                    onClick={clearDial}
                    className="absolute right-3 top-3.5 text-xs text-text-secondary hover:text-text-primary font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Dialer Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleKeyPress(digit)}
                    className="h-10 bg-secondary/15 hover:bg-white/5 border border-border/20 active:bg-secondary/40 text-text-primary font-bold rounded-xl flex items-center justify-center transition-all text-sm active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
              </div>

              {/* Call Action */}
              <div className="flex items-center space-x-2">
                {agentStatus === 'offline' ? (
                  <div className="flex items-center justify-center space-x-1.5 w-full py-2.5 px-3 rounded-xl border border-amber-500/10 bg-amber-500/5 text-amber-400 text-[10px] font-semibold text-center select-none">
                    <ShieldAlert size={12} className="shrink-0" />
                    <span>Go Online to dial out</span>
                  </div>
                ) : (
                  <Button 
                    variant="primary" 
                    className="w-full py-2.5 rounded-xl flex items-center justify-center font-bold bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 border-0 text-xs" 
                    onClick={() => startCall(dialNumber)}
                    disabled={!dialNumber.trim()}
                  >
                    <Phone size={14} className="mr-2" />
                    {t('agent.active_call')}
                  </Button>
                )}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
