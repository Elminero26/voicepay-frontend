import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, 
  ChevronDown, Headset, ShieldAlert, ShieldCheck, AppWindow, ArrowLeftRight
} from 'lucide-react';
import { useAgentStore } from '../../../stores/useAgentStore';
import type { AgentStatus } from '../../../stores/useAgentStore';
import { useLanguage } from '../../../hooks/useLanguage';
import { Button } from '../../../components/Button';
import { cn } from '../../../utils/cn';

let userInteracted = false;
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    userInteracted = true;
    window.removeEventListener('click', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
    window.removeEventListener('mousedown', handleInteraction);
  };
  window.addEventListener('click', handleInteraction, { capture: true, passive: true });
  window.addEventListener('keydown', handleInteraction, { capture: true, passive: true });
  window.addEventListener('touchstart', handleInteraction, { capture: true, passive: true });
  window.addEventListener('mousedown', handleInteraction, { capture: true, passive: true });
}

interface ConsoleSoftphoneProps {
  onCollapseToggle: () => void;
}

export const ConsoleSoftphone: React.FC<ConsoleSoftphoneProps> = ({ onCollapseToggle }) => {
  const { t } = useLanguage();
  const {
    agentStatus,
    callState,
    activeCall,
    isMuted,
    isSpeakerOn,
    dialNumber,
    callDuration,
    setAgentStatus,
    setSoftphoneOpen,
    setSoftphoneDocked,
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

  const [showStatusDropdown, setShowStatusDropdown] = React.useState(false);

  // Duration timer - only runs if docked
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

    const playRingTone = () => {
      try {
        const hasInteraction = (navigator.userActivation && navigator.userActivation.hasBeenActive) || userInteracted;
        if (!hasInteraction) {
          console.warn('AudioContext playback deferred: Awaiting user interaction on the page.');
          return;
        }
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        
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
    const intervalId = setInterval(playRingTone, 2500);

    return () => {
      clearInterval(intervalId);
    };
  }, [callState]);

  // DTMF Tone Generator
  const playDTMFTone = (digit: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  const handleUndockFloat = () => {
    setSoftphoneDocked(false);
    setSoftphoneOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Softphone Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-secondary/15">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Headset size={16} className="text-primary" />
          </div>
          <span className="font-bold text-sm tracking-wide text-white">{t('agent.title')}</span>
        </div>

        <div className="flex items-center space-x-1.5">
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

          {/* Dock/Float Toggle */}
          <button 
            onClick={handleUndockFloat}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
            title={t('agent.float', 'Float Softphone')}
          >
            <AppWindow size={15} />
          </button>

          {/* Collapse Panel Toggle */}
          <button 
            onClick={onCollapseToggle}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
            title={t('agent.collapse', 'Collapse Panel')}
          >
            <ArrowLeftRight size={15} />
          </button>
        </div>
      </div>

      {/* Dialer & Call Controls Body */}
      <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar">
        
        {/* RINGING VIEW (INCOMING CALL) */}
        {callState === 'ringing' && activeCall && (
          <div className="flex-1 flex flex-col justify-between py-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="absolute -inset-2 rounded-full bg-emerald-500/10 animate-pulse-slow" />
                <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Phone className="text-emerald-400 animate-bounce-slow" size={28} />
                </div>
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
                  {t('agent.incoming_call')}
                </span>
                <h3 className="text-xl font-bold mt-2 text-white">{activeCall.customerName}</h3>
                <p className="text-sm text-text-secondary font-mono mt-1">{activeCall.phoneNumber}</p>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <Button 
                variant="danger" 
                className="flex-1 py-3.5 rounded-xl flex items-center justify-center font-bold text-sm" 
                onClick={declineCall}
              >
                <PhoneOff size={16} className="mr-2" />
                {t('agent.decline')}
              </Button>
              <Button 
                variant="primary" 
                className="flex-1 py-3.5 rounded-xl flex items-center justify-center font-bold bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 border-0 text-sm" 
                onClick={acceptCall}
              >
                <Phone size={16} className="mr-2" />
                {t('agent.accept')}
              </Button>
            </div>
          </div>
        )}

        {/* CALLING VIEW (DIALING OUT) */}
        {callState === 'calling' && activeCall && (
          <div className="flex-1 flex flex-col justify-between py-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Phone className="text-primary animate-pulse" size={28} />
                </div>
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                  {t('agent.calling')}
                </span>
                <h3 className="text-xl font-bold mt-2 text-white">{activeCall.phoneNumber}</h3>
                <p className="text-xs text-text-secondary mt-1">{t('agent.webrtc_secure')}</p>
              </div>
            </div>

            <div className="mt-8">
              <Button 
                variant="danger" 
                className="w-full py-3.5 rounded-xl flex items-center justify-center font-bold text-sm" 
                onClick={hangUp}
              >
                <PhoneOff size={16} className="mr-2" />
                {t('agent.hangup')}
              </Button>
            </div>
          </div>
        )}

        {/* ACTIVE CALL VIEW */}
        {callState === 'active' && activeCall && (
          <div className="flex-1 flex flex-col justify-between h-full py-2">
            
            {/* Header info */}
            <div className="flex flex-col items-center justify-center text-center py-6 border-b border-border/30 mb-6">
              <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Phone size={24} className="animate-pulse" />
              </div>
              <h4 className="text-lg font-bold text-white truncate max-w-full">{activeCall.customerName}</h4>
              <p className="text-xs text-text-secondary font-mono mt-0.5">{activeCall.phoneNumber}</p>
              
              <div className="mt-4 flex items-center space-x-3">
                <span className="text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/25 uppercase">
                  Connected
                </span>
                <span className="text-sm font-bold font-mono text-white tracking-wider">
                  {formatTime(callDuration)}
                </span>
              </div>
            </div>

            {/* Quick Actions / Secure Transfer */}
            <div className="space-y-4 mb-6">
              <Button 
                variant="primary" 
                className="w-full py-3 rounded-xl flex items-center justify-center font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all text-xs tracking-wider" 
                onClick={transferToIvr}
              >
                <ShieldCheck size={16} className="mr-2 animate-pulse" />
                {t('agent.transfer_to_ivr')}
              </Button>
            </div>

            {/* Call Controls */}
            <div className="flex items-center justify-between border-t border-border/30 pt-4 mt-auto">
              <div className="flex space-x-2">
                <Button 
                  variant={isMuted ? 'primary' : 'outline'} 
                  size="icon" 
                  onClick={toggleMute}
                  className={cn(
                    "w-10 h-10 rounded-xl", 
                    isMuted ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" : "text-text-secondary hover:text-text-primary"
                  )}
                  title={isMuted ? t('agent.unmute') : t('agent.mute')}
                >
                  {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>

                <Button 
                  variant={isSpeakerOn ? 'outline' : 'ghost'} 
                  size="icon" 
                  onClick={toggleSpeaker}
                  className="w-10 h-10 rounded-xl text-text-secondary hover:text-text-primary"
                  title={t('agent.speaker')}
                >
                  {isSpeakerOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </Button>
              </div>

              <Button 
                variant="danger" 
                className="px-5 py-2.5 rounded-xl flex items-center font-bold text-xs" 
                onClick={hangUp}
              >
                <PhoneOff size={14} className="mr-1.5" />
                {t('agent.hangup')}
              </Button>
            </div>
          </div>
        )}

        {/* IDLE DIALER STATE */}
        {callState === 'idle' && (
          <div className="flex-grow flex flex-col justify-between py-2">
            
            {/* Dial Input Display */}
            <div className="relative mb-6">
              <input 
                type="text" 
                value={dialNumber}
                onChange={handleDialInputChange}
                placeholder={t('agent.dial_placeholder')}
                className="w-full bg-black/40 border border-border/40 rounded-2xl px-4 py-3.5 text-center text-lg font-bold font-mono tracking-wider focus:outline-none focus:border-primary/50 text-white focus:ring-1 focus:ring-primary/20 transition-all"
              />
              {dialNumber && (
                <button 
                  onClick={clearDial}
                  className="absolute right-4 top-4.5 text-xs text-text-secondary hover:text-text-primary font-bold transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Dialer Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeyPress(digit)}
                  className="h-12 bg-secondary/10 hover:bg-white/5 border border-border/10 active:bg-secondary/35 text-text-primary font-bold rounded-2xl flex items-center justify-center transition-all text-base active:scale-95 hover:border-border/30 hover:text-white"
                >
                  {digit}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 mt-auto">
              {agentStatus === 'offline' ? (
                <div className="flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-xl border border-amber-500/10 bg-amber-500/5 text-amber-400 text-xs font-semibold text-center select-none animate-pulse">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>Go Online to dial out</span>
                </div>
              ) : (
                <Button 
                  variant="primary" 
                  className="w-full py-3 rounded-xl flex items-center justify-center font-bold bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 border-0 text-sm tracking-wide" 
                  onClick={() => startCall(dialNumber)}
                  disabled={!dialNumber.trim()}
                >
                  <Phone size={15} className="mr-2" />
                  {t('agent.active_call')}
                </Button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
