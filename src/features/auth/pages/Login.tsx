import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PhoneCall, Lock, Mail, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../hooks/useLanguage';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/';

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired')) {
      setError(t('auth.session_expired'));
    }
  }, [t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || t('auth.login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid relative px-4">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 w-[30%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 p-8 shadow-2xl border-white/10 backdrop-blur-xl bg-background/80">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
            <PhoneCall className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('auth.welcome_back')}</h1>
          <p className="text-text-secondary mt-2 text-center">{t('auth.enter_credentials')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 text-red-500 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@voicepay.com"
                className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-base font-medium shadow-md shadow-primary/20" disabled={loading}>
            {loading ? t('auth.redirecting') : t('auth.sign_in')}
          </Button>
        </form>

        <div className="mt-8">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-text-secondary font-medium">{t('auth.or_continue_with')}</span>
            </div>
          </div>

          <button
            onClick={() => window.location.href = 'http://localhost:9000/oauth2/authorization/google'}
            className="w-full h-11 flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-xl font-medium transition-all shadow-sm active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{t('auth.sign_in_with_google')}</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

