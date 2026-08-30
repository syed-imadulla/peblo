import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Play } from 'lucide-react';
import { getShowBanner, getShowPoster, getShowLanguages } from '../utils/catalogue';

export const FallbackImage = ({ aspect = '16/9' }) => (
  <div
    style={{
      width: '100%',
      aspectRatio: aspect,
      backgroundColor: '#F1ECFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--purple-700)',
      borderRadius: 'var(--radius-md)',
    }}
  >
    <Film size={32} opacity={0.4} />
  </div>
);

export const ShowCard = ({ show, width = '225px', typeLabel = 'Series' }) => {
  // Use banner (16:9) first, fallback to poster
  const image = getShowBanner(show) || getShowPoster(show);
  const languages = getShowLanguages(show);
  const category = show.categories && show.categories.length > 0 ? show.categories[0] : 'Adventure';

  return (
    <Link
      to={`/show/${show.slug || show.show_id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: width,
        flexShrink: 0,
        outline: 'none',
        textDecoration: 'none',
      }}
      className="show-card group"
      aria-label={`View ${show.title}`}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: '#EDE6FF',
          aspectRatio: '16/9',
          boxShadow: 'var(--shadow-sm)',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
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
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--purple-700)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <Play size={17} fill="#ffffff" style={{ marginLeft: '2px' }} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '0.6rem' }}>
        <h3
          style={{
            fontSize: '0.94rem',
            fontWeight: 800,
            color: 'var(--navy-900)',
            marginBottom: '0.2rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}
          title={show.title}
        >
          {show.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ textTransform: 'capitalize' }}>{typeLabel}</span>
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
