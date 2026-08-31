import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LayoutDashboard, Film, UploadCloud, FileText, Menu, X, PlaySquare, History, Plus, Settings } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Shows', path: '/shows', icon: Film },
    { name: 'Episodes', path: '/episodes', icon: PlaySquare },
    { name: 'Validation', path: '/validation', icon: FileText },
    { name: 'Publish', path: '/publish', icon: UploadCloud, adminOnly: true },
    { name: 'Publish History', path: '/publish-history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings, adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || user?.role === 'admin');

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

  const hasCustomPageHeader = (
    location.pathname.includes('/new') || 
    location.pathname.includes('/edit') || 
    location.pathname === '/validation' || 
    location.pathname === '/publish' || 
    location.pathname === '/publish-history' || 
    location.pathname.startsWith('/settings')
  );

  return (
    <div className="layout-root">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
      >
        <div className="sidebar-brand-container">
          <h2 className="sidebar-brand-title">
            <img 
              src="/eoEf12a30xBVz5Q1VMqOk8gbgs.avif" 
              alt="Peblo Logo" 
              className="sidebar-logo-img"
              onError={(e) => { e.target.src = '/assets/eoEf12a30xBVz5Q1VMqOk8gbgs.avif'; }}
            />
            <span className="sidebar-cms-badge">CMS</span>
          </h2>
          <button 
            type="button"
            className="mobile-close-btn" 
            onClick={() => setSidebarOpen(false)} 
            aria-label="Close sidebar"
          >
            <X size={22} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.name} 
              to={item.path} 
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => isActive ? { ...itemStyle, ...activeStyle } : itemStyle}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div 
            className="user-profile-card" 
            onClick={logout} 
            title="Logout"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') logout(); }}
          >
            <div className="user-profile-left">
              <div className="avatar-circle">
                <img 
                  src="/eoEf12a30xBVz5Q1VMqOk8gbgs.avif" 
                  alt="avatar" 
                  className="avatar-img"
                  onError={(e) => { e.target.src = '/assets/eoEf12a30xBVz5Q1VMqOk8gbgs.avif'; }}
                />
              </div>
              <div className="user-text-info">
                <div className="user-name">
                  {user?.role === 'admin' ? 'Admin User' : 'Editor User'}
                </div>
                <div className="user-role-label">
                  {user?.role === 'admin' ? 'Administrator' : 'Editor'}
                </div>
              </div>
            </div>
            <div className="logout-icon-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {!hasCustomPageHeader ? (
          <header className="cms-header">
            <div className="header-inner">
              <button 
                type="button"
                className="mobile-menu-trigger" 
                onClick={() => setSidebarOpen(true)} 
                aria-label="Open sidebar menu"
              >
                <Menu size={20} />
              </button>
              
              <div className="header-titles">
                <div className="page-heading">
                  {location.pathname === '/dashboard' ? `${getGreeting()}, ${getUserName()}! 👋` : getPageTitle()}
                </div>
                <div className="page-subheading">
                  {location.pathname === '/dashboard' ? 'Here\'s what\'s happening with your content today.' : 
                   location.pathname.startsWith('/shows') ? 'Manage and organize all your shows in the library.' : 
                   location.pathname.startsWith('/episodes') ? 'Manage and organize all episodes in your library.' : 
                   location.pathname.startsWith('/validation') ? 'Review and fix issues before publishing content.' :
                   location.pathname.startsWith('/publish-history') ? 'View past publish runs and their outcomes.' :
                   location.pathname.startsWith('/publish') ? 'Publish validated content to the live catalogue.' : ''}
                </div>
              </div>

              <div className="header-actions">
                {(location.pathname.startsWith('/shows') || location.pathname.startsWith('/episodes')) && (
                  <button 
                    onClick={() => navigate(location.pathname.startsWith('/shows') ? '/shows/new' : '/episodes/new')}
                    className="btn btn-primary create-btn"
                  >
                    <Plus size={18} /> 
                    <span>{location.pathname.startsWith('/shows') ? 'Create New' : 'Add New Episode'}</span>
                  </button>
                )}
              </div>
            </div>
          </header>
        ) : (
          <header className="mobile-page-topbar">
            <button 
              type="button"
              className="mobile-menu-trigger" 
              onClick={() => setSidebarOpen(true)} 
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
          </header>
        )}

        <main className="cms-main">
          <Outlet />
        </main>
      </div>

      {/* Scoped Responsive Styles */}
      <style>{`
        .layout-root {
          display: flex;
          min-height: 100vh;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          background: linear-gradient(180deg, #F0F5FF 0%, #F8F9FF 50%, #FAFAFF 100%);
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(2px);
          z-index: 90;
        }

        .sidebar {
          width: 250px;
          min-width: 250px;
          flex-shrink: 0;
          background-color: #FFFFFF;
          padding: 24px 0;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 100;
          transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          background-image: linear-gradient(to bottom, rgba(255,255,255,1) 60%, rgba(255,255,255,0.7) 80%), url(/sidebar_bg.jpg);
          background-size: cover;
          background-position: bottom center;
          box-shadow: 4px 0 24px rgba(0,0,0,0.02);
          border-right: 1px solid var(--border);
          box-sizing: border-box;
        }

        .sidebar-brand-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 32px;
          padding: 0 24px;
          position: relative;
        }

        .sidebar-brand-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          flex-direction: column;
        }

        .sidebar-logo-img {
          width: 80px;
          object-fit: contain;
          display: block;
        }

        .sidebar-cms-badge {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 600;
          letter-spacing: 1px;
        }

        .mobile-close-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--text-muted);
          position: absolute;
          right: 16px;
          top: 4px;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }

        .sidebar-nav a {
          outline: none;
        }
        .sidebar-nav a:focus-visible {
          outline: 2px solid var(--purple-500);
          outline-offset: 2px;
        }
        .sidebar-nav a:hover:not([aria-current="page"]) {
          background-color: #f5f3ff !important;
          color: var(--purple-700) !important;
        }

        .sidebar-footer {
          margin-top: auto;
          padding: 16px 20px 24px;
        }

        .user-profile-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 20px;
          cursor: pointer;
          border: 1px solid var(--border);
          background-color: rgba(255, 255, 255, 0.85);
          transition: background-color 0.2s ease;
        }
        .user-profile-card:hover {
          background-color: #FFFFFF;
        }

        .user-profile-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--purple-100);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--purple-700);
          font-weight: bold;
          overflow: hidden;
          flex-shrink: 0;
        }

        .avatar-img {
          width: 28px;
          object-fit: cover;
        }

        .user-text-info {
          min-width: 0;
        }

        .user-name {
          font-weight: 700;
          font-size: 13px;
          color: var(--navy-900);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: capitalize;
        }

        .logout-icon-wrap {
          color: var(--purple-700);
          flex-shrink: 0;
        }

        .main-content {
          flex: 1;
          min-width: 0;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          box-sizing: border-box;
        }

        .cms-header {
          padding: 32px 32px 0 32px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .header-inner {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .mobile-menu-trigger {
          display: none;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          color: var(--navy-900);
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          flex-shrink: 0;
        }

        .header-titles {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .page-heading {
          font-weight: 800;
          font-size: 28px;
          color: var(--navy-900);
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.5px;
          line-height: 1.25;
        }

        .page-subheading {
          color: var(--text-muted);
          font-size: 15px;
          margin-top: 2px;
          line-height: 1.4;
        }

        .header-actions {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .create-btn {
          height: 40px;
          padding: 0 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--purple-700);
          color: #FFFFFF;
          border: none;
          box-shadow: 0 4px 12px rgba(109, 40, 217, 0.25);
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .mobile-page-topbar {
          display: none;
          padding: 16px 20px 0 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .cms-main {
          flex: 1;
          padding: 24px 32px 32px 32px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
        }

        /* BREAKPOINT: Tablet & Collapsed Sidebar */
        @media (max-width: 1024px) {
          .sidebar {
            position: fixed;
            left: -280px;
            top: 0;
            bottom: 0;
            height: 100vh;
            box-shadow: 0 0 30px rgba(0,0,0,0.15);
          }
          .sidebar.open {
            left: 0 !important;
          }
          .mobile-close-btn {
            display: block;
          }
          .mobile-menu-trigger {
            display: inline-flex;
          }
          .mobile-page-topbar {
            display: block;
          }
          .cms-header {
            padding: 20px 20px 0 20px;
          }
          .cms-main {
            padding: 16px 20px 24px 20px;
          }
          .page-heading {
            font-size: 24px;
          }
          .page-subheading {
            font-size: 14px;
          }
        }

        /* BREAKPOINT: Mobile Screens */
        @media (max-width: 640px) {
          .cms-header {
            padding: 16px 16px 0 16px;
          }
          .cms-main {
            padding: 14px 16px 24px 16px;
          }
          .page-heading {
            font-size: 22px;
          }
          .page-subheading {
            font-size: 13px;
          }
          .header-inner {
            gap: 12px;
          }
          .header-actions {
            width: 100%;
            margin-left: 0;
            margin-top: 4px;
          }
          .create-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
