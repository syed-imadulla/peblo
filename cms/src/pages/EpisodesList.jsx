import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Search, MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown, Image as ImageIcon, X, Trash2, Check, AlertTriangle, AlertCircle, Edit2 } from 'lucide-react';

const fetchShows = async () => {
  const { data } = await axios.get('/api/admin/shows');
  return data;
};

const fetchValidationReport = async () => {
  const { data } = await axios.get('/api/admin/validation-report');
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

const getLanguageColors = (lang) => {
  switch(lang?.toUpperCase()) {
    case 'EN': return { bg: '#DCFCE7', text: '#15803D' };
    case 'HI': return { bg: '#E0F2FE', text: '#0369A1' };
    default: return { bg: '#F3E8FF', text: '#7E22CE' };
  }
};

const getContentGroupColors = (group) => {
  switch (group?.toLowerCase()) {
    case 'series': return { bg: '#E0F2FE', text: '#0369A1' };
    case 'minisodes': return { bg: '#FFEDD5', text: '#C2410C' };
    case 'songs': return { bg: '#FEF9C3', text: '#CA8A04' };
    case 'shorts': return { bg: '#FCE7F3', text: '#BE185D' };
    default: return { bg: '#F1F5F9', text: '#475569' };
  }
};

const Dropdown = ({ label, options, value, onChange, minWidth = '140px', prefix, placement = 'bottom', height = '42px', padding = '0 12px 0 16px' }) => {
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
          height, padding, display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          backgroundColor: isOpen ? '#F5F3FF' : '#FFFFFF', 
          border: isOpen ? '1px solid #A78BFA' : '1px solid #E2E8F0', 
          borderRadius: '20px', cursor: 'pointer', color: isOpen ? '#6D28D9' : '#334155', 
          fontSize: '13px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
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
          border: 'none', 
          borderRadius: '20px', 
          boxShadow: '0 10px 40px -10px rgba(109, 40, 217, 0.15)', 
          zIndex: 50, 
          padding: '6px' 
        }}>
          {options.map(opt => (
            <div 
              key={opt}
              title={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', backgroundColor: value === opt ? 'var(--purple-50)' : 'transparent', color: value === opt ? 'var(--purple-700)' : 'var(--navy-900)', fontWeight: value === opt ? '600' : '400', display: 'flex', alignItems: 'center', justifyContent: 'space-between', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              onMouseOver={e => { if (value !== opt) e.currentTarget.style.backgroundColor = 'var(--gray-50)' }}
              onMouseOut={e => { if (value !== opt) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' }}>{opt}</span>
              {value === opt && <Check size={14} style={{ flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ActionMenu = ({ episode, onEditClick, onDeleteClick }) => {
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
      {isOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, width: '160px', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 50, padding: '6px' }}>
          <button 
            onClick={() => { setIsOpen(false); onEditClick(episode); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', color: 'var(--navy-900)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left', marginBottom: '2px' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Edit2 size={14} /> Edit Episode
          </button>
          <button 
            onClick={() => { setIsOpen(false); onDeleteClick(episode); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', color: '#DC2626', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Trash2 size={14} /> Delete Episode
          </button>
        </div>
      )}
    </div>
  );
};

const DeleteModal = ({ episode, onClose, onConfirm, isDeleting }) => {
  if (!episode) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <AlertTriangle size={24} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--navy-900)' }}>Delete Episode</h3>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Are you sure you want to delete <strong>{episode.episode_title}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={isDeleting} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF', color: 'var(--navy-900)', fontSize: '14px', fontWeight: '600', cursor: isDeleting ? 'not-allowed' : 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={isDeleting} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#DC2626', color: 'white', fontSize: '14px', fontWeight: '600', cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.7 : 1 }}>
            {isDeleting ? 'Deleting...' : 'Delete Episode'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EpisodesList = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterShow, setFilterShow] = useState('All Shows');
  const [filterContentGroup, setFilterContentGroup] = useState('All Groups');
  const [filterLanguage, setFilterLanguage] = useState('All Languages');
  const [filterStatus, setFilterStatus] = useState('All Status');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [episodeToDelete, setEpisodeToDelete] = useState(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterShow, filterContentGroup, filterLanguage, filterStatus, itemsPerPage]);

  const { data: shows, isLoading: isLoadingShows, error: errorShows } = useQuery({
    queryKey: ['shows'],
    queryFn: fetchShows,
  });

  const { data: validationReport, isLoading: isLoadingValidation } = useQuery({
    queryKey: ['validationReport'],
    queryFn: fetchValidationReport,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/api/admin/episodes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['shows']);
      setEpisodeToDelete(null);
    }
  });

  const { uniqueShows, uniqueContentGroups, uniqueLanguages, processedEpisodes } = useMemo(() => {
    if (!shows) return { uniqueShows: [], uniqueContentGroups: [], uniqueLanguages: [], processedEpisodes: [] };
    
    const showSet = new Set();
    const groupSet = new Set();
    const langSet = new Set();
    
    const episodes = [];
    
    shows.forEach(show => {
      if (show.title) showSet.add(show.title);
      
      show.seasons?.forEach(season => {
        season.episodes?.forEach(episode => {
          if (episode.content_group) groupSet.add(episode.content_group);
          if (episode.language) langSet.add(episode.language.toUpperCase());
          
          let validationState = 'neutral';
          if (episode.status === 'published' && validationReport) {
            const hasIssue = validationReport.issues.some(issue => issue.affected_episode_id === episode.id);
            validationState = hasIssue ? 'issues' : 'valid';
          }
          
          episodes.push({
            ...episode,
            showTitle: show.title,
            seasonNumber: season.season_number,
            validationState
          });
        });
      });
    });
    
    return {
      uniqueShows: Array.from(showSet).sort(),
      uniqueContentGroups: Array.from(groupSet).sort(),
      uniqueLanguages: Array.from(langSet).sort(),
      processedEpisodes: episodes.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    };
  }, [shows, validationReport]);

  const filteredEpisodes = useMemo(() => {
    let result = processedEpisodes.filter(ep => {
      const matchSearch = ep.episode_title.toLowerCase().includes(search.toLowerCase()) || 
                          ep.showTitle.toLowerCase().includes(search.toLowerCase()) ||
                          ep.content_group.toLowerCase().includes(search.toLowerCase());
      const matchShow = filterShow === 'All Shows' || ep.showTitle === filterShow;
      const matchGroup = filterContentGroup === 'All Groups' || ep.content_group === filterContentGroup;
      const matchLanguage = filterLanguage === 'All Languages' || (ep.language && ep.language.toUpperCase() === filterLanguage);
      const matchStatus = filterStatus === 'All Status' || ep.status === filterStatus.toLowerCase();
      
      return matchSearch && matchShow && matchGroup && matchLanguage && matchStatus;
    });

    return result;
  }, [processedEpisodes, search, filterShow, filterContentGroup, filterLanguage, filterStatus]);

  const paginatedEpisodes = filteredEpisodes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredEpisodes.length / itemsPerPage);

  const hasActiveFilters = search !== '' || filterShow !== 'All Shows' || filterContentGroup !== 'All Groups' || filterLanguage !== 'All Languages' || filterStatus !== 'All Status';

  const clearFilters = () => {
    setSearch('');
    setFilterShow('All Shows');
    setFilterContentGroup('All Groups');
    setFilterLanguage('All Languages');
    setFilterStatus('All Status');
  };

  const handleEditClick = (episode) => {
    navigate(`/episodes/${episode.id}/edit`);
  };

  const handleCreateClick = () => {
    navigate('/episodes/new');
  };

  if (isLoadingShows || isLoadingValidation) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--purple-600)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
      Loading episodes...
    </div>
  );
  if (errorShows) return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <AlertTriangle size={24} />
      </div>
      <h3 style={{ color: 'var(--navy-900)', marginBottom: '8px', fontSize: '16px', fontWeight: '700' }}>Unable to load episodes</h3>
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
            placeholder="Search episodes by title, show or content group..." 
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
            label="Show" 
            value={filterShow} 
            onChange={setFilterShow} 
            options={['All Shows', ...uniqueShows]} 
          />
          <Dropdown 
            label="Content Group" 
            value={filterContentGroup} 
            onChange={setFilterContentGroup} 
            options={['All Groups', ...uniqueContentGroups]} 
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
          {filterShow !== 'All Shows' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#F5F3FF', color: '#6D28D9', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #DDD6FE' }}>
              Show: <span style={{ fontWeight: '400' }}>{filterShow}</span>
              <X size={12} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => setFilterShow('All Shows')} />
            </div>
          )}
          {filterContentGroup !== 'All Groups' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#F5F3FF', color: '#6D28D9', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #DDD6FE' }}>
              Group: <span style={{ fontWeight: '400' }}>{filterContentGroup}</span>
              <X size={12} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => setFilterContentGroup('All Groups')} />
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
        {filteredEpisodes.length === 0 ? (
          <div style={{ padding: '100px 24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--gray-100)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Search size={24} />
            </div>
            {processedEpisodes.length === 0 ? (
              <>
                <h3 style={{ color: 'var(--navy-900)', marginBottom: '8px', fontSize: '16px', fontWeight: '700' }}>No episodes yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Create your first episode to get started.</p>
                <button onClick={handleCreateClick} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--purple-700)', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(109, 40, 217, 0.25)' }}>
                  + Add New Episode
                </button>
              </>
            ) : (
              <>
                <h3 style={{ color: 'var(--navy-900)', marginBottom: '8px', fontSize: '16px', fontWeight: '700' }}>No episodes found</h3>
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
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', minWidth: '1100px' }}>
                <thead>
                <tr style={{ backgroundColor: '#FFFFFF', color: '#475569', fontSize: '12px', fontWeight: '700' }}>
                  <th style={{ padding: '16px 24px', width: '30%', textTransform: 'uppercase', letterSpacing: '0.5px', borderTopLeftRadius: '24px', borderBottom: '1px solid #E2E8F0' }}>Episode</th>
                  <th style={{ padding: '16px 16px', width: '22%', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Show</th>
                  <th style={{ padding: '16px 16px', width: '15%', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Content Group</th>
                  <th style={{ padding: '16px 16px', width: '8%', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Language</th>
                  <th style={{ padding: '16px 16px', width: '8%', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Duration</th>
                  <th style={{ padding: '16px 16px', width: '8%', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                  <th style={{ padding: '16px 16px', width: '9%', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Validation</th>
                  <th style={{ padding: '16px 16px', width: '8%', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Updated</th>
                  <th style={{ padding: '16px 24px', width: '7%', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.5px', borderTopRightRadius: '24px', borderBottom: '1px solid #E2E8F0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEpisodes.map((ep, idx) => {
                  return (
                    <tr key={ep.id} style={{ transition: 'background-color 0.15s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#FAFAFF'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 24px', borderBottom: idx === paginatedEpisodes.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                          <div style={{ width: '64px', height: '36px', borderRadius: '8px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA', flexShrink: 0, overflow: 'hidden' }}>
                            {ep.artwork && ep.artwork.length > 0 ? (
                              <img src={`http://127.0.0.1:8000/content${ep.artwork[0].url}`} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <ImageIcon size={18} />
                            )}
                          </div>
                          <div style={{ overflow: 'hidden', minWidth: 0 }}>
                            <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ep.episode_title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ep.season_number === 0 ? 'Trailer' : `S${ep.season_number} • Episode ${idx + 1}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: '16px 16px', fontSize: '13px', color: 'var(--navy-900)', borderBottom: idx === paginatedEpisodes.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', minWidth: 0 }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', width: '100%' }}>
                            {ep.showTitle}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 16px', fontSize: '13px', color: 'var(--text-muted)', borderBottom: idx === paginatedEpisodes.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', minWidth: 0 }}>
                          <span title={ep.content_group} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', width: '100%' }}>
                            {ep.content_group || '-'}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 16px', borderBottom: idx === paginatedEpisodes.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        {ep.language ? (
                          <span style={{ 
                            backgroundColor: getLanguageColors(ep.language).bg, 
                            color: getLanguageColors(ep.language).text, 
                            padding: '4px 12px', 
                            borderRadius: '12px', 
                            fontSize: '12px', 
                            fontWeight: '700'
                          }}>
                            {ep.language.toUpperCase()}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 16px', fontSize: '13px', color: 'var(--navy-900)', borderBottom: idx === paginatedEpisodes.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        {ep.duration_seconds ? `${String(Math.floor(ep.duration_seconds / 60)).padStart(2, '0')}:${String(ep.duration_seconds % 60).padStart(2, '0')}` : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>

                      <td style={{ padding: '16px 16px', borderBottom: idx === paginatedEpisodes.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: ep.status === 'published' ? '#DCFCE7' : '#FFEDD5', padding: '4px 10px', borderRadius: '12px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: ep.status === 'published' ? '#16A34A' : '#EA580C' }} />
                          <span style={{ fontSize: '12px', fontWeight: '600', color: ep.status === 'published' ? '#15803D' : '#C2410C' }}>
                            {ep.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </td>
                      
                      <td style={{ padding: '16px 16px', borderBottom: idx === paginatedEpisodes.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        {ep.validationState === 'valid' ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16A34A', fontSize: '13px', fontWeight: '600' }}>
                            <Check size={14} /> Valid
                          </div>
                        ) : ep.validationState === 'issues' ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#EA580C', fontSize: '13px', fontWeight: '600' }}>
                            <AlertTriangle size={14} /> Issues
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 16px', fontSize: '13px', color: 'var(--text-muted)', borderBottom: idx === paginatedEpisodes.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        {safeFormatDate(ep.updated_at || ep.created_at, true) || '-'}
                      </td>

                      <td style={{ padding: '16px 24px', textAlign: 'right', borderBottom: idx === paginatedEpisodes.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                        <ActionMenu episode={ep} onEditClick={handleEditClick} onDeleteClick={setEpisodeToDelete} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #F1F5F9', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                Showing <strong style={{ color: '#0F172A' }}>{(currentPage - 1) * itemsPerPage + (filteredEpisodes.length > 0 ? 1 : 0)}</strong> to <strong style={{ color: '#0F172A' }}>{Math.min(currentPage * itemsPerPage, filteredEpisodes.length)}</strong> of <strong style={{ color: '#0F172A' }}>{filteredEpisodes.length}</strong> episodes
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '10px', background: 'transparent', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#CBD5E1' : '#64748B', transition: 'all 0.2s ease' }}
                  onMouseOver={e => { if(currentPage !== 1) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#334155'; } }}
                  onMouseOut={e => { if(currentPage !== 1) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: '#FFFFFF', borderRadius: '10px', background: '#8B5CF6', fontWeight: '600', fontSize: '13px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)' }}>
                  {currentPage}
                </div>
                
                {totalPages > 1 && currentPage < totalPages && (
                  <button 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: '#64748B', borderRadius: '10px', background: 'transparent', fontWeight: '500', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#334155'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
                  >
                    {currentPage + 1}
                  </button>
                )}
                
                {totalPages > 2 && currentPage < totalPages - 1 && (
                  <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: '#94A3B8', background: 'transparent', fontWeight: '500', fontSize: '13px' }}>
                    ...
                  </div>
                )}

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '10px', background: 'transparent', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', color: (currentPage === totalPages || totalPages === 0) ? '#CBD5E1' : '#64748B', transition: 'all 0.2s ease' }}
                  onMouseOver={e => { if(currentPage !== totalPages && totalPages !== 0) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#334155'; } }}
                  onMouseOut={e => { if(currentPage !== totalPages && totalPages !== 0) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Dropdown 
                  value={`${itemsPerPage} per page`}
                  onChange={(val) => setItemsPerPage(Number(val.split(' ')[0]))}
                  options={['10 per page', '20 per page', '50 per page']}
                  minWidth="110px"
                  placement="top"
                  height="36px"
                  padding="0 10px 0 14px"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <DeleteModal 
        episode={episodeToDelete}
        onClose={() => setEpisodeToDelete(null)}
        onConfirm={() => deleteMutation.mutate(episodeToDelete.id)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

export default EpisodesList;
