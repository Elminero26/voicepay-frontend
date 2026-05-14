import React, { useEffect, useState } from 'react';
import { Phone, Search, Download, ArrowUpRight, Clock, Network } from 'lucide-react';
import { Card } from '../components/Card';
import { Table, TableRow, TableCell } from '../components/Table';
import { paymentService } from '../services/api';
import type { Call } from '../types';
import { Loader } from '../components/Loader';
import { cn } from '../utils/cn';

export const CallsPage: React.FC = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed' | 'in-progress'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week'>('all');
  const [filterDuration, setFilterDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all');

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const data = await paymentService.getCalls();
        setCalls(data);
      } catch (error) {
        console.error('Error fetching calls:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  const filteredCalls = calls.filter(call => {
    const matchesSearch = 
      call.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.phoneNumber.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || call.status === filterStatus;
    
    // Simple date filter logic (mocking since we only have time strings in mock data)
    // In a real app, we'd compare actual Date objects
    const matchesDate = filterDate === 'all' || true; 

    // Duration filter logic
    let matchesDuration = true;
    if (filterDuration !== 'all' && call.duration) {
      const parts = call.duration.split(':');
      const seconds = parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : 0;
      if (filterDuration === 'short') matchesDuration = seconds < 60;
      else if (filterDuration === 'medium') matchesDuration = seconds >= 60 && seconds <= 300;
      else if (filterDuration === 'long') matchesDuration = seconds > 300;
    }

    return matchesSearch && matchesStatus && matchesDate && matchesDuration;
  });

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gradient">Call History</h2>
          <p className="text-text-secondary mt-1">Review and manage all voice payment transactions.</p>
        </div>
        <button className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/25 active:scale-95">
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Processed</p>
              <h3 className="text-2xl font-bold mt-1">{calls.length} Calls</h3>
            </div>
            <div className="p-3 bg-primary/20 rounded-xl text-primary">
              <Phone size={24} />
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Success Rate</p>
              <h3 className="text-2xl font-bold mt-1">
                {Math.round((calls.filter(c => c.status === 'completed').length / calls.length) * 100)}%
              </h3>
            </div>
            <div className="p-3 bg-green-500/20 rounded-xl text-green-500">
              <ArrowUpRight size={24} />
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Revenue</p>
              <h3 className="text-2xl font-bold mt-1">
                ${calls.reduce((acc, c) => acc + (c.status === 'completed' ? c.amount : 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-500">
              <Clock size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="overflow-hidden">
        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Search by customer or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2 bg-secondary/30 p-1 rounded-xl border border-border">
              <span className="text-[10px] font-bold uppercase px-2 text-text-secondary">Status</span>
              <div className="flex items-center space-x-1">
                {(['all', 'completed', 'failed', 'in-progress'] as const).map((status) => (
                  <button 
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize",
                      filterStatus === status 
                        ? "bg-primary text-white shadow-md" 
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Filter */}
            <div className="flex items-center space-x-2 bg-secondary/30 p-1 rounded-xl border border-border">
              <span className="text-[10px] font-bold uppercase px-2 text-text-secondary">Duration</span>
              <div className="flex items-center space-x-1">
                {(['all', 'short', 'medium', 'long'] as const).map((dur) => (
                  <button 
                    key={dur}
                    onClick={() => setFilterDuration(dur)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize",
                      filterDuration === dur 
                        ? "bg-amber-500 text-white shadow-md" 
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {dur === 'short' ? '<1m' : dur === 'medium' ? '1-5m' : dur === 'long' ? '>5m' : 'All'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Date Picker Placeholder */}
            <div className="flex items-center space-x-2 bg-secondary/30 p-1 rounded-xl border border-border">
              <span className="text-[10px] font-bold uppercase px-2 text-text-secondary">Date</span>
              <select 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-text-primary outline-none px-2 py-1 cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calls Table */}
        <div className="relative">
          <Table headers={['Customer', 'Phone Number', 'Amount', 'Duration', 'Status', 'Time', 'Actions']}>
            {filteredCalls.map((call) => (
              <TableRow key={call.id} className="group hover:bg-primary/5 transition-colors cursor-pointer">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center text-primary font-bold text-xs">
                      {call.customerName.charAt(0)}
                    </div>
                    <span className="font-semibold">{call.customerName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-text-secondary font-mono text-xs">{call.phoneNumber}</TableCell>
                <TableCell>
                  <span className={cn(
                    "font-bold",
                    call.status === 'completed' ? "text-text-primary" : "text-text-secondary"
                  )}>
                    ${(call.amount ?? 0).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-text-secondary text-xs">
                    <Clock size={12} className="mr-1.5" />
                    {call.duration}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                    call.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    call.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  )}>
                    {call.status}
                  </span>
                </TableCell>
                <TableCell className="text-text-secondary text-sm">{call.timestamp}</TableCell>
                <TableCell>
                  <a href="/ivr-flow" className="p-2 bg-secondary/50 hover:bg-primary/20 text-text-secondary hover:text-primary rounded-lg transition-colors inline-block" title="View IVR Flow">
                    <Network size={16} />
                  </a>
                </TableCell>
              </TableRow>
            ))}
            {filteredCalls.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20">
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-secondary rounded-full mb-4">
                      <Search size={32} className="text-text-secondary opacity-20" />
                    </div>
                    <p className="text-text-secondary font-medium">No calls found matching your criteria.</p>
                    <button 
                      onClick={() => {setSearchTerm(''); setFilterStatus('all'); setFilterDate('all'); setFilterDuration('all');}}
                      className="text-primary text-sm font-bold mt-2 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </Table>
        </div>
      </Card>
    </div>
  );
};
