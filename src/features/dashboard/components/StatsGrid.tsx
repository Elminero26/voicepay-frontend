import React from 'react';
import { 
  Phone, CheckCircle, XCircle, DollarSign, 
  TrendingUp, TrendingDown, ShieldCheck, Percent, Clock 
} from 'lucide-react';
import { Card } from '../../../components/Card';
import { cn } from '../../../utils/cn';
import type { PaymentStats } from '../../../types';
import type { DashboardTab } from './DashboardHeader';

interface AnalyticsData {
  totalCalls: number;
  successfulPayments: number;
  failedPayments: number;
  conversionRate: number;
  totalRevenue: number;
  avgTicket: number;
  avgDuration: number;
  callsTrend: string;
  revenueTrend: string;
  conversionTrend: string;
  durationTrend: string;
  isCallsPositive: boolean;
  isRevenuePositive: boolean;
  isConversionPositive: boolean;
  isDurationPositive: boolean;
}

interface StatsGridProps {
  activeTab: DashboardTab;
  stats: PaymentStats;
  analyticsData: AnalyticsData;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  activeTab,
  stats,
  analyticsData
}) => {
  // Métricas de tiempo real
  const realtimeMetrics = [
    { 
      label: 'Total Calls', 
      value: stats.totalCalls ?? 0, 
      icon: Phone, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10', 
      glow: 'shadow-indigo-500/10 hover:shadow-indigo-500/20 border-indigo-500/20',
      trend: '+12.5%', 
      isPositive: true 
    },
    { 
      label: 'Successful Payments', 
      value: stats.successfulPayments ?? 0, 
      icon: CheckCircle, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      glow: 'shadow-emerald-500/10 hover:shadow-emerald-500/20 border-emerald-500/20',
      trend: '+15.2%', 
      isPositive: true 
    },
    { 
      label: 'Failed Payments', 
      value: stats.failedPayments ?? 0, 
      icon: XCircle, 
      color: 'text-rose-400', 
      bg: 'bg-rose-500/10', 
      glow: 'shadow-rose-500/10 hover:shadow-rose-500/20 border-rose-500/20',
      trend: '-2.4%', 
      isPositive: true 
    },
    { 
      label: 'Total Revenue', 
      value: `$${(stats.totalRevenue ?? 0).toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10', 
      glow: 'shadow-amber-500/10 hover:shadow-amber-500/20 border-amber-500/20',
      trend: '+18.7%', 
      isPositive: true 
    },
  ];

  // Métricas avanzadas para la vista analítica
  const analyticsMetrics = [
    { 
      label: 'Volume Volume (Revenue)', 
      value: `$${analyticsData.totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-violet-400', 
      bg: 'bg-violet-500/10', 
      glow: 'shadow-violet-500/10 hover:shadow-violet-500/20 border-violet-500/20',
      trend: analyticsData.revenueTrend, 
      isPositive: analyticsData.isRevenuePositive,
      subtitle: 'Total invoice volume'
    },
    { 
      label: 'Average Ticket Value', 
      value: `$${analyticsData.avgTicket.toFixed(2)}`, 
      icon: ShieldCheck, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      glow: 'shadow-emerald-500/10 hover:shadow-emerald-500/20 border-emerald-500/20',
      trend: '+3.1%', 
      isPositive: true,
      subtitle: 'Value per successful call'
    },
    { 
      label: 'Total Active Calls', 
      value: analyticsData.totalCalls.toLocaleString(), 
      icon: Phone, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10', 
      glow: 'shadow-blue-500/10 hover:shadow-blue-500/20 border-blue-500/20',
      trend: analyticsData.callsTrend, 
      isPositive: analyticsData.isCallsPositive,
      subtitle: 'IVR Stream iterations'
    },
    { 
      label: 'Conversion Rate', 
      value: `${analyticsData.conversionRate}%`, 
      icon: Percent, 
      color: 'text-pink-400', 
      bg: 'bg-pink-500/10', 
      glow: 'shadow-pink-500/10 hover:shadow-pink-500/20 border-pink-500/20',
      trend: analyticsData.conversionTrend, 
      isPositive: analyticsData.isConversionPositive,
      subtitle: 'Successful payment ratio'
    },
    { 
      label: 'Avg. Call Duration', 
      value: `${analyticsData.avgDuration}s`, 
      icon: Clock, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10', 
      glow: 'shadow-amber-500/10 hover:shadow-amber-500/20 border-amber-500/20',
      trend: analyticsData.durationTrend, 
      isPositive: analyticsData.isDurationPositive,
      subtitle: 'Average time in system'
    },
  ];

  return (
    <div className={cn(
      "grid gap-6 transition-all duration-500",
      activeTab === 'realtime' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
    )}>
      {activeTab === 'realtime' ? (
        realtimeMetrics.map((metric, idx) => (
          <Card key={idx} className={cn("relative overflow-hidden group border bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 shadow-xl", metric.glow)}>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:w-32 group-hover:h-32 transition-all"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary opacity-70">{metric.label}</p>
                <h3 className="text-3xl font-black mt-2 tracking-tight">{metric.value}</h3>
              </div>
              <div className={cn('p-4 rounded-2xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-inner', metric.bg)}>
                <metric.icon className={metric.color} size={26} />
              </div>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold">
              <div className={cn(
                "flex items-center px-2 py-1 rounded-lg",
                metric.isPositive ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
              )}>
                {metric.isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                <span>{metric.trend}</span>
              </div>
              <span className="ml-2 text-text-secondary opacity-60">vs last month</span>
            </div>
          </Card>
        ))
      ) : (
        analyticsMetrics.map((metric, idx) => (
          <Card key={idx} className={cn("relative overflow-hidden group border bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 shadow-xl", metric.glow)}>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:w-32 group-hover:h-32 transition-all"></div>
            <div className="flex flex-col justify-between h-full relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">{metric.label}</p>
                  <h3 className="text-2xl font-black mt-2 tracking-tight text-white">{metric.value}</h3>
                </div>
                <div className={cn('p-3 rounded-xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-inner', metric.bg)}>
                  <metric.icon className={metric.color} size={20} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold">
                <span className="text-[10px] text-text-secondary font-medium truncate max-w-[90px]">{metric.subtitle}</span>
                <div className={cn(
                  "flex items-center px-1.5 py-0.5 rounded-lg shrink-0",
                  metric.isPositive ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                )}>
                  {metric.isPositive ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                  <span>{metric.trend}</span>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};
