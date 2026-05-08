import React, { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Phone, CheckCircle, XCircle, TrendingUp, DollarSign, Wifi, WifiOff, Bell } from 'lucide-react';
import { Card } from '../components/Card';
import { Table, TableRow, TableCell } from '../components/Table';
import { paymentService } from '../services/api';
import { useLiveCalls } from '../hooks/useLiveCalls';
import type { PaymentStats, Call } from '../types';
import { Loader } from '../components/Loader';
import { cn } from '../utils/cn';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export const Dashboard: React.FC = () => {
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

  if (loading || !stats) return <Loader />;

  const metrics = [
    { label: 'Total Calls', value: stats.totalCalls ?? 0, icon: Phone, color: 'text-primary', bg: 'bg-primary/10', glow: 'shadow-primary/20' },
    { label: 'Successful', value: stats.successfulPayments ?? 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', glow: 'shadow-green-500/20' },
    { label: 'Failed', value: stats.failedPayments ?? 0, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', glow: 'shadow-red-500/20' },
    { label: 'Total Revenue', value: `$${(stats.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/20' },
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
              toast.type === 'success' ? "bg-green-500/20 border-green-500/30 text-green-400" :
              toast.type === 'error' ? "bg-red-500/20 border-red-500/30 text-red-400" :
              "bg-primary/20 border-primary/30 text-primary-light"
            )}
          >
            <Bell size={18} className="animate-bounce" />
            <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-gradient tracking-tight">Dashboard Overview</h2>
          <p className="text-text-secondary mt-2 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
            Real-time monitoring enabled and secured with API Key.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-secondary/30 p-1.5 rounded-2xl border border-border/50 backdrop-blur-sm">
          <button className="px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl shadow-lg shadow-primary/25 hover:scale-105 transition-transform">Real-time</button>
          <button className="px-5 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary rounded-xl transition-all">Analytics</button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <Card key={idx} className={cn("relative overflow-hidden group border-none bg-secondary/20 hover:bg-secondary/30 transition-all duration-300 shadow-xl", metric.glow)}>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:w-32 group-hover:h-32 transition-all"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary opacity-70">{metric.label}</p>
                <h3 className="text-3xl font-black mt-2 tracking-tight">{metric.value}</h3>
              </div>
              <div className={cn('p-4 rounded-2xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-inner', metric.bg)}>
                <metric.icon className={metric.color} size={28} />
              </div>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold">
              <div className="flex items-center text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                <TrendingUp size={12} className="mr-1" />
                <span>+12.5%</span>
              </div>
              <span className="ml-2 text-text-secondary opacity-60">vs last month</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart (Area) */}
        <Card title="Revenue Flow" description="Performance tracking" className="lg:col-span-2 bg-secondary/10 border-border/30 backdrop-blur-md">
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20, 20, 22, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorCompleted)" 
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorFailed)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution Chart (Pie) */}
        <Card title="Success Rate" description="Current distribution" className="bg-secondary/10 border-border/30">
          <div className="h-[350px] w-full mt-4 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: stats.successfulPayments },
                    { name: 'Failed', value: stats.failedPayments },
                  ]}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={500}
                  animationDuration={1500}
                >
                  <Cell fill="#6366f1" stroke="none" />
                  <Cell fill="#ef4444" stroke="none" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20, 20, 22, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full flex justify-between items-center px-6 py-4 bg-primary/5 rounded-2xl border border-primary/10 mt-2">
              <div className="text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-text-secondary mb-1">Conversion</p>
                <p className="text-xl font-black text-green-500">{stats.conversionRate}%</p>
              </div>
              <div className="w-[1px] h-10 bg-border/50" />
              <div className="text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-text-secondary mb-1">Avg. Ticket</p>
                <p className="text-xl font-black text-white">$42.30</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Calls Table */}
      <Card 
        title="Live Voice Stream" 
        description="Encrypted active connections."
        className="relative overflow-hidden border-primary/20 bg-primary/5 shadow-2xl shadow-primary/5"
      >
        <div className="absolute top-6 right-8 flex items-center space-x-3 bg-black/20 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
          {connected ? (
            <>
              <div className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Live Secure Stream</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Connecting Node...</span>
            </>
          )}
        </div>
        <div className="mt-4">
          <Table headers={['Customer', 'Phone', 'Amount', 'Option', 'Duration', 'Secure Status', 'Time']}>
            {liveCalls.map((call) => (
              <TableRow key={call.id} className="hover:bg-white/5 transition-colors group">
                <TableCell className="font-bold text-white group-hover:text-primary transition-colors">{call.customerName || 'Unknown'}</TableCell>
                <TableCell className="text-text-secondary font-mono text-sm">{call.phoneNumber}</TableCell>
                <TableCell className="font-black text-white">${(call.amount ?? 0).toFixed(2)}</TableCell>
                <TableCell className="font-medium text-slate-300">{call.selectedOption || '-'}</TableCell>
                <TableCell className="text-slate-400 font-mono text-xs">{call.duration}s</TableCell>
                <TableCell>
                  <span className={cn(
                    'px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm',
                    call.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    call.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                  )}>
                    {call.status}
                  </span>
                </TableCell>
                <TableCell className="text-text-secondary font-medium">{call.timestamp}</TableCell>
              </TableRow>
            ))}
            {liveCalls.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
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
        description="Immutable record of last 10 attempts."
        className="bg-secondary/10 border-border/20"
      >
        <Table headers={['Customer', 'Phone', 'Amount', 'Option', 'Duration', 'Verification', 'Time']}>
          {recentPayments.map((payment) => (
            <TableRow key={payment.id} className="hover:bg-white/5 transition-colors">
              <TableCell className="font-bold">{payment.customerName}</TableCell>
              <TableCell className="text-text-secondary font-mono text-sm">{payment.phoneNumber}</TableCell>
              <TableCell className="font-black">${(payment.amount ?? 0).toFixed(2)}</TableCell>
              <TableCell className="text-text-secondary font-bold text-xs">{payment.option || '-'}</TableCell>
              <TableCell className="text-text-secondary font-bold text-xs">{payment.duration || '-'}</TableCell>
              <TableCell>
                <div className={cn(
                  'inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border',
                  payment.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                  payment.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-amber-500/10 text-amber-500 border-amber-500/20'
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
    </div>
  );
};
