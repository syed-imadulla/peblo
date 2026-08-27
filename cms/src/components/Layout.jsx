import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LayoutDashboard, Film, UploadCloud, LogOut, FileText } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Shows', path: '/shows', icon: Film },
    { name: 'Publish', path: '/publish', icon: UploadCloud },
    { name: 'Validation', path: '/validation', icon: FileText },
  ];

  const activeStyle = {
    backgroundColor: 'var(--purple-100)',
    color: 'var(--purple-700)',
    fontWeight: '600'
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    marginBottom: '8px',
    transition: 'background-color 0.2s',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: 'var(--purple-700)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--yellow-500)' }}></div>
          Peblo CMS
        </h2>
        
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <NavLink 
              key={item.name} 
              to={item.path} 
              style={({ isActive }) => isActive ? { ...itemStyle, ...activeStyle } : itemStyle}
            >
              <item.icon size={20} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>Logged in as</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
            <button onClick={logout} style={{ padding: '8px', color: 'var(--red-500)' }} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header style={{ height: '72px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', padding: '0 32px' }}>
          {/* We can add page title context here if needed */}
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
