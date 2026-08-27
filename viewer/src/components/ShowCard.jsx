import React from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';

export const FallbackImage = ({ aspect = '16/9' }) => (
  <div style={{
    width: '100%',
    aspectRatio: aspect,
    backgroundColor: 'var(--purple-100)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--purple-700)',
    borderRadius: 'var(--radius-md)'
  }}>
    <ImageIcon size={48} opacity={0.5} />
  </div>
);

export const ShowCard = ({ show }) => {
  const poster = show.artwork?.find(a => a.type === 'poster')?.url;
  
  return (
    <Link to={`/show/${show.slug}`} style={{ display: 'block', width: '200px', flexShrink: 0 }}>
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}>
        {poster ? (
          <img 
            src={poster} 
            alt={show.title} 
            style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div style={{ display: poster ? 'none' : 'flex', width: '100%' }}>
          <FallbackImage aspect="2/3" />
        </div>
      </div>
      <h3 style={{ marginTop: '0.75rem', fontSize: '1rem', color: 'var(--navy-900)' }}>{show.title}</h3>
      {show.categories && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{show.categories.join(', ')}</p>
      )}
    </Link>
  );
};
