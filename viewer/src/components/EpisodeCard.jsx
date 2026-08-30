import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { FallbackImage } from './ShowCard';
import { formatDuration, resolveAssetUrl } from '../utils/catalogue';

export const EpisodeCard = ({ episode, width = '260px' }) => {
  const rawThumbnail = episode.artwork?.thumbnail || episode.artwork?.banner || episode.artwork?.poster;
  const thumbnail = resolveAssetUrl(rawThumbnail);

  return (
    <Link
      to={`/episode/${episode.content_group}`}
      style={{
        width: width,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        outline: 'none',
        borderRadius: 'var(--radius-md)',
      }}
      className="episode-card"
      aria-label={`Play ${episode.title}`}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          aspectRatio: '16/9',
          backgroundColor: 'var(--surface)',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
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
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={episode.title}
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
        <div style={{ display: thumbnail ? 'none' : 'flex', width: '100%', height: '100%' }}>
          <FallbackImage aspect="16/9" title={episode.title} />
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
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--purple-600)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <Play size={18} fill="#ffffff" style={{ marginLeft: '2px' }} />
          </div>
        </div>

        {/* Duration badge on bottom-right of image */}
        {episode.duration_seconds > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              backgroundColor: 'rgba(20, 9, 41, 0.85)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Clock size={11} />
            {formatDuration(episode.duration_seconds)}
          </div>
        )}
      </div>

      <div>
        <h4
          style={{
            fontSize: '0.92rem',
            fontWeight: 700,
            color: 'var(--navy-900)',
            margin: '0 0 0.25rem 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={episode.title}
        >
          {episode.title}
        </h4>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {episode.languages && episode.languages.length > 0 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {episode.languages.map((lang) => (
                <span
                  key={lang}
                  style={{
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    backgroundColor: 'var(--purple-100)',
                    color: 'var(--purple-700)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: 700,
                  }}
                >
                  {lang}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
