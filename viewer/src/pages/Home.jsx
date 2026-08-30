import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Play,
  Info,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { getCatalog } from '../api';
import { ShowCard, FallbackImage } from '../components/ShowCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getShowBanner, getShowPoster } from '../utils/catalogue';

const Home = () => {
  const [heroIndex, setHeroIndex] = useState(0);
  const rowRefs = useRef({});

  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Could not load the catalogue. Is the backend running?" />;

  const rawSections = Object.keys(catalog || {});
  if (rawSections.length === 0) return <EmptyState message="The catalogue is currently empty. Publish shows in the CMS to see them here!" />;

  // Intended section ordering
  const preferredOrder = ['featured', 'minisodes', 'series', 'songs'];
  const sections = [
    ...preferredOrder.filter((s) => rawSections.includes(s)),
    ...rawSections.filter((s) => !preferredOrder.includes(s)),
  ];

  // Real-time Hero Shows: Pick featured list, or all catalog shows
  const featuredList = catalog.featured && catalog.featured.length > 0 ? catalog.featured : [];
  const allCatalogShows = Object.values(catalog).flat().filter(Boolean);
  if (allCatalogShows.length === 0) return <EmptyState message="No shows found in the catalogue." />;

  const heroPool = featuredList.length > 0 ? featuredList : allCatalogShows;
  const currentHeroIndex = Math.min(heroIndex, heroPool.length - 1);
  const heroShow = heroPool[currentHeroIndex] || heroPool[0];

  const heroBanner = getShowBanner(heroShow) || getShowPoster(heroShow);
  const firstPlayableContentGroup =
    heroShow?.seasons?.[0]?.episodes?.[0]?.content_group ||
    heroShow?.trailers?.[0]?.content_group;

  const heroTitle = heroShow.title;
  const heroSynopsis = heroShow.synopsis || "Explore fun, educational stories and adventures on PeBlo TV.";
  const heroCategories = heroShow.categories && heroShow.categories.length > 0 ? heroShow.categories : ['adventure', 'learning'];

  const nextHero = () => {
    setHeroIndex((prev) => (prev + 1) % heroPool.length);
  };

  const prevHero = () => {
    setHeroIndex((prev) => (prev - 1 + heroPool.length) % heroPool.length);
  };

  const scrollRow = (section, direction) => {
    const el = rowRefs.current[section];
    if (el) {
      const scrollAmt = direction === 'left' ? -420 : 420;
      el.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ─── Hero Billboard ──────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          borderRadius: '26px',
          overflow: 'hidden',
          backgroundColor: 'var(--surface)',
          minHeight: '380px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Right Half: Real Artwork with Soft Left Gradient Fade */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '62%',
            overflow: 'hidden',
          }}
        >
          {heroBanner ? (
            <img
              src={heroBanner}
              alt={heroTitle}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center right',
                display: 'block',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', opacity: 0.2 }}>
              <FallbackImage aspect="16/9" />
            </div>
          )}

          {/* Smooth left-to-right fade overlay into the dark card */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, #171727 0%, rgba(23, 23, 39, 0.95) 24%, rgba(23, 23, 39, 0) 65%)',
            }}
          />
        </div>

        {/* Left Half: Hero Billboard Content from Real Data */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '3rem 3.5rem',
            maxWidth: '560px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem',
          }}
        >
          {/* Featured Badge */}
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(124, 58, 237, 0.2)',
                color: 'var(--purple-500)',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '5px 14px',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.3px',
                border: '1px solid rgba(124, 58, 237, 0.3)',
              }}
            >
              <Sparkles size={14} fill="var(--purple-500)" /> Premiere
            </span>
          </div>

          {/* Real Title */}
          <h1
            style={{
              fontSize: '2.6rem',
              color: 'var(--navy-900)',
              fontWeight: 900,
              lineHeight: 1.15,
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            {heroShow.slug === 'motis-many-lives' ? heroShow.title : (allCatalogShows.length === 1 ? 'Featured Premiere' : heroShow.title)}
          </h1>

          {/* Real Synopsis */}
          <p
            style={{
              fontSize: '1.02rem',
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {heroSynopsis}
          </p>

          {/* Real Category Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {heroCategories.map((cat, idx) => (
              <span
                key={cat}
                style={{
                  backgroundColor: idx === 0 ? 'rgba(124, 58, 237, 0.18)' : idx === 1 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: idx === 0 ? 'var(--purple-500)' : idx === 1 ? '#34D399' : '#FBBF24',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '4px 13px',
                  borderRadius: 'var(--radius-pill)',
                  textTransform: 'capitalize',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.9rem', marginTop: '0.5rem' }}>
            {firstPlayableContentGroup ? (
              <Link
                to={`/episode/${firstPlayableContentGroup}`}
                className="btn btn-primary"
                style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}
              >
                <Play size={17} fill="#ffffff" /> Watch Now
              </Link>
            ) : (
              <Link
                to={`/show/${heroShow.slug || heroShow.show_id}`}
                className="btn btn-primary"
                style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}
              >
                <Play size={17} fill="#ffffff" /> Watch Now
              </Link>
            )}

            <Link
              to={`/show/${heroShow.slug || heroShow.show_id}`}
              className="btn btn-secondary"
              style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
            >
              <Info size={17} color="var(--text-main)" /> More Info
            </Link>
          </div>

          {/* Bottom Left Pagination Dots */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '0.75rem' }}>
            {heroPool.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroIndex(idx)}
                style={{
                  width: idx === currentHeroIndex ? '18px' : '7px',
                  height: '7px',
                  borderRadius: '999px',
                  backgroundColor: idx === currentHeroIndex ? 'var(--purple-700)' : 'rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Right Carousel Controls Overlay */}
        {heroPool.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '28px',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <button
              onClick={prevHero}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#121225',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.4)',
                color: 'var(--text-main)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              aria-label="Previous Hero Slide"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={nextHero}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.4)',
                color: 'var(--text-main)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              aria-label="Next Hero Slide"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* ─── Real Catalogue Section Rows ────────────────────────────────────────── */}
      {sections.map((section) => {
        const shows = catalog[section];
        if (!shows || shows.length === 0) return null;

        return (
          <section key={section} className="catalogue-section" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0, textTransform: 'capitalize' }}>
                  {section}
                </h2>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--purple-500)',
                    backgroundColor: 'rgba(124, 58, 237, 0.15)',
                    padding: '2px 9px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  {shows.length}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Link
                  to={`/browse?section=${section}`}
                  className="row-view-all"
                >
                  View all →
                </Link>

                {shows.length > 3 && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => scrollRow(section, 'left')}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-main)',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
                      aria-label={`Scroll ${section} left`}
                    >
                      <ChevronLeft size={17} />
                    </button>
                    <button
                      onClick={() => scrollRow(section, 'right')}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-main)',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
                      aria-label={`Scroll ${section} right`}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div
                ref={(el) => (rowRefs.current[section] = el)}
                className="hide-scrollbar"
                style={{
                  display: 'flex',
                  gap: '18px',
                  overflowX: 'auto',
                  padding: '16px 8px 140px 8px',
                  margin: '-16px -8px -120px -8px',
                  scrollSnapType: 'x proximity',
                }}
              >
                {shows.map((show) => (
                  <div key={section + '-' + (show.slug || show.show_id)} style={{ width: '290px', flexShrink: 0, scrollSnapAlign: 'start' }}>
                    <ShowCard
                      show={show}
                      width="100%"
                      typeLabel={show.type || (section === 'minisodes' ? 'Minisodes' : (section === 'songs' ? 'Songs' : 'Series'))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Home;
