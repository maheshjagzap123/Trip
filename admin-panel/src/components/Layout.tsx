import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Layers, BarChart3, MessageSquare, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './Layout.css';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'Users' },
  { path: '/groups', icon: Layers, label: 'Groups' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/feedback', icon: MessageSquare, label: 'Feedback' },
];

export function Layout() {
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
          <div className="sidebar-version">v1.0.0</div>
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
