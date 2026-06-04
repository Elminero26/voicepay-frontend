import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Loader } from '../../../components/Loader';

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

  return <Loader variant="spinner" fullScreen text="Authenticating with social provider..." />;
};
