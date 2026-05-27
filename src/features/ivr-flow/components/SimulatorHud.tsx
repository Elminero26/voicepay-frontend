import React from 'react';
import { Sparkles, Play, RefreshCw, Square } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { Call } from '../../../types';

interface SimulatorHudProps {
  isSimulating: boolean;
  simStep: number;
  simPath: 'payment' | 'agent';
  startSimulation: (path: 'payment' | 'agent') => void;
  stopSimulation: () => void;
  resetToPending: () => void;
  cachedCall: Call | null;
}

export const SimulatorHud: React.FC<SimulatorHudProps> = ({
  isSimulating,
  simStep,
  simPath,
  startSimulation,
  stopSimulation,
  resetToPending,
  cachedCall,
}) => {
  return (
    <div className="absolute bottom-6 right-6 z-10 glass-dark p-5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl max-w-[320px] w-full flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles size={16} className="text-primary animate-pulse" />
          <h4 className="text-[11px] font-black text-white uppercase tracking-widest">IVR Local Simulator</h4>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            isSimulating ? "bg-amber-500 animate-pulse" : "bg-white/20"
          )} />
          <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">
            {isSimulating ? `Paso ${simStep}/6` : "Standby"}
          </span>
        </div>
      </div>

      {!isSimulating ? (
        <div className="space-y-3">
          <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
            Simula flujos completos del árbol de decisiones IVR directamente en el frontend, sin dependencias del servidor.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => startSimulation('payment')}
              className="flex items-center justify-center space-x-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 hover:border-primary/50 text-white rounded-xl py-2 px-2.5 text-[10px] font-bold transition-all"
            >
              <Play size={12} className="text-primary" />
              <span>Pago Exitoso</span>
            </button>
            <button
              onClick={() => startSimulation('agent')}
              className="flex items-center justify-center space-x-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-white rounded-xl py-2 px-2.5 text-[10px] font-bold transition-all"
            >
              <Play size={12} className="text-white animate-pulse" />
              <span>Transf. Agente</span>
            </button>
          </div>
          {cachedCall && (
            <button
              onClick={resetToPending}
              className="w-full flex items-center justify-center space-x-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/35 text-red-400 rounded-xl py-2 text-[10px] font-bold transition-all"
            >
              <RefreshCw size={12} />
              <span>Limpiar Caché Local</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Step Description */}
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col space-y-1">
            <span className="text-[8px] uppercase font-black tracking-widest text-primary">Simulando paso actual</span>
            <span className="text-[11px] font-bold text-white leading-tight">
              {simStep === 1 && "📞 Recibiendo llamada entrante..."}
              {simStep === 2 && "🔒 Autenticando usuario mediante CallerID..."}
              {simStep === 3 && "💳 Consultando deuda pendiente en BD..."}
              {simStep === 4 && "🔊 Emitiendo menú de opciones IVR..."}
              {simStep === 5 && `⌨️ Selección ingresada [Opción ${simPath === 'payment' ? '1' : '2'}]`}
              {simStep === 6 && (simPath === 'payment' ? "✅ Transacción procesada con éxito!" : "🎧 Conectando con agente directo...")}
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[8px] font-black uppercase text-text-secondary font-mono tracking-wider">
              <span>Avance</span>
              <span>{Math.round((simStep / 6) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500" 
                style={{ width: `${(simStep / 6) * 100}%` }}
              />
            </div>
          </div>

          {/* Stop Button */}
          <button
            onClick={stopSimulation}
            className="w-full flex items-center justify-center space-x-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-white rounded-xl py-2 text-[10px] font-bold transition-all animate-pulse"
          >
            <Square size={12} className="fill-white" />
            <span>Detener Simulación</span>
          </button>
        </div>
      )}
    </div>
  );
};
