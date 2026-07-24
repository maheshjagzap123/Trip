import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './Login.css';

interface LoginProps {
  onLogin: (admin: { id: string; email: string; name: string; role: string }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('verify_admin_login', {
        p_email: email.trim().toLowerCase(),
        p_password: password,
      });

      if (rpcError) {
        setError('Login failed. Please try again.');
        return;
      }

      const admin = Array.isArray(data) ? data[0] : data;

      if (!admin || !admin.id) {
        setError('Invalid email or password');
        return;
      }

      // Save session to localStorage
      localStorage.setItem('expensex_admin', JSON.stringify(admin));
      onLogin(admin);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb orb-1" />
      <div className="login-bg-orb orb-2" />

      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-brand">
          <div className="login-brand-icon">X</div>
          <h1>ExpenseX</h1>
          <p>Admin Panel</p>
        </div>

        <div className="login-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="admin@expensex.app"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>

        <div className="login-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="login-footer">Protected area. Authorized admins only.</p>
      </form>
    </div>
  );
}
