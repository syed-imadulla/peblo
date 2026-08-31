import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Play, Info } from 'lucide-react';
import { getShowBanner, getShowPoster, getShowLanguages, getShowTotalEpisodes } from '../utils/catalogue';

export const FallbackImage = ({ aspect = '16/9' }) => (
  <div
    style={{
      width: '100%',
      aspectRatio: aspect,
      background: 'linear-gradient(140deg, #2D1A54 0%, #150F2C 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      borderRadius: '16px',
      position: 'relative',
      overflow: 'hidden',
      padding: '1rem',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: '-15%',
        right: '-15%',
        width: '110px',
        height: '110px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}
    />
    <div
      style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-10%',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}
    />

    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <Film size={18} color="#A78BFA" opacity={0.9} />
    </div>
  </div>
);

export const ShowCard = ({ show, width = '100%', typeLabel = 'Series' }) => {
  const image = getShowPoster(show);
  const languages = getShowLanguages(show);
  const category = show.categories && show.categories.length > 0 ? show.categories[0] : 'Adventure';
  const totalEpisodes = getShowTotalEpisodes(show);

  return (
    <div
      style={{
        width: width,
        flexShrink: 0,
      }}
      className="ott-card-slot"
    >
      <Link
        to={`/show/${show.slug || show.show_id}`}
        className="ott-floating-card show-card"
        aria-label={`View ${show.title}`}
      >
        <div className="ott-thumb-box">
          {image ? (
            <img
              src={image}
              alt={show.title}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                const fb = e.target.nextElementSibling;
                if (fb) fb.style.display = 'flex';
              }}
            />
          ) : null}
          <div style={{ display: image ? 'none' : 'flex', width: '100%', height: '100%' }}>
            <FallbackImage aspect="16/9" />
          </div>

          <div className="play-badge-overlay">
            <div className="play-badge-btn">
              <Play size={18} fill="var(--purple-700)" color="var(--purple-700)" style={{ marginLeft: '2px' }} />
            </div>
          </div>
        </div>

        <div className="ott-info-box">
          <h3 className="ott-card-title" title={show.title}>
            {show.title}
          </h3>

          <div className="ott-static-meta">
            <span style={{ textTransform: 'capitalize' }}>{typeLabel}</span>
            <span>·</span>
            <span style={{ textTransform: 'capitalize' }}>{category}</span>
            <span>·</span>
            <div style={{ display: 'inline-flex', gap: '3px' }}>
              {languages.length > 0 ? (
                languages.slice(0, 2).map((l) => (
                  <span key={l} className="lang-chip">{l}</span>
                ))
              ) : (
                <span className="lang-chip">EN</span>
              )}
            </div>
          </div>

          {/* Expanded Hover Area (Pops OUT over lane below) */}
          <div className="ott-hover-drawer">
            <div className="ott-hover-actions">
              <span className="btn-popover-play">
                <Play size={12} fill="#ffffff" /> Watch Now
              </span>
              <span className="btn-popover-circle" title="More Info">
                <Info size={13} />
              </span>
            </div>

            <div className="ott-hover-meta">
              <span className="meta-badge-purple">{typeLabel}</span>
              <span className="meta-dot">•</span>
              <span style={{ textTransform: 'capitalize' }}>{category}</span>
              {totalEpisodes > 0 && (
                <>
                  <span className="meta-dot">•</span>
                  <span>{totalEpisodes} Ep{totalEpisodes > 1 ? 's' : ''}</span>
                </>
              )}
            </div>

            {show.synopsis && (
              <p className="ott-hover-synopsis">
                {show.synopsis}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
