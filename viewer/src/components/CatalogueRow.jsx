import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CatalogueRow = ({ title, count, children }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -420 : 420;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="catalogue-row" style={{ marginBottom: '1.75rem', position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {title && (
            <h2
              style={{
                color: 'var(--navy-900)',
                textTransform: 'capitalize',
                fontSize: '1.35rem',
                fontWeight: 800,
                margin: 0,
              }}
            >
              {title}
            </h2>
          )}
          {typeof count === 'number' && (
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--purple-500)',
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              {count}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => scroll('left')}
            aria-label={`Scroll ${title} left`}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#121225',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#121225')}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label={`Scroll ${title} right`}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#121225',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#121225')}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: '18px',
          overflowX: 'auto',
          padding: '16px 8px 140px 8px',
          margin: '-16px -8px -120px -8px',
          scrollSnapType: 'x proximity',
        }}
      >
        {children}
      </div>
    </section>
  );
};
