import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Info } from 'lucide-react';
import { FallbackImage } from './ShowCard';
import { formatDuration, resolveAssetUrl } from '../utils/catalogue';

export const EpisodeCard = ({ episode, width = '100%' }) => {
  const rawThumbnail = episode.artwork?.thumbnail || episode.artwork?.banner || episode.artwork?.poster;
  const thumbnail = resolveAssetUrl(rawThumbnail);

  return (
    <div
      style={{
        width: width,
        flexShrink: 0,
        position: 'relative',
      }}
      className="episode-card-container"
    >
      <Link
        to={`/episode/${episode.content_group}`}
        className="episode-card"
        aria-label={`Play ${episode.title}`}
      >
        <div className="episode-card-thumb">
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
            <div className="card-duration-badge">
              <Clock size={10} />
              {formatDuration(episode.duration_seconds)}
            </div>
          )}
        </div>

        {/* Base Visible Info */}
        <div className="episode-card-base-info">
          <h4 className="episode-card-title" title={episode.title}>
            {episode.title}
          </h4>

          <div className="episode-card-subline">
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

        {/* Expanded Hover Drawer (Amazon Prime Video & JioHotstar Style) */}
        <div className="card-hover-drawer">
          <div className="card-hover-actions">
            <span className="btn-play-mini">
              <Play size={12} fill="#ffffff" /> Play
            </span>
            <span className="btn-info-circle" title="Play">
              <Info size={13} />
            </span>
          </div>

          <div className="card-hover-meta">
            {episode.duration_seconds > 0 && (
              <span>{formatDuration(episode.duration_seconds)}</span>
            )}
            {episode.languages?.length > 0 && (
              <>
                <span className="meta-dot">•</span>
                <span>{episode.languages.join(', ')}</span>
              </>
            )}
          </div>

          {episode.synopsis && (
            <p className="card-hover-synopsis">
              {episode.synopsis}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};
