import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Search, Globe, ChevronDown, Menu, X } from 'lucide-react';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('EN');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/browse', label: 'Browse', icon: LayoutGrid },
    { to: '/search', label: 'Search', icon: Search },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
      {/* Floating Sticky Navigation Bar */}
      <header
        style={{
          position: 'sticky',
          top: '12px',
          zIndex: 100,
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 1.5rem',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '24px',
            border: '1px solid rgba(237, 230, 250, 0.9)',
            boxShadow: scrolled
              ? '0 10px 30px rgba(21, 27, 79, 0.09), 0 2px 6px rgba(109, 53, 232, 0.04)'
              : '0 4px 20px rgba(21, 27, 79, 0.05)',
            padding: '0.6rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.25rem',
            transition: 'box-shadow 0.25s ease, background-color 0.25s ease, transform 0.2s ease',
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
              flexShrink: 0,
            }}
            aria-label="Peblo TV Home"
          >
            <img
              src="/peblo-logo.avif"
              alt="PeBlo"
              style={{
                height: '28px',
                width: 'auto',
                display: 'block',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                const textFallback = e.target.nextElementSibling;
                if (textFallback) textFallback.style.display = 'inline-block';
              }}
            />
            <span
              style={{
                display: 'none',
                fontSize: '1.45rem',
                fontWeight: 900,
                color: 'var(--purple-700)',
                letterSpacing: '-0.75px',
              }}
            >
              PeBlo
            </span>
            <span
              style={{
                backgroundColor: 'var(--purple-100)',
                color: 'var(--purple-700)',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.5px',
                lineHeight: 1.2,
              }}
            >
              TV
            </span>
          </Link>

          {/* Center: Desktop Navigation Items */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="desktop-nav">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '0.45rem 1.15rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.92rem',
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? 'var(--purple-700)' : 'var(--text-nav)',
                  backgroundColor: isActive ? 'var(--purple-100)' : 'transparent',
                  transition: 'all 0.18s ease',
                  textDecoration: 'none',
                })}
              >
                <Icon size={16} strokeWidth={2.2} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right: Language Selector & Profile Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Language Selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '0.35rem 0.8rem',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid #ECE6F6',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--navy-900)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                aria-label="Select Language"
              >
                <Globe size={14} color="var(--purple-600)" />
                <span>{selectedLang}</span>
                <ChevronDown size={13} color="var(--text-muted)" />
              </button>

              {langDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #EAE6F4',
                    borderRadius: '14px',
                    boxShadow: '0 8px 24px rgba(21, 27, 79, 0.12)',
                    padding: '6px',
                    minWidth: '130px',
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
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #EAE6F4',
                backgroundColor: '#FFE9D6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(21, 27, 79, 0.08)',
                flexShrink: 0,
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              aria-label="Viewer Profile"
            >
              <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
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
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              pointerEvents: 'auto',
              marginTop: '8px',
              padding: '0.85rem 1.2rem',
              borderRadius: '20px',
              border: '1px solid #ECE6F6',
              backgroundColor: '#ffffff',
              boxShadow: '0 8px 24px rgba(21, 27, 79, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
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
                  padding: '0.65rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
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
      <main style={{ flex: 1, padding: '1rem 0 3.5rem 0' }}>
        <div className="container" style={{ padding: '0 2rem' }}>
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
