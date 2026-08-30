import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Search, MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown, Image as ImageIcon, X, Trash2, Check, AlertTriangle, Edit2 } from 'lucide-react';
import { Pagination } from '../components/ui/Pagination';
import { Dropdown } from '../components/ui/Dropdown';

const fetchShows = async () => {
  const { data } = await axios.get('/api/admin/shows');
  return data;
};

const safeFormatDate = (dateString, relative = false) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  
  if (relative) {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}m ago`;
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return `${diffDays}d ago`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
  }
  
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
};

const getSectionColors = (section) => {
  switch (section?.toLowerCase()) {
    case 'featured': return { bg: '#F3E8FF', text: '#7E22CE' };
    case 'series': return { bg: '#E0F2FE', text: '#0369A1' };
    case 'minisodes': return { bg: '#FFEDD5', text: '#C2410C' };
    case 'songs': return { bg: '#FEF9C3', text: '#CA8A04' };
    case 'shorts': return { bg: '#FCE7F3', text: '#BE185D' };
    default: return { bg: '#F1F5F9', text: '#475569' };
  }
};

const getLanguageColors = (lang) => {
  switch(lang?.toUpperCase()) {
    case 'EN': return { bg: '#DCFCE7', text: '#15803D' };
    case 'HI': return { bg: '#E0F2FE', text: '#0369A1' };
    default: return { bg: '#F3E8FF', text: '#7E22CE' };
  }
};

const getShowArtwork = (show) => {
  if (show.artwork && show.artwork.length > 0) {
    return show.artwork[0].url || show.artwork[0].file_path;
  }
  
  if (show.seasons && show.seasons.length > 0) {
    for (const season of show.seasons) {
      if (season.artwork && season.artwork.length > 0) {
        return season.artwork[0].url || season.artwork[0].file_path;
      }
      if (season.episodes && season.episodes.length > 0) {
        for (const ep of season.episodes) {
          if (ep.artwork && ep.artwork.length > 0) {
            return ep.artwork[0].url || ep.artwork[0].file_path;
          }
        }
      }
    }
  }
  return null;
};

const getShowMetrics = (show) => {
  let isPublished = false;
  let totalEpisodes = 0;
  const langs = new Set();
  
  show.seasons?.forEach(s => {
    // Only count episodes from real viewer seasons (skip season 0 trailer/bonus semantics if needed, assuming season_number > 0 or similar if that field exists. By default, count all valid ones)
    if (s.episodes && s.season_number !== 0) {
      totalEpisodes += s.episodes.length;
      s.episodes.forEach(e => {
        if (e.status === 'published') isPublished = true;
        if (e.language) langs.add(e.language.toUpperCase());
      });
    }
  });

  return {
    isPublished,
    status: isPublished ? 'Published' : 'Draft',
    totalEpisodes,
    languages: Array.from(langs).sort()
  };
};

// --- UI COMPONENTS ---



const ActionMenu = ({ show, onDeleteClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const ref = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target) &&
          menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let top, bottom;
      if (spaceBelow < 120) {
        bottom = window.innerHeight - rect.top + 4;
        setMenuStyle({ bottom: `${bottom}px`, left: `${rect.right - 160}px` });
      } else {
        top = rect.bottom + 4;
        setMenuStyle({ top: `${top}px`, left: `${rect.right - 160}px` });
      }
    }
  }, [isOpen]);

  return (
    <>
      <div ref={ref} style={{ display: 'inline-block' }}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          style={{ 
            background: isOpen ? '#F5F3FF' : '#FFFFFF', 
            border: isOpen ? '1px solid #C4B5FD' : '1px solid #E2E8F0', 
            borderRadius: '10px', 
            width: '32px', 
            height: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: isOpen ? '#6D28D9' : '#64748B', 
            cursor: 'pointer', 
            transition: 'all 0.2s ease',
            boxShadow: isOpen ? '0 0 0 2px rgba(109, 40, 217, 0.1)' : '0 1px 2px rgba(0,0,0,0.03)'
          }}
          onMouseOver={e => { if(!isOpen) { e.currentTarget.style.background = '#F8F9FF'; e.currentTarget.style.borderColor = '#CBD5E1'; } }}
          onMouseOut={e => { if(!isOpen) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; } }}
          title="Actions"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
      {isOpen && ReactDOM.createPortal(
        <div ref={menuRef} style={{ position: 'fixed', ...menuStyle, width: '160px', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 9999, padding: '6px' }}>
          <button 
            onClick={() => { setIsOpen(false); navigate(`/shows/${show.id}/edit`); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', color: 'var(--navy-900)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left', marginBottom: '2px' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Edit2 size={14} /> Edit Show
          </button>
          <button 
            onClick={() => { setIsOpen(false); onDeleteClick(show); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', color: '#DC2626', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>,
        document.body
      )}
    </>
  );
};

const DeleteModal = ({ show, onClose, onConfirm, isDeleting }) => {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <AlertTriangle size={24} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--navy-900)' }}>Delete Show</h3>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Are you sure you want to delete <strong>{show.title}</strong>? This will permanently remove the show and all its episodes. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={isDeleting} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF', color: 'var(--navy-900)', fontSize: '14px', fontWeight: '600', cursor: isDeleting ? 'not-allowed' : 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={isDeleting} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#DC2626', color: 'white', fontSize: '14px', fontWeight: '600', cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.7 : 1 }}>
            {isDeleting ? 'Deleting...' : 'Delete Show'}
          </button>
        </div>
      </div>
    </div>
  );
};


// --- MAIN PAGE ---

const ShowsList = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('All Sections');
  const [filterLanguage, setFilterLanguage] = useState('All Languages');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [sortBy, setSortBy] = useState('Updated: Newest');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [showToDelete, setShowToDelete] = useState(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterSection, filterLanguage, filterStatus, sortBy, itemsPerPage]);

  const { data: shows, isLoading, error } = useQuery({
    queryKey: ['shows'],
    queryFn: fetchShows,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/api/admin/shows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['shows']);
      setShowToDelete(null);
    }
  });

  const { uniqueSections, uniqueLanguages, processedShows } = useMemo(() => {
    if (!shows) return { uniqueSections: [], uniqueLanguages: [], processedShows: [] };
    
    const secSet = new Set();
    const langSet = new Set();
    
    const proc = shows.map(show => {
      if (show.section) secSet.add(show.section);
      const metrics = getShowMetrics(show);
      metrics.languages.forEach(l => langSet.add(l));
      return { ...show, ...metrics };
    });
    
    return {
      uniqueSections: Array.from(secSet).sort(),
      uniqueLanguages: Array.from(langSet).sort(),
      processedShows: proc
    };
  }, [shows]);

  const filteredShows = useMemo(() => {
    let result = processedShows.filter(s => {
      const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                          (s.section && s.section.toLowerCase().includes(search.toLowerCase()));
      const matchSection = filterSection === 'All Sections' || s.section === filterSection;
      const matchLanguage = filterLanguage === 'All Languages' || s.languages.includes(filterLanguage);
      const matchStatus = filterStatus === 'All Status' || s.status === filterStatus;
      
      return matchSearch && matchSection && matchLanguage && matchStatus;
    });

    result.sort((a, b) => {
      if (sortBy === 'Updated: Newest') return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
      if (sortBy === 'Updated: Oldest') return new Date(a.updated_at || a.created_at) - new Date(b.updated_at || b.created_at);
      if (sortBy === 'Title: A-Z') return a.title.localeCompare(b.title);
      if (sortBy === 'Title: Z-A') return b.title.localeCompare(a.title);
      if (sortBy === 'Episodes: Highest') return b.totalEpisodes - a.totalEpisodes;
      if (sortBy === 'Episodes: Lowest') return a.totalEpisodes - b.totalEpisodes;
      return 0;
    });

    return result;
  }, [processedShows, search, filterSection, filterLanguage, filterStatus, sortBy]);

  const paginatedShows = filteredShows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredShows.length / itemsPerPage);

  const hasActiveFilters = search !== '' || filterSection !== 'All Sections' || filterLanguage !== 'All Languages' || filterStatus !== 'All Status';

  const clearFilters = () => {
    setSearch('');
    setFilterSection('All Sections');
    setFilterLanguage('All Languages');
    setFilterStatus('All Status');
  };

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--purple-600)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
      Loading shows...
    </div>
  );
  if (error) return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <AlertTriangle size={24} />
      </div>
      <h3 style={{ color: 'var(--navy-900)', marginBottom: '8px', fontSize: '16px', fontWeight: '700' }}>Unable to load shows</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>There was a problem communicating with the server.</p>
      <button onClick={() => queryClient.invalidateQueries(['shows'])} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--purple-700)', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
        Retry Loading
      </button>
    </div>
  );

  return (
    <div style={{ paddingBottom: '60px' }}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* FILTER BAR */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: hasActiveFilters ? '16px' : '24px', flexWrap: 'wrap', position: 'relative', zIndex: 100 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '16px', top: '13px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search shows by title, category or section..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{ 
              width: '100%', 
              padding: '10px 16px 10px 42px', 
              borderRadius: '20px', 
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '14px',
              outline: 'none',
              height: '42px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Dropdown 
            label="Section" 
            value={filterSection} 
            onChange={setFilterSection} 
            options={['All Sections', ...uniqueSections]} 
          />
          <Dropdown 
            label="Language" 
            value={filterLanguage} 
            onChange={setFilterLanguage} 
            options={['All Languages', ...uniqueLanguages]} 
          />
          <Dropdown 
            label="Status" 
            value={filterStatus} 
            onChange={setFilterStatus} 
            options={['All Status', 'Published', 'Draft']} 
          />
          <Dropdown 
            label="Sort by" 
            value={sortBy} 
            onChange={setSortBy} 
            minWidth="170px"
            options={['Updated: Newest', 'Updated: Oldest', 'Title: A-Z', 'Title: Z-A', 'Episodes: Highest', 'Episodes: Lowest']} 
          />
        </div>
      </div>

      {/* ACTIVE FILTER CHIPS */}
      {hasActiveFilters && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', minHeight: '32px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginRight: '4px' }}>Active Filters:</span>
          {search && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#F5F3FF', color: '#6D28D9', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #DDD6FE' }}>
              Search: <span style={{ fontWeight: '400' }}>{search}</span>
              <X size={12} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => setSearch('')} />
            </div>
          )}
          {filterSection !== 'All Sections' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#F5F3FF', color: '#6D28D9', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #DDD6FE' }}>
              Section: <span style={{ fontWeight: '400' }}>{filterSection}</span>
              <X size={12} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => setFilterSection('All Sections')} />
            </div>
          )}
          {filterLanguage !== 'All Languages' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#F5F3FF', color: '#6D28D9', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #DDD6FE' }}>
              Language: <span style={{ fontWeight: '400' }}>{filterLanguage}</span>
              <X size={12} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => setFilterLanguage('All Languages')} />
            </div>
          )}
          {filterStatus !== 'All Status' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#F5F3FF', color: '#6D28D9', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #DDD6FE' }}>
              Status: <span style={{ fontWeight: '400' }}>{filterStatus}</span>
              <X size={12} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => setFilterStatus('All Status')} />
            </div>
          )}
          <button onClick={clearFilters} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: '4px 8px', marginLeft: '4px' }}>
            Clear all
          </button>
        </div>
      )}

      {/* TABLE */}
      <div style={{ backgroundColor: '#FFFFFF', overflow: 'visible', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 4px 24px -8px rgba(0,0,0,0.08)' }}>
        {filteredShows.length === 0 ? (
          <div style={{ padding: '100px 24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--gray-100)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Search size={24} />
            </div>
            {processedShows.length === 0 ? (
              <>
                <h3 style={{ color: 'var(--navy-900)', marginBottom: '8px', fontSize: '16px', fontWeight: '700' }}>Nothing found yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>There are no shows in the database.</p>
              </>
            ) : (
              <>
                <h3 style={{ color: 'var(--navy-900)', marginBottom: '8px', fontSize: '16px', fontWeight: '700' }}>No shows found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Try adjusting your search or filters.</p>
                <button onClick={clearFilters} style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF', color: 'var(--navy-900)', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', width: '100%', maxWidth: '100%', minWidth: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', minWidth: '950px' }}>
                <thead>
                <tr style={{ backgroundColor: '#FFFFFF', color: '#475569', fontSize: '12px', fontWeight: '700' }}>
                  <th style={{ padding: '16px 24px', width: '35%', textTransform: 'uppercase', letterSpacing: '0.5px', borderTopLeftRadius: '24px', borderBottom: '1px solid #E2E8F0' }}>Show</th>
                  <th style={{ padding: '16px 16px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Section</th>
                  <th style={{ padding: '16px 16px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Languages</th>
                  <th style={{ padding: '16px 16px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Episodes</th>
                  <th style={{ padding: '16px 16px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                  <th style={{ padding: '16px 16px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Updated</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.5px', borderTopRightRadius: '24px', borderBottom: '1px solid #E2E8F0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShows.map((show, idx) => {
                  const displayLanguages = show.languages.slice(0, 3);
                  const extraLanguages = show.languages.length - 3;
                  
                  return (
                    <tr key={show.id} style={{ transition: 'background-color 0.15s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#FAFAFF'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 24px', borderBottom: idx === paginatedShows.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {(() => {
                            const artworkUrl = getShowArtwork(show);
                            if (artworkUrl) {
                              return (
                                <div style={{ width: '64px', height: '36px', borderRadius: '8px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA', flexShrink: 0, overflow: 'hidden' }}>
                                  <img 
                                    src={artworkUrl} 
                                    alt={show.title} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='36' viewBox='0 0 64 36'%3E%3Crect width='64' height='36' fill='%23f5f3ff'/%3E%3Cpath d='M22 18l4 4 8-8' stroke='%23a78bfa' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
                                    }}
                                  />
                                </div>
                              );
                            } else {
                              return (
                                <div style={{ width: '64px', height: '36px', borderRadius: '8px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA', flexShrink: 0, overflow: 'hidden' }}>
                                  <ImageIcon size={18} />
                                </div>
                              );
                            }
                          })()}
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {show.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {show.categories?.length > 0 ? show.categories.join(' • ') : 'No category'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: '16px 16px', fontSize: '13px', color: 'var(--navy-900)', borderBottom: idx === paginatedShows.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        {show.section ? (
                          <span style={{ 
                            backgroundColor: getSectionColors(show.section).bg, 
                            color: getSectionColors(show.section).text, 
                            padding: '4px 12px', 
                            borderRadius: '12px', 
                            fontWeight: '600' 
                          }}>
                            {show.section}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 16px', borderBottom: idx === paginatedShows.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        {show.languages.length > 0 ? (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {displayLanguages.map(l => (
                              <span key={l} style={{ 
                                backgroundColor: getLanguageColors(l).bg, 
                                color: getLanguageColors(l).text, 
                                padding: '4px 12px', 
                                borderRadius: '12px', 
                                fontSize: '12px', 
                                fontWeight: '700'
                              }}>
                                {l}
                              </span>
                            ))}
                            {extraLanguages > 0 && (
                              <span style={{ backgroundColor: 'var(--gray-100)', color: 'var(--text-muted)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                                +{extraLanguages}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 16px', fontSize: '13px', color: 'var(--navy-900)', fontWeight: '500', borderBottom: idx === paginatedShows.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        {show.totalEpisodes}
                      </td>

                      <td style={{ padding: '16px 16px', borderBottom: idx === paginatedShows.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: show.status === 'Published' ? '#DCFCE7' : '#FFEDD5', padding: '4px 10px', borderRadius: '12px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: show.status === 'Published' ? '#16A34A' : '#EA580C' }} />
                          <span style={{ fontSize: '12px', fontWeight: '600', color: show.status === 'Published' ? '#15803D' : '#C2410C' }}>
                            {show.status}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 16px', fontSize: '13px', color: 'var(--text-muted)', borderBottom: idx === paginatedShows.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        {safeFormatDate(show.updated_at || show.created_at, true) || '-'}
                      </td>

                      <td style={{ padding: '16px 24px', textAlign: 'right', borderBottom: idx === paginatedShows.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        <ActionMenu show={show} onDeleteClick={setShowToDelete} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            {filteredShows.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredShows.length}
                itemsPerPage={itemsPerPage}
                setCurrentPage={setCurrentPage}
                setItemsPerPage={setItemsPerPage}
                itemName="results"
              />
            )}
          </>
        )}
      </div>

      <DeleteModal 
        show={showToDelete}
        onClose={() => setShowToDelete(null)}
        onConfirm={() => deleteMutation.mutate(showToDelete.id)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

export default ShowsList;
