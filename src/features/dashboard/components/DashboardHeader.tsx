import React, { useState } from 'react';
import { ShieldCheck, Bell, Trash2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useCallStore } from '../../../stores/useCallStore';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, clearNotifications, markAllNotificationsAsRead } = useCallStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

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
        
        {/* Navigation Selector Mode & Notifications */}
        <div className="flex items-center space-x-3 self-end md:self-auto">
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

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  markAllNotificationsAsRead();
                }
              }}
              className="relative p-2.5 text-text-secondary hover:text-white bg-secondary/30 rounded-xl border border-border/40 hover:bg-secondary/60 hover:border-white/10 transition-all duration-300"
            >
              <Bell size={20} className={cn(unreadCount > 0 && "animate-pulse")} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white shadow-lg border border-background shadow-indigo-600/50">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 glass border border-white/10 shadow-2xl p-4 z-[999] backdrop-blur-xl rounded-2xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">System Audit Log</h4>
                  {notifications.length > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotifications();
                      }}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={12} />
                      Clear log
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-3 rounded-xl border transition-all text-xs",
                        n.type === 'success' ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300" :
                        n.type === 'error' ? "bg-rose-500/5 border-rose-500/10 text-rose-300" :
                        "bg-indigo-500/5 border-indigo-500/10 text-indigo-200"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-black tracking-tight">{n.title}</span>
                        <span className="text-[9px] opacity-50 font-mono">{n.timestamp}</span>
                      </div>
                      <p className="opacity-80 leading-relaxed font-medium">{n.message}</p>
                    </div>
                  ))}
                  
                  {notifications.length === 0 && (
                    <div className="text-center py-8 opacity-40">
                      <Bell size={28} className="mx-auto mb-2 text-text-secondary" />
                      <p className="text-[10px] font-bold uppercase tracking-wider">No logged system events</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
