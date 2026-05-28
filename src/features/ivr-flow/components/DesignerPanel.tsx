import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { 
  Sliders, Plus, Trash2, Save, RotateCcw, HelpCircle, Info,
  PhoneCall, Globe, ShieldCheck, CreditCard, CheckCircle2, 
  User, Headset, Activity, MessageSquare, Zap, AlertTriangle
} from 'lucide-react';
import { cn } from '../../../utils/cn';

interface DesignerPanelProps {
  selectedNode: any | null;
  onUpdateNode: (id: string, updatedData: any) => void;
  onDeleteNode: (id: string) => void;
  onAddNode: (type: 'ivrNode' | 'serviceNode') => void;
  onSave: () => void;
  onReset: () => void;
  hasChanges: boolean;
}

export const DesignerPanel: React.FC<DesignerPanelProps> = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onAddNode,
  onSave,
  onReset,
  hasChanges,
}) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('HelpCircle');
  const [action, setAction] = useState('');

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
    }
  }, [selectedNode]);

  // Handle updates
  const handleFieldChange = (field: string, value: any) => {
    if (!selectedNode) return;
    
    if (field === 'label') setLabel(value);
    if (field === 'description') setDescription(value);
    if (field === 'icon') setIcon(value);
    if (field === 'action') setAction(value);

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
  ];

  return (
    <Card className="flex-1 glass-dark border-white/5 p-6 flex flex-col overflow-hidden shadow-2xl max-h-[85vh]">
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <Sliders size={18} />
          </div>
          <h3 className="font-black text-white uppercase tracking-[0.15em] text-xs">Designer Toolbox</h3>
        </div>
        <span className="text-[9px] font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full uppercase">
          Editing Mode
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
        {selectedNode ? (
          // Node Inspector Form
          <div className="space-y-5 animate-slide-in-right">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black text-primary tracking-widest">
                Node Properties
              </span>
              <span className="text-[9px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">
                ID: {selectedNode.id}
              </span>
            </div>

            {/* Label Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                Node Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => handleFieldChange('label', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="e.g. Process Payment"
              />
            </div>

            {/* Description Textarea (Only for IVR Nodes) */}
            {selectedNode.type === 'ivrNode' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Summarize the action at this step..."
                />
              </div>
            )}

            {/* DTMF Action Input (Only for IVR Nodes) */}
            {selectedNode.type === 'ivrNode' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                  DTMF Trigger Key (Optional)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={action}
                  onChange={(e) => handleFieldChange('action', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-primary focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="e.g. 1, 2, #, *"
                />
                <span className="text-[9px] text-text-secondary opacity-60 leading-tight block">
                  If set, this node will light up when the user enters this key during option selection.
                </span>
              </div>
            )}

            {/* Visual Icon Grid Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">
                Visual Glyph / Icon
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
                <span>Delete Selected Node</span>
              </button>
            </div>
          </div>
        ) : (
          // Designer Guide & Node Palette
          <div className="space-y-6 animate-fade-in">
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex items-start space-x-3">
              <Info size={16} className="text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest block">Interactive Flow Designer</span>
                <p className="text-[10px] leading-relaxed text-text-secondary font-medium">
                  Click on any node to view/edit its parameters. Drag connections from the bottom handle of a node to the top of another to form flow routes.
                </p>
              </div>
            </div>

            {/* Add Node Section */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-black text-primary tracking-widest block">
                Add Canvas Elements
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => onAddNode('ivrNode')}
                  className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl py-3 px-4 text-xs font-bold transition-all text-left group"
                >
                  <div className="p-2 bg-primary/20 text-primary rounded-lg group-hover:scale-110 transition-transform">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">IVR Flow Node</p>
                    <p className="text-[10px] text-text-secondary opacity-65 font-medium">User choice, router or automated speech step.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onAddNode('serviceNode')}
                  className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl py-3 px-4 text-xs font-bold transition-all text-left group"
                >
                  <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg group-hover:scale-110 transition-transform">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">External Service Node</p>
                    <p className="text-[10px] text-text-secondary opacity-65 font-medium">Backend system, API gateway or web hook matrix.</p>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="text-[10px] text-text-secondary leading-relaxed bg-black/20 p-3.5 rounded-2xl border border-white/5 italic font-medium opacity-70">
              💡 Tip: You can select and delete edges/connections by clicking on them and hitting the "Backspace" or "Delete" key on your keyboard.
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
          <span>Save IVR Configuration</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-text-secondary hover:text-white rounded-xl py-2.5 text-[10px] font-bold transition-all"
        >
          <RotateCcw size={12} />
          <span>Restore Default Flow</span>
        </button>
      </div>
    </Card>
  );
};
