import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Search, Eye, Edit2, MoreHorizontal, Filter, ChevronLeft, ChevronRight, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    if (s.episodes) {
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

const getSectionColor = (section) => {
  const map = {
    'Featured': { bg: 'var(--purple-100)', text: 'var(--purple-700)' },
    'Series': { bg: 'var(--blue-100)', text: 'var(--blue-700)' },
    'Minisodes': { bg: 'var(--orange-100)', text: 'var(--orange-700)' },
    'Songs': { bg: 'var(--amber-100)', text: 'var(--amber-700)' },
  };
  return map[section] || { bg: 'var(--gray-100)', text: 'var(--gray-700)' };
};

const ShowsList = () => {
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('All Sections');
  const [filterLanguage, setFilterLanguage] = useState('All Languages');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [sortBy, setSortBy] = useState('Updated: Newest');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: shows, isLoading, error } = useQuery({
    queryKey: ['shows'],
    queryFn: fetchShows,
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
      return 0;
    });

    return result;
  }, [processedShows, search, filterSection, filterLanguage, filterStatus, sortBy]);

  const paginatedShows = filteredShows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredShows.length / itemsPerPage);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
      Loading shows...
    </div>
  );
  if (error) return <div style={{ padding: '24px', color: 'var(--red-600)' }}>Error loading shows: {error.message}</div>;

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* FILTER BAR */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
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
              border: '1px solid var(--border)',
              backgroundColor: 'var(--white)',
              fontSize: '14px',
              outline: 'none',
              height: '42px',
              boxShadow: 'var(--shadow-sm)'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--navy-900)', paddingLeft: '4px' }}>Section</label>
            <div style={{ position: 'relative' }}>
              <select 
                value={filterSection} 
                onChange={e => setFilterSection(e.target.value)}
                style={{ appearance: 'none', padding: '0 32px 0 16px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--white)', fontSize: '13px', color: 'var(--navy-900)', cursor: 'pointer', outline: 'none', height: '42px', minWidth: '140px' }}
              >
                <option value="All Sections">All Sections</option>
                {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--navy-900)', paddingLeft: '4px' }}>Language</label>
            <div style={{ position: 'relative' }}>
              <select 
                value={filterLanguage} 
                onChange={e => setFilterLanguage(e.target.value)}
                style={{ appearance: 'none', padding: '0 32px 0 16px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--white)', fontSize: '13px', color: 'var(--navy-900)', cursor: 'pointer', outline: 'none', height: '42px', minWidth: '140px' }}
              >
                <option value="All Languages">All Languages</option>
                {uniqueLanguages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--navy-900)', paddingLeft: '4px' }}>Status</label>
            <div style={{ position: 'relative' }}>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                style={{ appearance: 'none', padding: '0 32px 0 16px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--white)', fontSize: '13px', color: 'var(--navy-900)', cursor: 'pointer', outline: 'none', height: '42px', minWidth: '140px' }}
              >
                <option value="All Status">All Status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--navy-900)', paddingLeft: '4px' }}>Sort by</label>
            <div style={{ position: 'relative' }}>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{ appearance: 'none', padding: '0 32px 0 16px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--white)', fontSize: '13px', color: 'var(--navy-900)', cursor: 'pointer', outline: 'none', height: '42px', minWidth: '150px' }}
              >
                <option value="Updated: Newest">Updated: Newest</option>
                <option value="Updated: Oldest">Updated: Oldest</option>
                <option value="Title: A-Z">Title: A-Z</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <button style={{ height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Filter size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="card" style={{ padding: 0, backgroundColor: 'var(--white)', overflow: 'hidden' }}>
        {filteredShows.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--purple-100)', color: 'var(--purple-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Search size={24} />
            </div>
            <h3 style={{ color: 'var(--navy-900)', marginBottom: '8px', fontSize: '16px', fontWeight: '700' }}>No shows found</h3>
            <p style={{ fontSize: '14px' }}>Try adjusting your filters, or create a show to start building your library.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                  <th style={{ padding: '16px 24px', width: '35%' }}>Show</th>
                  <th style={{ padding: '16px 12px' }}>Section</th>
                  <th style={{ padding: '16px 12px' }}>Languages</th>
                  <th style={{ padding: '16px 12px' }}>Episodes</th>
                  <th style={{ padding: '16px 12px' }}>Status</th>
                  <th style={{ padding: '16px 12px' }}>Updated</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShows.map((show, idx) => {
                  const secColor = getSectionColor(show.section);
                  return (
                    <tr key={show.id} style={{ borderBottom: idx === paginatedShows.length - 1 ? 'none' : '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {show.artwork?.length > 0 ? (
                            <img 
                              src={`http://127.0.0.1:8000/content${show.artwork[0].file_path}`} 
                              alt={show.title} 
                              style={{ width: '72px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='48' viewBox='0 0 72 48'%3E%3Crect width='72' height='48' fill='%23f3f4f6'/%3E%3Cpath d='M28 24l4 4 8-8' stroke='%239ca3af' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div style={{ width: '72px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                              <ImageIcon size={20} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--navy-900)', marginBottom: '4px' }}>{show.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {show.categories?.length > 0 ? show.categories.join(' • ') : 'No category'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: '16px 12px' }}>
                        {show.section ? (
                          <span style={{ backgroundColor: secColor.bg, color: secColor.text, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                            {show.section}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 12px' }}>
                        {show.languages.length > 0 ? (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {show.languages.map(l => (
                              <span key={l} style={{ backgroundColor: 'var(--green-50)', color: 'var(--green-600)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
                                {l}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 12px', fontSize: '13px', color: 'var(--navy-900)', fontWeight: '500' }}>
                        {show.totalEpisodes}
                      </td>

                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: show.status === 'Published' ? 'var(--green-500)' : 'var(--orange-500)' }} />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: show.status === 'Published' ? 'var(--green-600)' : 'var(--orange-600)' }}>
                            {show.status}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {safeFormatDate(show.updated_at || show.created_at, true) || '-'}
                      </td>

                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <Eye size={14} />
                          </button>
                          <Link to={`/shows/${show.id}/edit`} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple-700)', cursor: 'pointer' }}>
                            <Edit2 size={14} />
                          </Link>
                          <button style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Showing {(currentPage - 1) * itemsPerPage + (filteredShows.length > 0 ? 1 : 0)} to {Math.min(currentPage * itemsPerPage, filteredShows.length)} of {filteredShows.length} shows
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--white)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? 'var(--gray-300)' : 'var(--text-main)' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--purple-700)', color: 'var(--purple-700)', borderRadius: '8px', background: 'var(--purple-50)', fontWeight: '600', fontSize: '13px' }}>
                  {currentPage}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--white)', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', color: (currentPage === totalPages || totalPages === 0) ? 'var(--gray-300)' : 'var(--text-main)' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <select disabled style={{ appearance: 'none', padding: '8px 28px 8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--white)', fontSize: '13px', color: 'var(--navy-900)', outline: 'none' }}>
                    <option>10 per page</option>
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '9px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ShowsList;
