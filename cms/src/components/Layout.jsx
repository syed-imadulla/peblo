import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LayoutDashboard, Film, UploadCloud, LogOut, FileText, Menu, X, PlaySquare, History, Plus, Settings } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Shows', path: '/shows', icon: Film },
    { name: 'Episodes', path: '/episodes', icon: PlaySquare },
    { name: 'Validation', path: '/validation', icon: FileText },
    { name: 'Publish', path: '/publish', icon: UploadCloud },
    { name: 'Publish History', path: '/publish-history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const activeStyle = {
    backgroundColor: '#F5F3FF',
    color: '#6D28D9',
    fontWeight: '700'
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    margin: '0 20px',
    borderRadius: '20px',
    color: 'var(--text-muted)',
    marginBottom: '8px',
    transition: 'all 0.2s',
    fontWeight: '600',
    textDecoration: 'none',
    outline: 'none',
  };
  
  const getPageTitle = () => {
    const currentItem = navItems.find(item => location.pathname.startsWith(item.path));
    return currentItem ? currentItem.name : 'Peblo CMS';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Welcome back';
  };

  const getUserName = () => {
    return user?.role === 'admin' ? 'Admin' : 'Editor';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(180deg, #F0F5FF 0%, #F8F9FF 50%, #FAFAFF 100%)' }}>
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
          width: '250px', 
          flexShrink: 0,
          backgroundColor: '#FFFFFF',
          padding: '24px 0', 
          display: 'flex', 
          flexDirection: 'column',
          zIndex: 50,
          transition: 'left 0.3s ease',
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,1) 60%, rgba(255,255,255,0.7) 80%), url(/sidebar_bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
          borderRight: '1px solid var(--border)'
        }}
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px', padding: '0 24px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, flexDirection: 'column' }}>
            <img src="/assets/eoEf12a30xBVz5Q1VMqOk8gbgs.avif" alt="Peblo Logo" style={{ width: '80px', objectFit: 'contain' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '1px' }}>CMS</span>
          </h2>
          <button className="mobile-only" onClick={() => setSidebarOpen(false)} style={{ color: 'var(--text-muted)', position: 'absolute', right: '16px', top: '24px' }}>
            <X size={24} />
          </button>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
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

        <div style={{ marginTop: 'auto', padding: '16px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '20px', cursor: 'pointer', border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.8)' }} onClick={logout} title="Logout">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--purple-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple-700)', fontWeight: 'bold', overflow: 'hidden' }}>
                <img src="/assets/eoEf12a30xBVz5Q1VMqOk8gbgs.avif" alt="avatar" style={{width: '28px', objectFit: 'cover'}} />
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

      {/* Responsive Adjustments + Nav Focus Fix */}
      <style>{`
        .sidebar { 
          position: sticky; 
          top: 0; 
          height: 100vh; 
        }
        .mobile-only { display: none !important; }
        .main-content { 
          flex: 1; 
          min-width: 0; 
          box-sizing: border-box; 
        }
        /* Remove browser default black outline on nav links.
           We keep :focus-visible for keyboard accessibility with a purple ring. */
        nav a {
          outline: none;
        }
        nav a:focus-visible {
          outline: 2px solid var(--purple-500);
          outline-offset: 2px;
        }
        nav a:hover:not([aria-current="page"]) {
          background-color: #f5f3ff !important;
          color: var(--purple-700) !important;
        }
        @media (max-width: 1024px) {
          .sidebar { 
            position: fixed; 
            left: -100%; 
          }
          .sidebar.open {
            left: 0 !important;
          }
          .mobile-only { display: block !important; }
        }
      `}</style>

      {/* Main Content */}
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {!(location.pathname.includes('/new') || location.pathname.includes('/edit') || location.pathname === '/validation' || location.pathname === '/publish' || location.pathname === '/publish-history' || location.pathname.startsWith('/settings')) ? (
          <header style={{ display: 'flex', alignItems: 'center', padding: '32px 32px 0 32px', gap: '16px', background: 'transparent', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <button className="mobile-only" onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-main)', display: 'none' }}>
              <Menu size={24} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: '800', fontSize: '28px', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
                {location.pathname === '/dashboard' ? `${getGreeting()}, ${getUserName()}! 👋` : getPageTitle()}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                {location.pathname === '/dashboard' ? 'Here\'s what\'s happening with your content today.' : 
                 location.pathname.startsWith('/shows') ? 'Manage and organize all your shows in the library.' : 
                 location.pathname.startsWith('/episodes') ? 'Manage and organize all episodes in your library.' : 
                 location.pathname.startsWith('/validation') ? 'Review and fix issues before publishing content.' :
                 location.pathname.startsWith('/publish-history') ? 'View past publish runs and their outcomes.' :
                 location.pathname.startsWith('/publish') ? 'Publish validated content to the live catalogue.' : ''}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '24px' }}>
              {(location.pathname.startsWith('/shows') || location.pathname.startsWith('/episodes')) && (
                <button 
                  onClick={() => navigate(location.pathname.startsWith('/shows') ? '/shows/new' : '/episodes/new')}
                  className="btn btn-primary" style={{ height: '40px', padding: '0 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--purple-700)', color: '#FFFFFF', border: 'none', boxShadow: '0 4px 12px rgba(109, 40, 217, 0.25)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <Plus size={18} /> {location.pathname.startsWith('/shows') ? 'Create New' : 'Add New Episode'}
                </button>
              )}
            </div>
          </header>
        ) : (
          <header className="mobile-only" style={{ height: 'auto', padding: '24px 32px 0 32px', display: 'none' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-main)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Menu size={24} />
            </button>
          </header>
        )}
        <main style={{ flex: 1, padding: '24px 32px 32px 32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
