import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Shield, MessageSquare, Key, Save, Eye, EyeOff, Smartphone } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useToast } from '../../../components/Toast';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'security' | 'twilio'>('security');
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  // Estados para los inputs
  const [apiKey, setApiKey] = useState('vp_live_xxxxxxxxxxxxxxxx');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioNumber, setTwilioNumber] = useState('');

  const handleSave = () => {
    console.log('Saving settings:', { apiKey, twilioSid, twilioToken, twilioNumber });
    toast('Settings Saved', 'System configuration updated successfully.', 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gradient">System Settings</h2>
          <p className="text-text-secondary mt-1">Configure your API authentication and communication services.</p>
        </div>
        <Button onClick={handleSave} className="flex items-center space-x-2">
          <Save size={18} />
          <span>Save Changes</span>
        </Button>
      </div>

      <div className="flex space-x-1 p-1 bg-secondary/50 rounded-xl border border-border w-fit">
        <button
          onClick={() => setActiveTab('security')}
          className={cn(
            'relative px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
            activeTab === 'security' ? 'text-white' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          {activeTab === 'security' && (
            <motion.div
              layoutId="settingsActiveTab"
              className="absolute inset-0 bg-primary rounded-lg shadow-lg"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center space-x-2">
            <Shield size={18} />
            <span>Security & API</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('twilio')}
          className={cn(
            'relative px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
            activeTab === 'twilio' ? 'text-white' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          {activeTab === 'twilio' && (
            <motion.div
              layoutId="settingsActiveTab"
              className="absolute inset-0 bg-primary rounded-lg shadow-lg"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center space-x-2">
            <MessageSquare size={18} />
            <span>Twilio Config</span>
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'security' && (
            <Card title="API Authentication" description="Manage your application secret keys and authentication methods.">
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Master API Key</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-12 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    />
                    <button
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    >
                      {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-text-secondary">This key allows external systems to interact with the VoicePay API.</p>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-3 text-amber-500">
                  <Shield size={20} className="shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold uppercase tracking-wider mb-1">Security Warning</p>
                    <p>Keep your API keys secret. Never share them or commit them to version control. If compromised, regenerate them immediately.</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'twilio' && (
            <Card title="Twilio Integration" description="Configure your SMS and Voice credentials to enable real-time notifications.">
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary uppercase tracking-widest text-[10px]">Account SID</label>
                  <input
                    type="text"
                    value={twilioSid}
                    onChange={(e) => setTwilioSid(e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-sm font-mono focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary uppercase tracking-widest text-[10px]">Auth Token</label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={twilioToken}
                      onChange={(e) => setTwilioToken(e.target.value)}
                      placeholder="Your Auth Token"
                      className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 pr-12 text-sm font-mono focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    />
                    <button
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    >
                      {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary uppercase tracking-widest text-[10px]">Twilio Phone Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input
                      type="text"
                      value={twilioNumber}
                      onChange={(e) => setTwilioNumber(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 px-4 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Helper" className="h-fit">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Key className="text-primary" size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium">Where to get them?</p>
                  <p className="text-xs text-text-secondary mt-1">You can find your Twilio credentials in the Twilio Console Dashboard under "Account Info".</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
