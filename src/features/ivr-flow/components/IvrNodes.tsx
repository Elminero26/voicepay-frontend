import { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  HelpCircle, CheckCircle2, Globe, PhoneCall, ShieldCheck, 
  CreditCard, User, Headset, Activity, MessageSquare, Zap, AlertTriangle,
  Server, GitFork, Clock, Cpu, Play, VolumeX, Loader2
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { FloatingSpeechBubbles } from './FloatingSpeechBubbles';
import { useLanguage } from '../../../hooks/useLanguage';
import { ttsService } from '../../../services/ttsService';

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
  AlertTriangle,
  GitFork,
  Clock,
  Cpu
};

const NodeValidationBadge = ({ errors, t }: { errors: any[]; t: any }) => {
  if (!errors || errors.length === 0) return null;
  const hasErrors = errors.some((e: any) => e.severity === 'error');
  
  return (
    <div className="absolute -top-3 -right-3 z-50 flex items-center justify-center">
      <div className={cn(
        "p-1.5 rounded-full border shadow-lg cursor-help animate-bounce-slow hover:scale-110 transition-all duration-300",
        hasErrors 
          ? "bg-red-500 border-red-400 text-white shadow-red-500/30" 
          : "bg-amber-500 border-amber-400 text-black shadow-amber-500/30"
      )}>
        <AlertTriangle size={12} />
      </div>
      {/* Custom tooltip on hover */}
      <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 bg-[#0d0e12]/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-xl w-64 text-left pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
        <p className="text-[10px] font-black text-white uppercase tracking-wider mb-1.5 flex items-center space-x-1">
          <AlertTriangle size={10} className={hasErrors ? "text-red-400 animate-pulse" : "text-amber-400"} />
          <span>{hasErrors ? t('ivr.validation.errors_detected') : t('ivr.validation.warnings_detected')}</span>
        </p>
        <ul className="space-y-1.5">
          {errors.map((err: any, idx: number) => (
            <li key={idx} className="text-[9px] text-text-secondary leading-tight flex items-start space-x-1.5">
              <span className={cn("inline-block w-1.5 h-1.5 rounded-full mt-1 shrink-0", err.severity === 'error' ? 'bg-red-500' : 'bg-amber-500')} />
              <span>{err.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Custom IVR Node
export const IvrNode = ({ id, data, isConnectable }: any) => {
  const { t, language } = useLanguage();
  const isCompleted = data.status === 'completed';
  const isInProgress = data.status === 'in-progress';
  const isFailed = data.status === 'failed';

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      ttsService.stop();
    };
  }, []);

  const handlePlayTts = () => {
    if (isPlaying || isLoading) {
      ttsService.stop();
      return;
    }

    ttsService.play(
      data.voicePrompt,
      language,
      () => {
        if (isMounted.current) {
          setIsLoading(true);
          setIsPlaying(false);
        }
      },
      () => {
        if (isMounted.current) {
          setIsLoading(false);
          setIsPlaying(true);
        }
      },
      () => {
        if (isMounted.current) {
          setIsLoading(false);
          setIsPlaying(false);
        }
      }
    );
  };

  // Support both component imports and string keys for serializability
  const Icon = typeof data.icon === 'string' 
    ? (iconMap[data.icon] || HelpCircle) 
    : (data.icon || HelpCircle);

  const label = t(`ivr.nodes.${id}.label`, data.label) as string;
  const description = t(`ivr.nodes.${id}.description`, data.description) as string;

  const errors = data.validationErrors || [];
  const isDesigner = data.mode === 'designer';
  const hasErrors = isDesigner && errors.some((e: any) => e.severity === 'error');
  const hasWarnings = isDesigner && errors.some((e: any) => e.severity === 'warning');

  return (
    <div className={cn(
      "px-4 py-3 rounded-2xl border-2 shadow-2xl w-[240px] transition-all duration-500",
      "glass backdrop-blur-xl relative group",
      !isInProgress && !hasErrors && !hasWarnings && "overflow-hidden",
      isCompleted ? "border-green-500/40 bg-green-500/5 shadow-green-500/10" :
      isInProgress ? "border-primary/50 bg-primary/10 shadow-primary/30 animate-pulse-slow" :
      isFailed ? "border-red-500/40 bg-red-500/5 shadow-red-500/10" :
      hasErrors ? "border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10 animate-pulse-slow" :
      hasWarnings ? "border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/10" :
      "border-border/40 bg-secondary/20 opacity-60 grayscale-[0.5]"
    )}>
      <NodeValidationBadge errors={errors} t={t} />

      {isInProgress && (
        <FloatingSpeechBubbles
          nodeId={id}
          nodeLabel={label}
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
          hasErrors ? "bg-red-500/20 text-red-400" :
          hasWarnings ? "bg-amber-500/20 text-amber-400" :
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
            hasErrors ? "text-red-400" :
            hasWarnings ? "text-amber-400" :
            "text-text-secondary"
          )}>{label}</h3>
          <p className="text-[11px] text-text-secondary mt-1 leading-tight font-medium opacity-80">{description}</p>
        </div>
      </div>

      {data.action && (
        <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-text-secondary font-mono bg-black/30 rounded-lg px-2 py-1.5 relative z-10 flex items-center justify-between">
          <span>{t('ivr.dtmf_trigger').split(' (')[0]}:</span>
          <span className="text-primary font-black bg-primary/10 px-1.5 rounded">{data.action}</span>
        </div>
      )}

      {(data.voicePrompt || data.apiEndpoint) && (
        <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5 relative z-10">
          {data.voicePrompt && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayTts();
              }}
              className={cn(
                "flex items-center space-x-1 border rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider animate-in fade-in zoom-in duration-300 hover:scale-105 transition-all shadow-sm cursor-pointer",
                isLoading 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                  : isPlaying
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
              )}
              title={isPlaying ? t('ivr.tts_stop') : t('ivr.tts_play')}
            >
              {isLoading ? (
                <Loader2 size={10} className="shrink-0 animate-spin" />
              ) : isPlaying ? (
                <VolumeX size={10} className="shrink-0" />
              ) : (
                <Play size={10} className="shrink-0" />
              )}
              <span>
                {isLoading 
                  ? t('common.loading').split('...')[0] 
                  : isPlaying 
                    ? t('ivr.tts_btn_stop') 
                    : t('ivr.tts_btn_play')}
              </span>
            </button>
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
export const ServiceNode = ({ id, data }: any) => {
  const { t } = useLanguage();
  const Icon = typeof data.icon === 'string'
    ? (iconMap[data.icon] || Globe)
    : (data.icon || Globe);

  const label = t(`ivr.nodes.${id}.label`, data.label) as string;

  const errors = data.validationErrors || [];
  const isDesigner = data.mode === 'designer';
  const hasErrors = isDesigner && errors.some((e: any) => e.severity === 'error');
  const hasWarnings = isDesigner && errors.some((e: any) => e.severity === 'warning');

  return (
    <div className={cn(
      "px-5 py-4 rounded-2xl border border-white/10 shadow-2xl w-[200px] transition-all duration-300 relative group",
      "glass-dark backdrop-blur-md bg-black/40",
      hasErrors ? "border-red-500/50 shadow-red-500/10" :
      hasWarnings ? "border-amber-500/50 shadow-amber-500/10" :
      "hover:border-primary/30"
    )}>
      <NodeValidationBadge errors={errors} t={t} />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-primary !border-none" />
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-transparent text-primary group-hover:rotate-12 transition-transform">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{label}</h3>
          <p className="text-[9px] text-text-secondary font-mono mt-0.5 opacity-60">EXTERNAL_MICROSERVICE</p>
        </div>
      </div>
      
      {data.apiEndpoint && (
        <div className="mt-3 pt-2 text-[8px] text-green-400 font-mono bg-green-500/5 border border-green-500/10 rounded-lg px-2 py-1 truncate relative z-10 flex items-center justify-between">
          <span>{t('ivr.api_endpoint').split(' /')[0]}:</span>
          <span className="truncate max-w-[100px] ml-1 opacity-80" title={data.apiEndpoint}>{data.apiEndpoint}</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-primary !border-none" />
    </div>
  );
};

// Custom Conditional Node
export const ConditionalNode = ({ id, data, isConnectable }: any) => {
  const { t } = useLanguage();
  const isCompleted = data.status === 'completed';
  const isInProgress = data.status === 'in-progress';
  const isFailed = data.status === 'failed';

  const Icon = GitFork;
  const label = t(`ivr.nodes.${id}.label`, data.label) as string;
  const description = t(`ivr.nodes.${id}.description`, data.description) as string;
  const selectedPath = data.selectedPath; // 'yes' | 'no'

  const errors = data.validationErrors || [];
  const isDesigner = data.mode === 'designer';
  const hasErrors = isDesigner && errors.some((e: any) => e.severity === 'error');
  const hasWarnings = isDesigner && errors.some((e: any) => e.severity === 'warning');

  return (
    <div className={cn(
      "px-4 py-3 rounded-2xl border-2 shadow-2xl w-[240px] transition-all duration-500",
      "glass backdrop-blur-xl relative group",
      !hasErrors && !hasWarnings && "overflow-hidden",
      isCompleted ? "border-purple-500/40 bg-purple-500/5 shadow-purple-500/10" :
      isInProgress ? "border-primary/50 bg-primary/10 shadow-primary/30 animate-pulse-slow" :
      isFailed ? "border-red-500/40 bg-red-500/5 shadow-red-500/10" :
      hasErrors ? "border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10 animate-pulse-slow" :
      hasWarnings ? "border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/10" :
      "border-border/40 bg-secondary/20 opacity-60 grayscale-[0.5]"
    )}>
      <NodeValidationBadge errors={errors} t={t} />

      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-background !border-2 !border-primary !shadow-glow" isConnectable={isConnectable} />

      {isInProgress && (
        <div className="absolute -inset-1 bg-primary/20 blur-2xl rounded-full animate-pulse" />
      )}

      <div className="relative z-10 flex items-start space-x-4">
        <div className={cn(
          "p-2.5 rounded-xl shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-inner",
          isCompleted ? "bg-purple-500/20 text-purple-400" :
          isInProgress ? "bg-primary/20 text-primary" :
          isFailed ? "bg-red-500/20 text-red-400" :
          hasErrors ? "bg-red-500/20 text-red-400" :
          hasWarnings ? "bg-amber-500/20 text-amber-400" :
          "bg-secondary/50 text-text-secondary"
        )}>
          <Icon size={22} className={cn(isInProgress && "animate-bounce-slow")} />
        </div>
        <div className="flex-1">
          <h3 className={cn(
            "text-sm font-black tracking-tight",
            isCompleted ? "text-purple-400" :
            isInProgress ? "text-white" :
            isFailed ? "text-red-400" :
            hasErrors ? "text-red-400" :
            hasWarnings ? "text-amber-400" :
            "text-text-secondary"
          )}>{label}</h3>
          <p className="text-[11px] text-text-secondary mt-1 leading-tight font-medium opacity-80">{description}</p>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-black tracking-wider uppercase relative z-10 px-2">
        <span className={cn(isCompleted && selectedPath === 'yes' ? "text-green-400 font-bold" : "text-text-secondary opacity-50")}>SÍ / YES</span>
        <span className={cn(isCompleted && selectedPath === 'no' ? "text-red-400 font-bold" : "text-text-secondary opacity-50")}>NO / FALSE</span>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="yes"
        style={{ left: '25%' }}
        className={cn(
          "!w-3 !h-3 !bg-green-500 !border-2 !border-background !shadow-glow",
          isCompleted && selectedPath === 'yes' && "!bg-green-400"
        )}
        isConnectable={isConnectable} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="no"
        style={{ left: '75%' }}
        className={cn(
          "!w-3 !h-3 !bg-red-500 !border-2 !border-background !shadow-glow",
          isCompleted && selectedPath === 'no' && "!bg-red-400"
        )}
        isConnectable={isConnectable} 
      />
    </div>
  );
};

// Custom Condition Node
export const ConditionNode = ({ id, data, isConnectable }: any) => {
  const { t } = useLanguage();
  const isCompleted = data.status === 'completed';
  const isInProgress = data.status === 'in-progress';
  const isFailed = data.status === 'failed';

  const Icon = typeof data.icon === 'string' 
    ? (iconMap[data.icon] || GitFork) 
    : (data.icon || GitFork);

  const label = t(`ivr.nodes.${id}.label`, data.label) as string;
  const description = t(`ivr.nodes.${id}.description`, data.description) as string;
  const selectedPath = data.selectedPath;

  const errors = data.validationErrors || [];
  const isDesigner = data.mode === 'designer';
  const hasErrors = isDesigner && errors.some((e: any) => e.severity === 'error');
  const hasWarnings = isDesigner && errors.some((e: any) => e.severity === 'warning');

  return (
    <div className={cn(
      "px-4 py-3 rounded-2xl border-2 shadow-2xl w-[240px] transition-all duration-500",
      "glass backdrop-blur-xl relative group",
      !hasErrors && !hasWarnings && "overflow-hidden",
      isCompleted ? "border-purple-500/40 bg-purple-500/5 shadow-purple-500/10" :
      isInProgress ? "border-primary/50 bg-primary/10 shadow-primary/30 animate-pulse-slow" :
      isFailed ? "border-red-500/40 bg-red-500/5 shadow-red-500/10" :
      hasErrors ? "border-purple-500/50 bg-purple-500/5 shadow-lg shadow-purple-500/10 animate-pulse-slow" :
      hasWarnings ? "border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/10" :
      "border-border/40 bg-secondary/20 opacity-60 grayscale-[0.5]"
    )}>
      <NodeValidationBadge errors={errors} t={t} />

      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-background !border-2 !border-primary !shadow-glow" isConnectable={isConnectable} />

      {isInProgress && (
        <div className="absolute -inset-1 bg-primary/20 blur-2xl rounded-full animate-pulse" />
      )}

      <div className="relative z-10 flex items-start space-x-4">
        <div className={cn(
          "p-2.5 rounded-xl shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-inner",
          isCompleted ? "bg-purple-500/20 text-purple-400" :
          isInProgress ? "bg-primary/20 text-primary" :
          isFailed ? "bg-red-500/20 text-red-400" :
          hasErrors ? "bg-red-500/20 text-red-400" :
          hasWarnings ? "bg-amber-500/20 text-amber-400" :
          "bg-secondary/50 text-text-secondary"
        )}>
          <Icon size={22} className={cn(isInProgress && "animate-bounce-slow")} />
        </div>
        <div className="flex-1">
          <h3 className={cn(
            "text-sm font-black tracking-tight",
            isCompleted ? "text-purple-400" :
            isInProgress ? "text-white" :
            isFailed ? "text-red-400" :
            hasErrors ? "text-red-400" :
            hasWarnings ? "text-amber-400" :
            "text-text-secondary"
          )}>{label}</h3>
          <p className="text-[11px] text-text-secondary mt-1 leading-tight font-medium opacity-80">{description}</p>
        </div>
      </div>

      {data.ruleType && (
        <div className="mt-3 pt-2 border-t border-white/5 text-[9px] text-text-secondary font-mono bg-black/30 rounded-lg px-2 py-1.5 relative z-10 flex items-center justify-between">
          <span>Rule:</span>
          <span className="text-purple-400 font-bold bg-purple-500/10 px-1.5 rounded truncate max-w-[140px]">{t(`ivr.rules.${data.ruleType}`, data.ruleType) as string}</span>
        </div>
      )}

      <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-black tracking-wider uppercase relative z-10 px-2">
        <span className={cn(isCompleted && (selectedPath === 'true' || selectedPath === 'yes') ? "text-green-400 font-bold" : "text-text-secondary opacity-50")}>TRUE / SÍ</span>
        <span className={cn(isCompleted && (selectedPath === 'false' || selectedPath === 'no') ? "text-red-400 font-bold" : "text-text-secondary opacity-50")}>FALSE / NO</span>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="true"
        style={{ left: '25%' }}
        className={cn(
          "!w-3 !h-3 !bg-green-500 !border-2 !border-background !shadow-glow",
          isCompleted && (selectedPath === 'true' || selectedPath === 'yes') && "!bg-green-400"
        )}
        isConnectable={isConnectable} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="false"
        style={{ left: '75%' }}
        className={cn(
          "!w-3 !h-3 !bg-red-500 !border-2 !border-background !shadow-glow",
          isCompleted && (selectedPath === 'false' || selectedPath === 'no') && "!bg-red-400"
        )}
        isConnectable={isConnectable} 
      />
    </div>
  );
};

// Custom Time Route Node
export const TimeRouteNode = ({ id, data, isConnectable }: any) => {
  const { t } = useLanguage();
  const isCompleted = data.status === 'completed';
  const isInProgress = data.status === 'in-progress';
  const isFailed = data.status === 'failed';

  const Icon = typeof data.icon === 'string' 
    ? (iconMap[data.icon] || Clock) 
    : (data.icon || Clock);

  const label = t(`ivr.nodes.${id}.label`, data.label) as string;
  const description = t(`ivr.nodes.${id}.description`, data.description) as string;
  const selectedPath = data.selectedPath;
  const timeWindow = data.timeWindow || '09:00 - 18:00';

  const errors = data.validationErrors || [];
  const isDesigner = data.mode === 'designer';
  const hasErrors = isDesigner && errors.some((e: any) => e.severity === 'error');
  const hasWarnings = isDesigner && errors.some((e: any) => e.severity === 'warning');

  return (
    <div className={cn(
      "px-4 py-3 rounded-2xl border-2 shadow-2xl w-[240px] transition-all duration-500",
      "glass backdrop-blur-xl relative group",
      !hasErrors && !hasWarnings && "overflow-hidden",
      isCompleted ? "border-amber-500/40 bg-amber-500/5 shadow-amber-500/10" :
      isInProgress ? "border-primary/50 bg-primary/10 shadow-primary/30 animate-pulse-slow" :
      isFailed ? "border-red-500/40 bg-red-500/5 shadow-red-500/10" :
      hasErrors ? "border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/10 animate-pulse-slow" :
      hasWarnings ? "border-amber-500/55 bg-amber-500/5 shadow-lg shadow-amber-500/10" :
      "border-border/40 bg-secondary/20 opacity-60 grayscale-[0.5]"
    )}>
      <NodeValidationBadge errors={errors} t={t} />

      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-background !border-2 !border-primary !shadow-glow" isConnectable={isConnectable} />

      {isInProgress && (
        <div className="absolute -inset-1 bg-primary/20 blur-2xl rounded-full animate-pulse" />
      )}

      <div className="relative z-10 flex items-start space-x-4">
        <div className={cn(
          "p-2.5 rounded-xl shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-inner",
          isCompleted ? "bg-amber-500/20 text-amber-400" :
          isInProgress ? "bg-primary/20 text-primary" :
          isFailed ? "bg-red-500/20 text-red-400" :
          hasErrors ? "bg-red-500/20 text-red-400" :
          hasWarnings ? "bg-amber-500/20 text-amber-400" :
          "bg-secondary/50 text-text-secondary"
        )}>
          <Icon size={22} className={cn(isInProgress && "animate-bounce-slow")} />
        </div>
        <div className="flex-1">
          <h3 className={cn(
            "text-sm font-black tracking-tight",
            isCompleted ? "text-amber-400" :
            isInProgress ? "text-white" :
            isFailed ? "text-red-400" :
            hasErrors ? "text-red-400" :
            hasWarnings ? "text-amber-400" :
            "text-text-secondary"
          )}>{label}</h3>
          <p className="text-[11px] text-text-secondary mt-1 leading-tight font-medium opacity-80">{description}</p>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-white/5 text-[9px] text-text-secondary font-mono bg-black/30 rounded-lg px-2 py-1.5 relative z-10 flex items-center justify-between">
        <span>Schedule:</span>
        <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 rounded truncate max-w-[130px]">{timeWindow}</span>
      </div>

      <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-black tracking-wider uppercase relative z-10 px-2">
        <span className={cn(isCompleted && (selectedPath === 'true' || selectedPath === 'yes') ? "text-green-400 font-bold" : "text-text-secondary opacity-50")}>IN HOURS / DENTRO</span>
        <span className={cn(isCompleted && (selectedPath === 'false' || selectedPath === 'no') ? "text-red-400 font-bold" : "text-text-secondary opacity-50")}>CLOSED / FUERA</span>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="true"
        style={{ left: '25%' }}
        className={cn(
          "!w-3 !h-3 !bg-green-500 !border-2 !border-background !shadow-glow",
          isCompleted && (selectedPath === 'true' || selectedPath === 'yes') && "!bg-green-400"
        )}
        isConnectable={isConnectable} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="false"
        style={{ left: '75%' }}
        className={cn(
          "!w-3 !h-3 !bg-red-500 !border-2 !border-background !shadow-glow",
          isCompleted && (selectedPath === 'false' || selectedPath === 'no') && "!bg-red-400"
        )}
        isConnectable={isConnectable} 
      />
    </div>
  );
};

// Custom API Request Node
export const APIRequestNode = ({ id, data, isConnectable }: any) => {
  const { t } = useLanguage();
  const isCompleted = data.status === 'completed';
  const isInProgress = data.status === 'in-progress';
  const isFailed = data.status === 'failed';

  const Icon = typeof data.icon === 'string' 
    ? (iconMap[data.icon] || Cpu) 
    : (data.icon || Cpu);

  const label = t(`ivr.nodes.${id}.label`, data.label) as string;
  const description = t(`ivr.nodes.${id}.description`, data.description) as string;
  const selectedPath = data.selectedPath;
  const httpMethod = data.httpMethod || 'POST';
  const apiEndpoint = data.apiEndpoint || 'https://api.voicepay.com/v1/ivr/request';

  const errors = data.validationErrors || [];
  const isDesigner = data.mode === 'designer';
  const hasErrors = isDesigner && errors.some((e: any) => e.severity === 'error');
  const hasWarnings = isDesigner && errors.some((e: any) => e.severity === 'warning');

  return (
    <div className={cn(
      "px-4 py-3 rounded-2xl border-2 shadow-2xl w-[240px] transition-all duration-500",
      "glass backdrop-blur-xl relative group",
      !hasErrors && !hasWarnings && "overflow-hidden",
      isCompleted ? "border-teal-500/40 bg-teal-500/5 shadow-teal-500/10" :
      isInProgress ? "border-primary/50 bg-primary/10 shadow-primary/30 animate-pulse-slow" :
      isFailed ? "border-red-500/40 bg-red-500/5 shadow-red-500/10" :
      hasErrors ? "border-teal-500/50 bg-teal-500/5 shadow-lg shadow-teal-500/10 animate-pulse-slow" :
      hasWarnings ? "border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/10" :
      "border-border/40 bg-secondary/20 opacity-60 grayscale-[0.5]"
    )}>
      <NodeValidationBadge errors={errors} t={t} />

      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-background !border-2 !border-primary !shadow-glow" isConnectable={isConnectable} />

      {isInProgress && (
        <div className="absolute -inset-1 bg-primary/20 blur-2xl rounded-full animate-pulse" />
      )}

      <div className="relative z-10 flex items-start space-x-4">
        <div className={cn(
          "p-2.5 rounded-xl shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-inner",
          isCompleted ? "bg-teal-500/20 text-teal-400" :
          isInProgress ? "bg-primary/20 text-primary" :
          isFailed ? "bg-red-500/20 text-red-400" :
          hasErrors ? "bg-teal-500/20 text-teal-400" :
          hasWarnings ? "bg-amber-500/20 text-amber-400" :
          "bg-secondary/50 text-text-secondary"
        )}>
          <Icon size={22} className={cn(isInProgress && "animate-bounce-slow")} />
        </div>
        <div className="flex-1">
          <h3 className={cn(
            "text-sm font-black tracking-tight",
            isCompleted ? "text-teal-400" :
            isInProgress ? "text-white" :
            isFailed ? "text-red-400" :
            hasErrors ? "text-red-400" :
            hasWarnings ? "text-amber-400" :
            "text-text-secondary"
          )}>{label}</h3>
          <p className="text-[11px] text-text-secondary mt-1 leading-tight font-medium opacity-80">{description}</p>
        </div>
      </div>

      <div className="mt-3 pt-2 text-[8px] text-teal-400 font-mono bg-teal-500/5 border border-teal-500/10 rounded-lg px-2 py-1.5 relative z-10 flex flex-col space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-white/40">METHOD:</span>
          <span className="text-teal-400 font-bold bg-teal-500/10 px-1 rounded">{httpMethod}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/40">URL:</span>
          <span className="truncate max-w-[130px] opacity-80" title={apiEndpoint}>{apiEndpoint}</span>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-black tracking-wider uppercase relative z-10 px-2">
        <span className={cn(isCompleted && (selectedPath === 'success' || selectedPath === 'true' || selectedPath === 'yes') ? "text-green-400 font-bold" : "text-text-secondary opacity-50")}>SUCCESS / ÉXITO</span>
        <span className={cn(isCompleted && (selectedPath === 'failure' || selectedPath === 'false' || selectedPath === 'no') ? "text-red-400 font-bold" : "text-text-secondary opacity-50")}>FAILURE / FALLO</span>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="success"
        style={{ left: '25%' }}
        className={cn(
          "!w-3 !h-3 !bg-green-500 !border-2 !border-background !shadow-glow",
          isCompleted && (selectedPath === 'success' || selectedPath === 'true' || selectedPath === 'yes') && "!bg-green-400"
        )}
        isConnectable={isConnectable} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="failure"
        style={{ left: '75%' }}
        className={cn(
          "!w-3 !h-3 !bg-red-500 !border-2 !border-background !shadow-glow",
          isCompleted && (selectedPath === 'failure' || selectedPath === 'false' || selectedPath === 'no') && "!bg-red-400"
        )}
        isConnectable={isConnectable} 
      />
    </div>
  );
};

// Node type dictionary for React Flow
export const nodeTypes = {
  ivrNode: IvrNode,
  serviceNode: ServiceNode,
  conditionalNode: ConditionalNode,
  ConditionNode: ConditionNode,
  conditionNode: ConditionNode,
  TimeRouteNode: TimeRouteNode,
  timeRouteNode: TimeRouteNode,
  APIRequestNode: APIRequestNode,
  apiRequestNode: APIRequestNode,
};
