import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { FallbackImage } from './ShowCard';
import { formatDuration, resolveAssetUrl } from '../utils/catalogue';

export const EpisodeCard = ({ episode, width = '100%' }) => {
  const rawThumbnail = episode.artwork?.thumbnail || episode.artwork?.banner || episode.artwork?.poster;
  const thumbnail = resolveAssetUrl(rawThumbnail);

  return (
    <Link
      to={`/episode/${episode.content_group}`}
      style={{
        width: width,
        flexShrink: 0,
        outline: 'none',
        textDecoration: 'none',
      }}
      className="episode-card"
      aria-label={`Play ${episode.title}`}
    >
      <div
        className="episode-card-thumb"
        style={{
          aspectRatio: '16/9',
          backgroundColor: '#EDE6FF',
          borderRadius: '16px',
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
              transition: 'filter 0.18s ease',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              const fb = e.target.nextElementSibling;
              if (fb) fb.style.display = 'flex';
            }}
          />
        ) : null}
        <div style={{ display: thumbnail ? 'none' : 'flex', width: '100%', height: '100%' }}>
          <FallbackImage aspect="16/9" />
        </div>

        {/* Hover play icon overlay */}
        <div className="play-badge-overlay">
          <div className="play-badge-btn">
            <Play size={18} fill="var(--purple-700)" color="var(--purple-700)" style={{ marginLeft: '2px' }} />
          </div>
        </div>

        {/* Duration badge on bottom-right of image */}
        {episode.duration_seconds > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              backgroundColor: 'rgba(16, 20, 58, 0.85)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              zIndex: 2,
            }}
          >
            <Clock size={10} />
            {formatDuration(episode.duration_seconds)}
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.6rem' }}>
        <h4
          style={{
            fontSize: '1rem',
            fontWeight: 800,
            color: 'var(--navy-900)',
            margin: '0 0 0.25rem 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}
          title={episode.title}
        >
          {episode.title}
        </h4>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
