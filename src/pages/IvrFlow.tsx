import React, { useState, useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap, applyNodeChanges, applyEdgeChanges, Handle, Position, MarkerType } from '@xyflow/react';
import type { NodeChange, EdgeChange, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '../components/Card';
import { PhoneCall, Globe, ShieldCheck, CreditCard, CheckCircle2, User, HelpCircle, PhoneOff, RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';
import { ivrService } from '../services/api';
import type { Call } from '../types';

// Define the node types
const IvrNode = ({ data, isConnectable }: any) => {
  const isCompleted = data.status === 'completed';
  const isInProgress = data.status === 'in-progress';

  const Icon = data.icon || HelpCircle;

  return (
    <div className={cn(
      "px-4 py-3 rounded-xl border-2 shadow-lg w-[220px] transition-all duration-300",
      "glass backdrop-blur-md relative overflow-hidden",
      isCompleted ? "border-green-500/50 bg-green-500/10 shadow-green-500/20" :
      isInProgress ? "border-primary/50 bg-primary/10 shadow-primary/20 animate-pulse-slow" :
      "border-border bg-secondary/50 opacity-70"
    )}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-background !border-2 !border-primary" isConnectable={isConnectable} />
      
      {/* Decorative background glow for active nodes */}
      {isInProgress && (
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
      )}
      
      <div className="relative z-10 flex items-start space-x-3">
        <div className={cn(
          "p-2 rounded-lg shrink-0",
          isCompleted ? "bg-green-500/20 text-green-500" :
          isInProgress ? "bg-primary/20 text-primary" :
          "bg-secondary text-text-secondary"
        )}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className={cn(
            "text-sm font-bold",
            isCompleted ? "text-green-400" :
            isInProgress ? "text-primary" :
            "text-text-secondary"
          )}>{data.label}</h3>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">{data.description}</p>
        </div>
      </div>

      {data.action && (
        <div className="mt-3 pt-2 border-t border-border/50 text-xs text-text-secondary font-mono bg-background/30 rounded px-2 py-1 relative z-10">
          User input: <span className="text-white font-bold">{data.action}</span>
        </div>
      )}

      {isCompleted && (
        <div className="absolute top-2 right-2 text-green-500">
          <CheckCircle2 size={16} />
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-background !border-2 !border-primary" isConnectable={isConnectable} />
    </div>
  );
};

const nodeTypes = {
  ivrNode: IvrNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'ivrNode',
    position: { x: 250, y: 50 },
    data: { label: 'Incoming Call', description: 'User dials the IVR system', status: 'completed', icon: PhoneCall }
  },
  {
    id: '2',
    type: 'ivrNode',
    position: { x: 250, y: 200 },
    data: { label: 'Language Selection', description: 'Press 1 for EN, 2 for ES', status: 'completed', action: '2 (Spanish)', icon: Globe }
  },
  {
    id: '3',
    type: 'ivrNode',
    position: { x: 250, y: 350 },
    data: { label: 'Authentication', description: 'Enter phone & PIN', status: 'completed', action: 'Validated', icon: ShieldCheck }
  },
  {
    id: '4',
    type: 'ivrNode',
    position: { x: 250, y: 500 },
    data: { label: 'Main Menu', description: 'Select service', status: 'completed', action: '1 (Payment)', icon: User }
  },
  {
    id: '5',
    type: 'ivrNode',
    position: { x: 100, y: 650 },
    data: { label: 'Account Inquiry', description: 'Check balance', status: 'pending', icon: User }
  },
  {
    id: '6',
    type: 'ivrNode',
    position: { x: 400, y: 650 },
    data: { label: 'Make Payment', description: 'Enter amount and card', status: 'in-progress', icon: CreditCard }
  },
  {
    id: '7',
    type: 'ivrNode',
    position: { x: 400, y: 800 },
    data: { label: 'Payment Confirmation', description: 'Confirm transaction', status: 'pending', icon: CheckCircle2 }
  },
  {
    id: '8',
    type: 'ivrNode',
    position: { x: 250, y: 950 },
    data: { label: 'End Call', description: 'Thank you for calling', status: 'pending', icon: PhoneOff }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: false, style: { stroke: '#22c55e', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' } },
  { id: 'e2-3', source: '2', target: '3', animated: false, style: { stroke: '#22c55e', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' } },
  { id: 'e3-4', source: '3', target: '4', animated: false, style: { stroke: '#22c55e', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' } },
  { id: 'e4-5', source: '4', target: '5', animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
  { id: 'e4-6', source: '4', target: '6', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } },
  { id: 'e6-7', source: '6', target: '7', animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
  { id: 'e5-8', source: '5', target: '8', animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
  { id: 'e7-8', source: '7', target: '8', animated: false, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } }
];

export const IvrFlow: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLiveData = useCallback(async () => {
    setLoading(true);
    try {
      const liveCalls = await ivrService.getLiveCalls();
      if (liveCalls && liveCalls.length > 0) {
        // Por ahora tomamos la primera llamada activa para visualizar
        const call = liveCalls[0];
        setActiveCall(call);
        updateFlowFromCall(call);
      } else {
        setActiveCall(null);
        // Volvemos al estado inicial si no hay llamadas
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    } catch (error) {
      console.error('Error fetching live IVR data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFlowFromCall = (call: Call) => {
    const status = call.status; // completed, failed, in-progress
    // El backend usa estados más detallados que mapeamos aquí
    // (Nota: asumiendo que el backend nos da pistas en el status o campos extra)
    
    setNodes(prevNodes => prevNodes.map(node => {
      let newNodeStatus = 'pending';
      
      // Lógica de mapeo simplificada basada en el estado de la llamada
      if (node.id === '1') newNodeStatus = 'completed';
      if (node.id === '2') newNodeStatus = 'completed';
      if (node.id === '3') newNodeStatus = 'completed';
      if (node.id === '4') newNodeStatus = 'completed';
      
      if (status === 'in-progress') {
        if (node.id === '6') newNodeStatus = 'in-progress';
      } else if (status === 'completed') {
        if (node.id === '6' || node.id === '7' || node.id === '8') newNodeStatus = 'completed';
      } else if (status === 'failed') {
        if (node.id === '6') newNodeStatus = 'failed';
      }

      return {
        ...node,
        data: {
          ...node.data,
          status: newNodeStatus
        }
      };
    }));
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gradient">IVR Flow Visualizer</h2>
          <p className="text-text-secondary mt-1">Real-time decision tree for customer interactions.</p>
        </div>
        <button 
          onClick={() => fetchLiveData()}
          disabled={loading}
          className="p-3 bg-secondary/50 hover:bg-primary/20 rounded-xl border border-border transition-all group"
        >
          <RefreshCw size={20} className={cn("text-primary", loading && "animate-spin")} />
        </button>
      </div>

      {/* Main Flow Container */}
      <Card className="flex-1 min-h-[600px] p-0 overflow-hidden relative glass border-border">
        {/* Status Legend */}
        <div className="absolute top-4 left-4 z-10 glass px-4 py-3 rounded-xl border border-border shadow-lg">
          <h4 className="text-sm font-semibold mb-2">Node Status</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-xs text-text-secondary">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse"></div>
              <span className="text-xs text-text-secondary">In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-secondary border border-border"></div>
              <span className="text-xs text-text-secondary">Pending</span>
            </div>
          </div>
        </div>

        {/* Current Call Info */}
        <div className="absolute top-4 right-4 z-10 glass px-4 py-3 rounded-xl border border-border shadow-lg max-w-[250px]">
          <h4 className="text-sm font-semibold mb-2">Active Session</h4>
          {activeCall ? (
            <div className="space-y-2 text-xs animate-fade-in">
              <div className="flex justify-between">
                <span className="text-text-secondary">Customer:</span>
                <span className="font-medium text-white">{activeCall.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Phone:</span>
                <span className="font-medium text-white">{activeCall.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Status:</span>
                <span className={cn(
                  "font-bold uppercase tracking-tighter",
                  activeCall.status === 'completed' ? "text-green-400" : 
                  activeCall.status === 'in-progress' ? "text-primary animate-pulse" : 
                  "text-red-400"
                )}>{activeCall.status}</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-text-secondary italic">No active calls detected</p>
            </div>
          )}
        </div>

        <div className="h-[700px] w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background/50"
            defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
            minZoom={0.2}
            maxZoom={4}
          >
            <Background color="#ffffff" gap={16} />
            <Controls className="!bg-secondary !border-border !fill-white" />
            <MiniMap 
              nodeColor={(node) => {
                if (node.data?.status === 'completed') return '#22c55e';
                if (node.data?.status === 'in-progress') return '#3b82f6';
                return '#4b5563';
              }}
              maskColor="rgba(0, 0, 0, 0.7)"
              className="!bg-secondary !border-border rounded-lg overflow-hidden"
            />
          </ReactFlow>
        </div>
      </Card>
    </div>
  );
};
