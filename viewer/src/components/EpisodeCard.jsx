import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { FallbackImage } from './ShowCard';
import { formatDuration, resolveAssetUrl } from '../utils/catalogue';

export const EpisodeCard = ({ episode, width = '290px' }) => {
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
        gap: '0.65rem',
        outline: 'none',
        textDecoration: 'none',
      }}
      className="episode-card"
      aria-label={`Play ${episode.title}`}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(21, 27, 79, 0.05)',
          aspectRatio: '16/9',
          backgroundColor: '#EDE6FF',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px) scale(1.025)';
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(109, 53, 232, 0.14)';
          const overlay = e.currentTarget.querySelector('.play-overlay');
          if (overlay) overlay.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(21, 27, 79, 0.05)';
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
            backgroundColor: 'rgba(21, 27, 79, 0.35)',
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
              backgroundColor: 'var(--purple-700)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            }}
          >
            <Play size={20} fill="#ffffff" style={{ marginLeft: '2px' }} />
          </div>
        </div>

        {/* Duration badge on bottom-right of image */}
        {episode.duration_seconds > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              backgroundColor: 'rgba(16, 20, 58, 0.85)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
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
            fontSize: '1rem',
            fontWeight: 800,
            color: 'var(--navy-900)',
            margin: '0 0 0.3rem 0',
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
                  className="lang-chip"
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
