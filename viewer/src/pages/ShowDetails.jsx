import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCatalog } from '../api';
import { CatalogueRow } from '../components/CatalogueRow';
import { EpisodeCard } from '../components/EpisodeCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { FallbackImage } from '../components/ShowCard';
import { ArrowLeft } from 'lucide-react';

const ShowDetails = () => {
  const { slug } = useParams();
  
  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Could not load show details." />;

  // Find the show by slug traversing all sections
  let show = null;
  for (const section of Object.values(catalog || {})) {
    show = section.find(s => s.slug === slug);
    if (show) break;
  }

  if (!show) return <EmptyState message="Show not found." />;

  // Find the first available banner in trailers or seasons
  let banner = null;
  const allEpisodes = [
    ...(show.trailers || []),
    ...(show.seasons?.flatMap(s => s.episodes) || [])
  ];
  
  for (const ep of allEpisodes) {
    if (ep.artwork?.banner) {
      banner = ep.artwork.banner;
      break;
    }
  }

  return (
    <div>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--purple-700)', fontWeight: 600, marginBottom: '2rem' }}>
        <ArrowLeft size={20} /> Back to Browse
      </Link>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        marginBottom: '4rem',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {banner ? (
             <img 
               src={banner} 
               alt={show.title} 
               style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
               onError={(e) => {
                 e.target.style.display = 'none';
                 e.target.nextSibling.style.display = 'flex';
               }}
             />
          ) : null}
          <div style={{ display: banner ? 'none' : 'flex', width: '100%', height: '100%' }}>
            <FallbackImage aspect="16/9" />
          </div>
        </div>
        
        <div>
          <h1 style={{ color: 'var(--navy-900)' }}>{show.title}</h1>
          {show.categories && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {show.categories.map(cat => (
                <span key={cat} style={{
                  backgroundColor: 'var(--yellow-100)',
                  color: 'var(--navy-900)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}>
                  {cat}
                </span>
              ))}
            </div>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '800px' }}>
            {show.synopsis || 'No synopsis available.'}
          </p>
        </div>
      </div>

      {show.trailers && show.trailers.length > 0 && (
        <CatalogueRow title="Trailers">
          {show.trailers.map(trailer => (
             <EpisodeCard key={trailer.content_group} episode={trailer} />
          ))}
        </CatalogueRow>
      )}

      {show.seasons && show.seasons.map(season => (
        <CatalogueRow key={season.season_number} title={`Season ${season.season_number}`}>
          {season.episodes.map(episode => (
             <EpisodeCard key={episode.content_group} episode={episode} />
          ))}
        </CatalogueRow>
      ))}
    </div>
  );
};

export default ShowDetails;
