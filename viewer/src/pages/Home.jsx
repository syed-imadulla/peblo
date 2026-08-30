import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Info, Sparkles, Compass } from 'lucide-react';
import { getCatalog } from '../api';
import { CatalogueRow } from '../components/CatalogueRow';
import { ShowCard, FallbackImage } from '../components/ShowCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getShowBanner, getShowLanguages } from '../utils/catalogue';

const Home = () => {
  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Could not load the catalogue. Is the backend running?" />;

  const sections = Object.keys(catalog || {});
  if (sections.length === 0) return <EmptyState message="The catalogue is completely empty!" />;

  // Pick the hero show: First show from 'featured' section or first available show
  const featuredShows = catalog.featured || [];
  const heroShow = featuredShows[0] || Object.values(catalog).flat()[0];
  const heroBanner = getShowBanner(heroShow);
  const heroLanguages = getShowLanguages(heroShow);

  // Find first playable episode or trailer for the hero "Watch Now" button
  const firstPlayableContentGroup =
    heroShow?.seasons?.[0]?.episodes?.[0]?.content_group ||
    heroShow?.trailers?.[0]?.content_group;

  const popularCategories = [
    'adventure',
    'learning',
    'music',
    'india',
    'friendship',
    'stories',
    'nature',
    'values',
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Featured Hero Billboard */}
      {heroShow && (
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: 'var(--navy-950)',
            color: '#ffffff',
            boxShadow: 'var(--shadow-lg)',
            minHeight: '340px',
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          {/* Hero Backdrop Banner */}
          {heroBanner ? (
            <img
              src={heroBanner}
              alt={heroShow.title}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.5,
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
              <FallbackImage aspect="16/9" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(20, 9, 41, 0.2) 0%, rgba(20, 9, 41, 0.85) 65%, rgba(20, 9, 41, 0.98) 100%)',
            }}
          />

          {/* Hero Content */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '2.5rem',
              maxWidth: '720px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  backgroundColor: 'var(--purple-600)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={12} /> Featured Premiere
              </span>

              {heroShow.categories?.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    textTransform: 'capitalize',
                  }}
                >
                  {cat}
                </span>
              ))}

              {heroLanguages.length > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {heroLanguages.join(' / ')}
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: '2.4rem',
                color: '#ffffff',
                fontWeight: 800,
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: '-0.5px',
              }}
            >
              Watch {heroShow.title}
            </h1>

            <p
              style={{
                fontSize: '1.05rem',
                color: 'rgba(255, 255, 255, 0.82)',
                lineHeight: 1.5,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {heroShow.synopsis || 'Explore episodes and fun learning stories on Peblo TV!'}
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {firstPlayableContentGroup && (
                <Link
                  to={`/episode/${firstPlayableContentGroup}`}
                  className="btn btn-primary"
                  style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}
                >
                  <Play size={18} fill="#ffffff" /> Watch Now
                </Link>
              )}

              <Link
                to={`/show/${heroShow.slug || heroShow.show_id}`}
                className="btn"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  padding: '0.8rem 1.5rem',
                  fontSize: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                <Info size={18} /> Show Details
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Category Quick-Filter Strip */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Popular Topics
          </span>
          <Link
            to="/browse"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--purple-700)',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            <Compass size={15} /> All Shows
          </Link>
        </div>

        <div
          className="hide-scrollbar"
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
          }}
        >
          {popularCategories.map((cat) => (
            <Link
              key={cat}
              to={`/browse?category=${cat}`}
              style={{
                padding: '0.45rem 1rem',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--navy-900)',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--purple-100)';
                e.currentTarget.style.borderColor = 'var(--purple-200)';
                e.currentTarget.style.color = 'var(--purple-700)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface)';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--navy-900)';
              }}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Section Rows (featured, series, minisodes, songs) */}
      <div>
        {sections.map((section) => {
          const shows = catalog[section];
          if (!shows || shows.length === 0) return null;

          return (
            <CatalogueRow key={section} title={section} count={shows.length}>
              {shows.map((show) => (
                <ShowCard key={show.show_id} show={show} />
              ))}
            </CatalogueRow>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
