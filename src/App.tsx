import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { Notifications } from './pages/Notifications';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';
import { AccessDenied } from './pages/AccessDenied';

function App() {
  return (
    <ToastProvider>
      <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="calls" element={<div className="p-8 text-center"><h2 className="text-2xl font-bold">Calls History</h2><p className="text-text-secondary mt-2">Module under development.</p></div>} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="access-denied" element={<AccessDenied />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </ToastProvider>
  );
}

export default App;
