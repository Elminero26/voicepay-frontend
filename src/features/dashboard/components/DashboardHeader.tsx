import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../../../utils/cn';

export type TimeRange = 'today' | 'week' | 'month' | 'year';
export type DashboardTab = 'realtime' | 'analytics';

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  connected: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  setActiveTab,
  timeRange,
  setTimeRange,
  connected
}) => {
  return (
    <div className="space-y-8 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-gradient tracking-tight">Dashboard Pro</h2>
          <p className="text-text-secondary mt-2 flex items-center gap-2">
            <span className={cn(
              "flex h-2.5 w-2.5 rounded-full",
              connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-pulse"
            )}></span>
            {connected ? "Secure active gateway connected" : "Gateway offline, secure metrics active"}
          </p>
        </div>
        
        {/* Navigation Selector Mode */}
        <div className="flex items-center space-x-2 bg-secondary/40 p-1.5 rounded-2xl border border-border/40 backdrop-blur-sm shadow-inner">
          <button 
            onClick={() => setActiveTab('realtime')}
            className={cn(
              "px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300",
              activeTab === 'realtime' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-102" 
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            Real-time
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300",
              activeTab === 'analytics' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-102" 
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            Pro Analytics
          </button>
        </div>
      </div>

      {/* Time filters for Analytics View */}
      {activeTab === 'analytics' && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass rounded-2xl border-white/5 bg-secondary/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary px-2">Temporal Filter:</span>
            <div className="flex items-center space-x-1.5 bg-black/20 p-1 rounded-xl border border-white/5">
              {(['today', 'week', 'month', 'year'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold capitalize rounded-lg transition-all",
                    timeRange === range 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                      : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                  )}
                >
                  {range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : range === 'year' ? '12 Months' : 'Today'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
            <ShieldCheck size={14} />
            <span>Audited Period</span>
          </div>
        </div>
      )}
    </div>
  );
};
