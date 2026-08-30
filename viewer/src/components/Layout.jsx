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
      setScrolled(window.scrollY > 10);
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
      {/* ─── Top-Attached Liquid Glass Island Navbar ───────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            width: 'calc(100% - 40px)',
            maxWidth: '1440px',
            backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.90)' : 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: '0 0 22px 22px',
            border: '1px solid rgba(230, 222, 246, 0.8)',
            borderTop: 'none',
            boxShadow: scrolled
              ? '0 8px 24px rgba(21, 27, 79, 0.06), 0 2px 6px rgba(109, 53, 232, 0.03), inset 0 -1px 0 rgba(255, 255, 255, 0.9)'
              : '0 4px 18px rgba(21, 27, 79, 0.04), inset 0 -1px 0 rgba(255, 255, 255, 0.9)',
            padding: '0.5rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.25rem',
            transition: 'all 0.2s ease',
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
                backgroundColor: 'rgba(109, 53, 232, 0.12)',
                color: 'var(--purple-700)',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.5px',
                lineHeight: 1.2,
                backdropFilter: 'blur(4px)',
              }}
            >
              TV
            </span>
          </Link>

          {/* Center: Liquid Glass Nav Pills */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(241, 236, 255, 0.45)',
              padding: '3px',
              borderRadius: '999px',
              border: '1px solid rgba(230, 222, 246, 0.65)',
              backdropFilter: 'blur(12px)',
            }}
            className="desktop-nav"
          >
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.4rem 1.1rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? '#ffffff' : 'var(--navy-900)',
                  background: isActive
                    ? 'linear-gradient(180deg, #7E45F2 0%, #632BD9 100%)'
                    : 'transparent',
                  boxShadow: isActive
                    ? '0 2px 10px rgba(109, 53, 232, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                    : 'none',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  textDecoration: 'none',
                })}
              >
                <Icon size={15} strokeWidth={2.2} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right: Language Selector & Profile Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                  border: '1px solid rgba(230, 222, 246, 0.8)',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(8px)',
                  color: 'var(--navy-900)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 6px rgba(21, 27, 79, 0.03)',
                }}
                aria-label="Select Language"
              >
                <Globe size={13} color="var(--purple-700)" />
                <span>{selectedLang}</span>
                <ChevronDown size={12} color="var(--text-muted)" />
              </button>

              {langDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(230, 222, 246, 0.9)',
                    borderRadius: '14px',
                    boxShadow: '0 8px 24px rgba(21, 27, 79, 0.1)',
                    padding: '5px',
                    minWidth: '125px',
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
                      padding: '7px 10px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: selectedLang === 'EN' ? 700 : 500,
                      color: selectedLang === 'EN' ? 'var(--purple-700)' : 'var(--navy-900)',
                      backgroundColor: selectedLang === 'EN' ? 'rgba(109, 53, 232, 0.1)' : 'transparent',
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
                      padding: '7px 10px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: selectedLang === 'HI' ? 700 : 500,
                      color: selectedLang === 'HI' ? 'var(--purple-700)' : 'var(--navy-900)',
                      backgroundColor: selectedLang === 'HI' ? 'rgba(109, 53, 232, 0.1)' : 'transparent',
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
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(230, 222, 246, 0.9)',
                backgroundColor: '#FFE9D6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(21, 27, 79, 0.06)',
                flexShrink: 0,
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              aria-label="Viewer Profile"
            >
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
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
                padding: '5px',
                borderRadius: '8px',
                backgroundColor: 'rgba(241, 236, 255, 0.6)',
                border: '1px solid rgba(230, 222, 246, 0.8)',
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
              position: 'absolute',
              top: '100%',
              width: 'calc(100% - 40px)',
              maxWidth: '1440px',
              padding: '0.75rem 1.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '0 0 20px 20px',
              border: '1px solid rgba(230, 222, 246, 0.9)',
              borderTop: 'none',
              boxShadow: '0 8px 24px rgba(21, 27, 79, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              pointerEvents: 'auto',
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
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: isActive ? 'var(--purple-700)' : 'var(--navy-900)',
                  backgroundColor: isActive ? 'var(--purple-100)' : 'transparent',
                  textDecoration: 'none',
                })}
              >
                <Icon size={17} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1.75rem 0 3rem 0' }}>
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
