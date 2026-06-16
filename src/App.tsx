import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './contexts/AuthContext';
import { Loader } from './components/Loader';
import { LanguageSwitcher } from './components/LanguageSwitcher';

// Lazy loading features
const Login = React.lazy(() => import('./features/auth').then(m => ({ default: m.Login })));
const OAuth2Redirect = React.lazy(() => import('./features/auth').then(m => ({ default: m.OAuth2Redirect })));
const AccessDenied = React.lazy(() => import('./features/auth').then(m => ({ default: m.AccessDenied })));
const Dashboard = React.lazy(() => import('./features/dashboard').then(m => ({ default: m.Dashboard })));
const UsersPage = React.lazy(() => import('./features/users').then(m => ({ default: m.UsersPage })));
const CallsPage = React.lazy(() => import('./features/calls').then(m => ({ default: m.CallsPage })));
const IvrFlow = React.lazy(() => import('./features/ivr-flow').then(m => ({ default: m.IvrFlow })));
const Notifications = React.lazy(() => import('./features/notifications').then(m => ({ default: m.Notifications })));
const Settings = React.lazy(() => import('./features/settings').then(m => ({ default: m.Settings })));
const AgentConsole = React.lazy(() => import('./features/agent-console').then(m => ({ default: m.AgentConsole })));

// VP-18: Render floating switcher on public auth pages
const GlobalFloatingSwitcher: React.FC = () => {
  const location = useLocation();
  const showFloating = ['/login'].includes(location.pathname);
  if (!showFloating) return null;
  return <LanguageSwitcher variant="floating" />;
};

function App() {
  return (
    <ToastProvider>
      <Router>
        <AuthProvider>
          <Suspense fallback={<Loader fullScreen />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
              
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="calls" element={<CallsPage />} />
                <Route path="ivr-flow" element={<IvrFlow />} />
                <Route path="agent-console" element={<AgentConsole />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="access-denied" element={<AccessDenied />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <GlobalFloatingSwitcher />
          </Suspense>
        </AuthProvider>
      </Router>
    </ToastProvider>
  );
}

export default App;


