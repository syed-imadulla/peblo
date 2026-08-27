import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const Layout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        backgroundColor: 'var(--surface)',
        padding: '1rem 2rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--purple-700)' }}>
          Peblo TV
        </Link>
        <form onSubmit={handleSearch} style={{ display: 'flex', position: 'relative', width: '300px' }}>
          <input
            type="text"
            placeholder="Search shows and episodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              fontSize: '1rem',
              outline: 'none',
              color: 'var(--navy-900)'
            }}
          />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </form>
      </header>
      
      <main style={{ flex: 1, padding: '2rem' }} className="container">
        <Outlet />
      </main>
      
      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)'
      }}>
        <p>© 2026 Peblo TV Mini</p>
      </footer>
    </div>
  );
};

export default Layout;
