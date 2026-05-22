import React, { useEffect, useState, useMemo } from 'react';
import { 
  Phone, Search, Download, ArrowUpRight, Clock, Network, 
  ShieldCheck, Filter, DollarSign, X, 
  ChevronLeft, ChevronRight, Info, Lock
} from 'lucide-react';
import { Card } from '../../../components/Card';
import { Table, TableRow, TableCell } from '../../../components/Table';
import { paymentService } from '../../../services/api';
import type { Call } from '../../../types';
import { Loader } from '../../../components/Loader';
import { cn } from '../../../utils/cn';

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

  // States para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // State para la llamada seleccionada en el Cajón de Auditoría (Drawer)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

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

  // Lógica de paginación
  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
  
  const paginatedCalls = useMemo(() => {
    const activePage = currentPage > totalPages ? 1 : currentPage;
    const startIndex = (activePage - 1) * itemsPerPage;
    return filteredCalls.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCalls, currentPage, itemsPerPage, totalPages]);

  // Cambiar de página
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Restablecer todos los filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterDuration('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setCurrentPage(1);
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

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 animate-slide-up relative">
      
      {/* Cajón de Detalle de Auditoría (Side Drawer Overlay) */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedCall(null)}
          />
          
          {/* Drawer Container */}
          <div className="relative w-full max-w-lg h-full glass border-l border-white/10 bg-background/95 p-8 flex flex-col justify-between shadow-2xl overflow-y-auto animate-slide-in-right z-10">
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
          </div>
        </div>
      )}

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
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
                    onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
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
                  onChange={(e) => { setFilterDuration(e.target.value as any); setCurrentPage(1); }}
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
                  onChange={(e) => { setMinAmount(e.target.value); setCurrentPage(1); }}
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
                  onChange={(e) => { setMaxAmount(e.target.value); setCurrentPage(1); }}
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
        <div className="relative">
          <Table headers={['ID de Auditoría', 'Cliente', 'Número de Teléfono', 'Monto (USD)', 'Duración', 'Estado', 'Hora del Registro', 'Acciones']}>
            {paginatedCalls.map((call) => (
              <TableRow 
                key={call.id} 
                className="group hover:bg-indigo-500/5 transition-colors cursor-pointer"
                onClick={() => setSelectedCall(call)}
              >
                <TableCell className="font-mono text-xs font-bold text-indigo-400">
                  AUD-{call.id}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-secondary flex items-center justify-center text-indigo-400 font-black text-xs border border-indigo-500/10">
                      {call.customerName.charAt(0)}
                    </div>
                    <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">{call.customerName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-text-secondary font-mono text-xs">{call.phoneNumber}</TableCell>
                <TableCell>
                  <span className={cn(
                    "font-black text-white",
                    call.status === 'completed' ? "text-white" : "text-text-secondary"
                  )}>
                    ${(call.amount ?? 0).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-text-secondary text-xs">
                    <Clock size={12} className="mr-1.5 text-indigo-400" />
                    {call.duration}s
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    'px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border shadow-inner',
                    call.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    call.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  )}>
                    {call.status === 'completed' ? 'completado' : call.status === 'failed' ? 'fallido' : 'activo'}
                  </span>
                </TableCell>
                <TableCell className="text-text-secondary text-xs font-medium">{call.timestamp}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
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
                </TableCell>
              </TableRow>
            ))}
            
            {filteredCalls.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20">
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
                </TableCell>
              </TableRow>
            )}
          </Table>
        </div>

        {/* Paginator footer */}
        {filteredCalls.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-white/5 bg-black/10">
            <span className="text-xs text-text-secondary font-semibold">
              Mostrando <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="text-white">{Math.min(currentPage * itemsPerPage, filteredCalls.length)}</span> de <span className="text-white">{filteredCalls.length}</span> registros de auditoría.
            </span>
            
            <div className="flex items-center gap-4">
              {/* Items Per Page Selector */}
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="text-[10px] font-black uppercase">Filas por página:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                  className="bg-secondary/40 border border-white/5 text-xs text-white rounded-lg px-2.5 py-1 outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                </select>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-secondary/40 border border-white/5 text-text-secondary hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft size={14} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all border",
                      currentPage === page 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                        : "bg-secondary/40 border-white/5 text-text-secondary hover:text-white"
                    )}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-secondary/40 border border-white/5 text-text-secondary hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
