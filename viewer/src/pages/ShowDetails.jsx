import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Play, Film, Clock, Globe, Sparkles } from 'lucide-react';
import { getCatalog } from '../api';
import { CatalogueRow } from '../components/CatalogueRow';
import { EpisodeCard } from '../components/EpisodeCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { FallbackImage } from '../components/ShowCard';
import {
  findShowBySlugOrId,
  getShowBanner,
  getShowPoster,
  getShowLanguages,
  getShowTotalEpisodes,
  formatDuration,
} from '../utils/catalogue';

const ShowDetails = () => {
  const { slug } = useParams();

  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog,
  });

  if (isLoading) return <LoadingState message="Loading show details..." />;
  if (error) return <ErrorState message="Could not load show details." />;

  const show = findShowBySlugOrId(catalog, slug);
  if (!show) return <EmptyState message="Show not found in catalogue." />;

  const banner = getShowBanner(show);
  const poster = getShowPoster(show);
  const languages = getShowLanguages(show);
  const totalEpisodes = getShowTotalEpisodes(show);

  // Find first playable episode
  const firstPlayableEp =
    show.seasons?.[0]?.episodes?.[0] ||
    show.trailers?.[0];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Back to Browse Button */}
      <div>
        <Link
          to="/browse"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--purple-700)',
            fontWeight: 700,
            fontSize: '0.92rem',
            padding: '0.45rem 0.95rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--purple-100)',
            transition: 'background-color 0.15s ease',
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> Back to Browse
        </Link>
      </div>

      {/* Hero Showcase Container */}
      <div
        style={{
          position: 'relative',
          borderRadius: '26px',
          overflow: 'hidden',
          backgroundColor: 'var(--surface)',
          boxShadow: '0 8px 30px rgba(21, 27, 79, 0.06)',
          border: '1px solid #ECE4F6',
        }}
      >
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
              background: 'linear-gradient(180deg, rgba(20, 9, 41, 0.15) 0%, rgba(20, 9, 41, 0.75) 100%)',
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
              boxShadow: '0 16px 36px rgba(21, 27, 79, 0.18)',
              backgroundColor: 'var(--surface)',
              flexShrink: 0,
              border: '4px solid #ffffff',
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
              <FallbackImage aspect="2/3" title={show.title} />
            </div>
          </div>

          {/* Show Metadata & Synopsis */}
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '100px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {show.categories?.map((cat) => (
                <span
                  key={cat}
                  style={{
                    backgroundColor: 'var(--purple-100)',
                    color: 'var(--purple-700)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
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
                    backgroundColor: '#FAF8FE',
                    color: 'var(--text-muted)',
                    border: '1px solid #ECE4F6',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  <Globe size={13} color="var(--purple-600)" /> {languages.join(', ')}
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
