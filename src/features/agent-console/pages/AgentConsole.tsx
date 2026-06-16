import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headset } from 'lucide-react';
import { useAgentStore } from '../../../stores/useAgentStore';
import { useLanguage } from '../../../hooks/useLanguage';
import { Button } from '../../../components/Button';
import { ConsoleSoftphone } from '../components/ConsoleSoftphone';
import { SessionDetails } from '../components/SessionDetails';
import { cn } from '../../../utils/cn';

export const AgentConsole: React.FC = () => {
  const { t } = useLanguage();
  const { 
    isSoftphoneDocked, 
    setSoftphoneDocked, 
    setSoftphoneOpen, 
    softphoneOpen,
    agentStatus 
  } = useAgentStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleDockToggle = () => {
    // If it's floating or completely closed, dock it back
    if (!isSoftphoneDocked || !softphoneOpen) {
      setSoftphoneDocked(true);
      setSoftphoneOpen(true);
      setIsSidebarCollapsed(false);
    } else {
      // Toggle collapse state of sidebar
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full relative space-y-6">
      
      {/* Top Console Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {t('agent.agent_console_title', 'Agent Session Console')}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Real-time secure client interaction control panel.
          </p>
        </div>

        {/* Console control options */}
        <div className="flex items-center space-x-3">
          {(!isSoftphoneDocked || !softphoneOpen || isSidebarCollapsed) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDockToggle}
              className="rounded-xl flex items-center space-x-2 border-primary/25 text-primary bg-primary/5 hover:bg-primary/10 transition-all font-bold text-xs px-3 py-2"
            >
              <Headset size={14} className="animate-pulse" />
              <span>
                {!softphoneOpen || !isSoftphoneDocked 
                  ? t('agent.dock', 'Dock Softphone') 
                  : t('agent.expand', 'Expand Sidebar')}
              </span>
            </Button>
          )}

          {/* Glowing Agent Presence Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[11px] font-bold select-none">
            <span className={cn(
              "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.7)]",
              agentStatus === 'available' ? "bg-emerald-500 shadow-emerald-500/50" :
              agentStatus === 'busy' ? "bg-amber-500 shadow-amber-500/50" :
              "bg-zinc-500"
            )} />
            <span className="text-text-secondary tracking-wider uppercase font-black">
              {t(`agent.${agentStatus}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Console Grid */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 h-full relative overflow-hidden">
        
        {/* Main Session Content Panel (Full width if sidebar collapsed or floating) */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pr-1">
          <SessionDetails />
        </div>

        {/* Collapsible Sidebar for Docked Softphone (Framer Motion Drawer) */}
        <AnimatePresence>
          {softphoneOpen && isSoftphoneDocked && !isSidebarCollapsed && (
            <motion.aside
              initial={{ opacity: 0, x: 200, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '20rem' }} // 320px sidebar width
              exit={{ opacity: 0, x: 200, width: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="hidden lg:block shrink-0 h-full"
            >
              <ConsoleSoftphone onCollapseToggle={handleDockToggle} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile/Tablet Collapsible Bottom Sheet or Sidebar for Softphone */}
        <AnimatePresence>
          {softphoneOpen && isSoftphoneDocked && !isSidebarCollapsed && (
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-40 max-h-[85vh] p-4 bg-background/95 backdrop-blur-xl border-t border-border/80 shadow-2xl rounded-t-[32px] flex flex-col"
            >
              {/* Drag Indicator */}
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-4 cursor-pointer shrink-0" onClick={handleDockToggle} />
              
              <div className="flex-1 overflow-y-auto min-h-[400px]">
                <ConsoleSoftphone onCollapseToggle={handleDockToggle} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
