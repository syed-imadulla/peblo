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
      }}
      className="ott-card-slot"
    >
      <Link
        to={`/episode/${episode.content_group}`}
        className="ott-floating-card episode-card"
        aria-label={`Play ${episode.title}`}
      >
        <div className="ott-thumb-box">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={episode.title}
              loading="lazy"
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

          <div className="play-badge-overlay">
            <div className="play-badge-btn">
              <Play size={18} fill="var(--purple-700)" color="var(--purple-700)" style={{ marginLeft: '2px' }} />
            </div>
          </div>

          {episode.duration_seconds > 0 && (
            <div className="card-duration-badge">
              <Clock size={10} />
              {formatDuration(episode.duration_seconds)}
            </div>
          )}
        </div>

        <div className="ott-info-box">
          <h4 className="ott-card-title" title={episode.title}>
            {episode.title}
          </h4>

          <div className="ott-static-meta">
            {episode.languages && episode.languages.length > 0 && (
              <div style={{ display: 'flex', gap: '3px' }}>
                {episode.languages.slice(0, 2).map((lang) => (
                  <span key={lang} className="lang-chip">
                    {lang}
                  </span>
                ))}
              </div>
            )}
            {episode.duration_seconds > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: '0.74rem' }}>
                {formatDuration(episode.duration_seconds)}
              </span>
            )}
          </div>

          {/* Expanded Hover Area */}
          <div className="ott-hover-drawer">
            <div className="ott-hover-actions">
              <span className="btn-popover-play">
                <Play size={12} fill="#ffffff" /> Play Episode
              </span>
              <span className="btn-popover-circle" title="Play">
                <Info size={13} />
              </span>
            </div>

            <div className="ott-hover-meta">
              {episode.duration_seconds > 0 && (
                <span>{formatDuration(episode.duration_seconds)}</span>
              )}
              {episode.languages?.length > 0 && (
                <>
                  <span className="meta-dot">•</span>
                  <div style={{ display: 'inline-flex', gap: '3px' }}>
                    {episode.languages.map((lang) => (
                      <span key={lang} className="lang-chip">
                        {lang}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {episode.synopsis && (
              <p className="ott-hover-synopsis">
                {episode.synopsis}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
