import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LayoutDashboard, Film, UploadCloud, LogOut, FileText, Menu, X, PlaySquare, History, Bell, Plus } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Shows', path: '/shows', icon: Film },
    { name: 'Episodes', path: '/episodes', icon: PlaySquare },
    { name: 'Validation', path: '/validation', icon: FileText },
    { name: 'Publish', path: '/publish', icon: UploadCloud },
    { name: 'Publish History', path: '/publish-history', icon: History },
  ];

  const activeStyle = {
    backgroundColor: 'var(--purple-100)',
    color: 'var(--purple-700)',
    fontWeight: '700',
    borderLeft: '4px solid var(--purple-700)'
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '0 var(--radius-md) var(--radius-md) 0',
    color: 'var(--text-muted)',
    marginBottom: '8px',
    transition: 'all 0.2s',
    borderLeft: '4px solid transparent',
    fontWeight: '500'
  };
  
  const getPageTitle = () => {
    const currentItem = navItems.find(item => location.pathname.startsWith(item.path));
    return currentItem ? currentItem.name : 'Peblo CMS';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40 }}
        />
      )}

      {/* Sidebar */}
      <div 
        style={{ 
          width: '260px', 
          backgroundColor: '#FFFFFF',
          padding: '24px 0', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: sidebarOpen ? 0 : '-100%',
          zIndex: 50,
          transition: 'left 0.3s ease',
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,1) 60%, rgba(255,255,255,0.7) 80%), url(/sidebar_bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
        }}
        className="sidebar"
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0, flexDirection: 'column', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', lineHeight: '1.2' }}>
              <span style={{ color: 'var(--purple-700)' }}>P</span>
              <span style={{ color: '#A881E6' }}>e</span>
              <span style={{ color: '#4B63D6' }}>B</span>
              <span style={{ color: '#E8669F' }}>L</span>
              <span style={{ color: '#F2994A' }}>o</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '2px' }}>CMS</span>
          </div>
          <button className="mobile-only" onClick={() => setSidebarOpen(false)} style={{ color: 'var(--text-muted)', position: 'absolute', right: '16px', top: '24px' }}>
            <X size={24} />
          </button>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '24px' }}>
          {navItems.map((item) => (
            <NavLink 
              key={item.name} 
              to={item.path} 
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => isActive ? { ...itemStyle, ...activeStyle } : itemStyle}
            >
              <item.icon size={20} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.9)', padding: '12px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }} onClick={logout} title="Logout">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--purple-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple-700)', fontWeight: 'bold', overflow: 'hidden' }}>
                <img src="/assets/eoEf12a30xBVz5Q1VMqOk8gbgs.avif" alt="avatar" style={{width: '24px'}} />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--navy-900)' }}>
                  {user?.role === 'admin' ? 'Admin User' : 'Editor User'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role === 'admin' ? 'Administrator' : 'Editor'}</div>
              </div>
            </div>
            <div style={{ color: 'var(--purple-700)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Adjustments */}
      <style>{`
        .sidebar { left: 0 !important; }
        .mobile-only { display: none !important; }
        .main-content { margin-left: 260px; }
        @media (max-width: 1024px) {
          .sidebar { left: -100% !important; }
          .main-content { margin-left: 0; }
          .mobile-only { display: block !important; }
        }
      `}</style>

      {/* Main Content */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.3s ease' }}>
        <header style={{ height: '88px', display: 'flex', alignItems: 'center', padding: '0 40px', gap: '16px', position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'var(--background)' }}>
          <button className="mobile-only" onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-main)', display: 'none' }}>
            <Menu size={24} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: '800', fontSize: '24px', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getPageTitle()} {location.pathname === '/dashboard' && '👋'}
            </div>
            {location.pathname === '/dashboard' && (
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Here's what's happening with your content today.
              </div>
            )}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative', cursor: 'pointer', color: 'var(--purple-700)', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: '0px', right: '0px', backgroundColor: 'var(--purple-700)', color: 'white', fontSize: '10px', fontWeight: 'bold', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>3</span>
            </div>
            <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '12px' }}>
              <Plus size={18} /> Create New
            </button>
          </div>
        </header>
        <main style={{ flex: 1, padding: '0 40px 40px 40px', maxWidth: '1400px', width: '100%' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
