import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCatalog } from '../api';
import { CatalogueRow } from '../components/CatalogueRow';
import { ShowCard } from '../components/ShowCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';

const Home = () => {
  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Could not load the catalogue. Is the backend running?" />;
  
  const sections = Object.keys(catalog || {});
  if (sections.length === 0) return <EmptyState message="The catalogue is completely empty!" />;

  return (
    <div>
      {sections.map(section => {
        const shows = catalog[section];
        if (!shows || shows.length === 0) return null;
        
        return (
          <CatalogueRow key={section} title={section}>
            {shows.map(show => (
              <ShowCard key={show.show_id} show={show} />
            ))}
          </CatalogueRow>
        );
      })}
    </div>
  );
};

export default Home;
