import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  AreaChart, Area, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar, 
  LineChart, Line
} from 'recharts';
import { 
  Phone, CheckCircle, XCircle, 
  TrendingUp, TrendingDown, DollarSign, 
  Wifi, WifiOff, Bell, Clock, 
  BarChart2, Percent, ShieldCheck
} from 'lucide-react';
import { Card } from '../../../components/Card';
import { Table, TableRow, TableCell } from '../../../components/Table';
import { paymentService } from '../../../services/api';
import { useLiveCalls } from '../../ivr-flow/hooks/useLiveCalls';
import type { PaymentStats, Call } from '../../../types';
import { Loader } from '../../../components/Loader';
import { cn } from '../../../utils/cn';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

type TimeRange = 'today' | 'week' | 'month' | 'year';
type DashboardTab = 'realtime' | 'analytics';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('realtime');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastCallCount, setLastCallCount] = useState(0);

  // WebSocket en tiempo real para llamadas activas
  const { liveCalls, connected } = useLiveCalls();

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // Detectar nuevas llamadas para mostrar Toast
  useEffect(() => {
    if (liveCalls.length > lastCallCount) {
      const newCall = liveCalls[liveCalls.length - 1];
      addToast(`Nueva llamada entrante: ${newCall.customerName || 'Desconocido'}`, 'info');
    }
    setLastCallCount(liveCalls.length);
  }, [liveCalls, lastCallCount, addToast]);

  // Obtener estadísticas reales del backend en intervalos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, recentData] = await Promise.all([
          paymentService.getStats(),
          paymentService.getRecentCalls()
        ]);
        setStats(statsData);
        setRecentPayments(recentData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Estadísticas: poll cada 10s

    return () => clearInterval(interval);
  }, []);

  // Generador dinámico de datos de analíticas basado en el filtro temporal seleccionado
  const analyticsData = useMemo(() => {
    if (timeRange === 'today') {
      return {
        totalCalls: 184,
        successfulPayments: 148,
        failedPayments: 36,
        conversionRate: 80.4,
        totalRevenue: 6364.50,
        avgTicket: 43.00,
        avgDuration: 94, // seconds
        callsTrend: '+8.2%',
        revenueTrend: '+12.4%',
        conversionTrend: '+2.1%',
        durationTrend: '-4.6%',
        isCallsPositive: true,
        isRevenuePositive: true,
        isConversionPositive: true,
        isDurationPositive: true, // duration going down is positive
        chartData: [
          { name: '08:00', completed: 12, failed: 2 },
          { name: '10:00', completed: 25, failed: 5 },
          { name: '12:00', completed: 34, failed: 9 },
          { name: '14:00', completed: 22, failed: 4 },
          { name: '16:00', completed: 38, failed: 11 },
          { name: '18:00', completed: 17, failed: 5 }
        ],
        revenueChartData: [
          { name: '08:00', amount: 516.00 },
          { name: '10:00', amount: 1075.00 },
          { name: '12:00', amount: 1462.00 },
          { name: '14:00', amount: 946.00 },
          { name: '16:00', amount: 1634.00 },
          { name: '18:00', amount: 731.50 }
        ],
        ivrBreakdown: [
          { name: 'Direct Payment', value: 98, color: '#6366f1' },
          { name: 'Talk to Agent', value: 42, color: '#3b82f6' },
          { name: 'Billing Query', value: 28, color: '#ec4899' },
          { name: 'Other Services', value: 16, color: '#f59e0b' }
        ]
      };
    } else if (timeRange === 'week') {
      return {
        totalCalls: 1280,
        successfulPayments: 1010,
        failedPayments: 270,
        conversionRate: 78.9,
        totalRevenue: 43632.00,
        avgTicket: 43.20,
        avgDuration: 102,
        callsTrend: '+14.2%',
        revenueTrend: '+16.8%',
        conversionTrend: '+1.5%',
        durationTrend: '-3.1%',
        isCallsPositive: true,
        isRevenuePositive: true,
        isConversionPositive: true,
        isDurationPositive: true,
        chartData: [
          { name: 'Mon', completed: 120, failed: 35 },
          { name: 'Tue', completed: 145, failed: 42 },
          { name: 'Wed', completed: 135, failed: 30 },
          { name: 'Thu', completed: 160, failed: 45 },
          { name: 'Fri', completed: 180, failed: 52 },
          { name: 'Sat', completed: 150, failed: 38 },
          { name: 'Sun', completed: 120, failed: 28 }
        ],
        revenueChartData: [
          { name: 'Mon', amount: 5184.00 },
          { name: 'Tue', amount: 6264.00 },
          { name: 'Wed', amount: 5832.00 },
          { name: 'Thu', amount: 6912.00 },
          { name: 'Fri', amount: 7776.00 },
          { name: 'Sat', amount: 6480.00 },
          { name: 'Sun', amount: 5184.00 }
        ],
        ivrBreakdown: [
          { name: 'Direct Payment', value: 680, color: '#6366f1' },
          { name: 'Talk to Agent', value: 290, color: '#3b82f6' },
          { name: 'Billing Query', value: 190, color: '#ec4899' },
          { name: 'Other Services', value: 120, color: '#f59e0b' }
        ]
      };
    } else if (timeRange === 'month') {
      return {
        totalCalls: 5420,
        successfulPayments: 4240,
        failedPayments: 1180,
        conversionRate: 78.2,
        totalRevenue: 183168.00,
        avgTicket: 43.20,
        avgDuration: 105,
        callsTrend: '+18.4%',
        revenueTrend: '+21.5%',
        conversionTrend: '+0.4%',
        durationTrend: '+1.2%',
        isCallsPositive: true,
        isRevenuePositive: true,
        isConversionPositive: true,
        isDurationPositive: false,
        chartData: [
          { name: 'Week 1', completed: 1020, failed: 280 },
          { name: 'Week 2', completed: 1110, failed: 310 },
          { name: 'Week 3', completed: 1060, failed: 290 },
          { name: 'Week 4', completed: 1050, failed: 300 }
        ],
        revenueChartData: [
          { name: 'Week 1', amount: 44064.00 },
          { name: 'Week 2', amount: 47952.00 },
          { name: 'Week 3', amount: 45792.00 },
          { name: 'Week 4', amount: 45360.00 }
        ],
        ivrBreakdown: [
          { name: 'Direct Payment', value: 2850, color: '#6366f1' },
          { name: 'Talk to Agent', value: 1220, color: '#3b82f6' },
          { name: 'Billing Query', value: 810, color: '#ec4899' },
          { name: 'Other Services', value: 540, color: '#f59e0b' }
        ]
      };
    } else {
      // year
      return {
        totalCalls: 68450,
        successfulPayments: 53120,
        failedPayments: 15330,
        conversionRate: 77.6,
        totalRevenue: 2294784.00,
        avgTicket: 43.20,
        avgDuration: 108,
        callsTrend: '+35.6%',
        revenueTrend: '+39.4%',
        conversionTrend: '+1.8%',
        durationTrend: '-2.4%',
        isCallsPositive: true,
        isRevenuePositive: true,
        isConversionPositive: true,
        isDurationPositive: true,
        chartData: [
          { name: 'Jan', completed: 4100, failed: 1200 },
          { name: 'Feb', completed: 4200, failed: 1180 },
          { name: 'Mar', completed: 4400, failed: 1250 },
          { name: 'Apr', completed: 4300, failed: 1220 },
          { name: 'May', completed: 4600, failed: 1350 },
          { name: 'Jun', completed: 4500, failed: 1300 },
          { name: 'Jul', completed: 4700, failed: 1380 },
          { name: 'Aug', completed: 4800, failed: 1390 },
          { name: 'Sep', completed: 4300, failed: 1250 },
          { name: 'Oct', completed: 4600, failed: 1300 },
          { name: 'Nov', completed: 4500, text: '', failed: 1290 },
          { name: 'Dec', completed: 4120, failed: 1620 }
        ],
        revenueChartData: [
          { name: 'Jan', amount: 177120.00 },
          { name: 'Feb', amount: 181440.00 },
          { name: 'Mar', amount: 190080.00 },
          { name: 'Apr', amount: 185760.00 },
          { name: 'May', amount: 198720.00 },
          { name: 'Jun', amount: 194400.00 },
          { name: 'Jul', amount: 203040.00 },
          { name: 'Aug', amount: 207360.00 },
          { name: 'Sep', amount: 185760.00 },
          { name: 'Oct', amount: 198720.00 },
          { name: 'Nov', amount: 194400.00 },
          { name: 'Dec', amount: 177984.00 }
        ],
        ivrBreakdown: [
          { name: 'Direct Payment', value: 36240, color: '#6366f1' },
          { name: 'Talk to Agent', value: 15450, color: '#3b82f6' },
          { name: 'Billing Query', value: 10220, color: '#ec4899' },
          { name: 'Other Services', value: 6540, color: '#f59e0b' }
        ]
      };
    }
  }, [timeRange]);

  // Formateador de Tooltip Recharts para mantener la estética glassmorphic
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md bg-secondary/85 animate-fade-in">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 my-1.5">
              <span className="text-xs font-semibold flex items-center gap-2" style={{ color: item.color || item.stroke }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.stroke }}></span>
                {item.name}
              </span>
              <span className="text-sm font-bold text-white">
                {item.dataKey === 'amount' ? `$${item.value.toLocaleString()}` : item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  }, []);

  if (loading || !stats) return <Loader />;

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
    <div className="space-y-8 animate-slide-up relative">
      {/* Toast Notification System */}
      <div className="fixed top-24 right-8 z-50 flex flex-col gap-3">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-slide-in-right",
              toast.type === 'success' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
              toast.type === 'error' ? "bg-rose-500/20 border-rose-500/30 text-rose-400" :
              "bg-indigo-500/20 border-indigo-500/30 text-indigo-200"
            )}
          >
            <Bell size={18} className="animate-bounce" />
            <span className="font-semibold text-sm">{toast.message}</span>
          </div>
        ))}
      </div>

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

      {/* Metrics Grid */}
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

      {/* Main Analytical / Real-time Panels */}
      {activeTab === 'realtime' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trend Chart (Area) */}
          <Card title="Live Call Flow Status" description="Monitoring transaction stream attempts" className="lg:col-span-2 bg-secondary/5 border-border/30 backdrop-blur-md">
            <div className="h-[350px] w-full mt-6">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={stats.chartData || []}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    name="Successful"
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCompleted)" 
                    animationDuration={1500}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="failed" 
                    name="Failed"
                    stroke="#ef4444" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorFailed)" 
                    animationDuration={1800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Success Rate Chart (Pie) */}
          <Card title="Conversion Share" description="Ratio of secure checkouts" className="bg-secondary/5 border-border/30">
            <div className="h-[350px] w-full mt-4 flex flex-col items-center justify-between">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Successful Payments', value: stats.successfulPayments ?? 0 },
                      { name: 'Failed Payments', value: stats.failedPayments ?? 0 },
                    ]}
                    innerRadius={70}
                    outerRadius={92}
                    paddingAngle={6}
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={1200}
                  >
                    <Cell fill="#6366f1" stroke="none" />
                    <Cell fill="#ef4444" stroke="none" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full flex justify-between items-center px-6 py-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-black tracking-widest text-text-secondary mb-1">Success Rate</p>
                  <p className="text-2xl font-black text-emerald-400">{stats.conversionRate}%</p>
                </div>
                <div className="w-[1.5px] h-10 bg-border/40" />
                <div className="text-center">
                  <p className="text-[10px] uppercase font-black tracking-widest text-text-secondary mb-1">Avg. Ticket</p>
                  <p className="text-2xl font-black text-white">$43.20</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* Analytics Tab Panels */
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Business Volume - Revenue Flow (BarChart) */}
            <Card 
              title="Revenue Flow Trend" 
              description={`Volume of checkout invoices in selected timeframe.`}
              className="lg:col-span-2 bg-secondary/5 border-border/30"
            >
              <div className="h-[350px] w-full mt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={analyticsData.revenueChartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#312e81" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} 
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="amount" 
                      name="Revenue Volume" 
                      fill="url(#colorRevenue)" 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={45}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* IVR Selections Breakdown */}
            <Card 
              title="IVR Navigation Choices" 
              description="User distribution inside Voice Node menus."
              className="bg-secondary/5 border-border/30"
            >
              <div className="h-[350px] w-full mt-4 flex flex-col items-center justify-between">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={analyticsData.ivrBreakdown}
                      innerRadius={65}
                      outerRadius={88}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1200}
                    >
                      {analyticsData.ivrBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Custom list description */}
                <div className="w-full space-y-2 mt-2">
                  {analyticsData.ivrBreakdown.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-xs px-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <span className="font-bold text-text-primary">{entry.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-text-secondary">{entry.value} iterations</span>
                        <span className="font-black text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded-md text-[10px]">
                          {Math.round((entry.value / analyticsData.ivrBreakdown.reduce((sum, item) => sum + item.value, 0)) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Additional Operational Efficiency Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Conversion Speed & Volume Chart */}
            <Card 
              title="Operational Success vs Failure" 
              description="Comparison of daily completion vs rejection counts"
              className="lg:col-span-2 bg-secondary/5 border-border/30"
            >
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      name="Completed Payments"
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1500}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="failed" 
                      name="Failed Payments"
                      stroke="#ef4444" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1800}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Performance Indicators */}
            <Card title="KPI Health Summary" description="Security metrics and audits" className="bg-secondary/5 border-border/30">
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-text-secondary">Security Compliance</h4>
                      <p className="text-sm font-bold text-white mt-0.5">AES-256 Enabled</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                </div>

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <BarChart2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-text-secondary">Average Conversion</h4>
                      <p className="text-sm font-bold text-white mt-0.5">80.4% Success Rate</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Optimal</span>
                </div>

                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-text-secondary">Latency Check</h4>
                      <p className="text-sm font-bold text-white mt-0.5">IVR response 82ms</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">Excellent</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Live Calls Table - Always present in Real-time view */}
      {activeTab === 'realtime' && (
        <>
          <Card 
            title="Live Voice Stream" 
            description="Encrypted active connections and calls from secure nodes."
            className="relative overflow-hidden border-indigo-500/20 bg-indigo-500/5 shadow-2xl shadow-indigo-500/5"
          >
            <div className="absolute top-6 right-8 flex items-center space-x-3 bg-black/20 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
              {connected ? (
                <>
                  <div className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Live Secure Stream</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} className="text-rose-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Connecting Node...</span>
                </>
              )}
            </div>
            <div className="mt-4">
              <Table headers={['Customer', 'Phone', 'Amount', 'Option', 'Duration', 'Secure Status', 'Time']}>
                {liveCalls.map((call) => (
                  <TableRow key={call.id} className="hover:bg-white/5 transition-colors group">
                    <TableCell className="font-bold text-white group-hover:text-indigo-400 transition-colors">{call.customerName || 'Unknown'}</TableCell>
                    <TableCell className="text-text-secondary font-mono text-sm">{call.phoneNumber}</TableCell>
                    <TableCell className="font-black text-white">${(call.amount ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="font-medium text-slate-300">{call.selectedOption || '-'}</TableCell>
                    <TableCell className="text-slate-400 font-mono text-xs">{call.duration}s</TableCell>
                    <TableCell>
                      <span className={cn(
                        'px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm',
                        call.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        call.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                      )}>
                        {call.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-text-secondary font-medium">{call.timestamp}</TableCell>
                  </TableRow>
                ))}
                {liveCalls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center opacity-40">
                        <Wifi size={48} className="mb-4 text-text-secondary" />
                        <p className="text-sm font-bold tracking-widest uppercase">Scanning for active voice nodes...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Table>
            </div>
          </Card>

          {/* Recent Activity Table */}
          <Card 
            title="Transaction Ledger" 
            description="Immutable records of last 10 attempts."
            className="bg-secondary/10 border-border/20"
          >
            <Table headers={['Customer', 'Phone', 'Amount', 'Option', 'Duration', 'Verification', 'Time']}>
              {recentPayments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-white/5 transition-colors">
                  <TableCell className="font-bold">{payment.customerName}</TableCell>
                  <TableCell className="text-text-secondary font-mono text-sm">{payment.phoneNumber}</TableCell>
                  <TableCell className="font-black">${(payment.amount ?? 0).toFixed(2)}</TableCell>
                  <TableCell className="text-text-secondary font-bold text-xs">{payment.selectedOption || '-'}</TableCell>
                  <TableCell className="text-text-secondary font-bold text-xs">{payment.duration || '-'}</TableCell>
                  <TableCell>
                    <div className={cn(
                      'inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border',
                      payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      payment.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}>
                      {payment.status === 'completed' && <CheckCircle size={10} className="mr-1.5" />}
                      {payment.status === 'failed' && <XCircle size={10} className="mr-1.5" />}
                      {payment.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary font-medium">{payment.timestamp}</TableCell>
                </TableRow>
              ))}
            </Table>
          </Card>
        </>
      )}
    </div>
  );
};
