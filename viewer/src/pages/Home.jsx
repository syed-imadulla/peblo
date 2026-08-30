import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Play,
  Info,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Sun,
} from 'lucide-react';
import { getCatalog } from '../api';
import { ShowCard, FallbackImage } from '../components/ShowCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getShowBanner, getShowPoster } from '../utils/catalogue';

const Home = () => {
  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Could not load the catalogue. Is the backend running?" />;

  const sections = Object.keys(catalog || {});
  if (sections.length === 0) return <EmptyState message="The catalogue is currently empty. Publish shows in the CMS to see them here!" />;

  // Real-time Hero Show: Pick first featured show, or first available catalogue show
  const allCatalogShows = Object.values(catalog).flat().filter(Boolean);
  if (allCatalogShows.length === 0) return <EmptyState message="No shows found in the catalogue." />;

  const featuredList = catalog.featured || [];
  const heroShow = featuredList[0] || allCatalogShows[0];

  const heroBanner = getShowBanner(heroShow) || getShowPoster(heroShow);
  const firstPlayableContentGroup =
    heroShow?.seasons?.[0]?.episodes?.[0]?.content_group ||
    heroShow?.trailers?.[0]?.content_group;

  const heroTitle = heroShow.title;
  const heroSynopsis = heroShow.synopsis || "Explore fun, educational stories and adventures on PeBlo TV.";
  const heroCategories = heroShow.categories && heroShow.categories.length > 0 ? heroShow.categories : ['adventure', 'learning'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* ─── Hero Billboard ──────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          backgroundColor: '#F3EFFE',
          minHeight: '340px',
          boxShadow: '0 4px 20px rgba(109, 53, 232, 0.06)',
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
            width: '64%',
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
            <div style={{ width: '100%', height: '100%', opacity: 0.15 }}>
              <FallbackImage aspect="16/9" />
            </div>
          )}

          {/* Smooth left-to-right fade overlay into the lavender card */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, #F3EFFE 0%, rgba(243, 239, 254, 0.95) 15%, rgba(243, 239, 254, 0) 55%)',
            }}
          />
        </div>

        {/* Left Half: Hero Billboard Content from Real Data */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '2.5rem 3rem',
            maxWidth: '520px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Featured Badge */}
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#EDE6FF',
                color: 'var(--purple-700)',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.2px',
              }}
            >
              <Sparkles size={13} fill="var(--purple-700)" /> Premiere
            </span>
          </div>

          {/* Real Title */}
          <h1
            style={{
              fontSize: '2.4rem',
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
              fontSize: '0.98rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
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
                  backgroundColor: idx === 0 ? '#EDE8FA' : idx === 1 ? '#E6F7F0' : '#FFF0E8',
                  color: idx === 0 ? 'var(--purple-700)' : idx === 1 ? '#1B7F53' : '#B8531D',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  textTransform: 'capitalize',
                }}
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.4rem' }}>
            {firstPlayableContentGroup ? (
              <Link
                to={`/episode/${firstPlayableContentGroup}`}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}
              >
                <Play size={16} fill="#ffffff" /> Watch Now
              </Link>
            ) : (
              <Link
                to={`/show/${heroShow.slug || heroShow.show_id}`}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}
              >
                <Play size={16} fill="#ffffff" /> Watch Now
              </Link>
            )}

            <Link
              to={`/show/${heroShow.slug || heroShow.show_id}`}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem' }}
            >
              <Info size={16} color="var(--navy-900)" /> More Info
            </Link>
          </div>

          {/* Bottom Left Pagination Dots */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '0.75rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--purple-700)' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D8CEF6' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D8CEF6' }} />
          </div>
        </div>

        {/* Bottom Right Carousel Controls Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '28px',
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Small Indicator Pill */}
          <div
            style={{
              backgroundColor: 'rgba(21, 27, 79, 0.45)',
              backdropFilter: 'blur(6px)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              display: 'flex',
              gap: '5px',
              alignItems: 'center',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.6)' }} />
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.6)' }} />
          </div>

          {/* Arrow Buttons */}
          <button
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              color: 'var(--navy-900)',
            }}
            aria-label="Previous Hero Slide"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <button
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              color: 'var(--navy-900)',
            }}
            aria-label="Next Hero Slide"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ─── Real Catalogue Section Rows ────────────────────────────────────────── */}
      {sections.map((section) => {
        const shows = catalog[section];
        if (!shows || shows.length === 0) return null;

        const isSeriesSection = section === 'series';

        return (
          <section key={section} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0, textTransform: 'capitalize' }}>{section}</h2>
              <Link
                to={`/browse?section=${section}`}
                style={{
                  color: 'var(--purple-700)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                View all →
              </Link>
            </div>

            {isSeriesSection ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${shows.length}, minmax(0, 1fr)) minmax(240px, 1.25fr)`,
                  gap: '14px',
                  alignItems: 'start',
                }}
              >
                {shows.map((show) => (
                  <ShowCard
                    key={section + '-' + (show.slug || show.show_id)}
                    show={show}
                    width="100%"
                    typeLabel="Series"
                  />
                ))}

                {/* Real PeBlo Brand Promotional Panel */}
                <div
                  style={{
                    background: 'linear-gradient(145deg, #F5F0FF 0%, #ECE4FD 100%)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid #EAE2F8',
                    minHeight: '130px',
                    aspectRatio: '16/9',
                  }}
                >
                  {/* Cheerful Sun Icon */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#FFEBB5',
                      color: '#E08B00',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <Sun size={18} fill="#FFB718" stroke="#E08B00" />
                  </div>

                  <h3
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 900,
                      color: 'var(--navy-900)',
                      margin: '0 0 0.2rem 0',
                      lineHeight: 1.25,
                      maxWidth: '220px',
                    }}
                  >
                    A kinder, brighter place for curious minds.
                  </h3>

                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      marginBottom: '0.6rem',
                      letterSpacing: '0.2px',
                    }}
                  >
                    Stories · Songs · Learning · Fun
                  </div>

                  {/* PeBlo TV Brand Stamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img
                      src="/peblo-logo.avif"
                      alt="PeBlo"
                      style={{
                        height: '24px',
                        width: 'auto',
                        display: 'block',
                        objectFit: 'contain',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const textFallback = e.target.nextElementSibling;
                        if (textFallback) textFallback.style.display = 'inline-block';
                      }}
                    />
                    <span
                      style={{
                        display: 'none',
                        fontSize: '1.15rem',
                        fontWeight: 900,
                        color: 'var(--purple-700)',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      PeBlo
                    </span>
                    <span
                      style={{
                        backgroundColor: '#ffffff',
                        color: 'var(--purple-700)',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid #E4DCF8',
                      }}
                    >
                      TV
                    </span>
                  </div>

                  {/* Soft Decorative Cloud Shapes in Background */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-10px',
                      left: '-10px',
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.45)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-12px',
                      right: '-12px',
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.45)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div
                  className="hide-scrollbar"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fill, minmax(210px, 1fr))`,
                    gap: '14px',
                    paddingBottom: '6px',
                  }}
                >
                  {shows.map((show) => (
                    <ShowCard
                      key={section + '-' + (show.slug || show.show_id)}
                      show={show}
                      width="100%"
                      typeLabel={show.type || (section === 'minisodes' ? 'Minisodes' : (section === 'songs' ? 'Songs' : 'Series'))}
                    />
                  ))}
                </div>

                {/* Floating Navigation Control for large rows */}
                {shows.length > 4 && (
                  <button
                    style={{
                      position: 'absolute',
                      right: '-18px',
                      top: '38%',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 14px rgba(21, 27, 79, 0.12)',
                      border: '1px solid #EAE6F4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--navy-900)',
                      zIndex: 10,
                    }}
                    aria-label={`Scroll ${section} shows`}
                  >
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default Home;
