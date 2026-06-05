import React from 'react';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/Button';
import { useLanguage } from '../../../hooks/useLanguage';

export const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
        <ShieldAlert size={48} className="text-red-500" />
      </div>
      
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
        {t('auth.access_denied')}
      </h1>
      
      <p className="text-text-secondary max-w-md mb-8">
        {t('auth.access_denied_desc')}
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="flex items-center"
        >
          <ArrowLeft size={18} className="mr-2" />
          {t('auth.go_back')}
        </Button>
        
        <Link to="/">
          <Button className="flex items-center">
            <Home size={18} className="mr-2" />
            {t('auth.dashboard_home')}
          </Button>
        </Link>
      </div>

      <div className="mt-12 text-xs text-text-tertiary">
        {t('auth.error_code')} 403_FORBIDDEN_VOICEPAY
      </div>
    </div>
  );
};

