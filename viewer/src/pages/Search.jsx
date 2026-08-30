import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, X, Sparkles, TrendingUp, Film, Tv, SlidersHorizontal } from 'lucide-react';
import { searchCatalog, getCatalog } from '../api';
import { EpisodeCard } from '../components/EpisodeCard';
import { ShowCard } from '../components/ShowCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getAllShows } from '../utils/catalogue';

const POPULAR_SEARCHES = [
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

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUrlQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(initialUrlQuery);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'shows' | 'episodes'
  const inputRef = useRef(null);

  // Sync state if URL param changes via browser navigation
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    setInputValue(urlQ);
  }, [searchParams]);

  // Global keyboard shortcuts: '/' focuses search input, 'Escape' blurs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch full catalogue for 100% instant real-time search and initial "Popular on PeBlo" shelf
  const { data: catalog, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog,
  });

  // Call searchCatalog API for backend compatibility and test integration
  const {
    data: apiSearchResults,
    isLoading: isApiSearchLoading,
    error: apiSearchError,
  } = useQuery({
    queryKey: ['search', inputValue.trim()],
    queryFn: () => searchCatalog(inputValue.trim()),
    enabled: !!inputValue.trim(),
  });

  // Synchronize URL search params with debounced typing
  useEffect(() => {
    const trimmed = inputValue.trim();
    const currentUrlQ = searchParams.get('q') || '';
    if (trimmed === currentUrlQ) return;

    const timer = setTimeout(() => {
      if (trimmed) {
        setSearchParams({ q: trimmed }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue, searchParams, setSearchParams]);

  // 100% Realtime search matcher running instantly on every keystroke
  const { matchedShows, matchedEpisodes, hasSearched, totalResultsCount } = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) {
      return { matchedShows: [], matchedEpisodes: [], hasSearched: false, totalResultsCount: 0 };
    }

    const allShows = catalog ? getAllShows(catalog) : [];
    const showSet = new Set();
    const episodeList = [];
    const queryTokens = q.split(/\s+/).filter(Boolean);

    // 1. Full-text search across shows and all nested episodes/trailers
    allShows.forEach((show) => {
      const showTitle = (show.title || '').toLowerCase();
      const showSynopsis = (show.synopsis || '').toLowerCase();
      const showSlug = (show.slug || '').toLowerCase();
      const showType = (show.type || '').toLowerCase();
      const showCats = (show.categories || []).map((c) => c.toLowerCase());
      const showCombined = `${showTitle} ${showSynopsis} ${showSlug} ${showType} ${showCats.join(' ')}`;

      // Check if all tokens match show
      const showMatches = queryTokens.every((token) => showCombined.includes(token));
      if (showMatches) {
        showSet.add(show);
      }

      // Check episodes and trailers
      const allEps = [
        ...(show.trailers || []),
        ...(show.seasons?.flatMap((s) => s.episodes || []) || []),
      ];

      allEps.forEach((ep) => {
        const epTitle = (ep.title || '').toLowerCase();
        const epSynopsis = (ep.synopsis || '').toLowerCase();
        const epLangs = (ep.languages || []).map((l) => l.toLowerCase());
        const epGroup = (ep.content_group || '').toLowerCase();
        const epCombined = `${epTitle} ${epSynopsis} ${epGroup} ${epLangs.join(' ')} ${showTitle} ${showCats.join(' ')}`;

        const epMatches = queryTokens.every((token) => epCombined.includes(token));
        if (epMatches) {
          episodeList.push(ep);
          showSet.add(show); // Also surface parent show in results
        }
      });
    });

    // Merge backend API search results if available
    if (Array.isArray(apiSearchResults)) {
      apiSearchResults.forEach((res) => {
        if (res.show_id && !Array.from(showSet).some((s) => s.show_id === res.show_id)) {
          showSet.add(res);
        } else if (res.content_group && !episodeList.some((e) => e.content_group === res.content_group)) {
          episodeList.push(res);
        }
      });
    }

    const shows = Array.from(showSet);
    const count = shows.length + episodeList.length;

    return {
      matchedShows: shows,
      matchedEpisodes: episodeList,
      hasSearched: true,
      totalResultsCount: count,
    };
  }, [inputValue, catalog, apiSearchResults]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
    } else {
      setSearchParams({});
    }
  };

  const handleQuickSearch = (term) => {
    setInputValue(term);
    setSearchParams({ q: term });
    inputRef.current?.focus();
  };

  const clearSearch = () => {
    setInputValue('');
    setSearchParams({});
    inputRef.current?.focus();
  };

  // Initial featured/popular shelf when query is empty
  const initialPopularShows = useMemo(() => {
    if (!catalog) return [];
    const featured = catalog.featured || [];
    const series = catalog.series || [];
    const minisodes = catalog.minisodes || [];
    const combined = [...featured, ...series, ...minisodes];
    const unique = [];
    const seen = new Set();
    combined.forEach((s) => {
      if (s && s.show_id && !seen.has(s.show_id)) {
        seen.add(s.show_id);
        unique.push(s);
      }
    });
    return unique.slice(0, 6);
  }, [catalog]);

  const activeQuery = inputValue.trim();
  const isLoading = !!activeQuery && isApiSearchLoading && isCatalogLoading;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* ─── Search Hero Card ─────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          padding: '2.25rem 2rem',
          borderRadius: '24px',
          boxShadow: '0 6px 24px rgba(21, 27, 79, 0.05)',
          border: '1px solid #ECE4F6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--navy-900)', margin: '0 0 0.4rem 0', fontWeight: 900, letterSpacing: '-0.5px' }}>
            Find Shows & Episodes
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>
            Search shows, episodes, characters, learning topics, and languages.
          </p>
        </div>

        {/* Real-time Search Input Bar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{ position: 'relative', width: '100%', maxWidth: '720px', marginTop: '0.25rem' }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Search shows, episodes, characters, topics..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{
              width: '100%',
              height: '56px',
              padding: '0 3.8rem 0 3.2rem',
              borderRadius: '999px',
              border: '2px solid #E6DEF4',
              backgroundColor: '#FAF9FE',
              fontSize: '1.05rem',
              fontWeight: 600,
              outline: 'none',
              color: 'var(--navy-900)',
              transition: 'all 0.2s ease',
              boxShadow: 'inset 0 2px 4px rgba(21, 27, 79, 0.02)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--purple-700)';
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.boxShadow = '0 0 0 4px rgba(109, 53, 232, 0.12)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E6DEF4';
              e.target.style.backgroundColor = '#FAF9FE';
              e.target.style.boxShadow = 'inset 0 2px 4px rgba(21, 27, 79, 0.02)';
            }}
            aria-label="Search catalogue"
          />

          <SearchIcon
            size={20}
            style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--purple-700)',
              pointerEvents: 'none',
            }}
          />

          {inputValue ? (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#EDE6FF',
                color: 'var(--purple-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease',
              }}
              aria-label="Clear search"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          ) : (
            <div
              style={{
                position: 'absolute',
                right: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: '#EDE6FF',
                color: 'var(--purple-700)',
                fontSize: '0.75rem',
                fontWeight: 800,
                pointerEvents: 'none',
              }}
            >
              /
            </div>
          )}
        </form>

        {/* Suggestion Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} color="var(--purple-700)" /> Try searching:
          </span>
          {POPULAR_SEARCHES.map((term) => {
            const isActive = activeQuery.toLowerCase() === term.toLowerCase();
            return (
              <button
                key={term}
                onClick={() => handleQuickSearch(term)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isActive ? 'var(--purple-700)' : '#F5F2FC',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--purple-700)' : '#EAE4F6',
                  color: isActive ? '#ffffff' : 'var(--navy-900)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--purple-100)';
                    e.currentTarget.style.color = 'var(--purple-700)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#F5F2FC';
                    e.currentTarget.style.color = 'var(--navy-900)';
                  }
                }}
              >
                {term}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Search Results or Initial State ───────────────────────────────────── */}
      {isLoading && <LoadingState message={`Searching for "${activeQuery}"...`} />}
      {apiSearchError && <ErrorState message="Could not complete the search. Please check if the backend is running." />}

      {/* 1. Results View (when query exists and results found) */}
      {!isLoading && !apiSearchError && hasSearched && totalResultsCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
          {/* Results Header + Category Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ECE4F6', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ color: 'var(--navy-900)', margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                Search results for "{activeQuery}"
              </h2>
              <span
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--purple-700)',
                  backgroundColor: 'var(--purple-100)',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                {totalResultsCount} {totalResultsCount === 1 ? 'match' : 'matches'}
              </span>
            </div>

            {/* Filter Tabs: All / Shows / Episodes */}
            <div style={{ display: 'flex', gap: '6px', backgroundColor: '#FAF8FE', padding: '3px', borderRadius: 'var(--radius-pill)', border: '1px solid #ECE4F6' }}>
              <button
                onClick={() => setFilterTab('all')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  backgroundColor: filterTab === 'all' ? 'var(--purple-700)' : 'transparent',
                  color: filterTab === 'all' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                All ({totalResultsCount})
              </button>
              {matchedShows.length > 0 && (
                <button
                  onClick={() => setFilterTab('shows')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    backgroundColor: filterTab === 'shows' ? 'var(--purple-700)' : 'transparent',
                    color: filterTab === 'shows' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Shows ({matchedShows.length})
                </button>
              )}
              {matchedEpisodes.length > 0 && (
                <button
                  onClick={() => setFilterTab('episodes')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    backgroundColor: filterTab === 'episodes' ? 'var(--purple-700)' : 'transparent',
                    color: filterTab === 'episodes' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Episodes ({matchedEpisodes.length})
                </button>
              )}
            </div>
          </div>

          {/* Matched Shows Section */}
          {(filterTab === 'all' || filterTab === 'shows') && matchedShows.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                <Tv size={18} color="var(--purple-700)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                  Shows ({matchedShows.length})
                </h3>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1.75rem',
                }}
              >
                {matchedShows.map((show) => (
                  <ShowCard key={show.show_id} show={show} width="100%" />
                ))}
              </div>
            </div>
          )}

          {/* Matched Episodes Section */}
          {(filterTab === 'all' || filterTab === 'episodes') && matchedEpisodes.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                <Film size={18} color="var(--purple-700)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                  Episodes & Clips ({matchedEpisodes.length})
                </h3>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1.75rem',
                }}
              >
                {matchedEpisodes.map((ep) => (
                  <EpisodeCard key={ep.content_group} episode={ep} width="100%" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Zero Results Empty State (Only shown AFTER an actual query with 0 results) */}
      {!isLoading && !apiSearchError && hasSearched && totalResultsCount === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <EmptyState message={`No results found for "${activeQuery}".`} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>Try searching for:</span>
            {['Moti', 'Adventure', 'Science', 'Music'].map((term) => (
              <button
                key={term}
                onClick={() => handleQuickSearch(term)}
                style={{
                  padding: '0.35rem 0.9rem',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--purple-100)',
                  color: 'var(--purple-700)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: '1px solid var(--purple-200)',
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Initial Search Page (When no query entered yet) */}
      {!hasSearched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <TrendingUp size={18} color="var(--purple-700)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                Popular on PeBlo
              </h2>
            </div>

            {initialPopularShows.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1.75rem',
                }}
              >
                {initialPopularShows.map((show) => (
                  <ShowCard key={show.show_id} show={show} width="100%" />
                ))}
              </div>
            ) : (
              <EmptyState message="Enter a search term above." />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
