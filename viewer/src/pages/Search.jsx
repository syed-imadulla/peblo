import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search as SearchIcon,
  X,
  Sparkles,
  TrendingUp,
  Tv,
  Film,
} from 'lucide-react';
import { getCatalog, searchCatalog } from '../api';
import { ShowCard } from '../components/ShowCard';
import { EpisodeCard } from '../components/EpisodeCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getAllShows } from '../utils/catalogue';

const POPULAR_SEARCHES = ['Moti', 'Adventure', 'Friendship', 'India', 'Animals', 'Tales', 'Music'];

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(initialQuery);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'shows', 'episodes'
  const inputRef = useRef(null);

  // Sync state if URL query param changes externally (e.g. back button)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== inputValue) {
      setInputValue(q);
    }
  }, [searchParams]);

  // Debounced URL update on typing so direct linking/refreshing works seamlessly
  useEffect(() => {
    const trimmed = inputValue.trim();
    const handler = setTimeout(() => {
      if (trimmed) {
        setSearchParams({ q: trimmed }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [inputValue, setSearchParams]);

  // Global keyboard shortcut '/' to focus search input, 'Esc' to clear/blur
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

  // Fetch complete catalogue for synchronous instant real-time in-memory search
  const { data: catalog, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog,
    staleTime: 60000,
  });

  // Query backend search API for server-side full text results
  const {
    data: apiSearchResults,
    isLoading: isApiSearchLoading,
    error: apiSearchError,
  } = useQuery({
    queryKey: ['catalogSearch', inputValue.trim()],
    queryFn: () => searchCatalog(inputValue.trim()),
    enabled: inputValue.trim().length > 0,
    staleTime: 30000,
  });

  // Synchronous, Instant 0ms Full-Text Matching Engine
  const { matchedShows, matchedEpisodes, hasSearched, totalResultsCount } = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) {
      return {
        matchedShows: [],
        matchedEpisodes: [],
        hasSearched: false,
        totalResultsCount: 0,
      };
    }

    if (!catalog) {
      return {
        matchedShows: [],
        matchedEpisodes: [],
        hasSearched: true,
        totalResultsCount: 0,
      };
    }

    const allShowsList = getAllShows(catalog);
    const tokens = query.split(/\s+/).filter(Boolean);

    const showSet = new Set();
    const episodeList = [];
    const seenEpisodeGroups = new Set();

    allShowsList.forEach((show) => {
      const showTitle = (show.title || '').toLowerCase();
      const showSynopsis = (show.synopsis || '').toLowerCase();
      const showCategories = (show.categories || []).map((c) => c.toLowerCase());
      const showSlug = (show.slug || '').toLowerCase();
      const showLanguages = (show.languages || []).map((l) => l.toLowerCase());

      // Check if show matches all search tokens
      const showMatches = tokens.every(
        (token) =>
          showTitle.includes(token) ||
          showSynopsis.includes(token) ||
          showSlug.includes(token) ||
          showCategories.some((c) => c.includes(token)) ||
          showLanguages.some((l) => l.includes(token))
      );

      if (showMatches) {
        showSet.add(show);
      }

      // Scan all episodes in the show
      const allEpisodes = [
        ...(show.trailers || []),
        ...(show.seasons?.flatMap((s) => s.episodes || []) || []),
      ];

      allEpisodes.forEach((ep) => {
        if (!ep) return;
        const epTitle = (ep.title || '').toLowerCase();
        const epSynopsis = (ep.synopsis || '').toLowerCase();
        const epLanguages = (ep.languages || []).map((l) => l.toLowerCase());
        const epGroup = (ep.content_group || '').toLowerCase();

        const epMatches = tokens.every(
          (token) =>
            epTitle.includes(token) ||
            epSynopsis.includes(token) ||
            epGroup.includes(token) ||
            epLanguages.some((l) => l.includes(token)) ||
            showTitle.includes(token) ||
            showCategories.some((c) => c.includes(token))
        );

        if (epMatches) {
          if (ep.content_group && !seenEpisodeGroups.has(ep.content_group)) {
            seenEpisodeGroups.add(ep.content_group);
            episodeList.push(ep);
          }
          showSet.add(show);
        }
      });
    });

    // Also blend any backend API results if present
    if (apiSearchResults && apiSearchResults.shows) {
      apiSearchResults.shows.forEach((apiShow) => {
        const found = allShowsList.find(
          (s) => s.show_id === apiShow.show_id || s.slug === apiShow.slug
        );
        if (found) {
          showSet.add(found);
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
    return unique.slice(0, 8);
  }, [catalog]);

  const activeQuery = inputValue.trim();
  const isLoading = !!activeQuery && isApiSearchLoading && isCatalogLoading;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ─── 1. Search Hero Card ──────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          padding: '1.5rem 1.75rem',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--navy-900)', margin: '0 0 0.25rem 0', fontWeight: 800, letterSpacing: '-0.4px' }}>
            Find Shows & Episodes
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.92rem' }}>
            Search shows, episodes, characters, learning topics, and languages.
          </p>
        </div>

        {/* Real-time Search Input Bar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{ position: 'relative', width: '100%', maxWidth: '680px' }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Search shows, episodes, characters, topics..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{
              width: '100%',
              height: '52px',
              padding: '0 3.6rem 0 3.1rem',
              borderRadius: '18px',
              border: '2px solid var(--border)',
              backgroundColor: '#080817',
              fontSize: '1rem',
              fontWeight: 600,
              outline: 'none',
              color: 'var(--text-main)',
              transition: 'all 0.18s ease',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--purple-700)';
              e.target.style.backgroundColor = '#0D0D1F';
              e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.25)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.backgroundColor = '#080817';
              e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.4)';
            }}
            aria-label="Search catalogue"
          />

          <SearchIcon
            size={18}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--purple-500)',
              pointerEvents: 'none',
            }}
          />

          {inputValue ? (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'rgba(124, 58, 237, 0.2)',
                color: 'var(--purple-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease',
              }}
              aria-label="Clear search"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          ) : (
            <div
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '2px 7px',
                borderRadius: '5px',
                backgroundColor: 'rgba(124, 58, 237, 0.2)',
                color: 'var(--purple-500)',
                fontSize: '0.72rem',
                fontWeight: 800,
                pointerEvents: 'none',
              }}
            >
              /
            </div>
          )}
        </form>

        {/* Suggestion Chips (Horizontally scrollable on mobile) */}
        <div className="chips-scroll-container hide-scrollbar">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <Sparkles size={13} color="var(--purple-500)" /> Try searching:
          </span>
          {POPULAR_SEARCHES.map((term) => {
            const isActive = activeQuery.toLowerCase() === term.toLowerCase();
            return (
              <button
                key={term}
                onClick={() => handleQuickSearch(term)}
                style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isActive ? 'var(--purple-700)' : 'var(--bg-secondary)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--purple-700)' : 'var(--border)',
                  color: isActive ? '#ffffff' : 'var(--text-nav)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.2)';
                    e.currentTarget.style.color = 'var(--purple-500)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.color = 'var(--text-nav)';
                  }
                }}
              >
                {term}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. Search Results or Initial State ───────────────────────────────── */}
      {isLoading && <LoadingState message={`Searching for "${activeQuery}"...`} />}
      {apiSearchError && <ErrorState message="Could not complete the search. Please check if the backend is running." />}

      {/* Results View (when query exists and results found) */}
      {!isLoading && !apiSearchError && hasSearched && totalResultsCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Results Header + Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem', flexWrap: 'wrap', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ color: 'var(--navy-900)', margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                Search results for "{activeQuery}"
              </h2>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--purple-500)',
                  backgroundColor: 'rgba(124, 58, 237, 0.15)',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                {totalResultsCount} {totalResultsCount === 1 ? 'match' : 'matches'}
              </span>
            </div>

            {/* Filter Tabs: All / Shows / Episodes */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setFilterTab('all')}
                style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.8rem',
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
                    padding: '0.3rem 0.8rem',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.8rem',
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
                    padding: '0.3rem 0.8rem',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.8rem',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Tv size={17} color="var(--purple-500)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                  Shows ({matchedShows.length})
                </h3>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Film size={17} color="var(--purple-500)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                  Episodes & Clips ({matchedEpisodes.length})
                </h3>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem',
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

      {/* 3. Zero Results Empty State (Only shown AFTER an actual query with 0 results) */}
      {!isLoading && !apiSearchError && hasSearched && totalResultsCount === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '2rem 1rem' }}>
          <EmptyState message={`No results found for "${activeQuery}".`} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Try searching for:</span>
            {['Moti', 'Adventure', 'Science', 'Music'].map((term) => (
              <button
                key={term}
                onClick={() => handleQuickSearch(term)}
                style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(124, 58, 237, 0.15)',
                  color: 'var(--purple-500)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Initial Search Page (When no query entered yet) */}
      {!hasSearched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <TrendingUp size={17} color="var(--purple-500)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                Popular on PeBlo
              </h2>
            </div>

            {initialPopularShows.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem',
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
