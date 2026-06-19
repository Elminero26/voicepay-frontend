import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { 
  Phone, Search, Download, ArrowUpRight, Clock, Network, 
  ShieldCheck, Filter, DollarSign, X, 
  Info, Lock, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '../../../components/Card';
import { paymentService } from '../../../services/api';
import type { Call } from '../../../types';
import { Loader } from '../../../components/Loader';
import { cn } from '../../../utils/cn';
import { AudioPlayer } from '../../../components/AudioPlayer';
import { WaveformCanvas } from '../../../components/WaveformCanvas';
import { useLanguage } from '../../../hooks/useLanguage';

const getPersistedAuditData = () => {
  try {
    const data = localStorage.getItem('voicepay_audit_notes');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Error reading audit notes from localStorage', e);
    return {};
  }
};

const persistAuditData = (callId: string, tags: string[], comments: string) => {
  try {
    const data = getPersistedAuditData();
    data[callId] = { tags, comments };
    localStorage.setItem('voicepay_audit_notes', JSON.stringify(data));
  } catch (e) {
    console.error('Error writing audit notes to localStorage', e);
  }
};

export const CallsPage: React.FC = () => {
  const { t } = useLanguage();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States para filtros y búsqueda avanzada
  // Raw input value — updates on every keystroke (bound to the <input>)
  const [searchInput, setSearchInput] = useState('');
  // Debounced value — updates only after 300ms of inactivity, used by the filter
  const debouncedSearch = useDebounce(searchInput, 300);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed' | 'in-progress'>('all');
  const [filterDuration, setFilterDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // State para la llamada seleccionada en el Cajón de Auditoría (Drawer)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  const handleUpdateAudit = (callId: string, tags: string[], comments: string) => {
    setCalls(prev => prev.map(c => c.id === callId ? { ...c, tags, comments } : c));
    setSelectedCall(prev => prev && prev.id === callId ? { ...prev, tags, comments } : prev);
    persistAuditData(callId, tags, comments);
  };

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const data = await paymentService.getCalls();
        const auditMap = getPersistedAuditData();
        const mergeAudit = (cList: Call[]) => cList.map(c => ({
          ...c,
          tags: auditMap[c.id]?.tags || [],
          comments: auditMap[c.id]?.comments || ''
        }));

        if (data.length < 50) {
          const expandedCalls: Call[] = [...data];
          const firstNames = ['Alice', 'Michael', 'Dwight', 'Jim', 'Pam', 'Andy', 'Angela', 'Stanley', 'Ryan', 'Kelly', 'Toby', 'Creed', 'Oscar', 'Kevin', 'Meredith'];
          const lastNames = ['Brown', 'Scott', 'Schrute', 'Halpert', 'Beesly', 'Bernard', 'Martin', 'Hudson', 'Howard', 'Kapoor', 'Flenderson', 'Bratton', 'Martinez', 'Malone', 'Palmer'];
          const statuses = ['completed', 'failed', 'in-progress'] as const;
          
          for (let i = 1; i <= 200; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const amount = status === 'completed' ? Math.floor(Math.random() * 450) + 10 : (status === 'failed' ? Math.floor(Math.random() * 100) + 5 : 0);
            const durationSecs = Math.floor(Math.random() * 500) + 20;
            const minutes = Math.floor(durationSecs / 60);
            const seconds = durationSecs % 60;
            const duration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            
            const hours = Math.floor(Math.random() * 12) + 1;
            const mins = Math.floor(Math.random() * 60);
            const ampm = Math.random() > 0.5 ? 'AM' : 'PM';
            const timestamp = `${hours}:${mins < 10 ? '0' : ''}${mins} ${ampm}`;
            
            expandedCalls.push({
              id: `v${i}`,
              customerName: `${firstName} ${lastName}`,
              phoneNumber: `+1 555 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
              status,
              amount,
              duration,
              timestamp,
              audioUrl: status !== 'in-progress' ? '/call_recording.mp3' : undefined
            });
          }
          setCalls(mergeAudit(expandedCalls));
        } else {
          setCalls(mergeAudit(data));
        }
      } catch (error) {
        console.error('Error fetching calls:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  // Lógica de filtrado de auditoría avanzado
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      // 1. Búsqueda por Nombre de Cliente o Teléfono (usa el valor debounced)
      const matchesSearch = 
        call.customerName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        call.phoneNumber.includes(debouncedSearch);

      // 2. Filtro por Estado
      const matchesStatus = filterStatus === 'all' || call.status === filterStatus;
      
      // 3. Filtro por Duración
      let matchesDuration = true;
      if (filterDuration !== 'all' && call.duration) {
        const parts = call.duration.split(':');
        const seconds = parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : parseInt(call.duration) || 0;
        if (filterDuration === 'short') matchesDuration = seconds < 60;
        else if (filterDuration === 'medium') matchesDuration = seconds >= 60 && seconds <= 300;
        else if (filterDuration === 'long') matchesDuration = seconds > 300;
      }

      // 4. Filtro por Rango de Montos
      let matchesMinAmount = true;
      if (minAmount !== '') {
        matchesMinAmount = (call.amount ?? 0) >= parseFloat(minAmount);
      }
      let matchesMaxAmount = true;
      if (maxAmount !== '') {
        matchesMaxAmount = (call.amount ?? 0) <= parseFloat(maxAmount);
      }

      // 5. Filtro por Fechas
      let matchesDates = true;
      if (startDate || endDate) {
        matchesDates = true; 
      }

      return matchesSearch && matchesStatus && matchesDuration && matchesMinAmount && matchesMaxAmount && matchesDates;
    });
  }, [calls, debouncedSearch, filterStatus, filterDuration, minAmount, maxAmount, startDate, endDate]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredCalls.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  // Restablecer todos los filtros
  const handleClearFilters = () => {
    setSearchInput('');
    setFilterStatus('all');
    setFilterDuration('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
  };

  // Exportar datos a formato CSV de forma funcional y descargable
  const handleExportCSV = () => {
    if (filteredCalls.length === 0) return;

    // Encabezados del archivo CSV con columnas de auditoria
    const headers = [
      t('calls.table.audit_id'),
      t('calls.table.client'),
      t('calls.table.phone'),
      t('calls.table.amount'),
      t('calls.table.duration'),
      t('calls.table.status'),
      t('calls.table.timestamp'),
      'Tags',
      'Comments'
    ];
    
    const getStatusKey = (status: string) => {
      if (status === 'in-progress') return 'in_progress';
      return status;
    };

    // Contenido de las filas con columnas de auditoria
    const rows = filteredCalls.map(c => [
      `AUD-${c.id}`,
      c.customerName,
      c.phoneNumber,
      (c.amount ?? 0).toFixed(2),
      c.duration || '-',
      t(`calls.status.${getStatusKey(c.status)}`).toUpperCase(),
      c.timestamp,
      (c.tags || []).join('; '),
      c.comments || ''
    ]);

    // Crear el string de CSV con soporte para caracteres en español (BOM)
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    // Crear el enlace y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_auditoria_voicepay_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generar línea de tiempo (timeline) de eventos de voz simulada según el estado para el Cajón de Auditoría
  const getCallEventsTimeline = (call: Call) => {
    if (call.callEvents && call.callEvents.length > 0) {
      return call.callEvents;
    }

    const defaultOption = t('ivr.speech_bubbles.fallback_general');

    // Fallback descriptivo y realista basado en el estado
    if (call.status === 'completed') {
      return [
        t('ivr.events_log.timeline_logs.completed.0'),
        t('ivr.events_log.timeline_logs.completed.1', { option: call.selectedOption || call.option || defaultOption }),
        t('ivr.events_log.timeline_logs.completed.2'),
        t('ivr.events_log.timeline_logs.completed.3'),
        t('ivr.events_log.timeline_logs.completed.4', { amount: (call.amount ?? 0).toFixed(2) }),
        t('ivr.events_log.timeline_logs.completed.5')
      ];
    } else if (call.status === 'failed') {
      return [
        t('ivr.events_log.timeline_logs.failed.0'),
        t('ivr.events_log.timeline_logs.failed.1', { option: call.selectedOption || call.option || defaultOption }),
        t('ivr.events_log.timeline_logs.failed.2'),
        t('ivr.events_log.timeline_logs.failed.3'),
        t('ivr.events_log.timeline_logs.failed.4'),
        t('ivr.events_log.timeline_logs.failed.5')
      ];
    } else {
      return [
        t('ivr.events_log.timeline_logs.in_progress.0'),
        t('ivr.events_log.timeline_logs.in_progress.1'),
        t('ivr.events_log.timeline_logs.in_progress.2')
      ];
    }
  };

  if (loading) return <Loader variant="table" />;

  return (
    <div className="space-y-8 animate-slide-up relative">
      
      {/* Cajón de Detalle de Auditoría (Side Drawer Overlay) */}
      <AnimatePresence>
        {selectedCall && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedCall(null)}
            />
            
            {/* Drawer Container */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-lg h-full glass border-l border-white/10 bg-background/95 p-8 flex flex-col justify-between shadow-2xl overflow-y-auto z-10"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{t('calls.drawer.audit_detail')}</span>
                    <h3 className="text-xl font-black text-white mt-1">AUD-{selectedCall.id}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedCall(null)}
                    className="p-2 bg-secondary/50 hover:bg-white/5 rounded-xl transition-all text-text-secondary hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Security Audit Badge - AES-256 Notification */}
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center space-x-3 text-indigo-200">
                  <Lock size={20} className="shrink-0 text-indigo-400 animate-pulse" />
                  <div className="text-xs">
                    <p className="font-bold">{t('calls.drawer.encryption_title')}</p>
                    <p className="opacity-70 mt-0.5">{t('calls.drawer.encryption_desc')}</p>
                  </div>
                </div>

                {/* Call Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 p-5 rounded-2xl border border-white/5">
                  <div>
                    <span className="text-xs text-text-secondary">{t('calls.drawer.audited_client')}</span>
                    <p className="font-bold text-white mt-1">{selectedCall.customerName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary">{t('calls.drawer.phone_number')}</span>
                    <p className="font-mono font-semibold text-white mt-1">{selectedCall.phoneNumber}</p>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-text-secondary">{t('calls.drawer.amount_transacted')}</span>
                    <p className="font-black text-white mt-1">${(selectedCall.amount ?? 0).toFixed(2)} USD</p>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-text-secondary">{t('calls.drawer.session_duration')}</span>
                    <p className="font-semibold text-white mt-1">{selectedCall.duration || '-'} s</p>
                  </div>
                  <div className="mt-2 col-span-2">
                    <span className="text-xs text-text-secondary">{t('calls.drawer.timestamp')}</span>
                    <p className="font-semibold text-white mt-1">{selectedCall.timestamp}</p>
                  </div>
                </div>

                {/* Reproductor de Audio Grabado o Indicador de Llamada en Vivo */}
                {selectedCall.audioUrl ? (
                  <AudioPlayer 
                    audioUrl={selectedCall.audioUrl} 
                    id={selectedCall.id} 
                    duration={selectedCall.duration}
                    clientName={selectedCall.customerName}
                    status={selectedCall.status}
                    amount={selectedCall.amount}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center space-x-3 text-text-secondary text-xs">
                      <Phone className="shrink-0 text-amber-500 animate-pulse" size={18} />
                      <div className="text-[11px] leading-relaxed">
                        <p className="font-bold text-white">{t('calls.drawer.active_call_title')}</p>
                        <p className="opacity-70 mt-0.5">{t('calls.drawer.active_call_desc')}</p>
                      </div>
                    </div>
                    <WaveformCanvas />
                  </div>
                )}

                {/* Clasificación de Auditoría y Comentarios */}
                <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <ShieldCheck size={14} className="text-indigo-400" />
                    {t('calls.drawer.audit_classification')}
                  </h4>
                  
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'fraud', label: t('calls.drawer.tag_fraud'), color: 'border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20', activeColor: 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30' },
                      { id: 'misunderstanding', label: t('calls.drawer.tag_misunderstanding'), color: 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20', activeColor: 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30' },
                      { id: 'success', label: t('calls.drawer.tag_success'), color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20', activeColor: 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30' }
                    ].map(tag => {
                      const isSelected = selectedCall.tags?.includes(tag.label) || false;
                      return (
                        <button
                          key={tag.id}
                          onClick={() => {
                            const currentTags = selectedCall.tags || [];
                            const newTags = isSelected 
                              ? currentTags.filter(t => t !== tag.label)
                              : [...currentTags, tag.label];
                            handleUpdateAudit(selectedCall.id, newTags, selectedCall.comments || '');
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 duration-200",
                            isSelected ? tag.activeColor : tag.color
                          )}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      <MessageSquare size={12} className="text-indigo-400" />
                      {t('calls.drawer.comments_title')}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={t('calls.drawer.comments_placeholder')}
                      value={selectedCall.comments || ''}
                      onChange={(e) => handleUpdateAudit(selectedCall.id, selectedCall.tags || [], e.target.value)}
                      className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-xs text-white placeholder-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none custom-scrollbar"
                    />
                  </div>
                </div>

                {/* Event Timeline (Voice flow events) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Network size={14} className="text-indigo-400" />
                    {t('calls.drawer.ivr_flow_log')}
                  </h4>
                  
                  <div className="relative border-l border-white/10 ml-2.5 pl-5 space-y-5 py-2">
                    {getCallEventsTimeline(selectedCall).map((event, idx) => (
                      <div key={idx} className="relative">
                        {/* Timeline Dot */}
                        <span className={cn(
                          "absolute -left-[26px] top-1.5 w-3 h-3 rounded-full border border-background",
                          selectedCall.status === 'completed' ? "bg-emerald-500 shadow-lg shadow-emerald-500/30" :
                          selectedCall.status === 'failed' && idx === getCallEventsTimeline(selectedCall).length - 1 ? "bg-rose-500 shadow-lg shadow-rose-500/30" :
                          "bg-indigo-500 shadow-lg shadow-indigo-500/30"
                        )}></span>
                        <p className="text-xs text-text-primary leading-relaxed">{event}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Close Button at bottom */}
              <div className="mt-6 pt-4 border-t border-white/5">
                <button 
                  onClick={() => setSelectedCall(null)}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 transition-colors font-bold text-sm text-white rounded-xl"
                >
                  {t('calls.drawer.close_audit')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-gradient tracking-tight">{t('calls.title')}</h2>
          <p className="text-text-secondary mt-2">{t('calls.subtitle')}</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/25 active:scale-95 text-xs shrink-0 self-start md:self-center"
        >
          <Download size={16} />
          <span>{t('calls.export_csv')}</span>
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 border-none shadow-xl shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">{t('calls.stats.total_processed')}</p>
              <h3 className="text-3xl font-black mt-2 text-white">{calls.length}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
              <Phone size={24} />
            </div>
          </div>
          <p className="text-[10px] text-text-secondary mt-4">{t('calls.stats.total_processed_desc')}</p>
        </Card>
        
        <Card className="bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 border-none shadow-xl shadow-emerald-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">{t('calls.stats.success_rate')}</p>
              <h3 className="text-3xl font-black mt-2 text-emerald-400">
                {calls.length > 0 ? Math.round((calls.filter(c => c.status === 'completed').length / calls.length) * 100) : 0}%
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <ArrowUpRight size={24} />
            </div>
          </div>
          <p className="text-[10px] text-text-secondary mt-4">{t('calls.stats.success_rate_desc')}</p>
        </Card>

        <Card className="bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 border-none shadow-xl shadow-amber-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">{t('calls.stats.billed_amount')}</p>
              <h3 className="text-3xl font-black mt-2 text-white">
                ${calls.reduce((acc, c) => acc + (c.status === 'completed' ? c.amount : 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-[10px] text-text-secondary mt-4">{t('calls.stats.billed_amount_desc')}</p>
        </Card>

        <Card className="bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 border-none shadow-xl shadow-teal-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">{t('calls.stats.db_security')}</p>
              <h3 className="text-xl font-black mt-3 text-teal-400">AES-256</h3>
            </div>
            <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-400 border border-teal-500/20">
              <ShieldCheck size={24} />
            </div>
          </div>
          <p className="text-[10px] text-text-secondary mt-4">{t('calls.stats.db_security_desc')}</p>
        </Card>
      </div>

      {/* Main Table & Filters Panel */}
      <Card className="overflow-hidden bg-secondary/5 border-white/5 shadow-2xl">
        
        {/* Filters Panel */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
              <input 
                type="text" 
                placeholder={t('calls.search_placeholder')} 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-secondary/40 border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Toggle Advanced Filters Button */}
              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all",
                  showAdvancedFilters 
                    ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" 
                    : "bg-secondary/40 text-text-secondary border-white/5 hover:text-white"
                )}
              >
                <Filter size={14} />
                <span>{t('calls.advanced_search')}</span>
              </button>

              {/* Status Selector Filter */}
              <div className="flex items-center space-x-1.5 bg-black/20 p-1 rounded-xl border border-white/5">
                <span className="text-[9px] font-black uppercase px-2 text-text-secondary tracking-widest">{t('calls.filters.status_label')}</span>
                {(['all', 'completed', 'failed', 'in-progress'] as const).map((status) => (
                  <button 
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                      filterStatus === status 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {status === 'all' ? t('calls.filters.all') : status === 'completed' ? t('calls.filters.completed') : status === 'failed' ? t('calls.filters.failed') : t('calls.filters.in_progress')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Filters Expandable section */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-black/20 border border-white/5 animate-slide-up">
              
              {/* Duration filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">{t('calls.filters.duration_label')}</label>
                <select 
                  value={filterDuration}
                  onChange={(e) => setFilterDuration(e.target.value as any)}
                  className="w-full bg-secondary/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">{t('calls.filters.duration_all')}</option>
                  <option value="short">{t('calls.filters.duration_short')}</option>
                  <option value="medium">{t('calls.filters.duration_medium')}</option>
                  <option value="long">{t('calls.filters.duration_long')}</option>
                </select>
              </div>

              {/* Rango de montos (Minimo) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">{t('calls.filters.min_amount')}</label>
                <input 
                  type="number"
                  placeholder="Min $0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full bg-secondary/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Rango de montos (Maximo) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">{t('calls.filters.max_amount')}</label>
                <input 
                  type="number"
                  placeholder="Max $500"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full bg-secondary/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Date Filters Placeholder */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">{t('calls.filters.date_range')}</label>
                <div className="flex gap-2">
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-1/2 bg-secondary/50 border border-white/5 rounded-xl px-2 py-1.5 text-[10px] text-white outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
                  />
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-1/2 bg-secondary/50 border border-white/5 rounded-xl px-2 py-1.5 text-[10px] text-white outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Audit Table */}
        <div className="w-full overflow-x-auto custom-scrollbar border border-white/5 rounded-2xl bg-black/10">
          <div className="min-w-[1000px]">
            {/* Table Header */}
            <div className="grid grid-cols-[120px_2fr_1.5fr_1fr_1fr_1.2fr_1.5fr_100px] gap-4 py-4 px-4 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-text-secondary items-center">
              <div>{t('calls.table.audit_id')}</div>
              <div>{t('calls.table.client')}</div>
              <div>{t('calls.table.phone')}</div>
              <div>{t('calls.table.amount')}</div>
              <div>{t('calls.table.duration')}</div>
              <div>{t('calls.table.status')}</div>
              <div>{t('calls.table.timestamp')}</div>
              <div>{t('calls.table.actions')}</div>
            </div>

            {/* Virtualized Scroll Viewport */}
            <div 
              ref={parentRef}
              className="overflow-y-auto max-h-[500px] relative custom-scrollbar"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const call = filteredCalls[virtualRow.index];
                  if (!call) return null;
                  return (
                    <div
                      key={call.id}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="grid grid-cols-[120px_2fr_1.5fr_1fr_1fr_1.2fr_1.5fr_100px] gap-4 px-4 items-center border-b border-white/5 hover:bg-indigo-500/5 transition-colors cursor-pointer group"
                      onClick={() => setSelectedCall(call)}
                    >
                      {/* Column 1: ID */}
                      <div className="font-mono text-xs font-bold text-indigo-400">
                        AUD-{call.id}
                      </div>

                      {/* Column 2: Cliente */}
                      <div className="flex items-center space-x-3 min-w-0 py-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-secondary flex items-center justify-center text-indigo-400 font-black text-xs border border-indigo-500/10 shrink-0">
                          {call.customerName.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                            {call.customerName}
                          </span>
                          {call.tags && call.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {call.tags.map((tag, idx) => (
                                <span 
                                  key={idx} 
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shadow-sm",
                                    tag === t('calls.drawer.tag_fraud') ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                    tag === t('calls.drawer.tag_misunderstanding') ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  )}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Column 3: Teléfono */}
                      <div className="text-text-secondary font-mono text-xs truncate">
                        {call.phoneNumber}
                      </div>

                      {/* Column 4: Monto */}
                      <div className={cn(
                        "font-black text-sm",
                        call.status === 'completed' ? "text-white" : "text-text-secondary"
                      )}>
                        ${(call.amount ?? 0).toFixed(2)}
                      </div>

                      {/* Column 5: Duración */}
                      <div className="flex items-center text-text-secondary text-xs">
                        <Clock size={12} className="mr-1.5 text-indigo-400 shrink-0" />
                        {call.duration}s
                      </div>

                      {/* Column 6: Estado */}
                      <div>
                        <span className={cn(
                          'px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border shadow-inner inline-block',
                          call.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          call.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        )}>
                          {call.status === 'completed' ? t('calls.status.completed').toLowerCase() : call.status === 'failed' ? t('calls.status.failed').toLowerCase() : t('calls.status.in_progress').toLowerCase()}
                        </span>
                      </div>

                      {/* Column 7: Hora */}
                      <div className="text-text-secondary text-xs font-medium truncate">
                        {call.timestamp}
                      </div>

                      {/* Column 8: Acciones */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setSelectedCall(call)}
                          className="p-2 bg-secondary/40 hover:bg-indigo-500/20 text-text-secondary hover:text-indigo-400 rounded-lg transition-colors"
                          title={t('calls.view_audit')}
                        >
                          <Info size={14} />
                        </button>
                        <a 
                          href="/ivr-flow" 
                          className="p-2 bg-secondary/40 hover:bg-indigo-500/20 text-text-secondary hover:text-indigo-400 rounded-lg transition-colors inline-block" 
                          title={t('calls.view_ivr')}
                        >
                          <Network size={14} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Empty state */}
            {filteredCalls.length === 0 && (
              <div className="text-center py-20 border-t border-white/5">
                <div className="flex flex-col items-center opacity-40">
                  <div className="p-4 bg-secondary rounded-full mb-4">
                    <Search size={32} className="text-text-secondary" />
                  </div>
                  <p className="text-sm font-bold tracking-widest uppercase">{t('calls.no_records')}</p>
                  <button 
                    onClick={handleClearFilters}
                    className="text-indigo-400 text-xs font-black uppercase mt-3 tracking-widest hover:underline"
                  >
                    {t('calls.reset_filters')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer simple showing stats */}
        {filteredCalls.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-white/5 bg-black/10">
            <span className="text-xs text-text-secondary font-semibold" dangerouslySetInnerHTML={{
              __html: t('calls.showing_count', { count: filteredCalls.length })
            }} />
          </div>
        )}
      </Card>
    </div>
  );
};
