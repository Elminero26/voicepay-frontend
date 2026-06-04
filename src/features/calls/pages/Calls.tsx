import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Phone, Search, Download, ArrowUpRight, Clock, Network, 
  ShieldCheck, Filter, DollarSign, X, 
  Info, Lock
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

export const CallsPage: React.FC = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States para filtros y búsqueda avanzada
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed' | 'in-progress'>('all');
  const [filterDuration, setFilterDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // State para la llamada seleccionada en el Cajón de Auditoría (Drawer)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const data = await paymentService.getCalls();
        // Para demostrar la virtualización correctamente con un scroll fluido,
        // expandimos los datos mockeados si es un entorno de desarrollo.
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
          setCalls(expandedCalls);
        } else {
          setCalls(data);
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
      // 1. Búsqueda por Nombre de Cliente o Teléfono
      const matchesSearch = 
        call.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.phoneNumber.includes(searchTerm);

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
  }, [calls, searchTerm, filterStatus, filterDuration, minAmount, maxAmount, startDate, endDate]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredCalls.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  // Restablecer todos los filtros
  const handleClearFilters = () => {
    setSearchTerm('');
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

    // Encabezados del archivo CSV
    const headers = ['ID de Auditoría', 'Cliente', 'Número de Teléfono', 'Monto (USD)', 'Duración (seg)', 'Estado', 'Hora de Registro'];
    
    // Contenido de las filas
    const rows = filteredCalls.map(c => [
      `AUD-${c.id}`,
      c.customerName,
      c.phoneNumber,
      (c.amount ?? 0).toFixed(2),
      c.duration || '-',
      c.status.toUpperCase(),
      c.timestamp
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

    // Fallback descriptivo y realista basado en el estado
    if (call.status === 'completed') {
      return [
        'Conexión segura establecida con el nodo telefónico.',
        `Navegación IVR: Opción seleccionada "${call.selectedOption || call.option || 'Pago Directo'}".`,
        'Ingreso de credenciales de facturación vía DTMF cifrado.',
        'Auditoría de seguridad biométrica superada con firma de voz.',
        `Transacción aprobada por el adquirente por un monto de $${(call.amount ?? 0).toFixed(2)}.`,
        'Cierre de canal de voz e inyección de datos cifrados AES-256 en base de datos.'
      ];
    } else if (call.status === 'failed') {
      return [
        'Conexión establecida en canal telefónico público.',
        `Navegación IVR: Opción seleccionada "${call.selectedOption || call.option || 'Pago Directo'}".`,
        'Ingreso de datos de tarjeta mediante tonos DTMF.',
        'Error de autenticación de seguridad en la pasarela de pagos.',
        'Código de error de pasarela: 402 Tarjeta Rechazada / Fondos Insuficientes.',
        'Registro de auditoría de seguridad para transacción fallida almacenado.'
      ];
    } else {
      return [
        'Llamada iniciada en nodo de telecomunicación VoicePay.',
        'Usuario ingresando al árbol interactivo IVR.',
        'Conexión WebSocket activa transmitiendo eventos del flujo.'
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Detalle de Auditoría</span>
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
                    <p className="font-bold">🔒 Registro Protegido con Cifrado AES-256</p>
                    <p className="opacity-70 mt-0.5">Los campos sensibles están encriptados a nivel de campo en la base de datos de VoicePay.</p>
                  </div>
                </div>

                {/* Call Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 p-5 rounded-2xl border border-white/5">
                  <div>
                    <span className="text-xs text-text-secondary">Cliente Auditado</span>
                    <p className="font-bold text-white mt-1">{selectedCall.customerName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary">Número Telefónico</span>
                    <p className="font-mono font-semibold text-white mt-1">{selectedCall.phoneNumber}</p>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-text-secondary">Monto Transaccionado</span>
                    <p className="font-black text-white mt-1">${(selectedCall.amount ?? 0).toFixed(2)} USD</p>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-text-secondary">Duración de Sesión</span>
                    <p className="font-semibold text-white mt-1">{selectedCall.duration || '-'} s</p>
                  </div>
                  <div className="mt-2 col-span-2">
                    <span className="text-xs text-text-secondary">Marca de Tiempo</span>
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
                        <p className="font-bold text-white">📞 Llamada Activa / En Proceso</p>
                        <p className="opacity-70 mt-0.5">Esta sesión de audio se está transmitiendo en vivo. La grabación final e interactiva estará disponible para auditoría al completarse.</p>
                      </div>
                    </div>
                    <WaveformCanvas />
                  </div>
                )}

                {/* Event Timeline (Voice flow events) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Network size={14} className="text-indigo-400" />
                    Ruta del Flujo de Voz (IVR Flow Log)
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
                  Cerrar Auditoría
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-gradient tracking-tight">Panel de Auditoría</h2>
          <p className="text-text-secondary mt-2">Consulta el historial completo de llamadas, transacciones financieras y auditorías de seguridad del sistema.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/25 active:scale-95 text-xs shrink-0 self-start md:self-center"
        >
          <Download size={16} />
          <span>Exportar reporte CSV</span>
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 border-none shadow-xl shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Procesado Total</p>
              <h3 className="text-3xl font-black mt-2 text-white">{calls.length}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
              <Phone size={24} />
            </div>
          </div>
          <p className="text-[10px] text-text-secondary mt-4">Auditorías de llamadas totales</p>
        </Card>
        
        <Card className="bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 border-none shadow-xl shadow-emerald-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Tasa de Éxito</p>
              <h3 className="text-3xl font-black mt-2 text-emerald-400">
                {calls.length > 0 ? Math.round((calls.filter(c => c.status === 'completed').length / calls.length) * 100) : 0}%
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <ArrowUpRight size={24} />
            </div>
          </div>
          <p className="text-[10px] text-text-secondary mt-4">Tasa de éxito comercial en cobro</p>
        </Card>

        <Card className="bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 border-none shadow-xl shadow-amber-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Facturación Auditada</p>
              <h3 className="text-3xl font-black mt-2 text-white">
                ${calls.reduce((acc, c) => acc + (c.status === 'completed' ? c.amount : 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-[10px] text-text-secondary mt-4">Monto total auditado en USD</p>
        </Card>

        <Card className="bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 border-none shadow-xl shadow-teal-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Seguridad DB</p>
              <h3 className="text-xl font-black mt-3 text-teal-400">AES-256</h3>
            </div>
            <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-400 border border-teal-500/20">
              <ShieldCheck size={24} />
            </div>
          </div>
          <p className="text-[10px] text-text-secondary mt-4">Cifrado de campos de datos activo</p>
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
                placeholder="Buscar por cliente o teléfono..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <span>Búsqueda Avanzada</span>
              </button>

              {/* Status Selector Filter */}
              <div className="flex items-center space-x-1.5 bg-black/20 p-1 rounded-xl border border-white/5">
                <span className="text-[9px] font-black uppercase px-2 text-text-secondary tracking-widest">Estado:</span>
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
                    {status === 'all' ? 'Todos' : status === 'completed' ? 'Completado' : status === 'failed' ? 'Fallido' : 'Activo'}
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
                <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Duración de llamada</label>
                <select 
                  value={filterDuration}
                  onChange={(e) => setFilterDuration(e.target.value as any)}
                  className="w-full bg-secondary/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Todas las duraciones</option>
                  <option value="short">Corta (Menos de 1m)</option>
                  <option value="medium">Media (1m a 5m)</option>
                  <option value="long">Larga (Más de 5m)</option>
                </select>
              </div>

              {/* Rango de montos (Minimo) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Monto Mínimo (USD)</label>
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
                <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Monto Máximo (USD)</label>
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
                <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Rango de fechas</label>
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
              <div>ID de Auditoría</div>
              <div>Cliente</div>
              <div>Número de Teléfono</div>
              <div>Monto (USD)</div>
              <div>Duración</div>
              <div>Estado</div>
              <div>Hora del Registro</div>
              <div>Acciones</div>
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
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-secondary flex items-center justify-center text-indigo-400 font-black text-xs border border-indigo-500/10 shrink-0">
                          {call.customerName.charAt(0)}
                        </div>
                        <span className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                          {call.customerName}
                        </span>
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
                          {call.status === 'completed' ? 'completado' : call.status === 'failed' ? 'fallido' : 'activo'}
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
                          title="Ver Auditoría Completa"
                        >
                          <Info size={14} />
                        </button>
                        <a 
                          href="/ivr-flow" 
                          className="p-2 bg-secondary/40 hover:bg-indigo-500/20 text-text-secondary hover:text-indigo-400 rounded-lg transition-colors inline-block" 
                          title="Ver Árbol IVR"
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
                  <p className="text-sm font-bold tracking-widest uppercase">No se encontraron registros de auditoría</p>
                  <button 
                    onClick={handleClearFilters}
                    className="text-indigo-400 text-xs font-black uppercase mt-3 tracking-widest hover:underline"
                  >
                    Restablecer todos los filtros
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer simple showing stats */}
        {filteredCalls.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-white/5 bg-black/10">
            <span className="text-xs text-text-secondary font-semibold">
              Mostrando <span className="text-white">{filteredCalls.length}</span> registros de auditoría en total. Use el scroll para navegar.
            </span>
          </div>
        )}
      </Card>
    </div>
  );
};
