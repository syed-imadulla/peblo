import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, X, Sparkles } from 'lucide-react';
import { searchCatalog } from '../api';
import { EpisodeCard } from '../components/EpisodeCard';
import { ShowCard } from '../components/ShowCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchCatalog(query),
    enabled: !!query,
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleQuickSearch = (term) => {
    setInputValue(term);
    setSearchParams({ q: term });
  };

  const clearSearch = () => {
    setInputValue('');
    setSearchParams({});
  };

  const popularSuggestions = [
    'Moti',
    'Adventure',
    'India',
    'Learning',
    'Music',
    'Stories',
    'Science',
    'Nature',
    'Friendship',
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search Input Bar */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        <h1 style={{ fontSize: '1.8rem', color: 'var(--navy-900)', margin: 0, textAlign: 'center' }}>
          Find Shows & Episodes
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, textAlign: 'center', maxWidth: '600px', fontSize: '0.95rem' }}>
          Search by show title, character names, learning categories, or synopsis.
        </p>

        <form
          onSubmit={handleSearchSubmit}
          style={{ position: 'relative', width: '100%', maxWidth: '640px', marginTop: '0.5rem' }}
        >
          <input
            type="text"
            placeholder="Search catalogue..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{
              width: '100%',
              padding: '0.9rem 3rem 0.9rem 3rem',
              borderRadius: 'var(--radius-pill)',
              border: '2px solid var(--border)',
              backgroundColor: 'var(--background)',
              fontSize: '1.05rem',
              outline: 'none',
              color: 'var(--navy-900)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--purple-600)';
              e.target.style.boxShadow = 'var(--shadow-focus)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
            aria-label="Search term"
          />

          <SearchIcon
            size={20}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />

          {inputValue && (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </form>

        {/* Quick Suggestion Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={13} /> Try searching:
          </span>
          {popularSuggestions.map((term) => (
            <button
              key={term}
              onClick={() => handleQuickSearch(term)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--navy-900)',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--purple-100)';
                e.currentTarget.style.borderColor = 'var(--purple-200)';
                e.currentTarget.style.color = 'var(--purple-700)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--background)';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--navy-900)';
              }}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Area */}
      {!query && <EmptyState message="Enter a search term above." />}
      {query && isLoading && <LoadingState message={`Searching for "${query}"...`} />}
      {query && error && <ErrorState message="Could not complete the search." />}
      {query && !isLoading && !error && (!results || results.length === 0) && (
        <EmptyState message={`No results found for "${query}".`} />
      )}

      {query && !isLoading && !error && results && results.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ color: 'var(--navy-900)', margin: 0, fontSize: '1.4rem' }}>
              Results for "{query}"
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Found {results.length} {results.length === 1 ? 'match' : 'matches'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {results.map((result) => {
              if (result.show_id) {
                return <ShowCard key={result.show_id} show={result} width="100%" />;
              }
              return <EpisodeCard key={result.content_group} episode={result} width="100%" />;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
