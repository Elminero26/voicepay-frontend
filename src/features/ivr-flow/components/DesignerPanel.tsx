import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../../components/Card';
import { 
  Sliders, Trash2, Save, RotateCcw, Info,
  PhoneCall, Globe, ShieldCheck, CreditCard, CheckCircle2, 
  User, Headset, MessageSquare, Zap, AlertTriangle, GripVertical, GitFork,
  Volume2, VolumeX, Upload, Download, Clock, Cpu, Loader2
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useLanguage } from '../../../hooks/useLanguage';
import { PromptAutocompleteInput } from './PromptAutocompleteInput';
import { ttsService } from '../../../services/ttsService';

interface DesignerPanelProps {
  selectedNode: any | null;
  onUpdateNode: (id: string, updatedData: any) => void;
  onDeleteNode: (id: string) => void;
  onAddNode: (type: string, customData?: any) => void;
  onSave: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (nodes: any[], edges: any[]) => void;
  onImportError: (errorMsg: string) => void;
  hasChanges: boolean;
}

const isValidFlow = (json: any): boolean => {
  if (!json || typeof json !== 'object') return false;
  if (!('nodes' in json) || !('edges' in json)) return false;
  if (!Array.isArray(json.nodes) || !Array.isArray(json.edges)) return false;
  
  for (const node of json.nodes) {
    if (!node || typeof node !== 'object') return false;
    if (typeof node.id !== 'string' || !node.id.trim()) return false;
    if (typeof node.type !== 'string' || !node.type.trim()) return false;
    if (!node.position || typeof node.position !== 'object') return false;
    if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') return false;
    if (!node.data || typeof node.data !== 'object') return false;
    if (typeof node.data.label !== 'string') return false;
  }

  for (const edge of json.edges) {
    if (!edge || typeof edge !== 'object') return false;
    if (typeof edge.id !== 'string' || !edge.id.trim()) return false;
    if (typeof edge.source !== 'string' || !edge.source.trim()) return false;
    if (typeof edge.target !== 'string' || !edge.target.trim()) return false;
  }

  return true;
};

