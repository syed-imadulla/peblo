import React from 'react';
import { FallbackImage } from './ShowCard';

export const EpisodeCard = ({ episode }) => {
  const thumbnail = episode.artwork?.find(a => a.type === 'thumbnail')?.url;

  return (
    <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        aspectRatio: '16/9'
      }}>
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={episode.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div style={{ display: thumbnail ? 'none' : 'flex', width: '100%', height: '100%' }}>
          <FallbackImage aspect="16/9" />
        </div>
      </div>
      
      <div>
        <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', margin: '0 0 0.25rem 0' }}>{episode.title}</h4>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {episode.duration_seconds && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {Math.floor(episode.duration_seconds / 60)}m {episode.duration_seconds % 60}s
            </span>
          )}
          {episode.languages && episode.languages.length > 0 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {episode.languages.map(lang => (
                <span key={lang} style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  backgroundColor: 'var(--purple-100)',
                  color: 'var(--purple-700)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 600
                }}>
                  {lang}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
