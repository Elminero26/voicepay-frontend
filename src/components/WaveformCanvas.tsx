import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Bot, Mic, MicOff } from 'lucide-react';
import { useCallStore } from '../stores/useCallStore';
import { cn } from '../utils/cn';

interface WaveformCanvasProps {
  className?: string;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({ className }) => {
  const isSimulating = useCallStore((state) => state.isSimulating);
  const simulatedCall = useCallStore((state) => state.simulatedCall);
  const liveCalls = useCallStore((state) => state.liveCalls);
  const selectedCallId = useCallStore((state) => state.selectedCallId);

  // Active call resolution
  const activeCall = useMemo(() => {
    if (isSimulating && simulatedCall) {
      return simulatedCall;
    }
    return liveCalls.find(c => c.id === selectedCallId) || liveCalls[0] || null;
  }, [isSimulating, simulatedCall, liveCalls, selectedCallId]);

  const [speaker, setSpeaker] = useState<'bot' | 'user' | 'idle'>('idle');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const eventCount = activeCall?.callEvents?.length || 0;
  const callId = activeCall?.id || null;
  const isCallActive = activeCall && activeCall.status === 'in-progress';

  // Synchronize speaker state based on conversation progress (timer cycle per event/step)
  useEffect(() => {
    if (!isCallActive) {
      setSpeaker('idle');
      return;
    }

    // Set to Bot speaking first (starts speaking on new event/node transition)
    setSpeaker('bot');

    // Switch to User speaking after 1200ms
    const userTimeout = setTimeout(() => {
      setSpeaker('user');
    }, 1200);

    // Switch to Idle after 2400ms (until next event is received)
    const idleTimeout = setTimeout(() => {
      setSpeaker('idle');
    }, 2400);

    return () => {
      clearTimeout(userTimeout);
      clearTimeout(idleTimeout);
    };
  }, [callId, eventCount, isCallActive]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      // Prevent blurry canvas on high DPI screens
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      const width = rect.width;
      const height = rect.height;
      
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      let numWaves = 3;
      let colors: string[] = [];
      let baseAmplitude = 0;
      let baseFrequency = 0.02;
      let phaseSpeed = 0.05;

      if (!isCallActive) {
        // Silence/No call: Flat line
        colors = ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.01)'];
        baseAmplitude = 0.5;
        baseFrequency = 0.005;
        phaseSpeed = 0.01;
      } else if (speaker === 'bot') {
        // IA Speaking: Indigo/Violet gradients, regular fluid waves
        colors = ['rgba(99, 102, 241, 0.75)', 'rgba(139, 92, 246, 0.45)', 'rgba(168, 85, 247, 0.2)'];
        baseAmplitude = height * 0.28;
        baseFrequency = 0.025;
        phaseSpeed = 0.07;
      } else if (speaker === 'user') {
        // User Speaking: Emerald/Teal gradients, higher and slightly irregular voice waves
        colors = ['rgba(16, 185, 129, 0.75)', 'rgba(20, 184, 166, 0.45)', 'rgba(5, 150, 105, 0.2)'];
        baseAmplitude = height * 0.32;
        baseFrequency = 0.032;
        phaseSpeed = 0.09;
      } else {
        // Idle between speaking: Subtle micro-fluctuations (alive line)
        colors = ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'];
        baseAmplitude = 2.5;
        baseFrequency = 0.012;
        phaseSpeed = 0.03;
      }

      const centerY = height / 2;

      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        
        // Slightly modify amplitude and frequency for overlapping depth
        const amplitude = baseAmplitude * (1 - i * 0.25);
        const frequency = baseFrequency * (1 + i * 0.18);
        
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = i === 0 ? 2 : 1;
        
        // Add neon glow on the main wave line
        if (i === 0 && isCallActive && speaker !== 'idle') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = speaker === 'bot' ? 'rgba(99, 102, 241, 0.7)' : 'rgba(16, 185, 129, 0.7)';
        } else {
          ctx.shadowBlur = 0;
          ctx.shadowColor = 'transparent';
        }

        // Draw sine path with fade envelope at edges
        for (let x = 0; x < width; x++) {
          // Sine envelope to taper the wave edges to zero
          const envelope = Math.sin((x / width) * Math.PI);
          
          // Introduce slight vocal jitter for the human user speaking state
          let jitter = 0;
          if (isCallActive && speaker === 'user' && x % 6 === 0) {
            jitter = (Math.random() - 0.5) * 3;
          }

          const y = centerY + amplitude * envelope * Math.sin(x * frequency + phase + (i * Math.PI) / 3.5) + jitter;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      phase += phaseSpeed;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [speaker, isCallActive]);

  return (
    <div className={cn(
      "w-full bg-[#0d0e12]/60 border border-white/10 rounded-2xl p-4 flex flex-col space-y-3 relative overflow-hidden backdrop-blur-xl shadow-xl",
      className
    )}>
      {/* Background radial highlight */}
      <div className={cn(
        "absolute -inset-10 bg-radial-glow opacity-10 pointer-events-none transition-all duration-700 blur-[80px]",
        !isCallActive ? "bg-white/10" :
        speaker === 'bot' ? "bg-indigo-500/30" :
        speaker === 'user' ? "bg-emerald-500/30" :
        "bg-white/10"
      )} />

      {/* Header Info Row */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          {/* pulsating mic indicator */}
          <span className="relative flex h-2 w-2">
            {isCallActive && speaker !== 'idle' && (
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                speaker === 'bot' ? "bg-indigo-400" : "bg-emerald-400"
              )} />
            )}
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              !isCallActive ? "bg-slate-500" :
              speaker === 'bot' ? "bg-indigo-500" :
              speaker === 'user' ? "bg-emerald-500" :
              "bg-amber-500"
            )} />
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
            Monitoreo de Señal de Voz
          </span>
        </div>

        {/* State Badge */}
        <div className={cn(
          "flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
          !isCallActive 
            ? "bg-slate-500/5 text-slate-400 border-slate-500/10" 
            : speaker === 'bot'
            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            : speaker === 'user'
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
        )}>
          {!isCallActive ? (
            <>
              <MicOff size={10} />
              <span>Línea Inactiva</span>
            </>
          ) : speaker === 'bot' ? (
            <>
              <Bot size={10} className="animate-pulse" />
              <span>IA Hablando (TTS)</span>
            </>
          ) : speaker === 'user' ? (
            <>
              <Mic size={10} className="animate-bounce" />
              <span>Usuario Hablando (STT)</span>
            </>
          ) : (
            <>
              <MicOff size={10} />
              <span>En Espera</span>
            </>
          )}
        </div>
      </div>

      {/* Visual Canvas Waveform */}
      <div className="relative h-20 w-full bg-black/40 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Subtle grid background inside canvas box */}
        <div className="absolute inset-0 bg-audio-grid pointer-events-none opacity-5" />
      </div>
    </div>
  );
};
