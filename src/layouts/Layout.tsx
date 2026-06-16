import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, PhoneCall, Settings, LogOut, Menu, X, Bell, Network, Headset } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useCallStore } from '../stores/useCallStore';
import { WebSocketBanner } from '../components/WebSocketBanner';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useLanguage } from '../hooks/useLanguage';
import { useAgentStore } from '../stores/useAgentStore';
import { useAgentCallSync } from '../hooks/useAgentCallSync';
import { Softphone } from '../components/Softphone';
import { ScreenPop } from '../components/ScreenPop';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { logout, user } = useAuth();
  const { connectionState } = useCallStore();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);
  const { t } = useLanguage();

  // Run the agent call synchronization hook
  useAgentCallSync();

  const { softphoneOpen, setSoftphoneOpen, agentStatus } = useAgentStore();

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
    { icon: Users, label: t('nav.users'), path: '/users' },
    { icon: PhoneCall, label: t('nav.calls'), path: '/calls' },
    { icon: Network, label: t('nav.ivr_flow'), path: '/ivr-flow' },
    { icon: Headset, label: t('nav.agent_console'), path: '/agent-console' },
    { icon: Bell, label: t('nav.notifications'), path: '/notifications' },
    { icon: Settings, label: t('nav.settings'), path: '/settings' },
  ];

  const getConnectionLabel = () => {
    switch (connectionState) {
      case 'connected':
        return t('connection.live');
      case 'connecting':
        return t('connection.connecting');
      case 'reconnecting':
        return t('connection.reconnecting');
      default:
        return t('connection.offline');
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden bg-grid relative">
      {/* Decorative Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Mobile Sidebar Toggle Backdrop */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-35 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Toggle Button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 glass border-r border-border lg:static lg:inset-0 lg:translate-x-0'
        )}
        initial={isMobile ? { x: '-100%' } : { x: 0 }}
        animate={{ x: isMobile ? (isSidebarOpen ? 0 : '-100%') : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center space-x-3 mb-10 px-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <PhoneCall className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight">VoicePay</span>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden',
                    isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                  )
                }
                onClick={() => setIsSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="activeSidebarItem"
                        className="absolute inset-0 bg-primary/10 border-l-2 border-primary"
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center space-x-3">
                      <item.icon size={20} className="transition-transform group-hover:scale-110" />
                      <span className="font-medium">{item.label}</span>
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="pt-6 border-t border-border">
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/5">
              <LogOut size={20} className="mr-3" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md border-b border-border z-30">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold lg:block hidden">{t('nav.system_overview')}</h1>
            
            {/* Glowing Live Connection Badge */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] font-medium tracking-wide">
              <span className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                connectionState === 'connected' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)] animate-pulse" :
                connectionState === 'connecting' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)] animate-pulse" :
                connectionState === 'reconnecting' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse" :
                "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"
              )} />
              <span className="text-text-secondary select-none">
                {getConnectionLabel()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 ml-auto">
            {/* Softphone Widget Trigger */}
            <Button
              variant={softphoneOpen ? "primary" : "ghost"}
              size="icon"
              onClick={() => setSoftphoneOpen(!softphoneOpen)}
              className="relative w-10 h-10 rounded-xl"
              title={t('agent.title')}
            >
              <Headset size={20} className={cn(softphoneOpen ? "text-white" : "text-text-secondary hover:text-text-primary")} />
              <span className={cn(
                "absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-background",
                agentStatus === 'available' ? "bg-emerald-500" :
                agentStatus === 'busy' ? "bg-amber-500" :
                "bg-zinc-500"
              )} />
            </Button>

            {/* VP-19: Light/Dark Theme Switcher */}
            <ThemeSwitcher />
            {/* VP-17: Language switcher */}
            <LanguageSwitcher />
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-medium">{user?.name || 'User'}</span>
              <span className="text-xs text-text-secondary capitalize">{user?.role || 'System Manager'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center border border-primary/20">
              <Users size={18} className="text-primary" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 animate-fade-in custom-scrollbar flex flex-col">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-2">
            <WebSocketBanner />
            <Outlet />
          </div>
        </div>

        {/* Softphone Component */}
        <Softphone />

        {/* ScreenPop Component */}
        <ScreenPop />
      </main>
    </div>
  );
};

