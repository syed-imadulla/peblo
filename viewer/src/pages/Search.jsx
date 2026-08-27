import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchCatalog } from '../api';
import { EpisodeCard } from '../components/EpisodeCard';
import { ShowCard } from '../components/ShowCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchCatalog(query),
    enabled: !!query,
  });

  if (!query) return <EmptyState message="Enter a search term above." />;
  if (isLoading) return <LoadingState message={`Searching for "${query}"...`} />;
  if (error) return <ErrorState message="Could not complete the search." />;
  if (!results || results.length === 0) return <EmptyState message={`No results found for "${query}".`} />;

  return (
    <div>
      <h1 style={{ color: 'var(--navy-900)', marginBottom: '2rem' }}>
        Results for "{query}"
      </h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        {results.map(result => {
          // Determine if this is a Show or an Episode
          if (result.show_id) {
            return <ShowCard key={result.show_id} show={result} />;
          }
          return <EpisodeCard key={result.content_group} episode={result} />;
        })}
      </div>
    </div>
  );
};

export default Search;
