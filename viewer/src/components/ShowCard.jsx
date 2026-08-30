import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Play } from 'lucide-react';
import { getShowBanner, getShowPoster, getShowLanguages } from '../utils/catalogue';

export const FallbackImage = ({ aspect = '16/9' }) => (
  <div
    style={{
      width: '100%',
      aspectRatio: aspect,
      background: 'linear-gradient(140deg, #6C35E6 0%, #4D20A6 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      borderRadius: '18px',
      position: 'relative',
      overflow: 'hidden',
      padding: '1rem',
      textAlign: 'center',
    }}
  >
    {/* Subtle soft backdrop glowing accents */}
    <div
      style={{
        position: 'absolute',
        top: '-15%',
        right: '-15%',
        width: '110px',
        height: '110px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 230, 160, 0.25) 0%, transparent 70%)',
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
        background: 'radial-gradient(circle, rgba(160, 120, 255, 0.3) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}
    />

    <div
      style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <Film size={20} color="#ffffff" opacity={0.9} />
    </div>
  </div>
);

export const ShowCard = ({ show, width = '280px', typeLabel = 'Series' }) => {
  // Use banner (16:9) first, fallback to poster
  const image = getShowBanner(show) || getShowPoster(show);
  const languages = getShowLanguages(show);
  const category = show.categories && show.categories.length > 0 ? show.categories[0] : 'Adventure';

  return (
    <Link
      to={`/show/${show.slug || show.show_id}`}
      style={{
        width: width,
        flexShrink: 0,
        outline: 'none',
        textDecoration: 'none',
      }}
      className="show-card"
      aria-label={`View ${show.title}`}
    >
      <div
        className="show-card-thumb"
        style={{
          backgroundColor: '#EDE6FF',
          aspectRatio: '16/9',
        }}
      >
        {image ? (
          <img
            src={image}
            alt={show.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'filter 0.25s ease',
            }}
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

        {/* Hover play icon overlay */}
        <div className="play-badge-overlay">
          <div className="play-badge-btn">
            <Play size={20} fill="var(--purple-700)" color="var(--purple-700)" style={{ marginLeft: '2px' }} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '0.65rem' }}>
        <h3
          style={{
            fontSize: '1.02rem',
            fontWeight: 800,
            color: 'var(--navy-900)',
            marginBottom: '0.25rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}
          title={show.title}
        >
          {show.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{typeLabel}</span>
          <span>·</span>
          <span style={{ textTransform: 'capitalize' }}>{category}</span>
          <span>·</span>
          <div style={{ display: 'inline-flex', gap: '4px' }}>
            <span className="lang-chip">EN</span>
            <span className="lang-chip">HI</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
