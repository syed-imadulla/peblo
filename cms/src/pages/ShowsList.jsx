import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Search, MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown, Image as ImageIcon, X, Trash2, Check, AlertTriangle } from 'lucide-react';

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

const Dropdown = ({ label, options, value, onChange, minWidth = '140px', prefix, placement = 'bottom' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', minWidth, flexShrink: 0 }}>
      {label && <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--navy-900)', paddingLeft: '4px', marginBottom: '6px', display: 'block' }}>{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          height: '42px', padding: '0 12px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          backgroundColor: isOpen ? 'var(--purple-50)' : 'var(--white)', 
          border: isOpen ? '1px solid var(--purple-400)' : '1px solid var(--border)', 
          borderRadius: '12px', cursor: 'pointer', color: isOpen ? 'var(--purple-700)' : 'var(--navy-900)', 
          fontSize: '13px', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px', fontWeight: value.startsWith('All') ? '400' : '500' }}>
          {prefix && <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginRight: '4px' }}>{prefix}</span>}
          {value}
        </span>
        <ChevronDown size={14} style={{ flexShrink: 0, color: isOpen ? 'var(--purple-700)' : 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </div>
      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          ...(placement === 'top' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }), 
          left: 0, 
          minWidth: '100%', 
          backgroundColor: '#FFFFFF', 
          border: '1px solid #E2E8F0', 
          borderRadius: '12px', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', 
          zIndex: 50, 
          padding: '6px' 
        }}>
          {options.map(opt => (
            <div 
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', backgroundColor: value === opt ? 'var(--purple-50)' : 'transparent', color: value === opt ? 'var(--purple-700)' : 'var(--navy-900)', fontWeight: value === opt ? '600' : '400', display: 'flex', alignItems: 'center', justifyContent: 'space-between', whiteSpace: 'nowrap' }}
              onMouseOver={e => { if (value !== opt) e.currentTarget.style.backgroundColor = 'var(--gray-50)' }}
              onMouseOut={e => { if (value !== opt) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {opt}
              {value === opt && <Check size={14} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ActionMenu = ({ show, onDeleteClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ background: isOpen ? 'var(--gray-100)' : 'transparent', border: '1px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOpen ? 'var(--navy-900)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s ease' }}
        title="Actions"
      >
        <MoreHorizontal size={14} />
      </button>
      {isOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, width: '160px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 50, padding: '6px' }}>
          <button 
            onClick={() => { setIsOpen(false); onDeleteClick(show); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', color: '#DC2626', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Trash2 size={14} /> Delete Show
          </button>
        </div>
      )}
    </div>
  );
};

const DeleteModal = ({ show, onClose, onConfirm, isDeleting }) => {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: 'var(--white)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <AlertTriangle size={24} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--navy-900)' }}>Delete Show</h3>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Are you sure you want to delete <strong>{show.title}</strong>? This will permanently remove the show and all its episodes. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={isDeleting} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--white)', color: 'var(--navy-900)', fontSize: '14px', fontWeight: '600', cursor: isDeleting ? 'not-allowed' : 'pointer' }}>Cancel</button>
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
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '16px', top: '13px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search shows by title, category or section..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 16px 10px 42px', 
              borderRadius: '12px', 
              border: search ? '1px solid var(--purple-400)' : '1px solid var(--border)',
              backgroundColor: search ? 'var(--purple-50)' : 'var(--white)',
              color: 'var(--navy-900)',
              fontSize: '14px',
              outline: 'none',
              height: '42px',
              boxShadow: 'var(--shadow-sm)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'var(--purple-50)', color: 'var(--purple-700)', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid var(--purple-200)' }}>
              Search: <span style={{ fontWeight: '400' }}>{search}</span>
              <X size={12} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => setSearch('')} />
            </div>
          )}
          {filterSection !== 'All Sections' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'var(--purple-50)', color: 'var(--purple-700)', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid var(--purple-200)' }}>
              Section: <span style={{ fontWeight: '400' }}>{filterSection}</span>
              <X size={12} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => setFilterSection('All Sections')} />
            </div>
          )}
          {filterLanguage !== 'All Languages' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'var(--purple-50)', color: 'var(--purple-700)', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid var(--purple-200)' }}>
              Language: <span style={{ fontWeight: '400' }}>{filterLanguage}</span>
              <X size={12} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => setFilterLanguage('All Languages')} />
            </div>
          )}
          {filterStatus !== 'All Status' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'var(--purple-50)', color: 'var(--purple-700)', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid var(--purple-200)' }}>
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
      <div style={{ backgroundColor: '#FFFFFF', overflow: 'visible', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}>
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
                <button onClick={clearFilters} style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--white)', color: 'var(--navy-900)', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
                <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', fontWeight: '600' }}>
                  <th style={{ padding: '16px 24px', width: '35%', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Show</th>
                  <th style={{ padding: '16px 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Section</th>
                  <th style={{ padding: '16px 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Languages</th>
                  <th style={{ padding: '16px 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Episodes</th>
                  <th style={{ padding: '16px 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '16px 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Updated</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShows.map((show, idx) => {
                  const displayLanguages = show.languages.slice(0, 3);
                  const extraLanguages = show.languages.length - 3;
                  
                  return (
                    <tr key={show.id} style={{ borderBottom: idx === paginatedShows.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background-color 0.15s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--gray-50)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {show.artwork?.length > 0 ? (
                            <img 
                              src={`http://127.0.0.1:8000/content${show.artwork[0].file_path}`} 
                              alt={show.title} 
                              style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border)', flexShrink: 0 }} 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Crect width='56' height='56' fill='%23f3f4f6'/%3E%3Cpath d='M20 28l4 4 8-8' stroke='%239ca3af' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div style={{ width: '56px', height: '56px', borderRadius: '10px', backgroundColor: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px solid var(--border)', flexShrink: 0 }}>
                              <ImageIcon size={20} />
                            </div>
                          )}
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--navy-900)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {show.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {show.categories?.length > 0 ? show.categories.join(' • ') : 'No category'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: '16px 16px', fontSize: '13px', color: 'var(--navy-900)' }}>
                        {show.section ? (
                          <span>{show.section}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 16px' }}>
                        {show.languages.length > 0 ? (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {displayLanguages.map(l => (
                              <span key={l} style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-700)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
                                {l}
                              </span>
                            ))}
                            {extraLanguages > 0 && (
                              <span style={{ backgroundColor: 'var(--gray-100)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                                +{extraLanguages}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 16px', fontSize: '13px', color: 'var(--navy-900)', fontWeight: '500' }}>
                        {show.totalEpisodes}
                      </td>

                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {show.status === 'Published' && (
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--green-500)' }} />
                          )}
                          <span style={{ fontSize: '13px', fontWeight: '500', color: show.status === 'Published' ? 'var(--navy-900)' : 'var(--text-muted)' }}>
                            {show.status}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {safeFormatDate(show.updated_at || show.created_at, true) || '-'}
                      </td>

                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <ActionMenu show={show} onDeleteClick={setShowToDelete} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                Showing <strong style={{ color: 'var(--navy-900)' }}>{(currentPage - 1) * itemsPerPage + (filteredShows.length > 0 ? 1 : 0)}</strong> to <strong style={{ color: 'var(--navy-900)' }}>{Math.min(currentPage * itemsPerPage, filteredShows.length)}</strong> of <strong style={{ color: 'var(--navy-900)' }}>{filteredShows.length}</strong> shows
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--white)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? 'var(--gray-300)' : 'var(--navy-900)', transition: 'all 0.2s ease', boxShadow: currentPage === 1 ? 'none' : 'var(--shadow-sm)' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--purple-700)', color: 'var(--purple-700)', borderRadius: '8px', background: 'var(--purple-50)', fontWeight: '600', fontSize: '13px' }}>
                  {currentPage}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--white)', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', color: (currentPage === totalPages || totalPages === 0) ? 'var(--gray-300)' : 'var(--navy-900)', transition: 'all 0.2s ease', boxShadow: (currentPage === totalPages || totalPages === 0) ? 'none' : 'var(--shadow-sm)' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Dropdown 
                  value={`${itemsPerPage} per page`}
                  onChange={(val) => setItemsPerPage(Number(val.split(' ')[0]))}
                  options={['10 per page', '20 per page', '50 per page']}
                  minWidth="130px"
                />
              </div>
            </div>
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
