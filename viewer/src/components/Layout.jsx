import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Search, Menu, X } from 'lucide-react';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
            backgroundColor: scrolled ? 'rgba(23, 23, 39, 0.94)' : 'rgba(23, 23, 39, 0.88)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: '0 0 22px 22px',
            border: '1px solid var(--border)',
            borderTop: 'none',
            boxShadow: scrolled
              ? '0 8px 28px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(124, 58, 237, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.05)'
              : '0 4px 20px rgba(0, 0, 0, 0.45), inset 0 -1px 0 rgba(255, 255, 255, 0.05)',
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
                color: 'var(--purple-500)',
                letterSpacing: '-0.75px',
              }}
            >
              PeBlo
            </span>
            <span
              style={{
                backgroundColor: 'rgba(124, 58, 237, 0.2)',
                color: 'var(--purple-500)',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.5px',
                lineHeight: 1.2,
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
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
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '3px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
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
                  color: isActive ? '#ffffff' : 'var(--text-nav)',
                  background: isActive
                    ? 'linear-gradient(180deg, #8B5CF6 0%, #7C3AED 100%)'
                    : 'transparent',
                  boxShadow: isActive
                    ? '0 2px 12px rgba(124, 58, 237, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
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

          {/* Right: Profile Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Child Profile Avatar */}
            <Link
              to="/profile"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(124, 58, 237, 0.4)',
                backgroundColor: '#191933',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                flexShrink: 0,
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              aria-label="Viewer Profile"
            >
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="16" fill="#2D2048" />
                <path d="M10 14C10 9.58 13.58 6 18 6C22.42 6 26 9.58 26 14C26 15 25 15.5 24 14C23 12.5 21 11 18 11C15 11 13 12.5 12 14C11 15.5 10 15 10 14Z" fill="#7C3AED" />
                <circle cx="14" cy="18" r="2" fill="#FAF7FF" />
                <circle cx="22" cy="18" r="2" fill="#FAF7FF" />
                <path d="M15 22C15.8 23.5 20.2 23.5 21 22" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" />
                <circle cx="11.5" cy="20" r="1.5" fill="#F472B6" />
                <circle cx="24.5" cy="20" r="1.5" fill="#F472B6" />
                <path d="M9 32C9 28 13 26 18 26C23 26 27 28 27 32" fill="#7C3AED" />
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
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-main)',
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
              backgroundColor: 'rgba(23, 23, 39, 0.96)',
              backdropFilter: 'blur(20px)',
              borderRadius: '0 0 20px 20px',
              border: '1px solid var(--border)',
              borderTop: 'none',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
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
                  color: isActive ? '#ffffff' : 'var(--text-main)',
                  backgroundColor: isActive ? 'var(--purple-700)' : 'transparent',
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
