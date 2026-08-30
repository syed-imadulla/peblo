import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Sparkles, Globe, ArrowLeft, Tv, Film } from 'lucide-react';
import { getCatalog } from '../api';
import { CatalogueRow } from '../components/CatalogueRow';
import { EpisodeCard } from '../components/EpisodeCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { FallbackImage } from '../components/ShowCard';
import {
  findShowBySlug,
  getShowPoster,
  getShowBanner,
  getShowLanguages,
  getShowTotalEpisodes,
} from '../utils/catalogue';

const ShowDetails = () => {
  const { slug } = useParams();

  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog,
  });

  if (isLoading) return <LoadingState message="Loading show details..." />;
  if (error) return <ErrorState message="Could not load the show. Is the backend running?" />;

  const show = findShowBySlug(catalog, slug);

  if (!show) {
    return (
      <EmptyState
        message={`We couldn't find a show with the identifier "${slug}". It might not be published yet.`}
      />
    );
  }

  const poster = getShowPoster(show);
  const banner = getShowBanner(show);
  const languages = getShowLanguages(show);
  const totalEpisodes = getShowTotalEpisodes(show);

  const firstPlayableEp =
    show.seasons?.[0]?.episodes?.[0] || show.trailers?.[0];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* ─── Modern Show Details Hero with Integrated Back Button ───────────── */}
      <div
        style={{
          position: 'relative',
          borderRadius: '26px',
          overflow: 'hidden',
          backgroundColor: '#0D0D1F',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Floating Frosted Back Button */}
        <Link
          to="/browse"
          style={{
            position: 'absolute',
            top: '20px',
            left: '24px',
            zIndex: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.88rem',
            padding: '0.45rem 1.05rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'rgba(8, 8, 23, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(8, 8, 23, 0.85)';
            e.currentTarget.style.transform = 'translateX(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(8, 8, 23, 0.65)';
            e.currentTarget.style.transform = 'none';
          }}
          aria-label="Back to Browse"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>Back</span>
        </Link>

        {/* Banner Backdrop */}
        <div style={{ position: 'relative', width: '100%', height: '280px', backgroundColor: 'var(--navy-950)' }}>
          {banner ? (
            <img
              src={banner}
              alt={show.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', opacity: 0.25 }}>
              <FallbackImage aspect="16/9" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(8, 8, 23, 0.2) 0%, rgba(8, 8, 23, 0.85) 100%)',
            }}
          />
        </div>

        {/* Content Body Floating Inside Hero */}
        <div
          style={{
            padding: '1.75rem 3rem 3rem 3rem',
            display: 'flex',
            gap: '2.75rem',
            marginTop: '-100px',
            position: 'relative',
            zIndex: 2,
            flexWrap: 'wrap',
          }}
        >
          {/* Poster Image */}
          <div
            style={{
              width: '210px',
              aspectRatio: '2/3',
              borderRadius: '22px',
              overflow: 'hidden',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
              backgroundColor: 'var(--surface)',
              flexShrink: 0,
              border: '4px solid #191933',
            }}
          >
            {poster ? (
              <img
                src={poster}
                alt={show.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fb = e.target.nextElementSibling;
                  if (fb) fb.style.display = 'flex';
                }}
              />
            ) : null}
            <div style={{ display: poster ? 'none' : 'flex', width: '100%', height: '100%' }}>
              <FallbackImage aspect="2/3" />
            </div>
          </div>

          {/* Show Metadata & Synopsis */}
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '100px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {show.categories?.map((cat) => (
                <span
                  key={cat}
                  style={{
                    backgroundColor: 'rgba(124, 58, 237, 0.18)',
                    color: 'var(--purple-500)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    border: '1px solid rgba(124, 58, 237, 0.25)',
                  }}
                >
                  {cat}
                </span>
              ))}

              {languages.length > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  <Globe size={13} color="var(--purple-500)" /> {languages.join(', ')}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2.4rem', color: 'var(--navy-900)', margin: 0, fontWeight: 900, letterSpacing: '-0.5px' }}>
              {show.title}
            </h1>

            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, margin: 0, maxWidth: '820px' }}>
              {show.synopsis || 'No synopsis provided for this series.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {firstPlayableEp && (
                <Link
                  to={`/episode/${firstPlayableEp.content_group}`}
                  className="btn btn-primary"
                  style={{ padding: '0.85rem 1.85rem', fontSize: '1.02rem' }}
                >
                  <Play size={18} fill="#ffffff" />
                  {show.seasons?.[0]?.episodes?.[0] ? 'Play S1 E1' : 'Play Trailer'}
                </Link>
              )}

              <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                {totalEpisodes} {totalEpisodes === 1 ? 'Episode' : 'Episodes'} • {show.seasons?.length || 0} {show.seasons?.length === 1 ? 'Season' : 'Seasons'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Season 0 Trailers (if present) */}
      {show.trailers && show.trailers.length > 0 && (
        <CatalogueRow title="Trailers & Previews" count={show.trailers.length}>
          {show.trailers.map((trailer) => (
            <EpisodeCard key={trailer.content_group} episode={trailer} width="290px" />
          ))}
        </CatalogueRow>
      )}

      {/* Seasons & Episodes */}
      {show.seasons &&
        show.seasons.map((season) => (
          <CatalogueRow
            key={season.season_number}
            title={`Season ${season.season_number}`}
            count={season.episodes?.length || 0}
          >
            {season.episodes?.map((episode) => (
              <EpisodeCard key={episode.content_group} episode={episode} width="290px" />
            ))}
          </CatalogueRow>
        ))}
    </div>
  );
};

export default ShowDetails;
