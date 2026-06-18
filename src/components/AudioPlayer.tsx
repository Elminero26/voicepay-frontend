import React, { useEffect, useRef, useState, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { 
  Play, Pause, Volume2, VolumeX, Download, 
  RotateCcw, Loader2, AlertCircle, Sparkles,
  Network, Hash, ShieldCheck, PhoneForwarded, AlertTriangle,
  MessageSquareText, Bot, User
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useLanguage } from '../hooks/useLanguage';

interface AudioPlayerProps {
  audioUrl: string;
  id: string;
  duration?: string;
  clientName?: string;
  status?: string;
  amount?: number;
}

interface TranscriptUtterance {
  id: number;
  speaker: 'bot' | 'client';
  start: number;
  end: number;
  textEs: string;
  textEn: string;
}

const COMPLETED_TRANSCRIPT: TranscriptUtterance[] = [
  { id: 1, speaker: 'bot', start: 0, end: 3.5, textEs: "Bienvenido al sistema de pagos automáticos VoicePay. Por favor, espere mientras le identificamos.", textEn: "Welcome to the VoicePay automated payment system. Please hold while we identify you." },
  { id: 2, speaker: 'client', start: 3.8, end: 7.2, textEs: "Hola, buenas. Quería pagar una factura pendiente.", textEn: "Hello, hello. I wanted to pay a pending invoice." },
  { id: 3, speaker: 'bot', start: 7.5, end: 11.2, textEs: "Para garantizar su seguridad, estamos verificando el número de teléfono desde el que nos llama.", textEn: "To ensure your security, we are verifying the phone number you are calling from." },
  { id: 4, speaker: 'client', start: 11.5, end: 14.5, textEs: "De acuerdo. Estoy llamando desde mi móvil de empresa.", textEn: "Alright. I'm calling from my business mobile phone." },
  { id: 5, speaker: 'bot', start: 14.8, end: 20.0, textEs: "Hemos detectado una factura pendiente de ciento cincuenta euros. Pulse uno para proceder con el pago seguro con tarjeta.", textEn: "We have detected a pending invoice of one hundred and fifty euros. Press one to proceed with secure card payment." },
  { id: 6, speaker: 'client', start: 20.2, end: 24.5, textEs: "Quiero hacer el pago de la factura de ciento cincuenta euros con mi tarjeta bancaria.", textEn: "I want to pay the invoice of one hundred and fifty euros with my bank card." },
  { id: 7, speaker: 'bot', start: 24.8, end: 28.5, textEs: "Su pago de ciento cincuenta euros ha sido procesado y aprobado correctamente. Muchas gracias por utilizar VoicePay. Hasta pronto.", textEn: "Your payment of one hundred and fifty euros has been successfully processed and approved. Thank you very much for using VoicePay. See you soon." },
  { id: 8, speaker: 'client', start: 28.8, end: 31.5, textEs: "Perfecto, pago confirmado. Muchas gracias por la rapidez. Adiós.", textEn: "Perfect, payment confirmed. Thank you very much for the speed. Goodbye." }
];

const FAILED_TRANSCRIPT: TranscriptUtterance[] = [
  { id: 1, speaker: 'bot', start: 0, end: 3.5, textEs: "Bienvenido al sistema de pagos automáticos VoicePay. Por favor, espere mientras le identificamos.", textEn: "Welcome to the VoicePay automated payment system. Please hold while we identify you." },
  { id: 2, speaker: 'client', start: 3.8, end: 7.2, textEs: "Hola, buenas. Quería pagar una factura pendiente.", textEn: "Hello, hello. I wanted to pay a pending invoice." },
  { id: 3, speaker: 'bot', start: 7.5, end: 11.2, textEs: "Para garantizar su seguridad, estamos verificando el número de teléfono desde el que nos llama.", textEn: "To ensure your security, we are verifying the phone number you are calling from." },
  { id: 4, speaker: 'client', start: 11.5, end: 14.5, textEs: "De acuerdo. Estoy llamando desde mi móvil de empresa.", textEn: "Alright. I'm calling from my business mobile phone." },
  { id: 5, speaker: 'bot', start: 14.8, end: 20.0, textEs: "Hemos detectado una factura pendiente de ciento cincuenta euros. Pulse uno para proceder con el pago seguro con tarjeta.", textEn: "We have detected a pending invoice of one hundred and fifty euros. Press one to proceed with secure card payment." },
  { id: 6, speaker: 'client', start: 20.2, end: 23.5, textEs: "Sí, procedo al pago con la tarjeta terminada en 4321.", textEn: "Yes, I proceed with the payment with the card ending in 4321." },
  { id: 7, speaker: 'bot', start: 23.8, end: 28.2, textEs: "Lo sentimos, la transacción ha sido rechazada por fondos insuficientes o tarjeta declinada. Por favor, intente con otra tarjeta.", textEn: "We are sorry, the transaction has been rejected due to insufficient funds or card declined. Please try with another card." },
  { id: 8, speaker: 'client', start: 28.5, end: 32.0, textEs: "Vaya, qué raro. De acuerdo, tendré que llamar al banco. Gracias de todos modos.", textEn: "Oh, how strange. Alright, I'll have to call the bank. Thanks anyway." }
];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  id, 
  duration, 
  clientName,
  status,
  amount
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Synchronized Transcript Hooks & States
  const { t, language } = useLanguage();
  const [autoscroll, setAutoscroll] = useState(true);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const transcript = useMemo(() => {
    const isFailed = status?.toLowerCase() === 'failed' || status === 'FAILED';
    return isFailed ? FAILED_TRANSCRIPT : COMPLETED_TRANSCRIPT;
  }, [status]);

  const activeUtteranceId = useMemo(() => {
    const current = transcript.find(
      (u) => currentTime >= u.start && currentTime <= u.end
    );
    return current ? current.id : null;
  }, [currentTime, transcript]);

  // Handle click to seek to dynamic timestamp
  const handleUtteranceClick = (startTime: number) => {
    if (!wavesurferRef.current || isLoading || hasError) return;
    wavesurferRef.current.setTime(startTime);
    if (!isPlaying) {
      wavesurferRef.current.play();
    }
  };

  // Scroll active utterance into view
  useEffect(() => {
    if (!autoscroll || activeUtteranceId === null || !transcriptContainerRef.current) return;
    const activeEl = transcriptContainerRef.current.querySelector(
      `[data-utterance-id="${activeUtteranceId}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeUtteranceId, autoscroll]);

  // Helper to map color to explicit Tailwind classes for markers
  const getMarkerClasses = (color: string, isActive: boolean) => {
    if (isActive) {
      switch (color) {
        case 'indigo':
          return 'bg-indigo-950/90 border-indigo-500 text-indigo-400 shadow-indigo-500/20';
        case 'amber':
          return 'bg-amber-950/90 border-amber-500 text-amber-400 shadow-amber-500/20';
        case 'emerald':
          return 'bg-emerald-950/90 border-emerald-500 text-emerald-400 shadow-emerald-500/20';
        case 'rose':
          return 'bg-rose-950/90 border-rose-500 text-rose-400 shadow-rose-500/20';
        case 'teal':
          return 'bg-teal-950/90 border-teal-500 text-teal-400 shadow-teal-500/20';
        default:
          return 'bg-indigo-950/90 border-indigo-500 text-indigo-400 shadow-indigo-500/20';
      }
    } else {
      return 'bg-neutral-900/90 border-white/10 text-neutral-400 hover:border-white/30 hover:text-white';
    }
  };

  // Helper to map color to text color class
  const getTextColorClass = (color: string) => {
    switch (color) {
      case 'indigo': return 'text-indigo-400';
      case 'amber': return 'text-amber-400';
      case 'emerald': return 'text-emerald-400';
      case 'rose': return 'text-rose-400';
      case 'teal': return 'text-teal-400';
      default: return 'text-indigo-400';
    }
  };

  // Dynamic audio events generation based on status and amount
  const events = useMemo(() => {
    const isFailed = status?.toLowerCase() === 'failed' || status === 'FAILED';
    const amountVal = amount !== undefined ? amount : 0;
    
    return [
      {
        id: 'handshake',
        percentage: 15,
        title: 'Handshake SSL',
        description: 'Conexión segura SSL/TLS establecida con el nodo telefónico.',
        icon: <Network size={13} />,
        color: 'indigo'
      },
      {
        id: 'dtmf',
        percentage: 45,
        title: 'Captura DTMF',
        description: 'Ingreso cifrado de credenciales de facturación vía tonos DTMF.',
        icon: <Hash size={13} />,
        color: 'amber'
      },
      {
        id: 'payment',
        percentage: 75,
        title: isFailed ? 'Pago Fallido' : 'Pago Exitoso (AES-256)',
        description: isFailed 
          ? 'Error de autenticación de seguridad en la pasarela de pagos. Fondos insuficientes o tarjeta declinada.' 
          : `Transacción aprobada de $${amountVal.toFixed(2)} USD. Criptograma seguro persistido en base de datos.`,
        icon: isFailed ? <AlertTriangle size={13} /> : <ShieldCheck size={13} />,
        color: isFailed ? 'rose' : 'emerald'
      },
      {
        id: 'transfer',
        percentage: 90,
        title: 'Desvío / Cierre',
        description: isFailed
          ? 'Llamada transferida a soporte para validación manual.'
          : 'Desvío automático a agente para finalizar la atención.',
        icon: <PhoneForwarded size={13} />,
        color: 'teal'
      }
    ];
  }, [status, amount]);

  // Click-to-seek milestone handler
  const handleMarkerClick = (time: number) => {
    if (!wavesurferRef.current || isLoading || hasError) return;
    wavesurferRef.current.setTime(time);
    if (!isPlaying) {
      wavesurferRef.current.play();
    }
  };

  // Formatear segundos a MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);

    // Inicializar WaveSurfer
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(99, 102, 241, 0.2)', // Indigo translúcido apagado
      progressColor: '#6366f1',             // Indigo brillante
      cursorColor: '#a78bfa',               // Violeta/púrpura para cursor
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2.5,
      barRadius: 4,
      height: 60,
      url: audioUrl,
      normalize: true,
      dragToSeek: true,
    });

    wavesurferRef.current = ws;

    // Controladores de eventos de Wavesurfer
    ws.on('ready', () => {
      setIsLoading(false);
      setTotalDuration(ws.getDuration());
      ws.setVolume(volume);
      ws.setPlaybackRate(playbackSpeed);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    
    ws.on('timeupdate', (time) => {
      setCurrentTime(time);
    });

    ws.on('finish', () => {
      setIsPlaying(false);
      ws.setTime(0);
    });

    ws.on('error', (err) => {
      console.error('Wavesurfer error:', err);
      setIsLoading(false);
      setHasError(true);
    });

    // Limpieza al desmontar o cambiar audioUrl
    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [audioUrl]);

  // Controles del reproductor
  const handlePlayPause = () => {
    if (!wavesurferRef.current || isLoading || hasError) return;
    wavesurferRef.current.playPause();
  };

  const handleRestart = () => {
    if (!wavesurferRef.current || isLoading || hasError) return;
    wavesurferRef.current.setTime(0);
    if (!isPlaying) {
      wavesurferRef.current.play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(val);
    }
    if (val === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!wavesurferRef.current) return;
    if (isMuted) {
      wavesurferRef.current.setVolume(volume);
      setIsMuted(false);
    } else {
      wavesurferRef.current.setVolume(0);
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(speed);
    }
  };

  return (
    <div className="w-full glass bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl select-none">
      
      {/* Player Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Sparkles size={14} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Grabación de Llamada</span>
            <span className="text-xs font-semibold text-text-secondary">
              ID: <span className="font-mono text-white">AUD-{id}</span> {clientName ? `• ${clientName}` : ''}
            </span>
          </div>
        </div>

        {/* Action Button: Download */}
        <a 
          href={audioUrl}
          download={`grabacion_voicepay_aud_${id}.mp3`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-white/5 border border-white/5 text-text-secondary hover:text-white rounded-lg transition-all text-xs font-bold"
          title="Descargar audio de la llamada"
        >
          <Download size={13} />
          <span className="hidden sm:inline">Descargar</span>
        </a>
      </div>

      {/* Waveform Area with states */}
      <div className="relative bg-black/25 border border-white/5 rounded-xl px-4 pt-3 pb-5 flex flex-col justify-center min-h-[96px]">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-black/40 backdrop-blur-[1px] rounded-xl z-20">
            <Loader2 size={24} className="text-indigo-500 animate-spin" />
            <span className="text-[10px] text-text-secondary tracking-widest font-black uppercase">Decodificando señal...</span>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 bg-black/40 backdrop-blur-[1px] rounded-xl text-rose-400 p-4 text-center z-20">
            <AlertCircle size={20} />
            <span className="text-[10px] font-black uppercase tracking-wider">Error de audio</span>
            <p className="text-[9px] opacity-80 max-w-xs">No se pudo recuperar la grabación. Valida la conexión de red o permisos CORS del servidor.</p>
          </div>
        )}

        {/* Waveform DOM Node Wrapper with relative context for timeline events */}
        <div className="relative w-full py-1">
          <div 
            ref={containerRef} 
            className={cn(
              "w-full transition-opacity duration-300", 
              isLoading || hasError ? "opacity-10 cursor-not-allowed pointer-events-none" : "opacity-100"
            )}
          />
          
          {/* Overlay for Timeline Milestones */}
          {!isLoading && !hasError && totalDuration > 0 && (
            <div className="absolute inset-0 pointer-events-none z-10 select-none">
              {events.map((event) => {
                const percentage = event.percentage;
                const eventTime = (percentage * totalDuration) / 100;
                const isActive = currentTime >= eventTime;
                
                return (
                  <div
                    key={event.id}
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{ left: `${percentage}%` }}
                  >
                    {/* Vertical line indicator */}
                    <div className={cn(
                      "absolute top-0 bottom-0 w-[1px] border-l border-dashed transition-all duration-300 pointer-events-none",
                      isActive ? "border-indigo-500/50" : "border-white/10"
                    )} />
                    
                    {/* Marker Badge Interactive Div (acting as button + hover group) */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkerClick(eventTime);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleMarkerClick(eventTime);
                        }
                      }}
                      className={cn(
                        "absolute left-1/2 -translate-x-1/2 bottom-[-16px] w-6 h-6 rounded-lg flex items-center justify-center border shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 pointer-events-auto cursor-pointer group/marker focus:outline-none focus:ring-1 focus:ring-indigo-500",
                        getMarkerClasses(event.color, isActive)
                      )}
                    >
                      {event.icon}
                      
                      {/* Tooltip Card (Premium popover) */}
                      <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2 mb-3 w-52 p-3 rounded-xl bg-neutral-950/95 backdrop-blur-md border border-white/10 shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/marker:opacity-100 group-hover/marker:translate-y-0 transition-all duration-200 z-30">
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn("text-[9px] font-black uppercase tracking-wider", getTextColorClass(event.color))}>
                            {event.title}
                          </span>
                          <span className="text-[9px] font-mono text-white/45">
                            {formatTime(eventTime)}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/70 leading-relaxed font-medium text-left">
                          {event.description}
                        </p>
                        <div className="text-[8px] text-indigo-400 mt-1.5 font-bold uppercase tracking-widest flex items-center gap-1">
                          <span>⚡ Click para saltar</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        
        {/* Playback Buttons & Time Counter */}
        <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-2">
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              disabled={isLoading || hasError}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95",
                isPlaying 
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 hover:border-indigo-500/50"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20 hover:shadow-indigo-500/30"
              )}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>

            {/* Restart Button */}
            <button
              onClick={handleRestart}
              disabled={isLoading || hasError}
              className="p-2.5 bg-secondary hover:bg-white/5 border border-white/5 text-text-secondary hover:text-white rounded-xl transition-all"
              title="Reiniciar reproducción"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Time Counter Display */}
          <div className="font-mono text-xs text-text-secondary bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="text-white font-semibold">{formatTime(currentTime)}</span>
            <span className="opacity-50"> / </span>
            <span>{formatTime(totalDuration || (duration ? parseInt(duration) : 0))}</span>
          </div>
        </div>

        {/* Speed Controls & Volume slider */}
        <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
          
          {/* Speed Selectors (1.0x, 1.5x, etc.) */}
          <div className="flex items-center space-x-1 bg-black/25 p-1 rounded-xl border border-white/5">
            {([1, 1.5, 2] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                disabled={isLoading || hasError}
                className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider",
                  playbackSpeed === speed 
                    ? "bg-indigo-600 text-white" 
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {speed.toFixed(1)}x
              </button>
            ))}
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              disabled={isLoading || hasError}
              className="text-text-secondary hover:text-white transition-colors"
              title={isMuted ? "Quitar silencio" : "Silenciar"}
            >
              {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              disabled={isLoading || hasError}
              className="w-20 sm:w-24 h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(isMuted ? 0 : volume) * 100}%, #1e1e21 ${(isMuted ? 0 : volume) * 100}%, #1e1e21 100%)`
              }}
            />
          </div>
        </div>

      </div>

      {/* Diatonic Transcript Section */}
      <div className="border-t border-white/5 pt-4 mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-text-secondary">
            <MessageSquareText size={15} className="text-indigo-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              {t('calls.drawer.synchronized_transcript')}
            </h4>
          </div>
          
          {/* Autoscroll Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              {t('calls.drawer.autoscroll')}
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={autoscroll}
                onChange={(e) => setAutoscroll(e.target.checked)}
                className="sr-only"
              />
              <div className={cn(
                "w-8 h-4 rounded-full transition-colors duration-200",
                autoscroll ? "bg-indigo-600" : "bg-neutral-800"
              )} />
              <div className={cn(
                "absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200",
                autoscroll ? "translate-x-4" : "translate-x-0"
              )} />
            </div>
          </label>
        </div>

        {/* Utterance Bubbles */}
        <div 
          ref={transcriptContainerRef}
          className="max-h-[220px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent custom-scrollbar flex flex-col"
        >
          {transcript.map((u) => {
            const isActive = activeUtteranceId === u.id;
            const isBot = u.speaker === 'bot';
            
            return (
              <div
                key={u.id}
                data-utterance-id={u.id}
                onClick={() => handleUtteranceClick(u.start)}
                className={cn(
                  "flex flex-col space-y-1 p-3 rounded-2xl cursor-pointer transition-all duration-300 border relative group max-w-[85%]",
                  isBot 
                    ? "self-start text-left bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/10" 
                    : "self-end text-left bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10",
                  isActive && (
                    isBot 
                      ? "bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-500/5 scale-[1.01]" 
                      : "bg-emerald-600/15 border-emerald-500/50 shadow-lg shadow-emerald-500/5 scale-[1.01]"
                  )
                )}
              >
                {/* Utterance Header */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-1.5">
                    {isBot ? (
                      <>
                        <Bot size={12} className={cn("shrink-0", isActive ? "text-indigo-400" : "text-neutral-400")} />
                        <span className={cn("text-[9px] font-black tracking-widest uppercase", isActive ? "text-indigo-400" : "text-neutral-400")}>
                          {t('calls.drawer.voice_assistant')}
                        </span>
                      </>
                    ) : (
                      <>
                        <User size={12} className={cn("shrink-0", isActive ? "text-emerald-400" : "text-neutral-400")} />
                        <span className={cn("text-[9px] font-black tracking-widest uppercase", isActive ? "text-emerald-400" : "text-neutral-400")}>
                          {t('calls.drawer.client')}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Timestamp & Active Wave indicator */}
                  <div className="flex items-center space-x-1.5">
                    {isActive && (
                      <div className="flex items-end space-x-0.5 h-2.5 px-0.5">
                        <div className={cn("w-0.5 rounded-full h-2 origin-bottom animate-wave-bar-1", isBot ? "bg-indigo-400" : "bg-emerald-400")} />
                        <div className={cn("w-0.5 rounded-full h-2 origin-bottom animate-wave-bar-2", isBot ? "bg-indigo-400" : "bg-emerald-400")} />
                        <div className={cn("w-0.5 rounded-full h-2 origin-bottom animate-wave-bar-3", isBot ? "bg-indigo-400" : "bg-emerald-400")} />
                      </div>
                    )}
                    <span className="font-mono text-[9px] text-text-secondary select-none">
                      {formatTime(u.start)}
                    </span>
                  </div>
                </div>

                {/* Utterance Text */}
                <p className={cn(
                  "text-[11px] leading-relaxed",
                  isActive ? "text-white font-medium" : "text-text-primary"
                )}>
                  {language === 'es' ? u.textEs : u.textEn}
                </p>

                {/* Click to jump overlay hint on hover */}
                <div className="absolute right-3 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1 select-none pointer-events-none">
                  <span>⚡ Saltar a {formatTime(u.start)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
