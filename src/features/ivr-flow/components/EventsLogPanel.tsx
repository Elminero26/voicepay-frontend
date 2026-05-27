import React from 'react';
import { Card } from '../../../components/Card';
import { Zap, Globe, ShieldCheck } from 'lucide-react';
import type { Call } from '../../../types';

interface EventsLogPanelProps {
  activeCall: Call | null;
  isSimulating: boolean;
}

export const EventsLogPanel: React.FC<EventsLogPanelProps> = ({
  activeCall,
  isSimulating,
}) => {
  return (
    <Card className="flex-1 glass-dark border-white/5 p-6 flex flex-col overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <Zap size={18} />
          </div>
          <h3 className="font-black text-white uppercase tracking-[0.15em] text-xs">Events Log</h3>
        </div>
        <span className="text-[9px] font-mono text-text-secondary opacity-50 uppercase">Secured v2.4</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-3 scrollbar-hide custom-scrollbar">
        {activeCall?.callEvents && activeCall.callEvents.length > 0 ? (
          activeCall.callEvents.map((event, idx) => (
            <div key={idx} className="flex space-x-4 group animate-slide-in-right" style={{ animationDelay: `${idx * 80}ms` }}>
              <div className="flex flex-col items-center pt-1">
                <div className="w-2 h-2 rounded-full bg-primary group-last:bg-primary group-last:animate-ping shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                <div className="w-[1px] flex-1 bg-white/5 mt-2 group-last:hidden" />
              </div>
              <div className="flex-1 pb-4">
                <p className="text-[11px] leading-relaxed text-text-secondary group-last:text-white group-last:font-bold transition-all">
                  {event}
                </p>
                <span className="text-[9px] font-mono text-white/20 mt-1 block">T+{idx * 2}s</span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4 border border-white/5">
              <Globe size={32} className="text-border animate-spin-slow opacity-30" />
            </div>
            <p className="text-xs text-text-secondary font-medium italic px-6 opacity-60">
              Awaiting encrypted signals from the voice node matrix...
            </p>
          </div>
        )}
      </div>

      {activeCall && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
              <ShieldCheck size={40} />
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase font-black text-primary tracking-widest">
                {isSimulating ? "SIMULATION SESSION" : "Active session"}
              </span>
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-black font-mono text-green-500">
                  {isSimulating ? "SIMULATED" : "ENCRYPTED"}
                </span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-text-secondary truncate bg-black/20 p-2 rounded-lg border border-white/5">
              {activeCall.id}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
