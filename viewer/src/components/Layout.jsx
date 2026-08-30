import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, Search, Globe, ChevronDown, Menu, X } from 'lucide-react';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('EN');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/browse', label: 'Browse', icon: LayoutGrid },
    { to: '/search', label: 'Search', icon: Search },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
      {/* Clean White Top Navigation Bar */}
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #F0EDF7',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '0.85rem 0',
          boxShadow: '0 1px 4px rgba(21, 27, 79, 0.02)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            padding: '0 2.5rem',
          }}
        >
          {/* Left: PeBlo Logo + TV Pill Badge */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
            aria-label="Peblo TV Home"
          >
            <span
              style={{
                fontSize: '1.65rem',
                fontWeight: 900,
                color: 'var(--purple-700)',
                letterSpacing: '-0.75px',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              PeBlo
            </span>
            <span
              style={{
                backgroundColor: 'var(--purple-100)',
                color: 'var(--purple-700)',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.5px',
                lineHeight: 1.2,
              }}
            >
              TV
            </span>
          </Link>

          {/* Center: Desktop Navigation Items */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }} className="desktop-nav">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '0.5rem 1.15rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.92rem',
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? 'var(--purple-700)' : 'var(--text-nav)',
                  backgroundColor: isActive ? 'var(--purple-100)' : 'transparent',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none',
                })}
              >
                <Icon size={16} strokeWidth={2.2} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right: Language Selector & Profile Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Language Selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid #EAE6F4',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--navy-900)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                aria-label="Select Language"
              >
                <Globe size={15} color="var(--text-muted)" />
                <span>{selectedLang}</span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {langDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #EAE6F4',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-md)',
                    padding: '6px',
                    minWidth: '120px',
                    zIndex: 110,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <button
                    onClick={() => {
                      setSelectedLang('EN');
                      setLangDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: selectedLang === 'EN' ? 700 : 500,
                      color: selectedLang === 'EN' ? 'var(--purple-700)' : 'var(--navy-900)',
                      backgroundColor: selectedLang === 'EN' ? 'var(--purple-100)' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    English (EN)
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLang('HI');
                      setLangDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: selectedLang === 'HI' ? 700 : 500,
                      color: selectedLang === 'HI' ? 'var(--purple-700)' : 'var(--navy-900)',
                      backgroundColor: selectedLang === 'HI' ? 'var(--purple-100)' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    Hindi (HI)
                  </button>
                </div>
              )}
            </div>

            {/* Child Profile Avatar */}
            <Link
              to="/profile"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #EAE6F4',
                backgroundColor: '#FFE9D6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(21, 27, 79, 0.06)',
                flexShrink: 0,
              }}
              aria-label="Viewer Profile"
            >
              <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="16" fill="#FFDFC6" />
                <path d="M10 14C10 9.58 13.58 6 18 6C22.42 6 26 9.58 26 14C26 15 25 15.5 24 14C23 12.5 21 11 18 11C15 11 13 12.5 12 14C11 15.5 10 15 10 14Z" fill="#5A3921" />
                <circle cx="14" cy="18" r="2" fill="#2A1B12" />
                <circle cx="22" cy="18" r="2" fill="#2A1B12" />
                <path d="M15 22C15.8 23.5 20.2 23.5 21 22" stroke="#D9534F" strokeWidth="2" strokeLinecap="round" />
                <circle cx="11.5" cy="20" r="1.5" fill="#FFAAA6" />
                <circle cx="24.5" cy="20" r="1.5" fill="#FFAAA6" />
                <path d="M9 32C9 28 13 26 18 26C23 26 27 28 27 32" fill="#6D35E8" />
              </svg>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
              style={{
                display: 'none',
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: '1px solid #EAE6F4',
                color: 'var(--navy-900)',
              }}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #F0EDF7',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: isActive ? 'var(--purple-700)' : 'var(--navy-900)',
                  backgroundColor: isActive ? 'var(--purple-100)' : 'transparent',
                  textDecoration: 'none',
                })}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1.75rem 0 3rem 0' }}>
        <div className="container" style={{ padding: '0 2.5rem' }}>
          <Outlet />
        </div>
      </main>

      {/* Responsive CSS for Header */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
