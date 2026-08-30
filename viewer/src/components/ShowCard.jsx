import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Play } from 'lucide-react';
import { getShowPoster, getShowLanguages, getShowTotalEpisodes } from '../utils/catalogue';

export const FallbackImage = ({ aspect = '2/3' }) => (
  <div
    style={{
      width: '100%',
      aspectRatio: aspect,
      backgroundColor: '#f3e8ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--purple-700)',
      borderRadius: 'var(--radius-md)',
    }}
  >
    <Film size={36} opacity={0.4} />
  </div>
);

export const ShowCard = ({ show, width = '190px' }) => {
  const poster = getShowPoster(show);
  const languages = getShowLanguages(show);
  const episodeCount = getShowTotalEpisodes(show);

  return (
    <Link
      to={`/show/${show.slug || show.show_id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: width,
        flexShrink: 0,
        outline: 'none',
        borderRadius: 'var(--radius-md)',
      }}
      className="show-card group"
      aria-label={`View ${show.title}`}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          backgroundColor: 'var(--surface)',
          aspectRatio: '2/3',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          const overlay = e.currentTarget.querySelector('.play-overlay');
          if (overlay) overlay.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          const overlay = e.currentTarget.querySelector('.play-overlay');
          if (overlay) overlay.style.opacity = '0';
        }}
      >
        {poster ? (
          <img
            src={poster}
            alt={show.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              const fb = e.target.nextElementSibling;
              if (fb) fb.style.display = 'flex';
            }}
          />
        ) : null}
        <div style={{ display: poster ? 'none' : 'flex', width: '100%', height: '100%' }}>
          <FallbackImage aspect="2/3" title={show.title} />
        </div>

        {/* Hover play icon overlay */}
        <div
          className="play-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(25, 10, 45, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--purple-600)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <Play size={20} fill="#ffffff" style={{ marginLeft: '2px' }} />
          </div>
        </div>

        {/* Top Badges */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '4px',
          }}
        >
          {episodeCount > 0 && (
            <span
              style={{
                backgroundColor: 'rgba(20, 9, 41, 0.85)',
                backdropFilter: 'blur(4px)',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              {episodeCount} {episodeCount === 1 ? 'ep' : 'eps'}
            </span>
          )}
        </div>
      </div>

      <div style={{ marginTop: '0.65rem' }}>
        <h3
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: 'var(--navy-900)',
            marginBottom: '0.2rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={show.title}
        >
          {show.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {show.categories && show.categories.length > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >
              {show.categories[0]}
            </span>
          )}

          {languages.length > 0 && (
            <span
              style={{
                fontSize: '0.65rem',
                backgroundColor: 'var(--purple-100)',
                color: 'var(--purple-700)',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              {languages.join(', ')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
