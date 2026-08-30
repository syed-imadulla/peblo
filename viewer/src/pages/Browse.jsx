import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Compass, Filter, Sparkles } from 'lucide-react';
import { getCatalog } from '../api';
import { ShowCard } from '../components/ShowCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getAllShows } from '../utils/catalogue';

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSection = searchParams.get('section') || 'all';

  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog,
  });

  // Extract all categories and languages dynamically from catalog
  const { allShows, categories, sections } = useMemo(() => {
    if (!catalog) return { allShows: [], categories: [], sections: [] };

    const rawSections = Object.keys(catalog);
    const shows = getAllShows(catalog);

    const cats = new Set();
    shows.forEach((s) => {
      (s.categories || []).forEach((c) => cats.add(c.toLowerCase()));
    });

    return {
      allShows: shows,
      categories: Array.from(cats).sort(),
      sections: rawSections,
    };
  }, [catalog]);

  // Filter shows based on active filters
  const filteredShows = useMemo(() => {
    if (!catalog) return [];

    let showsToFilter = [];
    if (selectedSection !== 'all' && catalog[selectedSection]) {
      showsToFilter = catalog[selectedSection];
    } else {
      showsToFilter = allShows;
    }

    return showsToFilter.filter((show) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const hasCategory = (show.categories || []).some(
          (c) => c.toLowerCase() === selectedCategory.toLowerCase()
        );
        if (!hasCategory) return false;
      }

      // Language filter
      if (selectedLanguage !== 'all') {
        const allEpisodes = [
          ...(show.trailers || []),
          ...(show.seasons?.flatMap((s) => s.episodes || []) || []),
        ];
        const hasLang = allEpisodes.some((ep) =>
          (ep.languages || []).includes(selectedLanguage)
        );
        if (!hasLang) return false;
      }

      return true;
    });
  }, [catalog, allShows, selectedSection, selectedCategory, selectedLanguage]);

  const handleSectionChange = (sec) => {
    setSelectedSection(sec);
    if (sec === 'all') {
      searchParams.delete('section');
    } else {
      searchParams.set('section', sec);
    }
    setSearchParams(searchParams);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    if (cat === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  if (isLoading) return <LoadingState message="Loading shows catalogue..." />;
  if (error) return <ErrorState message="Could not load the catalogue. Please check if the server is active." />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--purple-700)', fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            <Compass size={16} /> Explore
          </div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--navy-900)' }}>
            Browse Shows
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Discover educational adventures, animated stories, and fun songs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--navy-900)',
            }}
          >
            Showing {filteredShows.length} of {allShows.length} Shows
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Section Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-900)', marginRight: '0.25rem' }}>
            Section:
          </span>
          <button
            onClick={() => handleSectionChange('all')}
            style={{
              padding: '0.35rem 0.9rem',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: selectedSection === 'all' ? 'var(--purple-700)' : 'var(--background)',
              color: selectedSection === 'all' ? '#ffffff' : 'var(--navy-900)',
              border: '1px solid',
              borderColor: selectedSection === 'all' ? 'var(--purple-700)' : 'var(--border)',
              transition: 'all 0.15s ease',
            }}
          >
            All Sections
          </button>
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => handleSectionChange(sec)}
              style={{
                padding: '0.35rem 0.9rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                backgroundColor: selectedSection === sec ? 'var(--purple-700)' : 'var(--background)',
                color: selectedSection === sec ? '#ffffff' : 'var(--navy-900)',
                border: '1px solid',
                borderColor: selectedSection === sec ? 'var(--purple-700)' : 'var(--border)',
                transition: 'all 0.15s ease',
              }}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Categories & Languages Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          {/* Categories Horizontal Scroll */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px', overflowX: 'auto' }} className="hide-scrollbar">
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-900)', flexShrink: 0 }}>
              Category:
            </span>
            <button
              onClick={() => handleCategoryChange('all')}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.8rem',
                fontWeight: 600,
                flexShrink: 0,
                backgroundColor: selectedCategory === 'all' ? 'var(--navy-900)' : 'transparent',
                color: selectedCategory === 'all' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  flexShrink: 0,
                  backgroundColor: selectedCategory === cat ? 'var(--navy-900)' : 'transparent',
                  color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-900)' }}>
              Language:
            </span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--navy-900)',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
              }}
              aria-label="Filter shows by language"
            >
              <option value="all">All Languages</option>
              <option value="en">English (EN)</option>
              <option value="hi">Hindi (HI)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shows Grid */}
      {filteredShows.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredShows.map((show) => (
            <ShowCard key={show.show_id} show={show} width="100%" />
          ))}
        </div>
      ) : (
        <EmptyState message="No shows match your selected filter criteria. Try clearing some filters!" />
      )}
    </div>
  );
};

export default Browse;
