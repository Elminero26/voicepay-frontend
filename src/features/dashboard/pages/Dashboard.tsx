import React, { useEffect, useState, useMemo } from 'react';
import { 
  CheckCircle, XCircle, 
  Wifi, WifiOff
} from 'lucide-react';
import { Card } from '../../../components/Card';
import { Table, TableRow, TableCell } from '../../../components/Table';
import { paymentService } from '../../../services/api';
import { useLiveCalls } from '../../ivr-flow/hooks/useLiveCalls';
import type { PaymentStats, Call } from '../../../types';
import { Loader } from '../../../components/Loader';
import { cn } from '../../../utils/cn';

// Subcomponents
import { DashboardHeader } from '../components/DashboardHeader';
import type { TimeRange, DashboardTab } from '../components/DashboardHeader';
import { StatsGrid } from '../components/StatsGrid';
import { AnalyticsCharts } from '../components/AnalyticsCharts';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('realtime');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  // WebSocket en tiempo real para llamadas activas
  const { liveCalls, connected } = useLiveCalls();

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
          { name: 'Oct', completed: 4600, text: '', failed: 1300 },
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

  if (loading || !stats) return <Loader variant="dashboard" />;

  return (
    <div className="space-y-8 animate-slide-up relative">
      {/* Header Section */}
      <DashboardHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        connected={connected}
      />

      {/* Metrics Grid */}
      <StatsGrid 
        activeTab={activeTab}
        stats={stats}
        analyticsData={analyticsData}
      />

      {/* Main Analytical / Real-time Panels */}
      <AnalyticsCharts 
        activeTab={activeTab}
        stats={stats}
        analyticsData={analyticsData}
      />

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
