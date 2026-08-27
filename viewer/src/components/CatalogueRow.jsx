import React from 'react';

export const CatalogueRow = ({ title, children }) => {
  return (
    <section style={{ marginBottom: '3rem' }}>
      {title && <h2 style={{ color: 'var(--navy-900)', marginBottom: '1rem', textTransform: 'capitalize' }}>{title}</h2>}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '1rem',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {children}
      </div>
    </section>
  );
};
