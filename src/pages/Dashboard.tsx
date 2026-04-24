import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Phone, CheckCircle, XCircle, TrendingUp, DollarSign } from 'lucide-react';
import { Card } from '../components/Card';
import { Table, TableRow, TableCell } from '../components/Table';
import { paymentService } from '../services/api';
import type { PaymentStats, Call } from '../types';
import { Loader } from '../components/Loader';
import { cn } from '../utils/cn';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, callsData] = await Promise.all([
          paymentService.getStats(),
          paymentService.getRecentCalls()
        ]);
        setStats(statsData);
        setCalls(callsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !stats) return <Loader />;

  const metrics = [
    { label: 'Total Calls', value: stats.totalCalls, icon: Phone, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Successful', value: stats.successfulPayments, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Failed', value: stats.failedPayments, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-text-secondary">Real-time monitoring of your voice payment system.</p>
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
              <div className={cn('p-3 rounded-2xl transition-transform group-hover:scale-110', metric.bg)}>
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
        {/* Chart Section */}
        <Card title="Payment Trends" description="Successful vs Failed payments over the last week" className="lg:col-span-2">
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
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

        {/* Status Distribution (Bonus) */}
        <Card title="Quick Actions" description="Common administrative tasks">
          <div className="space-y-4 mt-4">
            <button className="w-full p-4 flex items-center justify-between bg-secondary rounded-2xl border border-border hover:border-primary/50 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Phone size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">New Call Test</p>
                  <p className="text-xs text-text-secondary">Simulate an IVR call</p>
                </div>
              </div>
            </button>
            <button className="w-full p-4 flex items-center justify-between bg-secondary rounded-2xl border border-border hover:border-primary/50 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                  <TrendingUp size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Generate Report</p>
                  <p className="text-xs text-text-secondary">Export data to CSV/PDF</p>
                </div>
              </div>
            </button>
          </div>
        </Card>
      </div>

      {/* Recent Calls Table */}
      <Card title="Recent Calls" description="Monitor calls in real-time as they happen.">
        <Table headers={['Customer', 'Phone Number', 'Amount', 'Duration', 'Status', 'Time']}>
          {calls.map((call) => (
            <TableRow key={call.id}>
              <TableCell className="font-medium">{call.customerName}</TableCell>
              <TableCell className="text-text-secondary">{call.phoneNumber}</TableCell>
              <TableCell className="font-semibold">${call.amount.toFixed(2)}</TableCell>
              <TableCell>{call.duration}</TableCell>
              <TableCell>
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border',
                  call.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                  call.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-amber-500/10 text-amber-500 border-amber-500/20'
                )}>
                  {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                </span>
              </TableCell>
              <TableCell className="text-text-secondary">{call.timestamp}</TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>
    </div>
  );
};
