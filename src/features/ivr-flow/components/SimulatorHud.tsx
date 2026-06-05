import React from 'react';
import { Sparkles, Play, RefreshCw, Square } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { Call } from '../../../types';
import { useLanguage } from '../../../hooks/useLanguage';

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
  const { t } = useLanguage();
  const stepText = t('ivr.simulator.simulating_step').toLowerCase().includes('paso') ? 'Paso' : 'Step';

  return (
    <div className="absolute bottom-6 right-6 z-10 glass-dark p-5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl max-w-[320px] w-full flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles size={16} className="text-primary animate-pulse" />
          <h4 className="text-[11px] font-black text-white uppercase tracking-widest">{t('ivr.simulator.title')}</h4>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            isSimulating ? "bg-amber-500 animate-pulse" : "bg-white/20"
          )} />
          <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">
            {isSimulating ? `${stepText} ${simStep}/6` : t('ivr.simulator.standby')}
          </span>
        </div>
      </div>

      {!isSimulating ? (
        <div className="space-y-3">
          <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
            {t('ivr.simulator.description')}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => startSimulation('payment')}
              className="flex items-center justify-center space-x-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 hover:border-primary/50 text-white rounded-xl py-2 px-2.5 text-[10px] font-bold transition-all"
            >
              <Play size={12} className="text-primary" />
              <span>{t('ivr.simulator.success_payment')}</span>
            </button>
            <button
              onClick={() => startSimulation('agent')}
              className="flex items-center justify-center space-x-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-white rounded-xl py-2 px-2.5 text-[10px] font-bold transition-all"
            >
              <Play size={12} className="text-white animate-pulse" />
              <span>{t('ivr.simulator.agent_transfer')}</span>
            </button>
          </div>
          {cachedCall && (
            <button
              onClick={resetToPending}
              className="w-full flex items-center justify-center space-x-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/35 text-red-400 rounded-xl py-2 text-[10px] font-bold transition-all"
            >
              <RefreshCw size={12} />
              <span>{t('ivr.simulator.clear_cache')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Step Description */}
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col space-y-1">
            <span className="text-[8px] uppercase font-black tracking-widest text-primary">{t('ivr.simulator.simulating_step')}</span>
            <span className="text-[11px] font-bold text-white leading-tight">
              {simStep === 1 && t('ivr.simulator.step_1')}
              {simStep === 2 && t('ivr.simulator.step_2')}
              {simStep === 3 && t('ivr.simulator.step_3')}
              {simStep === 4 && t('ivr.simulator.step_4')}
              {simStep === 5 && t('ivr.simulator.step_5', { opt: simPath === 'payment' ? '1' : '2' })}
              {simStep === 6 && (simPath === 'payment' ? t('ivr.simulator.step_6_pay') : t('ivr.simulator.step_6_agent'))}
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[8px] font-black uppercase text-text-secondary font-mono tracking-wider">
              <span>{t('ivr.simulator.progress')}</span>
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
            <span>{t('ivr.simulator.stop_simulation')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
