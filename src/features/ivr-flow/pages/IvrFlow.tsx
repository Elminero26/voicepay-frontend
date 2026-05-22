import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, Handle, Position, MarkerType } from '@xyflow/react';
import type { NodeChange, EdgeChange, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '../../../components/Card';
import { 
  PhoneCall, Globe, ShieldCheck, CreditCard, CheckCircle2, 
  User, HelpCircle, Headset, Zap, Activity, Play, Square, 
  RefreshCw, Sparkles 
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useLiveCalls } from '../hooks/useLiveCalls';
import type { Call } from '../../../types';

// Define the node types
const IvrNode = ({ data, isConnectable }: any) => {
  const isCompleted = data.status === 'completed';
  const isInProgress = data.status === 'in-progress';
  const isFailed = data.status === 'failed';

  const Icon = data.icon || HelpCircle;

  return (
    <div className={cn(
      "px-4 py-3 rounded-2xl border-2 shadow-2xl w-[240px] transition-all duration-500",
      "glass backdrop-blur-xl relative overflow-hidden group",
      isCompleted ? "border-green-500/40 bg-green-500/5 shadow-green-500/10" :
      isInProgress ? "border-primary/50 bg-primary/10 shadow-primary/30 animate-pulse-slow" :
      isFailed ? "border-red-500/40 bg-red-500/5 shadow-red-500/10" :
      "border-border/40 bg-secondary/20 opacity-60 grayscale-[0.5]"
    )}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-background !border-2 !border-primary !shadow-glow" isConnectable={isConnectable} />
      
      {/* Decorative background glow for active nodes */}
      {isInProgress && (
        <div className="absolute -inset-1 bg-primary/20 blur-2xl rounded-full animate-pulse" />
      )}
      
      <div className="relative z-10 flex items-start space-x-4">
        <div className={cn(
          "p-2.5 rounded-xl shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-inner",
          isCompleted ? "bg-green-500/20 text-green-400" :
          isInProgress ? "bg-primary/20 text-primary" :
          isFailed ? "bg-red-500/20 text-red-400" :
          "bg-secondary/50 text-text-secondary"
        )}>
          <Icon size={22} className={cn(isInProgress && "animate-bounce-slow")} />
        </div>
        <div className="flex-1">
          <h3 className={cn(
            "text-sm font-black tracking-tight",
            isCompleted ? "text-green-400" :
            isInProgress ? "text-white" :
            isFailed ? "text-red-400" :
            "text-text-secondary"
          )}>{data.label}</h3>
          <p className="text-[11px] text-text-secondary mt-1 leading-tight font-medium opacity-80">{data.description}</p>
        </div>
      </div>

      {data.action && (
        <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-text-secondary font-mono bg-black/30 rounded-lg px-2 py-1.5 relative z-10 flex items-center justify-between">
          <span>DTMF Input:</span>
          <span className="text-primary font-black bg-primary/10 px-1.5 rounded">{data.action}</span>
        </div>
      )}

      {isCompleted && (
        <div className="absolute top-2 right-2 text-green-500 animate-in zoom-in duration-300">
          <CheckCircle2 size={16} />
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-background !border-2 !border-primary !shadow-glow" isConnectable={isConnectable} />
    </div>
  );
};

const ServiceNode = ({ data }: any) => {
  const Icon = data.icon || Globe;
  return (
    <div className={cn(
      "px-5 py-4 rounded-2xl border border-white/10 shadow-2xl w-[200px] transition-all duration-300",
      "glass-dark backdrop-blur-md bg-black/40 group hover:border-primary/30"
    )}>
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-primary !border-none" />
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-transparent text-primary group-hover:rotate-12 transition-transform">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{data.label}</h3>
          <p className="text-[9px] text-text-secondary font-mono mt-0.5 opacity-60">EXTERNAL_MICROSERVICE</p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-primary !border-none" />
    </div>
  );
};

const nodeTypes = {
  ivrNode: IvrNode,
  serviceNode: ServiceNode,
};

const initialNodes: Node[] = [
  // User Flow
  { id: '1', type: 'ivrNode', position: { x: 250, y: 50 }, data: { label: 'Incoming Call', description: 'User dials the IVR system', status: 'pending', icon: PhoneCall } },
  { id: '2', type: 'ivrNode', position: { x: 250, y: 180 }, data: { label: 'Authentication', description: 'Identifying user by phone', status: 'pending', icon: ShieldCheck } },
  { id: '3', type: 'ivrNode', position: { x: 250, y: 310 }, data: { label: 'Payment Inquiry', description: 'Checking pending amount', status: 'pending', icon: CreditCard } },
  { id: '4', type: 'ivrNode', position: { x: 250, y: 440 }, data: { label: 'User Selection', description: 'Waiting for DTMF (1 or 2)', status: 'pending', icon: User } },
  
  // Branches
  { id: '5', type: 'ivrNode', position: { x: 50, y: 580 }, data: { label: 'Payment Status', description: 'Final transaction result', status: 'pending', icon: CheckCircle2 } },
  { id: '6', type: 'ivrNode', position: { x: 450, y: 580 }, data: { label: 'Agent Transfer', description: 'Connecting to human agent', status: 'pending', icon: Headset } },

  // External Services
  { id: 'user-service', type: 'serviceNode', position: { x: 650, y: 180 }, data: { label: 'User Service', icon: User } },
  { id: 'payment-service', type: 'serviceNode', position: { x: 650, y: 310 }, data: { label: 'Payment Service', icon: CreditCard } },
  { id: 'notification-service', type: 'serviceNode', position: { x: 650, y: 580 }, data: { label: 'Notif. Service', icon: Globe } },
  { id: 'agent-service', type: 'serviceNode', position: { x: 650, y: 700 }, data: { label: 'Human Agent', icon: Headset } }
];

const initialEdges: Edge[] = [
  // User Flow Edges
  { id: 'e1-2', source: '1', target: '2', animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
  { id: 'e2-3', source: '2', target: '3', animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
  { id: 'e3-4', source: '3', target: '4', animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
  
  // Branch Edges
  { id: 'e4-5', source: '4', target: '5', label: 'Option 1', labelStyle: { fill: '#71717a', fontSize: 10, fontWeight: 700 }, animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
  { id: 'e4-6', source: '4', target: '6', label: 'Option 2', labelStyle: { fill: '#71717a', fontSize: 10, fontWeight: 700 }, animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },

  // Communication Edges
  { id: 'comm-user', source: '2', target: 'user-service', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5,5', opacity: 0.3 } },
  { id: 'comm-pay', source: '3', target: 'payment-service', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5,5', opacity: 0.3 } },
  { id: 'comm-notif', source: '5', target: 'notification-service', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5,5', opacity: 0.3 } },
  { id: 'comm-agent', source: '6', target: 'agent-service', animated: false, style: { stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5,5', opacity: 0.3 } }
];

export const IvrFlow: React.FC = () => {
  const { liveCalls, connected } = useLiveCalls();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // 1. Persistencia: Hydrate cached active call from localStorage if it exists
  const [cachedCall, setCachedCall] = useState<Call | null>(() => {
    try {
      const saved = localStorage.getItem('voicepay_last_active_call');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // 2. Simulador: states for local simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simPath, setSimPath] = useState<'payment' | 'agent'>('payment');
  const [simulatedCall, setSimulatedCall] = useState<Call | null>(null);
  const simTimerRef = useRef<any>(null);

  // Stop/Reset simulation
  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
    setSimStep(0);
    setSimulatedCall(null);
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
  }, []);

  // Start simulation
  const startSimulation = useCallback((path: 'payment' | 'agent') => {
    stopSimulation();
    setIsSimulating(true);
    setSimPath(path);
    setSimStep(1);
  }, [stopSimulation]);

  // Handle simulation timer steps
  useEffect(() => {
    if (!isSimulating) return;

    const runStep = () => {
      setSimStep(prevStep => {
        const nextStep = prevStep + 1;
        if (nextStep > 6) {
          setIsSimulating(false);
          if (simTimerRef.current) clearInterval(simTimerRef.current);
          return prevStep;
        }
        return nextStep;
      });
    };

    simTimerRef.current = setInterval(runStep, 2500);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating]);

  // Construct simulated Call object depending on step and path
  useEffect(() => {
    if (!isSimulating || simStep === 0) return;

    const baseCall: Call = {
      id: 'sim-call-999',
      customerName: 'Carlos Prueba (Simulado)',
      phoneNumber: '+34 600 111 222',
      status: 'in-progress',
      amount: 0,
      duration: '0m 0s',
      timestamp: new Date().toLocaleTimeString(),
      callEvents: [],
      selectedOption: undefined,
    };

    const stepEventsMap: { [key: number]: string[] } = {
      1: [
        '📞 Llamada entrante desde +34 600 111 222',
        '🔄 Estableciendo handshake con el nodo IVR principal...',
        '✅ Conexión establecida de forma segura'
      ],
      2: [
        '📞 Llamada entrante desde +34 600 111 222',
        '🔄 Estableciendo handshake con el nodo IVR principal...',
        '✅ Conexión establecida de forma segura',
        '🔒 Iniciando proceso de autenticación del llamante...',
        '👤 Identificando usuario por ID de llamada (CallerID)...',
        '✅ Usuario autenticado: Carlos Prueba (Cliente VIP)'
      ],
      3: [
        '📞 Llamada entrante desde +34 600 111 222',
        '✅ Conexión establecida de forma segura',
        '👤 Usuario autenticado: Carlos Prueba (Cliente VIP)',
        '📡 Consultando servicio de facturación externa (Payment Service)...',
        '💳 Factura pendiente localizada: 150.00 € (Vencimiento: hoy)'
      ],
      4: [
        '📞 Llamada entrante desde +34 600 111 222',
        '👤 Usuario autenticado: Carlos Prueba (Cliente VIP)',
        '💳 Factura pendiente localizada: 150.00 €',
        '🔊 Reproduciendo menú principal de opciones de voz (Menú IVR)...',
        '⏳ Esperando que el usuario ingrese una opción DTMF en el teclado (1 o 2)...'
      ],
      5: [
        '📞 Llamada entrante desde +34 600 111 222',
        '👤 Usuario autenticado: Carlos Prueba (Cliente VIP)',
        '💳 Factura pendiente localizada: 150.00 €',
        '⏳ Esperando selección del usuario...',
        `⌨️ Evento DTMF detectado: Presionó tecla [${simPath === 'payment' ? '1' : '2'}]`,
        `📡 Redireccionando llamada según elección del usuario (Opción ${simPath === 'payment' ? '1' : '2'})...`
      ],
      6: simPath === 'payment' ? [
        '📞 Llamada entrante desde +34 600 111 222',
        '👤 Usuario autenticado: Carlos Prueba (Cliente VIP)',
        `⌨️ Evento DTMF detectado: Presionó tecla [1]`,
        '🔐 Iniciando pasarela de pago seguro (VoicePay Gateway)...',
        '🛡️ Encriptando transacción bancaria con AES-256...',
        '✅ Pago aprobado con éxito. ID Transacción: #VP-99881',
        '✉️ Notificación push de confirmación de pago enviada al cliente',
        '👋 Flujo finalizado con éxito. Liberando línea telefónica.'
      ] : [
        '📞 Llamada entrante desde +34 600 111 222',
        '👤 Usuario autenticado: Carlos Prueba (Cliente VIP)',
        `⌨️ Evento DTMF detectado: Presionó tecla [2]`,
        '🎧 Solicitando transferencia de llamada al pool de agentes humanos...',
        '🔄 Conectando con la cola de atención al cliente (Agent Service)...',
        '🔊 Reproduciendo música de espera en el canal telefónico...',
        '✅ Llamada transferida con éxito al Agente: Lucía Gómez (ID #112)',
        '👋 Salida exitosa del flujo automático de voz.'
      ]
    };

    const currentCall: Call = {
      ...baseCall,
      amount: simStep >= 3 ? 150.00 : 0,
      selectedOption: simStep >= 5 ? (simPath === 'payment' ? '1' : '2') : undefined,
      status: simStep === 6 ? 'completed' : 'in-progress',
      callEvents: stepEventsMap[simStep] || [],
    };

    setSimulatedCall(currentCall);
  }, [isSimulating, simStep, simPath]);

  // Clean simulation and cache in localStorage
  const resetToPending = () => {
    stopSimulation();
    localStorage.removeItem('voicepay_last_active_call');
    setCachedCall(null);
    setSelectedCallId(null);
    setNodes(initialNodes);
    setEdges(initialEdges);
  };

  // Determine the active call from WebSocket stream, simulation or cache
  const activeCall = useMemo(() => {
    if (isSimulating && simulatedCall) {
      return simulatedCall;
    }
    const current = liveCalls.find(c => c.id === selectedCallId) || liveCalls[0] || null;
    if (current) {
      localStorage.setItem('voicepay_last_active_call', JSON.stringify(current));
      return current;
    }
    return cachedCall;
  }, [isSimulating, simulatedCall, liveCalls, selectedCallId, cachedCall]);

  useEffect(() => {
    if (activeCall && !selectedCallId) {
      setSelectedCallId(activeCall.id);
    }
  }, [activeCall, selectedCallId]);

  const updateFlowFromCall = useCallback((call: Call) => {
    const status = call.status;
    const option = call.selectedOption;
    
    setNodes(prevNodes => prevNodes.map(node => {
      let newNodeStatus = 'pending';
      let action = node.data.action;
      
      // Node 1: Always completed if call exists
      if (node.id === '1') newNodeStatus = 'completed';
      
      // Node 2: Authentication (Completed if user name identified)
      if (node.id === '2') {
        if (call.customerName && call.customerName !== 'Unknown Caller') newNodeStatus = 'completed';
        else newNodeStatus = 'in-progress';
      }
      
      // Node 3: Payment Inquiry (Completed if amount > 0 or user identified)
      if (node.id === '3') {
        if (call.amount > 0) newNodeStatus = 'completed';
        else if (call.customerName && call.customerName !== 'Unknown Caller') newNodeStatus = 'in-progress';
        else newNodeStatus = 'pending';
      }
      
      // Node 4: User Selection (Active when waiting confirmation)
      if (node.id === '4') {
        if (option) {
          newNodeStatus = 'completed';
          action = option;
        } else if (call.amount > 0) {
          newNodeStatus = 'in-progress';
        }
      }

      // Branch 5: Payment (Option 1)
      if (node.id === '5') {
        if (option === '1') {
          newNodeStatus = status === 'completed' ? 'completed' : 
                         status === 'failed' ? 'failed' : 'in-progress';
        }
      }

      // Branch 6: Agent (Option 2)
      if (node.id === '6') {
        if (option === '2') {
          newNodeStatus = 'completed'; // For demo, let's say it's completed once transferred
        }
      }

      return {
        ...node,
        data: { ...node.data, status: newNodeStatus, action }
      };
    }));

    // Animate edges
    setEdges(prevEdges => prevEdges.map(edge => {
      let animated = false;
      let stroke = '#4b5563';
      
      if (edge.id === 'e1-2') { stroke = '#22c55e'; }
      if (edge.id === 'e2-3' && call.customerName && call.customerName !== 'Unknown Caller') { stroke = '#22c55e'; }
      if (edge.id === 'e3-4' && call.amount > 0) { stroke = '#22c55e'; }
      
      if (edge.id === 'e4-5' && option === '1') { 
        stroke = status === 'completed' ? '#22c55e' : status === 'failed' ? '#ef4444' : '#3b82f6';
        animated = status === 'in-progress';
      }
      if (edge.id === 'e4-6' && option === '2') { stroke = '#22c55e'; animated = true; }
      
      // Service edges
      if (edge.id === 'comm-user' && call.customerName) animated = false;
      if (edge.id === 'comm-pay' && call.amount > 0) animated = false;
      if (edge.id === 'comm-notif' && option === '1' && (status === 'completed' || status === 'failed')) {
        animated = true;
        stroke = '#3b82f6';
      }
      if (edge.id === 'comm-agent' && option === '2') {
        animated = true;
        stroke = '#3b82f6';
      }

      return { ...edge, animated, style: { ...edge.style, stroke } };
    }));
    
    setLastUpdate(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    if (activeCall) {
      updateFlowFromCall(activeCall);
    } else {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [activeCall, updateFlowFromCall]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div className="space-y-6 flex-1 flex flex-col animate-fade-in pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-4xl font-black text-gradient tracking-tighter">IVR Flow Visualizer</h2>
            {connected && !isSimulating && (
              <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live Stream</span>
              </div>
            )}
            {isSimulating && (
              <div className="flex items-center space-x-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Local Simulation</span>
              </div>
            )}
          </div>
          <p className="text-text-secondary font-medium opacity-70">Real-time decision tree and microservices communication matrix.</p>
        </div>
        
        <div className="flex items-center space-x-6">
          {liveCalls.length > 0 && !isSimulating && (
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1.5 ml-1">Active Streams</span>
              <div className="flex items-center space-x-2 glass-dark px-4 py-2 rounded-2xl border border-white/5 shadow-xl">
                <Activity size={16} className="text-primary animate-pulse" />
                <select 
                  value={selectedCallId || ''} 
                  onChange={(e) => setSelectedCallId(e.target.value)}
                  className="bg-transparent text-sm font-black text-white border-none focus:ring-0 cursor-pointer min-w-[150px]"
                >
                  {liveCalls.map(call => (
                    <option key={call.id} value={call.id} className="bg-secondary text-white">
                      {call.customerName || 'Unknown'} ({call.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black opacity-50">Heartbeat</p>
            <p className="text-sm font-mono text-primary font-bold">{lastUpdate || '--:--:--'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 space-x-8 min-h-[650px]">
        {/* Main Flow Container */}
        <Card 
          className="flex-[3] h-full p-0 overflow-hidden relative glass border-white/5 shadow-inner-glow group"
          contentClassName="h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none opacity-50" />
          
          {/* Status Legend */}
          <div className="absolute top-6 left-6 z-10 glass-dark px-5 py-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Status Matrix</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">Node: Completed</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse"></div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">Node: Processing</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"></div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">Node: Error</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary border border-white/10"></div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">Node: Idle</span>
              </div>
            </div>
          </div>

          {/* Floating Call Simulator HUD Widget */}
          <div className="absolute bottom-6 right-6 z-10 glass-dark p-5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl max-w-[320px] w-full flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles size={16} className="text-primary animate-pulse" />
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest">IVR Local Simulator</h4>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isSimulating ? "bg-amber-500 animate-pulse" : "bg-white/20"
                )} />
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">
                  {isSimulating ? `Paso ${simStep}/6` : "Standby"}
                </span>
              </div>
            </div>

            {!isSimulating ? (
              <div className="space-y-3">
                <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                  Simula flujos completos del árbol de decisiones IVR directamente en el frontend, sin dependencias del servidor.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => startSimulation('payment')}
                    className="flex items-center justify-center space-x-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 hover:border-primary/50 text-white rounded-xl py-2 px-2.5 text-[10px] font-bold transition-all"
                  >
                    <Play size={12} className="text-primary" />
                    <span>Pago Exitoso</span>
                  </button>
                  <button
                    onClick={() => startSimulation('agent')}
                    className="flex items-center justify-center space-x-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-white rounded-xl py-2 px-2.5 text-[10px] font-bold transition-all"
                  >
                    <Play size={12} className="text-white animate-pulse" />
                    <span>Transf. Agente</span>
                  </button>
                </div>
                {cachedCall && (
                  <button
                    onClick={resetToPending}
                    className="w-full flex items-center justify-center space-x-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/35 text-red-400 rounded-xl py-2 text-[10px] font-bold transition-all"
                  >
                    <RefreshCw size={12} />
                    <span>Limpiar Caché Local</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Step Description */}
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col space-y-1">
                  <span className="text-[8px] uppercase font-black tracking-widest text-primary">Simulando paso actual</span>
                  <span className="text-[11px] font-bold text-white leading-tight">
                    {simStep === 1 && "📞 Recibiendo llamada entrante..."}
                    {simStep === 2 && "🔒 Autenticando usuario mediante CallerID..."}
                    {simStep === 3 && "💳 Consultando deuda pendiente en BD..."}
                    {simStep === 4 && "🔊 Emitiendo menú de opciones IVR..."}
                    {simStep === 5 && `⌨️ Selección ingresada [Opción ${simPath === 'payment' ? '1' : '2'}]`}
                    {simStep === 6 && (simPath === 'payment' ? "✅ Transacción procesada con éxito!" : "🎧 Conectando con agente directo...")}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-black uppercase text-text-secondary font-mono tracking-wider">
                    <span>Avance</span>
                    <span>{Math.round((simStep / 6) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500" 
                      style={{ width: `${(simStep / 6) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stop Button */}
                <button
                  onClick={stopSimulation}
                  className="w-full flex items-center justify-center space-x-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-white rounded-xl py-2 text-[10px] font-bold transition-all animate-pulse"
                >
                  <Square size={12} className="fill-white" />
                  <span>Detener Simulación</span>
                </button>
              </div>
            )}
          </div>

          <div className="h-full w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              className="bg-background/20"
              defaultViewport={{ x: 0, y: 0, zoom: 1.2 }}
              minZoom={0.2}
              maxZoom={2.5}
            >
              <Background color="#ffffff22" gap={20} size={1} />
              <Controls className="!bg-secondary/80 !border-white/10 !fill-white !rounded-xl !shadow-2xl overflow-hidden backdrop-blur-md" />
            </ReactFlow>
          </div>
        </Card>

        {/* Side Panel: System Logs */}
        <Card className="flex-1 glass-dark border-white/5 p-6 flex flex-col overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Zap size={18} />
              </div>
              <h3 className="font-black text-white uppercase tracking-[0.15em] text-xs">Events Log</h3>
            </div>
            <span className="text-[9px] font-mono text-text-secondary opacity-50 uppercase">Secured v2.4</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-3 scrollbar-hide custom-scrollbar">
            {activeCall?.callEvents && activeCall.callEvents.length > 0 ? (
              activeCall.callEvents.map((event, idx) => (
                <div key={idx} className="flex space-x-4 group animate-slide-in-right" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-2 h-2 rounded-full bg-primary group-last:bg-primary group-last:animate-ping shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    <div className="w-[1px] flex-1 bg-white/5 mt-2 group-last:hidden" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-[11px] leading-relaxed text-text-secondary group-last:text-white group-last:font-bold transition-all">
                      {event}
                    </p>
                    <span className="text-[9px] font-mono text-white/20 mt-1 block">T+{idx * 2}s</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4 border border-white/5">
                  <Globe size={32} className="text-border animate-spin-slow opacity-30" />
                </div>
                <p className="text-xs text-text-secondary font-medium italic px-6 opacity-60">
                  Awaiting encrypted signals from the voice node matrix...
                </p>
              </div>
            )}
          </div>

          {activeCall && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  <ShieldCheck size={40} />
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase font-black text-primary tracking-widest">
                    {isSimulating ? "SIMULATION SESSION" : "Active session"}
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black font-mono text-green-500">
                      {isSimulating ? "SIMULATED" : "ENCRYPTED"}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-text-secondary truncate bg-black/20 p-2 rounded-lg border border-white/5">
                  {activeCall.id}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

