import React, { useCallback } from 'react';
import { 
  AreaChart, Area, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar, 
  LineChart, Line
} from 'recharts';
import { 
  ShieldCheck, BarChart2, Clock
} from 'lucide-react';
import { Card } from '../../../components/Card';
import type { PaymentStats } from '../../../types';
import type { DashboardTab } from './DashboardHeader';

interface AnalyticsData {
  chartData: Array<{ name: string; completed: number; failed: number }>;
  revenueChartData: Array<{ name: string; amount: number }>;
  ivrBreakdown: Array<{ name: string; value: number; color: string; }>;
}

interface AnalyticsChartsProps {
  activeTab: DashboardTab;
  stats: PaymentStats;
  analyticsData: AnalyticsData;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  activeTab,
  stats,
  analyticsData
}) => {
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

  if (activeTab === 'realtime') {
    return (
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
    );
  }

  // Analytics Tab Panels
  return (
    <div className="space-y-8 animate-fade-in">
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
  );
};
