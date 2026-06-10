import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, MarkerType, addEdge, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import type { NodeChange, EdgeChange, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { 
  Activity, Sparkles, Volume2, VolumeX
} from 'lucide-react';
import { useLiveCalls } from '../hooks/useLiveCalls';
import type { Call } from '../../../types';
import { nodeTypes, SimulatorHud, EventsLogPanel, DesignerPanel, PromptAutocompleteInput } from '../components';
import { useCallStore } from '../../../stores/useCallStore';
import { cn } from '../../../utils/cn';
import { ivrService } from '../../../services/api';
import { useLanguage } from '../../../hooks/useLanguage';
import { resolvePromptVariables } from '../utils/resolveVariables';

const initialNodes: Node[] = [
  // User Flow
  { id: '1', type: 'ivrNode', position: { x: 250, y: 50 }, data: { label: 'Incoming Call', description: 'User dials the IVR system', status: 'pending', icon: 'PhoneCall', voicePrompt: 'Bienvenido al sistema de pagos automáticos VoicePay. Por favor, espere mientras le identificamos.', apiEndpoint: 'https://api.voicepay.com/v1/ivr/welcome' } },
  { id: '2', type: 'ivrNode', position: { x: 250, y: 170 }, data: { label: 'Authentication', description: 'Identifying user by phone', status: 'pending', icon: 'ShieldCheck', voicePrompt: 'Para garantizar su seguridad, estamos verificando el número de teléfono desde el que nos llama.', apiEndpoint: 'https://api.voicepay.com/v1/users/verify' } },
  { id: 'cond-vip', type: 'conditionalNode', position: { x: 250, y: 290 }, data: { label: '¿Cliente VIP?', description: 'Validar estatus del cliente en base de datos', status: 'pending', ruleType: 'vip_customer', selectedPath: null } },
  { id: '3', type: 'ivrNode', position: { x: 50, y: 420 }, data: { label: 'Payment Inquiry', description: 'Checking pending amount', status: 'pending', icon: 'CreditCard', voicePrompt: 'Hemos detectado una factura pendiente de ciento cincuenta euros. Pulse uno para proceder con el pago seguro con tarjeta, o pulse dos si prefiere ser atendido por un agente.', apiEndpoint: 'https://api.voicepay.com/v1/payments/inquiry' } },
  { id: '4', type: 'ivrNode', position: { x: 50, y: 550 }, data: { label: 'User Selection', description: 'Waiting for DTMF (1 or 2)', status: 'pending', icon: 'User', voicePrompt: 'Esperando su selección. Marque uno para pagar, o dos para soporte.', apiEndpoint: 'https://api.voicepay.com/v1/ivr/selection' } },
  
  // Branches
  { id: '5', type: 'ivrNode', position: { x: 50, y: 680 }, data: { label: 'Payment Status', description: 'Final transaction result', status: 'pending', icon: 'CheckCircle2', voicePrompt: 'Su pago de ciento cincuenta euros ha sido procesado y aprobado correctamente. Muchas gracias por utilizar VoicePay. Hasta pronto.', apiEndpoint: 'https://api.voicepay.com/v1/payments/checkout' } },
  { id: '6', type: 'ivrNode', position: { x: 450, y: 550 }, data: { label: 'Agent Transfer', description: 'Connecting to human agent', status: 'pending', icon: 'Headset', voicePrompt: 'Estamos transfiriendo su llamada con el siguiente agente disponible. Por favor, no cuelgue.', apiEndpoint: 'https://api.voicepay.com/v1/agents/transfer' } },

  // External Services
  { id: 'user-service', type: 'serviceNode', position: { x: 650, y: 170 }, data: { label: 'User Service', icon: 'User', apiEndpoint: 'https://api.voicepay.com/v1/users' } },
  { id: 'payment-service', type: 'serviceNode', position: { x: 650, y: 420 }, data: { label: 'Payment Service', icon: 'CreditCard', apiEndpoint: 'https://api.voicepay.com/v1/payments' } },
  { id: 'notification-service', type: 'serviceNode', position: { x: 650, y: 680 }, data: { label: 'Notif. Service', icon: 'Globe', apiEndpoint: 'https://api.voicepay.com/v1/notifications' } },
  { id: 'agent-service', type: 'serviceNode', position: { x: 650, y: 780 }, data: { label: 'Human Agent', icon: 'Headset', apiEndpoint: 'https://api.voicepay.com/v1/agents' } }
];

const initialEdges: Edge[] = [
  // User Flow Edges
  { id: 'e1-2', source: '1', target: '2', animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
  { id: 'e2-cond', source: '2', target: 'cond-vip', animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
  { id: 'econd-3', source: 'cond-vip', sourceHandle: 'yes', target: '3', label: 'SÍ (VIP)', labelStyle: { fill: '#22c55e', fontSize: 9, fontWeight: 700 }, animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
  { id: 'econd-6', source: 'cond-vip', sourceHandle: 'no', target: '6', label: 'NO (Regular)', labelStyle: { fill: '#ef4444', fontSize: 9, fontWeight: 700 }, animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
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

export const IvrFlowContent: React.FC = () => {
  const { t, language } = useLanguage();
  const cachedCall = useCallStore((state) => state.cachedCall);
  const { liveCalls, connected } = useLiveCalls();
  const { screenToFlowPosition } = useReactFlow();
  
  // State for Switch Mode
  const [mode, setMode] = useState<'live' | 'designer'>('live');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Configuration Modal state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configNode, setConfigNode] = useState<Node | null>(null);
  const [tempVoicePrompt, setTempVoicePrompt] = useState('');
  const [tempApiEndpoint, setTempApiEndpoint] = useState('');
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);

  // Cancel speech synthesis on modal close or state change
  useEffect(() => {
    if (!isConfigModalOpen) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsTtsPlaying(false);
    }
  }, [isConfigModalOpen]);

  // Cancel speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayTts = useCallback(() => {
    if (!tempVoicePrompt) return;
    if (isTtsPlaying) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const resolvedPrompt = resolvePromptVariables(tempVoicePrompt, cachedCall);
    const utterance = new SpeechSynthesisUtterance(resolvedPrompt);
    
    // Set language matching UI
    const voiceLang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.lang = voiceLang;
    
    // Find matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith(voiceLang.toLowerCase()) || 
      v.lang.toLowerCase().includes(language.toLowerCase())
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    
    utterance.onend = () => {
      setIsTtsPlaying(false);
    };
    
    utterance.onerror = () => {
      setIsTtsPlaying(false);
    };

    setIsTtsPlaying(true);
    window.speechSynthesis.speak(utterance);
  }, [tempVoicePrompt, language, isTtsPlaying, cachedCall]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (mode !== 'designer') return;

      const type = event.dataTransfer?.getData('application/reactflow');
      const customDataStr = event.dataTransfer?.getData('application/reactflow-data');

      if (!type) return;

      let customData = {};
      if (customDataStr) {
        try {
          customData = JSON.parse(customDataStr);
        } catch (e) {
          console.error('Error parsing drop data:', e);
        }
      }

      const defaultLabel = type === 'ivrNode' ? t('ivr.nodes.new_ivr_step') 
                         : type === 'conditionalNode' ? t('ivr.blocks.conditional.label', 'Nodo Condicional')
                         : type === 'ConditionNode' || type === 'conditionNode' ? t('ivr.blocks.condition.label', 'Verificación de Condición')
                         : type === 'TimeRouteNode' || type === 'timeRouteNode' ? t('ivr.blocks.timeroute.label', 'Ruta por Horario')
                         : type === 'APIRequestNode' || type === 'apiRequestNode' ? t('ivr.blocks.apirequest.label', 'Petición API')
                         : t('ivr.nodes.new_service_node');
      const defaultDesc = type === 'ivrNode' ? t('ivr.nodes.configure_step_desc')
                        : type === 'conditionalNode' ? t('ivr.blocks.conditional.description', 'Evalúa reglas de negocio.')
                        : type === 'ConditionNode' || type === 'conditionNode' ? t('ivr.blocks.condition.description', 'Evalúa una expresión personalizada y bifurca en True/False.')
                        : type === 'TimeRouteNode' || type === 'timeRouteNode' ? t('ivr.blocks.timeroute.description', 'Enruta la llamada según la hora del día o día de la semana.')
                        : type === 'APIRequestNode' || type === 'apiRequestNode' ? t('ivr.blocks.apirequest.description', 'Realiza una consulta a un servicio REST y bifurca en Éxito/Fallo.')
                        : t('ivr.nodes.external_service_integration');
      const defaultIcon = type === 'ivrNode' ? 'HelpCircle' 
                        : type === 'conditionalNode' ? 'GitFork'
                        : type === 'ConditionNode' || type === 'conditionNode' ? 'GitFork'
                        : type === 'TimeRouteNode' || type === 'timeRouteNode' ? 'Clock'
                        : type === 'APIRequestNode' || type === 'apiRequestNode' ? 'Cpu'
                        : 'Globe';

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newId = `node-${Date.now()}`;
      const newNode: Node = {
        id: newId,
        type,
        position,
        data: {
          label: defaultLabel,
          description: defaultDesc,
          status: 'pending',
          icon: defaultIcon,
          ruleType: (type === 'conditionalNode' || type === 'ConditionNode' || type === 'conditionNode') ? 'business_hours' : undefined,
          timeWindow: (type === 'TimeRouteNode' || type === 'timeRouteNode') ? '09:00 - 18:00' : undefined,
          httpMethod: (type === 'APIRequestNode' || type === 'apiRequestNode') ? 'POST' : undefined,
          apiEndpoint: (type === 'APIRequestNode' || type === 'apiRequestNode') ? 'https://api.voicepay.com/v1/ivr/request' : undefined,
          selectedPath: null,
          ...customData,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newId);
      setHasChanges(true);
    },
    [screenToFlowPosition, mode, t]
  );

  // Initialize nodes and edges from localStorage if present
  const [nodes, setNodes] = useState<Node[]>(() => {
    try {
      const savedNodes = localStorage.getItem('voicepay_ivr_nodes');
      if (savedNodes) {
        return JSON.parse(savedNodes);
      }
    } catch (e) {
      console.error('Error loading custom IVR nodes:', e);
    }
    return initialNodes;
  });

  const [edges, setEdges] = useState<Edge[]>(() => {
    try {
      const savedEdges = localStorage.getItem('voicepay_ivr_edges');
      if (savedEdges) {
        return JSON.parse(savedEdges);
      }
    } catch (e) {
      console.error('Error loading custom IVR edges:', e);
    }
    return initialEdges;
  });

  const [lastUpdate, setLastUpdate] = useState<string>('');

  const {
    selectedCallId,
    setSelectedCallId,
    setCachedCall,
    isSimulating,
    simStep,
    setSimStep,
    simPath,
    simulatedCall,
    setSimulatedCall,
    startSimulation,
    stopSimulation,
    resetToPending,
    toastFn,
  } = useCallStore();

  const simTimerRef = useRef<any>(null);

  // Handle simulation timer steps
  useEffect(() => {
    if (!isSimulating) return;

    const runStep = () => {
      setSimStep((prevStep: number) => {
        const nextStep = prevStep + 1;
        if (nextStep > 6) {
          stopSimulation();
          return prevStep;
        }
        return nextStep;
      });
    };

    simTimerRef.current = setInterval(runStep, 2500);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating, stopSimulation, setSimStep]);

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
  }, [isSimulating, simStep, simPath, setSimulatedCall]);

  // Clean simulation and cache in localStorage
  const handleResetToPending = () => {
    resetToPending();
    setNodes(initialNodes);
    setEdges(initialEdges);
    localStorage.removeItem('voicepay_ivr_nodes');
    localStorage.removeItem('voicepay_ivr_edges');
    setHasChanges(false);
  };

  // Determine the active call from WebSocket stream, simulation or cache
  const activeCall = useMemo(() => {
    if (isSimulating && simulatedCall) {
      return simulatedCall;
    }
    const current = liveCalls.find(c => c.id === selectedCallId) || liveCalls[0] || null;
    if (current) {
      setCachedCall(current);
      return current;
    }
    return cachedCall;
  }, [isSimulating, simulatedCall, liveCalls, selectedCallId, cachedCall, setCachedCall]);

  useEffect(() => {
    if (activeCall && !selectedCallId) {
      setSelectedCallId(activeCall.id);
    }
  }, [activeCall, selectedCallId, setSelectedCallId]);

  const updateFlowFromCall = useCallback((call: Call) => {
    const status = call.status;
    const option = call.selectedOption;
    
    let currentNodes: any[] = [];
    setNodes(prevNodes => {
      currentNodes = prevNodes.map(node => {
        let newNodeStatus = 'pending';
        let action = node.data.action;
        let selectedPath = node.data.selectedPath;
        
        // Node 1: Always completed if call exists
        if (node.id === '1') newNodeStatus = 'completed';
        
        // Node 2: Authentication (Completed if user name identified)
        if (node.id === '2') {
          if (call.customerName && call.customerName !== 'Unknown Caller') newNodeStatus = 'completed';
          else newNodeStatus = 'in-progress';
        }

        // Conditional VIP check node
        if (node.id === 'cond-vip') {
          const isAuthCompleted = call.customerName && call.customerName !== 'Unknown Caller';
          if (isAuthCompleted) {
            newNodeStatus = 'completed';
            selectedPath = call.customerName.includes('Carlos') || call.customerName.includes('VIP') ? 'yes' : 'no';
          } else if (call.status === 'in-progress') {
            newNodeStatus = 'pending';
            selectedPath = null;
          }
        }
        
        // Node 3: Payment Inquiry (Completed if amount > 0 or user identified as VIP)
        if (node.id === '3') {
          const isVip = call.customerName && (call.customerName.includes('Carlos') || call.customerName.includes('VIP'));
          if (call.amount > 0) {
            newNodeStatus = 'completed';
          } else if (isVip) {
            newNodeStatus = 'in-progress';
          } else {
            newNodeStatus = 'pending';
          }
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

        // Branch 6: Agent (Option 2 or NOT VIP path)
        if (node.id === '6') {
          const isAuthCompleted = call.customerName && call.customerName !== 'Unknown Caller';
          const isNotVip = isAuthCompleted && !(call.customerName.includes('Carlos') || call.customerName.includes('VIP'));
          
          if (option === '2' || isNotVip) {
            newNodeStatus = 'completed';
          }
        }

        // Generic conditional node fallback (if user adds new custom ones)
        if ((node.type === 'conditionalNode' || node.type === 'ConditionNode' || node.type === 'conditionNode' || node.type === 'TimeRouteNode' || node.type === 'timeRouteNode' || node.type === 'APIRequestNode' || node.type === 'apiRequestNode') && node.id !== 'cond-vip') {
          if (call.status === 'in-progress' || call.status === 'completed') {
            newNodeStatus = 'completed';
            if (node.type === 'APIRequestNode' || node.type === 'apiRequestNode') {
              selectedPath = 'success';
            } else if (node.type === 'TimeRouteNode' || node.type === 'timeRouteNode' || node.type === 'ConditionNode' || node.type === 'conditionNode') {
              selectedPath = 'true';
            } else {
              selectedPath = 'yes';
            }
          }
        }

        return {
          ...node,
          data: { ...node.data, status: newNodeStatus, action, selectedPath }
        };
      });
      return currentNodes;
    });

    // Animate edges
    setEdges(prevEdges => prevEdges.map(edge => {
      let animated = false;
      let stroke = '#4b5563';
      let opacity: number | undefined = undefined;
      
      const isAuthCompleted = call.customerName && call.customerName !== 'Unknown Caller';
      const isVip = isAuthCompleted && (call.customerName.includes('Carlos') || call.customerName.includes('VIP'));
      
      if (edge.id === 'e1-2') { stroke = '#22c55e'; }
      if (edge.id === 'e2-cond') { 
        stroke = isAuthCompleted ? '#22c55e' : '#4b5563'; 
      }
      
      if (edge.id === 'econd-3') {
        if (isAuthCompleted) {
          if (isVip) {
            stroke = '#22c55e';
            animated = call.status === 'in-progress';
          } else {
            stroke = '#ef4444';
            opacity = 0.3;
          }
        }
      }
      
      if (edge.id === 'econd-6') {
        if (isAuthCompleted) {
          if (!isVip) {
            stroke = '#22c55e';
            animated = call.status === 'in-progress';
          } else {
            stroke = '#ef4444';
            opacity = 0.3;
          }
        }
      }
      
      if (edge.id === 'e3-4' && call.amount > 0) { stroke = '#22c55e'; }
      
      if (edge.id === 'e4-5' && option === '1') { 
        stroke = status === 'completed' ? '#22c55e' : status === 'failed' ? '#ef4444' : '#3b82f6';
        animated = status === 'in-progress';
      }
      if (edge.id === 'e4-6' && option === '2') { stroke = '#22c55e'; animated = true; }
      
      // Generic conditional node edge coloring
      const sourceNode = currentNodes.find((n: any) => n.id === edge.source);
      const isAnyConditionalNode = sourceNode && (
        sourceNode.type === 'conditionalNode' ||
        sourceNode.type === 'ConditionNode' ||
        sourceNode.type === 'conditionNode' ||
        sourceNode.type === 'TimeRouteNode' ||
        sourceNode.type === 'timeRouteNode' ||
        sourceNode.type === 'APIRequestNode' ||
        sourceNode.type === 'apiRequestNode'
      );
      if (isAnyConditionalNode && edge.id !== 'econd-3' && edge.id !== 'econd-6') {
        if (sourceNode.data.status === 'completed') {
          const isYesEdge = edge.sourceHandle === 'yes' || edge.sourceHandle === 'true' || edge.sourceHandle === 'success';
          const isNoEdge = edge.sourceHandle === 'no' || edge.sourceHandle === 'false' || edge.sourceHandle === 'failure';
          const isSelected = (isYesEdge && (sourceNode.data.selectedPath === 'yes' || sourceNode.data.selectedPath === 'true' || sourceNode.data.selectedPath === 'success')) || 
                             (isNoEdge && (sourceNode.data.selectedPath === 'no' || sourceNode.data.selectedPath === 'false' || sourceNode.data.selectedPath === 'failure'));
          
          if (isSelected) {
            stroke = '#22c55e';
            animated = call.status === 'in-progress';
          } else {
            stroke = '#ef4444';
            opacity = 0.3;
          }
        }
      }
      
      // Service edges
      if (edge.id === 'comm-user' && call.customerName) animated = false;
      if (edge.id === 'comm-pay' && call.amount > 0) animated = false;
      if (edge.id === 'comm-notif' && option === '1' && (status === 'completed' || status === 'failed')) {
        animated = true;
        stroke = '#3b82f6';
      }
      if (edge.id === 'comm-agent' && (option === '2' || !isVip)) {
        animated = true;
        stroke = '#3b82f6';
      }

      return { 
        ...edge, 
        animated, 
        style: { 
          ...edge.style, 
          stroke,
          opacity: opacity !== undefined ? opacity : edge.style?.opacity 
        } 
      };
    }));
    
    setLastUpdate(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    // Only synchronize flow updates from active call when in Live Status mode
    if (mode === 'live') {
      if (activeCall) {
        updateFlowFromCall(activeCall);
      } else {
        // Fallback to local storage if loaded, otherwise initials
        const savedNodes = localStorage.getItem('voicepay_ivr_nodes');
        if (savedNodes) {
          setNodes(JSON.parse(savedNodes));
        } else {
          setNodes(initialNodes);
        }
        
        const savedEdges = localStorage.getItem('voicepay_ivr_edges');
        if (savedEdges) {
          setEdges(JSON.parse(savedEdges));
        } else {
          setEdges(initialEdges);
        }
      }
    }
  }, [activeCall, updateFlowFromCall, mode]);

  // Load custom IVR Flow configuration from PostgreSQL backend on mount
  useEffect(() => {
    const fetchBackendFlow = async () => {
      try {
        const backendFlow = await ivrService.getFlow();
        if (backendFlow && backendFlow.nodes && backendFlow.nodes.length > 0) {
          setNodes(backendFlow.nodes);
          setEdges(backendFlow.edges || []);
          
          localStorage.setItem('voicepay_ivr_nodes', JSON.stringify(backendFlow.nodes));
          localStorage.setItem('voicepay_ivr_edges', JSON.stringify(backendFlow.edges || []));
          
          if (toastFn) {
            toastFn('Flujo Sincronizado', 'El árbol de decisiones interactivo se ha cargado con éxito desde el servidor.', 'info');
          }
        }
      } catch (error) {
        console.warn('Backend IVR flow unavailable. Operating with local storage fallback.', error);
      }
    };

    fetchBackendFlow();
  }, [toastFn]);

  // React Flow Handlers
  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      const hasRealChange = changes.some(c => c.type === 'position' || c.type === 'dimensions' || c.type === 'remove');
      if (hasRealChange) {
        setHasChanges(true);
      }
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      const hasRealChange = changes.some(c => c.type === 'remove');
      if (hasRealChange) {
        setHasChanges(true);
      }
    },
    []
  );

  const onConnect = useCallback(
    (params: any) => {
      setEdges((eds) => addEdge({
        ...params,
        animated: false,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
      }, eds));
      setHasChanges(true);
    },
    []
  );

  // Designer Action Callbacks
  const handleUpdateNode = useCallback((id: string, updatedData: any) => {
    setNodes(nds => nds.map(node => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            ...updatedData
          }
        };
      }
      return node;
    }));
    setHasChanges(true);
  }, []);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    setConfigNode(node);
    const resolvedPrompt = node.data?.voicePrompt
      ? t(`ivr.nodes.${node.id}.voicePrompt`, node.data.voicePrompt as string)
      : '';
    setTempVoicePrompt(resolvedPrompt);
    setTempApiEndpoint((node.data?.apiEndpoint as string) || '');
    setIsConfigModalOpen(true);
  }, [t, setConfigNode, setTempVoicePrompt, setTempApiEndpoint, setIsConfigModalOpen]);

  const handleSaveNodeConfig = useCallback(() => {
    if (!configNode) return;
    handleUpdateNode(configNode.id, {
      voicePrompt: tempVoicePrompt,
      apiEndpoint: tempApiEndpoint,
    });
    setIsConfigModalOpen(false);
    if (toastFn) {
      const nodeLabel = t(`ivr.nodes.${configNode.id}.label`, configNode.data?.label as string);
      toastFn(
        t('ivr.toasts.node_configured'),
        t('ivr.toasts.node_configured_desc', { label: nodeLabel }),
        'success'
      );
    }
  }, [configNode, tempVoicePrompt, tempApiEndpoint, handleUpdateNode, setIsConfigModalOpen, toastFn, t]);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes(nds => nds.filter(node => node.id !== id));
    setEdges(eds => eds.filter(edge => edge.source !== id && edge.target !== id));
    setSelectedNodeId(null);
    setHasChanges(true);
  }, []);

  const handleAddNode = useCallback((type: string, customData?: any) => {
    const newId = `node-${Date.now()}`;
    const defaultLabel = type === 'ivrNode' ? t('ivr.nodes.new_ivr_step') 
                       : type === 'conditionalNode' ? t('ivr.blocks.conditional.label', 'Nodo Condicional')
                       : type === 'ConditionNode' || type === 'conditionNode' ? t('ivr.blocks.condition.label', 'Verificación de Condición')
                       : type === 'TimeRouteNode' || type === 'timeRouteNode' ? t('ivr.blocks.timeroute.label', 'Ruta por Horario')
                       : type === 'APIRequestNode' || type === 'apiRequestNode' ? t('ivr.blocks.apirequest.label', 'Petición API')
                       : t('ivr.nodes.new_service_node');
    const defaultDesc = type === 'ivrNode' ? t('ivr.nodes.configure_step_desc')
                      : type === 'conditionalNode' ? t('ivr.blocks.conditional.description', 'Evalúa reglas de negocio.')
                      : type === 'ConditionNode' || type === 'conditionNode' ? t('ivr.blocks.condition.description', 'Evalúa una expresión personalizada y bifurca en True/False.')
                      : type === 'TimeRouteNode' || type === 'timeRouteNode' ? t('ivr.blocks.timeroute.description', 'Enruta la llamada según la hora del día o día de la semana.')
                      : type === 'APIRequestNode' || type === 'apiRequestNode' ? t('ivr.blocks.apirequest.description', 'Realiza una consulta a un servicio REST y bifurca en Éxito/Fallo.')
                      : t('ivr.nodes.external_service_integration');
    const defaultIcon = type === 'ivrNode' ? 'HelpCircle' 
                      : type === 'conditionalNode' ? 'GitFork'
                      : type === 'ConditionNode' || type === 'conditionNode' ? 'GitFork'
                      : type === 'TimeRouteNode' || type === 'timeRouteNode' ? 'Clock'
                      : type === 'APIRequestNode' || type === 'apiRequestNode' ? 'Cpu'
                      : 'Globe';
                      
    const newNode: Node = {
      id: newId,
      type,
      position: { 
        x: 150 + Math.random() * 150, 
        y: 150 + Math.random() * 150 
      },
      data: {
        label: defaultLabel,
        description: defaultDesc,
        status: 'pending',
        icon: defaultIcon,
        ruleType: (type === 'conditionalNode' || type === 'ConditionNode' || type === 'conditionNode') ? 'business_hours' : undefined,
        timeWindow: (type === 'TimeRouteNode' || type === 'timeRouteNode') ? '09:00 - 18:00' : undefined,
        httpMethod: (type === 'APIRequestNode' || type === 'apiRequestNode') ? 'POST' : undefined,
        apiEndpoint: (type === 'APIRequestNode' || type === 'apiRequestNode') ? 'https://api.voicepay.com/v1/ivr/request' : undefined,
        selectedPath: null,
        ...customData
      }
    };
    setNodes(nds => [...nds, newNode]);
    setSelectedNodeId(newId);
    setHasChanges(true);
  }, [t, setNodes, setSelectedNodeId, setHasChanges]);

  const handleSaveFlow = useCallback(async () => {
    const serializedNodes = nodes.map(node => {
      let iconName = 'HelpCircle';
      if (typeof node.data.icon === 'string') {
        iconName = node.data.icon;
      } else if (node.data.icon && (node.data.icon as any).name) {
        iconName = (node.data.icon as any).name;
      } else {
        // Fallback map based on default nodes
        if (node.id === '1') iconName = 'PhoneCall';
        else if (node.id === '2') iconName = 'ShieldCheck';
        else if (node.id === 'cond-vip') iconName = 'GitFork';
        else if (node.id === '3') iconName = 'CreditCard';
        else if (node.id === '4') iconName = 'User';
        else if (node.id === '5') iconName = 'CheckCircle2';
        else if (node.id === '6') iconName = 'Headset';
        else if (node.id === 'user-service') iconName = 'User';
        else if (node.id === 'payment-service') iconName = 'CreditCard';
        else if (node.id === 'notification-service') iconName = 'Globe';
        else if (node.id === 'agent-service') iconName = 'Headset';
        else if (node.type === 'TimeRouteNode' || node.type === 'timeRouteNode') iconName = 'Clock';
        else if (node.type === 'APIRequestNode' || node.type === 'apiRequestNode') iconName = 'Cpu';
        else if (node.type === 'ConditionNode' || node.type === 'conditionNode') iconName = 'GitFork';
      }
      return {
        ...node,
        data: {
          ...node.data,
          icon: iconName
        }
      };
    });

    try {
      localStorage.setItem('voicepay_ivr_nodes', JSON.stringify(serializedNodes));
      localStorage.setItem('voicepay_ivr_edges', JSON.stringify(edges));
      
      await ivrService.saveFlow({ nodes: serializedNodes, edges });
      setHasChanges(false);
      
      if (toastFn) {
        toastFn(t('ivr.toasts.flow_saved'), t('ivr.toasts.flow_saved_desc'), 'success');
      }
    } catch (error) {
      console.warn('Backend save failed, saved locally only:', error);
      setHasChanges(false);
      if (toastFn) {
        toastFn(t('ivr.toasts.flow_saved_local'), t('ivr.toasts.flow_saved_local_desc'), 'info');
      }
    }
  }, [nodes, edges, toastFn, t, setHasChanges]);

  const handleResetFlow = useCallback(() => {
    localStorage.removeItem('voicepay_ivr_nodes');
    localStorage.removeItem('voicepay_ivr_edges');
    setNodes(initialNodes);
    setEdges(initialEdges);
    setHasChanges(false);
    setSelectedNodeId(null);
    if (toastFn) {
      toastFn(t('ivr.toasts.flow_restored'), t('ivr.toasts.flow_restored_desc'), 'info');
    }
  }, [toastFn, t, setNodes, setEdges, setHasChanges, setSelectedNodeId]);

  const handleExportFlow = useCallback(() => {
    const serializedNodes = nodes.map(node => {
      let iconName = 'HelpCircle';
      if (typeof node.data.icon === 'string') {
        iconName = node.data.icon;
      } else if (node.data.icon && (node.data.icon as any).name) {
        iconName = (node.data.icon as any).name;
      } else {
        if (node.id === '1') iconName = 'PhoneCall';
        else if (node.id === '2') iconName = 'ShieldCheck';
        else if (node.id === 'cond-vip') iconName = 'GitFork';
        else if (node.id === '3') iconName = 'CreditCard';
        else if (node.id === '4') iconName = 'User';
        else if (node.id === '5') iconName = 'CheckCircle2';
        else if (node.id === '6') iconName = 'Headset';
        else if (node.id === 'user-service') iconName = 'User';
        else if (node.id === 'payment-service') iconName = 'CreditCard';
        else if (node.id === 'notification-service') iconName = 'Globe';
        else if (node.id === 'agent-service') iconName = 'Headset';
      }
      return {
        ...node,
        data: {
          ...node.data,
          icon: iconName
        }
      };
    });

    const flowData = { nodes: serializedNodes, edges };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flowData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `voicepay-ivr-flow-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (toastFn) {
      toastFn(t('ivr.toasts.flow_exported'), t('ivr.toasts.flow_exported_desc'), 'success');
    }
  }, [nodes, edges, toastFn, t]);

  const handleImportFlow = useCallback((importedNodes: any[], importedEdges: any[]) => {
    const normalizedNodes = importedNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        status: mode === 'designer' ? 'idle' : 'pending'
      }
    }));

    setNodes(normalizedNodes);
    setEdges(importedEdges);
    setHasChanges(true);
    setSelectedNodeId(null);

    if (toastFn) {
      toastFn(t('ivr.toasts.flow_imported'), t('ivr.toasts.flow_imported_desc'), 'success');
    }
  }, [toastFn, t, mode]);

  const handleImportError = useCallback((_errorType: string) => {
    if (toastFn) {
      toastFn(t('ivr.toasts.flow_import_error'), t('ivr.toasts.flow_import_error_desc'), 'error');
    }
  }, [toastFn, t]);

  // Memoize properties for designer selector
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Clean canvas values when toggling between editing and viewing
  const processedNodes = useMemo(() => {
    if (mode === 'designer') {
      return nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          status: 'idle',
        }
      }));
    }
    return nodes;
  }, [nodes, mode]);

  const processedEdges = useMemo(() => {
    if (mode === 'designer') {
      return edges.map(edge => ({
        ...edge,
        animated: false,
        style: {
          ...edge.style,
          stroke: '#4b5563',
        }
      }));
    }
    return edges;
  }, [edges, mode]);

  const configNodeLabel = configNode ? t(`ivr.nodes.${configNode.id}.label`, configNode.data?.label as string) : '';

  return (
    <div className="space-y-6 flex-1 flex flex-col animate-fade-in pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-4xl font-black text-gradient tracking-tighter">{t('ivr.flow_visualizer')}</h2>
            {mode === 'live' && connected && !isSimulating && (
              <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{t('ivr.live_stream')}</span>
              </div>
            )}
            {mode === 'live' && isSimulating && (
              <div className="flex items-center space-x-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{t('ivr.local_simulation')}</span>
              </div>
            )}
            {mode === 'designer' && (
              <div className="flex items-center space-x-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/45 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('ivr.designer_mode')}</span>
              </div>
            )}
          </div>
          <p className="text-text-secondary font-medium opacity-70">
            {mode === 'designer' 
              ? t('ivr.designer_desc') 
              : t('ivr.live_desc')}
          </p>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Segmented Mode Switch */}
          <div className="flex bg-secondary/40 p-1.5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md">
            <button
              onClick={() => {
                setMode('live');
                setSelectedNodeId(null);
              }}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300",
                mode === 'live' 
                  ? "bg-primary text-white shadow-lg shadow-primary/30" 
                  : "text-text-secondary hover:text-white"
              )}
            >
              <Activity size={14} className={mode === 'live' ? 'animate-pulse' : ''} />
              <span>{t('ivr.live_status')}</span>
            </button>
            <button
              onClick={() => {
                setMode('designer');
                if (isSimulating) stopSimulation();
              }}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300",
                mode === 'designer' 
                  ? "bg-primary text-white shadow-lg shadow-primary/30" 
                  : "text-text-secondary hover:text-white"
              )}
            >
              <Sparkles size={14} />
              <span>{t('ivr.interactive_designer')}</span>
            </button>
          </div>

          {mode === 'live' && liveCalls.length > 0 && !isSimulating && (
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1.5 ml-1">{t('ivr.active_streams')}</span>
              <div className="flex items-center space-x-2 glass-dark px-4 py-2 rounded-2xl border border-white/5 shadow-xl">
                <Activity size={16} className="text-primary animate-pulse" />
                <select 
                  value={selectedCallId || ''} 
                  onChange={(e) => setSelectedCallId(e.target.value)}
                  className="bg-transparent text-sm font-black text-white border-none focus:ring-0 cursor-pointer min-w-[150px]"
                >
                  {liveCalls.map(call => (
                    <option key={call.id} value={call.id} className="bg-secondary text-white">
                      {call.customerName || t('dashboard.table.unknown')} ({call.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {mode === 'live' && (
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black opacity-50">{t('ivr.heartbeat')}</p>
              <p className="text-sm font-mono text-primary font-bold">{lastUpdate || '--:--:--'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 space-x-8 min-h-[650px]">
        {/* Main Flow Container */}
        <Card 
          className="flex-[3] h-full p-0 overflow-hidden relative glass border-white/5 shadow-inner-glow group"
          contentClassName="h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none opacity-50" />
          
          {/* Status Legend - only in live mode */}
          {mode === 'live' && (
            <div className="absolute top-6 left-6 z-10 glass-dark px-5 py-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl animate-fade-in">
              <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-4 border-b border-white/5 pb-2">{t('ivr.status_matrix')}</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">{t('ivr.node_completed')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse"></div>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">{t('ivr.node_processing')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"></div>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">{t('ivr.node_error')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary border border-white/10"></div>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">{t('ivr.node_idle')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Designer Mode Indicator Badge */}
          {mode === 'designer' && (
            <div className="absolute top-6 left-6 z-10 glass-dark px-4 py-2.5 rounded-2xl border border-primary/20 shadow-2xl backdrop-blur-xl flex items-center space-x-2 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('ivr.designer_canvas')}</span>
            </div>
          )}

          {/* Floating Call Simulator HUD Widget - hide in designer mode */}
          {mode === 'live' && (
            <SimulatorHud
              isSimulating={isSimulating}
              simStep={simStep}
              simPath={simPath}
              startSimulation={startSimulation}
              stopSimulation={stopSimulation}
              resetToPending={handleResetToPending}
              cachedCall={cachedCall}
            />
          )}

          <div className="h-full w-full">
            <ReactFlow
              nodes={processedNodes}
              edges={processedEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => {
                if (mode === 'designer') {
                  setSelectedNodeId(node.id);
                }
              }}
              onNodeDoubleClick={onNodeDoubleClick}
              onPaneClick={() => setSelectedNodeId(null)}
              onDragOver={onDragOver}
              onDrop={onDrop}
              nodeTypes={nodeTypes}
              fitView
              className="bg-background/20"
              defaultViewport={{ x: 0, y: 0, zoom: 1.2 }}
              minZoom={0.2}
              maxZoom={2.5}
              nodesConnectable={mode === 'designer'}
              nodesDraggable={mode === 'designer'}
              elementsSelectable={mode === 'designer'}
            >
              <Background color="#ffffff22" gap={20} size={1} />
              <Controls className="!bg-secondary/80 !border-white/10 !fill-white !rounded-xl !shadow-2xl overflow-hidden backdrop-blur-md" />
            </ReactFlow>
          </div>
        </Card>

        {/* Side Panel: System Logs or Designer Toolbox */}
        {mode === 'designer' ? (
          <DesignerPanel
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onAddNode={handleAddNode}
            onSave={handleSaveFlow}
            onReset={handleResetFlow}
            onExport={handleExportFlow}
            onImport={handleImportFlow}
            onImportError={handleImportError}
            hasChanges={hasChanges}
          />
        ) : (
          <EventsLogPanel
            activeCall={activeCall}
            isSimulating={isSimulating}
          />
        )}
      </div>

      {/* Modal de Configuración de Nodo */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title={t('ivr.config_modal_title', { label: configNodeLabel })}
        className="max-w-lg bg-[#0d0e12]/95 border border-white/10 backdrop-blur-xl"
      >
        <div className="space-y-6">
          <div className="flex items-center space-x-3 bg-primary/5 p-3 rounded-2xl border border-primary/20">
            <div className="p-2 bg-primary/20 rounded-xl text-primary shrink-0">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-primary tracking-wider">{t('ivr.advanced_config')}</p>
              <p className="text-[10px] text-text-secondary leading-tight opacity-80">
                {t('ivr.advanced_config_desc')}
              </p>
            </div>
          </div>

          {/* Voice Prompt Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                {t('ivr.tts_label')}
              </label>
              
              {/* TTS Preview Button & Waveform Animation */}
              {tempVoicePrompt && (
                <div className="flex items-center space-x-2">
                  {isTtsPlaying && (
                    <div className="flex items-end space-x-0.5 h-2.5 px-1">
                      <span className="w-[2px] h-full bg-primary origin-bottom animate-wave-bar-1 rounded-full"></span>
                      <span className="w-[2px] h-full bg-primary origin-bottom animate-wave-bar-2 rounded-full"></span>
                      <span className="w-[2px] h-full bg-primary origin-bottom animate-wave-bar-3 rounded-full"></span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handlePlayTts}
                    className={cn(
                      "flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border shadow-sm",
                      isTtsPlaying
                        ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                        : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                    )}
                    title={isTtsPlaying ? t('ivr.tts_stop') : t('ivr.tts_play')}
                  >
                    {isTtsPlaying ? <VolumeX size={10} /> : <Volume2 size={10} />}
                    <span>{isTtsPlaying ? t('ivr.tts_btn_stop') : t('ivr.tts_btn_play')}</span>
                  </button>
                </div>
              )}
            </div>
            
            <PromptAutocompleteInput
              value={tempVoicePrompt}
              onChange={setTempVoicePrompt}
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none custom-scrollbar"
              placeholder={t('ivr.prompt_placeholder')}
            />
            <span className="text-[9px] text-text-secondary opacity-60 leading-tight block">
              {t('ivr.tts_hint')}
            </span>
          </div>

          {/* API Endpoint Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
              {t('ivr.api_url_label')}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-[9px] font-mono font-black text-primary uppercase tracking-widest bg-primary/15 px-1.5 py-0.5 rounded pointer-events-none">
                URL
              </span>
              <input
                type="text"
                value={tempApiEndpoint}
                onChange={(e) => setTempApiEndpoint(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-4 py-3 text-xs font-mono font-medium text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="https://api.voicepay.com/v1/services/auth"
              />
            </div>
            <span className="text-[9px] text-text-secondary opacity-60 leading-tight block">
              {t('ivr.api_url_hint')}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(false)}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-text-secondary hover:text-white rounded-xl py-3 text-xs font-bold transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSaveNodeConfig}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl py-3 text-xs font-bold shadow-lg shadow-primary/30 transition-all cursor-pointer"
            >
              {t('ivr.save_configuration')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const IvrFlow: React.FC = () => {
  return (
    <ReactFlowProvider>
      <IvrFlowContent />
    </ReactFlowProvider>
  );
};
