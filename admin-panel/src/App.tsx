import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Groups } from './pages/Groups';
import { Analytics } from './pages/Analytics';
import { Feedback } from './pages/Feedback';
import { Login } from './pages/Login';
import './index.css';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function App() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already logged in
    const saved = localStorage.getItem('expensex_admin');
    if (saved) {
      try {
        setAdmin(JSON.parse(saved));
      } catch {}
    }
    setChecking(false);
  }, []);

  const handleLogin = (user: AdminUser) => {
    setAdmin(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('expensex_admin');
    setAdmin(null);
  };

  if (checking) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  if (!admin) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout admin={admin} onLogout={handleLogout} />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="groups" element={<Groups />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="feedback" element={<Feedback />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
