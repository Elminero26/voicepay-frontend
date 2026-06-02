import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { 
  Play, Pause, Volume2, VolumeX, Download, 
  RotateCcw, Loader2, AlertCircle, Sparkles 
} from 'lucide-react';
import { cn } from '../utils/cn';

interface AudioPlayerProps {
  audioUrl: string;
  id: string;
  duration?: string;
  clientName?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  id, 
  duration, 
  clientName 
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
      <div className="relative bg-black/25 border border-white/5 rounded-xl px-4 py-3 flex flex-col justify-center min-h-[80px]">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-black/40 backdrop-blur-[1px] rounded-xl">
            <Loader2 size={24} className="text-indigo-500 animate-spin" />
            <span className="text-[10px] text-text-secondary tracking-widest font-black uppercase">Decodificando señal...</span>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 bg-black/40 backdrop-blur-[1px] rounded-xl text-rose-400 p-4 text-center">
            <AlertCircle size={20} />
            <span className="text-[10px] font-black uppercase tracking-wider">Error de audio</span>
            <p className="text-[9px] opacity-80 max-w-xs">No se pudo recuperar la grabación. Valida la conexión de red o permisos CORS del servidor.</p>
          </div>
        )}

        {/* Waveform DOM Node */}
        <div 
          ref={containerRef} 
          className={cn(
            "w-full transition-opacity duration-300", 
            isLoading || hasError ? "opacity-10 cursor-not-allowed pointer-events-none" : "opacity-100"
          )}
        />
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
    </div>
  );
};
