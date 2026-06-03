import { Handle, Position } from '@xyflow/react';
import { 
  HelpCircle, CheckCircle2, Globe, PhoneCall, ShieldCheck, 
  CreditCard, User, Headset, Activity, MessageSquare, Zap, AlertTriangle,
  Mic, Server
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { FloatingSpeechBubbles } from './FloatingSpeechBubbles';

// Icon mapping dictionary to support serializable node data (strings instead of components)
export const iconMap: { [key: string]: any } = {
  PhoneCall,
  Globe,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  User,
  Headset,
  Activity,
  HelpCircle,
  MessageSquare,
  Zap,
  AlertTriangle
};

// Custom IVR Node
export const IvrNode = ({ id, data, isConnectable }: any) => {
  const isCompleted = data.status === 'completed';
  const isInProgress = data.status === 'in-progress';
  const isFailed = data.status === 'failed';

  // Support both component imports and string keys for serializability
  const Icon = typeof data.icon === 'string' 
    ? (iconMap[data.icon] || HelpCircle) 
    : (data.icon || HelpCircle);

  return (
    <div className={cn(
      "px-4 py-3 rounded-2xl border-2 shadow-2xl w-[240px] transition-all duration-500",
      "glass backdrop-blur-xl relative group",
      !isInProgress && "overflow-hidden",
      isCompleted ? "border-green-500/40 bg-green-500/5 shadow-green-500/10" :
      isInProgress ? "border-primary/50 bg-primary/10 shadow-primary/30 animate-pulse-slow" :
      isFailed ? "border-red-500/40 bg-red-500/5 shadow-red-500/10" :
      "border-border/40 bg-secondary/20 opacity-60 grayscale-[0.5]"
    )}>
      {isInProgress && (
        <FloatingSpeechBubbles
          nodeId={id}
          nodeLabel={data.label}
          voicePrompt={data.voicePrompt}
        />
      )}

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

      {(data.voicePrompt || data.apiEndpoint) && (
        <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5 relative z-10">
          {data.voicePrompt && (
            <div 
              className="flex items-center space-x-1 bg-primary/10 border border-primary/20 text-primary rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider animate-in fade-in zoom-in duration-300 hover:scale-105 transition-transform"
              title={data.voicePrompt}
            >
              <Mic size={10} className="shrink-0" />
              <span>Prompt</span>
            </div>
          )}
          {data.apiEndpoint && (
            <div 
              className="flex items-center space-x-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider animate-in fade-in zoom-in duration-300 hover:scale-105 transition-transform truncate max-w-[120px]"
              title={data.apiEndpoint}
            >
              <Server size={10} className="shrink-0" />
              <span className="truncate">API</span>
            </div>
          )}
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

// Custom Service Node
export const ServiceNode = ({ data }: any) => {
  const Icon = typeof data.icon === 'string'
    ? (iconMap[data.icon] || Globe)
    : (data.icon || Globe);

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
      
      {data.apiEndpoint && (
        <div className="mt-3 pt-2 text-[8px] text-green-400 font-mono bg-green-500/5 border border-green-500/10 rounded-lg px-2 py-1 truncate relative z-10 flex items-center justify-between">
          <span>ENDPOINT:</span>
          <span className="truncate max-w-[100px] ml-1 opacity-80" title={data.apiEndpoint}>{data.apiEndpoint}</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-primary !border-none" />
    </div>
  );
};

// Node type dictionary for React Flow
export const nodeTypes = {
  ivrNode: IvrNode,
  serviceNode: ServiceNode,
};
