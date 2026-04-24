import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="calls" element={<div className="p-8 text-center"><h2 className="text-2xl font-bold">Calls History</h2><p className="text-text-secondary mt-2">Module under development.</p></div>} />
          <Route path="settings" element={<div className="p-8 text-center"><h2 className="text-2xl font-bold">System Settings</h2><p className="text-text-secondary mt-2">Module under development.</p></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
