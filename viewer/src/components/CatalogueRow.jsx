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
    <section className="catalogue-row" style={{ marginBottom: '2.5rem', position: 'relative' }}>
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
                color: 'var(--purple-700)',
                backgroundColor: 'var(--purple-100)',
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
              backgroundColor: '#ffffff',
              border: '1px solid #ECE4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--navy-900)',
              boxShadow: '0 2px 6px rgba(21, 27, 79, 0.04)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--purple-100)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
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
              backgroundColor: '#ffffff',
              border: '1px solid #ECE4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--navy-900)',
              boxShadow: '0 2px 6px rgba(21, 27, 79, 0.04)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--purple-100)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
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
          padding: '12px 6px 16px 6px',
          margin: '-12px -6px 0 -6px',
          scrollSnapType: 'x proximity',
        }}
      >
        {children}
      </div>
    </section>
  );
};
