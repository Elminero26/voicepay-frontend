import React, { useState } from 'react';
import { ShieldCheck, Bell, Trash2, Download, FileText, FileSpreadsheet, KeyRound, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { useCallStore } from '../../../stores/useCallStore';
import { paymentService } from '../../../services/api';
import { useLanguage } from '../../../hooks/useLanguage';

export type TimeRange = 'today' | 'week' | 'month' | 'year';
export type DashboardTab = 'realtime' | 'analytics';

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  connected: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  setActiveTab,
  timeRange,
  setTimeRange,
  connected
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{valid: boolean, message: string} | null>(null);
  const { t } = useLanguage();

  // Form states for verification
  const [vUserId, setVUserId] = useState('');
  const [vStatus, setVStatus] = useState('');
  const [vStartDate, setVStartDate] = useState('');
  const [vEndDate, setVEndDate] = useState('');
  const [vSignature, setVSignature] = useState('');

  const { notifications, clearNotifications, markAllNotificationsAsRead } = useCallStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleExport = async (type: 'pdf' | 'excel') => {
    try {
      if (type === 'pdf') {
        await paymentService.downloadPdfReport();
      } else {
        await paymentService.downloadExcelReport();
      }
      setShowExportMenu(false);
    } catch (err) {
      console.error('Error during report export', err);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyLoading(true);
    setVerificationResult(null);
    try {
      const payload = {
        userId: vUserId ? parseInt(vUserId) : null,
        status: vStatus || null,
        startDate: vStartDate || null,
        endDate: vEndDate || null,
        signature: vSignature.trim()
      };
      
      const response = await fetch('/api/payments/reports/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'voicepay-secret-key-2024',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      setVerificationResult(result);
    } catch (err) {
      console.error(err);
      setVerificationResult({
        valid: false,
        message: t('ivr.verifying_signature_error')
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-gradient tracking-tight">{t('dashboard.title')} Pro</h2>
          <p className="text-text-secondary mt-2 flex items-center gap-2">
            <span className={cn(
              "flex h-2.5 w-2.5 rounded-full",
              connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-pulse"
            )}></span>
            {connected ? t('dashboard.live_voice_stream_desc') : t('connection.offline')}
          </p>
        </div>
        
        {/* Navigation Selector Mode, Exports, Notifications */}
        <div className="flex items-center space-x-3 self-end md:self-auto">
          <div className="flex items-center space-x-2 bg-secondary/40 p-1.5 rounded-2xl border border-border/40 backdrop-blur-sm shadow-inner">
            <button 
              onClick={() => setActiveTab('realtime')}
              className={cn(
                "relative px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                activeTab === 'realtime' ? "text-white" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {activeTab === 'realtime' && (
                <motion.div
                  layoutId="dashboardActiveTab"
                  className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t('ivr.live_status')}</span>
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={cn(
                "relative px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                activeTab === 'analytics' ? "text-white" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {activeTab === 'analytics' && (
                <motion.div
                  layoutId="dashboardActiveTab"
                  className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t('ivr.interactive_designer')}</span>
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 p-2.5 text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600/20 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300 font-bold text-xs uppercase tracking-wider"
            >
              <Download size={18} />
              <span className="hidden sm:inline">{t('common.export')}</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-3 w-56 glass border border-white/10 shadow-2xl p-2 z-[999] backdrop-blur-xl rounded-2xl">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-text-secondary hover:text-white transition-colors text-xs font-bold uppercase tracking-wider text-left"
                >
                  <FileText size={16} className="text-rose-400" />
                  <span>{t('ivr.export_signed_pdf')}</span>
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-text-secondary hover:text-white transition-colors text-xs font-bold uppercase tracking-wider text-left"
                >
                  <FileSpreadsheet size={16} className="text-emerald-400" />
                  <span>{t('ivr.export_signed_excel')}</span>
                </button>
                <div className="border-t border-white/5 my-2"></div>
                <button
                  onClick={() => {
                    setShowVerifyModal(true);
                    setShowExportMenu(false);
                    setVerificationResult(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-indigo-400 hover:text-indigo-300 transition-colors text-xs font-bold uppercase tracking-wider text-left"
                >
                  <KeyRound size={16} />
                  <span>{t('ivr.validate_digital_signature')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  markAllNotificationsAsRead();
                }
              }}
              className="relative p-2.5 text-text-secondary hover:text-white bg-secondary/30 rounded-xl border border-border/40 hover:bg-secondary/60 hover:border-white/10 transition-all duration-300"
            >
              <Bell size={20} className={cn(unreadCount > 0 && "animate-pulse")} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white shadow-lg border border-background shadow-indigo-600/50">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 glass border border-white/10 shadow-2xl p-4 z-[999] backdrop-blur-xl rounded-2xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">{t('ivr.events_log.title')}</h4>
                  {notifications.length > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotifications();
                      }}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={12} />
                      {t('common.reset')} Log
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-3 rounded-xl border transition-all text-xs",
                        n.type === 'success' ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300" :
                        n.type === 'error' ? "bg-rose-500/5 border-rose-500/10 text-rose-300" :
                        "bg-indigo-500/5 border-indigo-500/10 text-indigo-200"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-black tracking-tight">{n.title}</span>
                        <span className="text-[9px] opacity-50 font-mono">{n.timestamp}</span>
                      </div>
                      <p className="opacity-80 leading-relaxed font-medium">{n.message}</p>
                    </div>
                  ))}
                  
                  {notifications.length === 0 && (
                    <div className="text-center py-8 opacity-40">
                      <Bell size={28} className="mx-auto mb-2 text-text-secondary" />
                      <p className="text-[10px] font-bold uppercase tracking-wider">{t('ivr.events_log.awaiting_signals')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Modal (Aesthetics & functionality) */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="glass border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl p-6 relative overflow-hidden animate-slide-up">
            <button
              onClick={() => {
                setShowVerifyModal(false);
                setVerificationResult(null);
              }}
              className="absolute top-4 right-4 p-2 text-text-secondary hover:text-white rounded-xl hover:bg-white/5 transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <KeyRound size={24} className="text-indigo-400" />
              <div>
                <h3 className="text-lg font-bold text-white">{t('ivr.validate_authenticity_report')}</h3>
                <p className="text-xs text-text-secondary">{t('ivr.validate_crypto_signature')}</p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">{t('ivr.user_id_filter')}</label>
                  <input
                    type="number"
                    value={vUserId}
                    onChange={(e) => setVUserId(e.target.value)}
                    placeholder="Ej. 1"
                    className="w-full bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">{t('ivr.status_filter')}</label>
                  <select
                    value={vStatus}
                    onChange={(e) => setVStatus(e.target.value)}
                    className="w-full bg-black/30 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">{t('common.all')}</option>
                    <option value="COMPLETED" className="bg-slate-900">{t('calls.status.completed')}</option>
                    <option value="FAILED" className="bg-slate-900">{t('calls.status.failed')}</option>
                    <option value="PENDING" className="bg-slate-900">{t('calls.status.in_progress')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">{t('ivr.start_date_filter')}</label>
                  <input
                    type="date"
                    value={vStartDate}
                    onChange={(e) => setVStartDate(e.target.value)}
                    className="w-full bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">{t('ivr.end_date_filter')}</label>
                  <input
                    type="date"
                    value={vEndDate}
                    onChange={(e) => setVEndDate(e.target.value)}
                    className="w-full bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">{t('ivr.rsa_crypto_signature')}</label>
                <textarea
                  required
                  value={vSignature}
                  onChange={(e) => setVSignature(e.target.value)}
                  placeholder={t('ivr.rsa_signature_placeholder')}
                  rows={4}
                  className="w-full bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={verifyLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {verifyLoading ? t('ivr.checking_signature') : t('ivr.verify_legitimacy')}
              </button>
            </form>

            {/* Results Display */}
            {verificationResult && (
              <div className={cn(
                "mt-4 p-4 rounded-2xl border text-xs animate-slide-up",
                verificationResult.valid 
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/5 border-rose-500/20 text-rose-300"
              )}>
                <div className="flex items-center gap-2 font-bold mb-1.5">
                  {verificationResult.valid ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span>{t('ivr.valid_signature_msg')}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} className="text-rose-400" />
                      <span>{t('ivr.invalid_signature_msg')}</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed opacity-90">{verificationResult.message}</p>
                {verificationResult.valid && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[9px] opacity-70">
                    <span>{t('ivr.validation_authority')}</span>
                    <span>{t('ivr.date')} {new Date().toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time filters for Analytics View */}
      {activeTab === 'analytics' && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass rounded-2xl border-white/5 bg-secondary/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary px-2">{t('ivr.temporal_filter')}</span>
            <div className="flex items-center space-x-1.5 bg-black/20 p-1 rounded-xl border border-white/5">
              {(['today', 'week', 'month', 'year'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold capitalize rounded-lg transition-all",
                    timeRange === range 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                      : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                  )}
                >
                  {range === 'week' ? t('ivr.days_7') : range === 'month' ? t('ivr.days_30') : range === 'year' ? t('ivr.months_12') : t('ivr.today')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
            <ShieldCheck size={14} />
            <span>{t('ivr.audited_period')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

