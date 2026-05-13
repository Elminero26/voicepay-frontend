import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const OAuth2Redirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleSocialLogin } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      handleSocialLogin(token);
      navigate('/', { replace: true });
    } else {
      navigate('/login?error=oauth2_failed');
    }
  }, [location, navigate, handleSocialLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary font-medium">Authenticating with social provider...</p>
      </div>
    </div>
  );
};
