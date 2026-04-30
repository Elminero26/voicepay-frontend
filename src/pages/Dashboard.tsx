import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Phone, CheckCircle, XCircle, TrendingUp, DollarSign, Wifi, WifiOff } from 'lucide-react';
import { Card } from '../components/Card';
import { Table, TableRow, TableCell } from '../components/Table';
import { paymentService } from '../services/api';
import { useLiveCalls } from '../hooks/useLiveCalls';
import type { PaymentStats, Call } from '../types';
import { Loader } from '../components/Loader';
import { cn } from '../utils/cn';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  // WebSocket en tiempo real para llamadas activas
  const { liveCalls, connected } = useLiveCalls();

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
    { label: 'Total Calls', value: stats.totalCalls ?? 0, icon: Phone, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Successful', value: stats.successfulPayments ?? 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Failed', value: stats.failedPayments ?? 0, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Total Revenue', value: `$${(stats.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gradient">Dashboard</h2>
          <p className="text-text-secondary mt-1">Real-time monitoring of your voice payment system.</p>
        </div>
        <div className="flex items-center space-x-2 bg-secondary/50 p-1 rounded-xl border border-border">
          <button className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg shadow-sm">Last 24h</button>
          <button className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg transition-colors">Last 7d</button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">{metric.label}</p>
                <h3 className="text-2xl font-bold mt-1">{metric.value}</h3>
              </div>
              <div className={cn('p-4 rounded-2xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-lg', metric.bg)}>
                <metric.icon className={metric.color} size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-500 font-medium">
              <TrendingUp size={14} className="mr-1" />
              <span>+12.5% from yesterday</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart (Area) */}
        <Card title="Payment Trends" description="Successful vs Failed payments over the last week" className="lg:col-span-2">
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={stats.chartData || []}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141416', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCompleted)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorFailed)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution Chart (Pie) */}
        <Card title="Payment Status" description="Distribution of overall payments">
          <div className="h-[350px] w-full mt-4 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: stats.successfulPayments },
                    { name: 'Failed', value: stats.failedPayments },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141416', border: '1px solid #27272a', borderRadius: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-between items-center px-4 py-2 bg-secondary/50 rounded-xl border border-border mt-2">
              <div className="text-center">
                <p className="text-xs text-text-secondary">Conversion</p>
                <p className="text-sm font-bold text-green-500">{stats.conversionRate}%</p>
              </div>
              <div className="w-[1px] h-8 bg-border" />
              <div className="text-center">
                <p className="text-xs text-text-secondary">Avg. Amount</p>
                <p className="text-sm font-bold">$42.30</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bar Chart Section (Daily) */}
      <Card title="Daily Performance" description="Detailed comparison of successful and failed payments by day">
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height={300} minWidth={0}>
            <BarChart data={stats.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ backgroundColor: '#141416', border: '1px solid #27272a', borderRadius: '12px' }}
              />
              <Legend />
              <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Live Calls Table */}
      <Card 
        title="Live Monitoring" 
        description="Active IVR sessions currently in the system."
        className="relative overflow-hidden"
      >
        <div className="absolute top-6 right-6 flex items-center space-x-2">
          {connected ? (
            <>
              <div className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              <Wifi size={12} className="text-green-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">WebSocket Live</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Reconnecting...</span>
            </>
          )}
        </div>
        <Table headers={['Customer', 'Phone Number', 'Amount', 'Duration', 'Status', 'Time']}>
          {liveCalls.map((call) => (
            <TableRow key={call.id}>
              <TableCell className="font-medium">{call.customerName || 'Unknown Caller'}</TableCell>
              <TableCell className="text-text-secondary">{call.phoneNumber}</TableCell>
              <TableCell className="font-semibold">${(call.amount ?? 0).toFixed(2)}</TableCell>
              <TableCell>{call.duration}</TableCell>
              <TableCell>
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border',
                  call.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                  call.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-amber-500/10 text-amber-500 border-amber-500/20'
                )}>
                  {(call.status || 'unknown').charAt(0).toUpperCase() + (call.status || 'unknown').slice(1)}
                </span>
              </TableCell>
              <TableCell className="text-text-secondary">{call.timestamp}</TableCell>
            </TableRow>
          ))}
          {liveCalls.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                No active calls at the moment.
              </TableCell>
            </TableRow>
          )}
        </Table>
      </Card>

      {/* Recent Activity Table */}
      <Card 
        title="Recent Activity" 
        description="History of the last 10 payment attempts."
      >
        <Table headers={['Customer', 'Phone Number', 'Amount', 'Status', 'Time']}>
          {recentPayments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{payment.customerName}</TableCell>
              <TableCell className="text-text-secondary">{payment.phoneNumber}</TableCell>
              <TableCell className="font-semibold">${(payment.amount ?? 0).toFixed(2)}</TableCell>
              <TableCell>
                <span className={cn(
                  'px-2 py-1 rounded-md text-xs font-medium border',
                  payment.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                  payment.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-amber-500/10 text-amber-500 border-amber-500/20'
                )}>
                  {(payment.status || 'unknown').charAt(0).toUpperCase() + (payment.status || 'unknown').slice(1)}
                </span>
              </TableCell>
              <TableCell className="text-text-secondary">{payment.timestamp}</TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>
    </div>
  );
};
