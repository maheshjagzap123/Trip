import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Layers, BarChart3, MessageSquare, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import './Layout.css';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'Users' },
  { path: '/groups', icon: Layers, label: 'Groups' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/feedback', icon: MessageSquare, label: 'Feedback' },
];

interface LayoutProps {
  admin: { id: string; email: string; name: string; role: string };
  onLogout: () => void;
}

export function Layout({ admin, onLogout }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <h1 className="header-title">ExpenseX Admin</h1>
        <div className="header-badge">Admin</div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">X</div>
          <span className="brand-text">ExpenseX</span>
          <span className="brand-sub">Admin Panel</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-admin">
            <div className="admin-avatar">{(admin.name || admin.email)[0].toUpperCase()}</div>
            <div className="admin-info">
              <span className="admin-name">{admin.name || 'Admin'}</span>
              <span className="admin-email">{admin.email}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