export const DesignerPanel: React.FC<DesignerPanelProps> = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onAddNode,
  onSave,
  onReset,
  onExport,
  onImport,
  onImportError,
  hasChanges,
}) => {
  const { t, language } = useLanguage();
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('HelpCircle');
  const [action, setAction] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          onImportError('read_error');
          return;
        }
        const json = JSON.parse(result);
        if (isValidFlow(json)) {
          onImport(json.nodes, json.edges);
        } else {
          onImportError('invalid_format');
        }
      } catch (err) {
        console.error('Error parsing JSON:', err);
        onImportError('parse_error');
      } finally {
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      onImportError('read_error');
      e.target.value = '';
    };
    reader.readAsText(file);
  };
  const [voicePrompt, setVoicePrompt] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [ruleType, setRuleType] = useState('business_hours');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [timeWindow, setTimeWindow] = useState('09:00 - 18:00');
  const [httpMethod, setHttpMethod] = useState('POST');

  const availableBlocks = [
    {
      type: 'ivrNode' as string,
      label: t('ivr.blocks.welcome.label'),
      description: t('ivr.blocks.welcome.description'),
      icon: 'PhoneCall',
      lucideIcon: PhoneCall,
      accentClass: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/10 shadow-indigo-500/5 hover:shadow-indigo-500/10',
      iconBgClass: 'bg-indigo-500/15 text-indigo-400',
    },
    {
      type: 'ivrNode' as string,
      label: t('ivr.blocks.payment.label'),
      description: t('ivr.blocks.payment.description'),
      icon: 'CreditCard',
      lucideIcon: CreditCard,
      accentClass: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 shadow-emerald-500/5 hover:shadow-emerald-500/10',
      iconBgClass: 'bg-emerald-500/15 text-emerald-400',
    },
    {
      type: 'ivrNode' as string,
      label: t('ivr.blocks.agent.label'),
      description: t('ivr.blocks.agent.description'),
      icon: 'Headset',
      lucideIcon: Headset,
      accentClass: 'border-amber-500/20 bg-amber-500/5 text-amber-400 group-hover:border-amber-500/40 group-hover:bg-amber-500/10 shadow-amber-500/5 hover:shadow-amber-500/10',
      iconBgClass: 'bg-amber-500/15 text-amber-400',
    },
    {
      type: 'serviceNode' as string,
      label: t('ivr.blocks.service.label'),
      description: t('ivr.blocks.service.description'),
      icon: 'Globe',
      lucideIcon: Globe,
      accentClass: 'border-teal-500/20 bg-teal-500/5 text-teal-400 group-hover:border-teal-500/40 group-hover:bg-teal-500/10 shadow-teal-500/5 hover:shadow-teal-500/10',
      iconBgClass: 'bg-teal-500/15 text-teal-400',
    },
    {
      type: 'ConditionNode' as string,
      label: t('ivr.blocks.condition.label'),
      description: t('ivr.blocks.condition.description'),
      icon: 'GitFork',
      lucideIcon: GitFork,
      accentClass: 'border-purple-500/20 bg-purple-500/5 text-purple-400 group-hover:border-purple-500/40 group-hover:bg-purple-500/10 shadow-purple-500/5 hover:shadow-purple-500/10',
      iconBgClass: 'bg-purple-500/15 text-purple-400',
    },
    {
      type: 'TimeRouteNode' as string,
      label: t('ivr.blocks.timeroute.label'),
      description: t('ivr.blocks.timeroute.description'),
      icon: 'Clock',
      lucideIcon: Clock,
      accentClass: 'border-amber-500/20 bg-amber-500/5 text-amber-400 group-hover:border-amber-500/40 group-hover:bg-amber-500/10 shadow-amber-500/5 hover:shadow-amber-500/10',
      iconBgClass: 'bg-amber-500/15 text-amber-400',
    },
    {
      type: 'APIRequestNode' as string,
      label: t('ivr.blocks.apirequest.label'),
      description: t('ivr.blocks.apirequest.description'),
      icon: 'Cpu',
      lucideIcon: Cpu,
      accentClass: 'border-teal-500/20 bg-teal-500/5 text-teal-400 group-hover:border-teal-500/40 group-hover:bg-teal-500/10 shadow-teal-500/5 hover:shadow-teal-500/10',
      iconBgClass: 'bg-teal-500/15 text-teal-400',
    }
  ];

  const onDragStart = (event: React.DragEvent, nodeType: string, blockData: any) => {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/reactflow', nodeType);
      event.dataTransfer.setData('application/reactflow-data', JSON.stringify(blockData));
      event.dataTransfer.effectAllowed = 'move';
    }
  };

  // Cancel speech synthesis on unmount
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, []);

  // Cancel speech synthesis when selectedNode changes
  useEffect(() => {
    ttsService.stop();
  }, [selectedNode?.id]);

  const handlePlayTts = () => {
    if (!voicePrompt) return;
    if (isPlaying || isTtsLoading) {
      ttsService.stop();
      return;
    }

    ttsService.play(
      voicePrompt,
      language,
      () => {
        setIsTtsLoading(true);
        setIsPlaying(false);
      },
      () => {
        setIsTtsLoading(false);
        setIsPlaying(true);
      },
      () => {
        setIsTtsLoading(false);
        setIsPlaying(false);
      }
    );
  };

  // Sync state with selected node
  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setDescription(selectedNode.data.description || '');
      // If icon is a component (initial state) or string, handle gracefully
      const iconKey = typeof selectedNode.data.icon === 'string' 
        ? selectedNode.data.icon 
        : (selectedNode.data.icon?.name || 'HelpCircle');
      setIcon(iconKey);
      setAction(selectedNode.data.action || '');
      setVoicePrompt(selectedNode.data.voicePrompt || '');
      setApiEndpoint(selectedNode.data.apiEndpoint || '');
      setRuleType(selectedNode.data.ruleType || 'business_hours');
      setTimeWindow(selectedNode.data.timeWindow || '09:00 - 18:00');
      setHttpMethod(selectedNode.data.httpMethod || 'POST');
    }
  }, [selectedNode]);

  // Handle updates
  const handleFieldChange = (field: string, value: any) => {
    if (!selectedNode) return;
    
    if (field === 'label') setLabel(value);
    if (field === 'description') setDescription(value);
    if (field === 'icon') setIcon(value);
    if (field === 'action') setAction(value);
    if (field === 'voicePrompt') setVoicePrompt(value);
    if (field === 'apiEndpoint') setApiEndpoint(value);
    if (field === 'ruleType') setRuleType(value);
    if (field === 'timeWindow') setTimeWindow(value);
    if (field === 'httpMethod') setHttpMethod(value);

    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      [field]: value,
    });
  };

  const designerIcons = [
    { name: 'PhoneCall', icon: PhoneCall, label: 'Call' },
    { name: 'ShieldCheck', icon: ShieldCheck, label: 'Auth' },
    { name: 'CreditCard', icon: CreditCard, label: 'Pay' },
    { name: 'User', icon: User, label: 'User' },
    { name: 'Headset', icon: Headset, label: 'Agent' },
    { name: 'Globe', icon: Globe, label: 'Service' },
    { name: 'MessageSquare', icon: MessageSquare, label: 'Message' },
    { name: 'Zap', icon: Zap, label: 'Trigger' },
    { name: 'AlertTriangle', icon: AlertTriangle, label: 'Alert' },
    { name: 'CheckCircle2', icon: CheckCircle2, label: 'Success' },
    { name: 'GitFork', icon: GitFork, label: 'Condition' },
  ];

  return (
    <Card className="flex-1 glass-dark border-white/5 p-6 flex flex-col overflow-hidden shadow-2xl max-h-[85vh]">
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <Sliders size={18} />
          </div>
          <h3 className="font-black text-white uppercase tracking-[0.15em] text-xs">{t('ivr.designer_toolbox')}</h3>
        </div>
        <span className="text-[9px] font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full uppercase">
          {t('ivr.editing_mode')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
        {selectedNode ? (
          // Node Inspector Form
          <div className="space-y-5 animate-slide-in-right">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black text-primary tracking-widest">
                {t('ivr.node_properties')}
              </span>
              <span className="text-[9px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">
                ID: {selectedNode.id}
              </span>
            </div>

            {/* Label Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                {t('ivr.node_label')}
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => handleFieldChange('label', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder={t('ivr.label_placeholder')}
              />
            </div>

            {/* Description Textarea (For IVR and Conditional/Custom Nodes) */}
            {(selectedNode.type === 'ivrNode' || selectedNode.type === 'conditionalNode' || selectedNode.type === 'ConditionNode' || selectedNode.type === 'conditionNode' || selectedNode.type === 'TimeRouteNode' || selectedNode.type === 'timeRouteNode' || selectedNode.type === 'APIRequestNode' || selectedNode.type === 'apiRequestNode') && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                  {t('ivr.description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  placeholder={t('ivr.desc_placeholder')}
                />
              </div>
            )}

            {/* Rule Selector (Only for Conditional Nodes) */}
            {(selectedNode.type === 'conditionalNode' || selectedNode.type === 'ConditionNode' || selectedNode.type === 'conditionNode') && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                  {t('ivr.routing_rule', 'Regla de Enrutamiento')}
                </label>
                <select
                  value={ruleType}
                  onChange={(e) => handleFieldChange('ruleType', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="business_hours" className="bg-secondary text-white">{t('ivr.rules.business_hours')}</option>
                  <option value="vip_customer" className="bg-secondary text-white">{t('ivr.rules.vip_customer')}</option>
                  <option value="custom_api" className="bg-secondary text-white">{t('ivr.rules.custom_api')}</option>
                </select>
              </div>
            )}

            {/* HTTP Method Selector (Only for API Request Nodes) */}
            {(selectedNode.type === 'APIRequestNode' || selectedNode.type === 'apiRequestNode') && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                  {t('ivr.http_method', 'Método HTTP')}
                </label>
                <select
                  value={httpMethod}
                  onChange={(e) => handleFieldChange('httpMethod', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="GET" className="bg-secondary text-white">GET</option>
                  <option value="POST" className="bg-secondary text-white">POST</option>
                  <option value="PUT" className="bg-secondary text-white">PUT</option>
                  <option value="DELETE" className="bg-secondary text-white">DELETE</option>
                </select>
              </div>
            )}

            {/* Time Window Config (Only for Time Route Nodes) */}
            {(selectedNode.type === 'TimeRouteNode' || selectedNode.type === 'timeRouteNode') && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                  {t('ivr.time_window', 'Horario de Activación')}
                </label>
                <input
                  type="text"
                  value={timeWindow}
                  onChange={(e) => handleFieldChange('timeWindow', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="Ej. 09:00 - 18:00"
                />
              </div>
            )}

            {/* DTMF Action Input (Only for IVR Nodes) */}
            {selectedNode.type === 'ivrNode' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                  {t('ivr.dtmf_trigger')}
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={action}
                  onChange={(e) => handleFieldChange('action', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-primary focus:outline-none focus:border-primary/50 transition-all"
                  placeholder={t('ivr.dtmf_placeholder')}
                />
                <span className="text-[9px] text-text-secondary opacity-60 leading-tight block">
                  {t('ivr.dtmf_hint')}
                </span>
              </div>
            )}

            {/* Voice Prompt Textarea (Only for IVR Nodes) */}
            {selectedNode.type === 'ivrNode' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                    {t('ivr.voice_prompt')}
                  </label>
                  
                  {/* TTS Preview Button & Waveform Animation */}
                  {voicePrompt && (
                    <div className="flex items-center space-x-2">
                      {isPlaying && (
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
                          "flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border shadow-sm cursor-pointer",
                          isTtsLoading
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : isPlaying
                              ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                              : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                        )}
                        title={isPlaying ? t('ivr.tts_stop') : t('ivr.tts_play')}
                        disabled={isTtsLoading && !isPlaying}
                      >
                        {isTtsLoading ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : isPlaying ? (
                          <VolumeX size={10} />
                        ) : (
                          <Volume2 size={10} />
                        )}
                        <span>
                          {isTtsLoading 
                            ? t('common.loading').split('...')[0] 
                            : isPlaying 
                              ? t('ivr.tts_btn_stop') 
                              : t('ivr.tts_btn_play')}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
                <PromptAutocompleteInput
                  value={voicePrompt}
                  onChange={(val) => handleFieldChange('voicePrompt', val)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  placeholder={t('ivr.prompt_placeholder')}
                />
              </div>
            )}

            {/* API Endpoint Input */}
            {(selectedNode.type === 'serviceNode' || selectedNode.type === 'ivrNode' || selectedNode.type === 'APIRequestNode' || selectedNode.type === 'apiRequestNode' || (selectedNode.type === 'conditionalNode' && ruleType === 'custom_api')) && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                  {t('ivr.api_endpoint')}
                </label>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => handleFieldChange('apiEndpoint', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-medium text-white focus:outline-none focus:border-primary/50 transition-all"
                  placeholder={t('ivr.api_url_label')}
                />
              </div>
            )}

            {/* Visual Icon Grid Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                {t('ivr.visual_glyph')}
              </label>
              <div className="grid grid-cols-5 gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                {designerIcons.map((ico) => {
                  const IconComp = ico.icon;
                  const isSelected = icon === ico.name;
                  return (
                    <button
                      key={ico.name}
                      type="button"
                      title={ico.label}
                      onClick={() => handleFieldChange('icon', ico.name)}
                      className={cn(
                        "p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 border",
                        isSelected 
                          ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(59,130,246,0.3)] scale-110 z-10" 
                          : "bg-secondary/40 border-white/5 text-text-secondary hover:text-white hover:border-white/10"
                      )}
                    >
                      <IconComp size={16} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Node specific delete actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onDeleteNode(selectedNode.id)}
                className="w-full flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                <Trash2 size={14} />
                <span>{t('ivr.delete_selected')}</span>
              </button>
            </div>
          </div>
        ) : (
          // Designer Guide & Node Palette
          <div className="space-y-6 animate-fade-in">
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex items-start space-x-3">
              <Info size={16} className="text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest block">{t('ivr.designer_guide_title')}</span>
                <p className="text-[10px] leading-relaxed text-text-secondary font-medium">
                  {t('ivr.designer_guide_desc')}
                </p>
              </div>
            </div>

            {/* Bloques Disponibles (Drag & Drop) */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-black text-primary tracking-widest block">
                  {t('ivr.available_blocks')}
                </span>
                <span className="text-[9px] text-text-secondary opacity-60 leading-tight block mt-1">
                  {t('ivr.drag_hint')}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {availableBlocks.map((block, idx) => {
                  const IconComp = block.lucideIcon;
                  return (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => onDragStart(e, block.type, {
                        label: block.label,
                        description: block.description,
                        icon: block.icon,
                        status: 'pending'
                      })}
                      onClick={() => onAddNode(block.type, {
                        label: block.label,
                        description: block.description,
                        icon: block.icon,
                        status: 'pending'
                      })}
                      className={cn(
                        "flex items-center space-x-3 border rounded-2xl p-3.5 transition-all duration-300 cursor-grab active:cursor-grabbing group hover:-translate-y-0.5",
                        block.accentClass
                      )}
                    >
                      {/* Left: Drag Handle & Icon */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <GripVertical size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
                        <div className={cn(
                          "p-2.5 rounded-xl transition-transform duration-500 group-hover:scale-110 shadow-inner",
                          block.iconBgClass
                        )}>
                          <IconComp size={18} />
                        </div>
                      </div>
                      
                      {/* Center/Right: Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-white group-hover:text-primary transition-colors tracking-tight">
                            {block.label}
                          </p>
                          <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest">
                            {block.type === 'ivrNode' ? 'IVR' : 
                             (block.type === 'conditionalNode' || block.type === 'ConditionNode' || block.type === 'TimeRouteNode' || block.type === 'APIRequestNode') ? 'REGLA' : 
                             t('ivr.nodes.new_service').split(' ')[1] || 'Servicio'}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary opacity-75 font-medium leading-tight mt-1 truncate">
                          {block.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="text-[10px] text-text-secondary leading-relaxed bg-black/20 p-3.5 rounded-2xl border border-white/5 italic font-medium opacity-70">
              {t('ivr.tip_message')}
            </div>
          </div>
        )}
      </div>

      {/* Global Actions footer */}
      <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
        <button
          type="button"
          onClick={onSave}
          disabled={!hasChanges}
          className={cn(
            "w-full flex items-center justify-center space-x-2 rounded-xl py-3 text-xs font-bold transition-all border shadow-lg",
            hasChanges 
              ? "bg-green-500/20 hover:bg-green-500/30 border-green-500/30 hover:border-green-500/50 text-green-400 shadow-green-500/5 cursor-pointer animate-pulse-slow" 
              : "bg-white/5 border-white/5 text-white/30 cursor-not-allowed"
          )}
        >
          <Save size={14} />
          <span>{t('ivr.save_configuration')}</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            type="button"
            onClick={handleImportClick}
            className="flex items-center justify-center space-x-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary font-bold text-xs py-2.5 rounded-xl transition-all duration-300 cursor-pointer shadow-md hover:shadow-primary/5"
          >
            <Upload size={14} />
            <span>{t('ivr.import_flow')}</span>
          </button>
          <button
            type="button"
            onClick={onExport}
            className="flex items-center justify-center space-x-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary font-bold text-xs py-2.5 rounded-xl transition-all duration-300 cursor-pointer shadow-md hover:shadow-primary/5"
          >
            <Download size={14} />
            <span>{t('ivr.export_flow')}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-text-secondary hover:text-white rounded-xl py-2.5 text-[10px] font-bold transition-all"
        >
          <RotateCcw size={12} />
          <span>{t('ivr.restore_default')}</span>
        </button>
      </div>
    </Card>
  );
};
