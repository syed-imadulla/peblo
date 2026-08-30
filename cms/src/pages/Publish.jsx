import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { 
  CheckCircle, 
  Info, 
  Check, 
  XCircle,
  FileJson,
  Tv,
  Globe,
  Briefcase,
  PlaySquare,
  ChevronLeft,
  ChevronRight,
  Film,
  Send,
  Eye
} from 'lucide-react';
import { parseISO, format } from 'date-fns';

const fetchValidationReport = async () => {
  const { data } = await axios.get('/api/admin/validation-report');
  return data;
};

const fetchPublishHistory = async () => {
  const { data } = await axios.get('/api/admin/publish-history');
  return data;
};

const fetchCatalogPreview = async () => {
  const { data } = await axios.get('/api/admin/catalog/preview');
  return data;
};

const publishCatalog = async () => {
  const { data } = await axios.post('/api/admin/catalog/publish');
  return data;
};

const parseUtcDate = (dateString) => {
  if (!dateString) return null;
  if (!dateString.endsWith('Z')) {
    dateString += 'Z';
  }
  return parseISO(dateString);
};

const Publish = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [publishResult, setPublishResult] = useState(null);
  const [activeTab, setActiveTab] = useState('shows');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (showPreviewModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPreviewModal]);

  const { data: report, isLoading: loadingReport } = useQuery({
    queryKey: ['validationReport'],
    queryFn: fetchValidationReport,
    refetchOnWindowFocus: true,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['publishHistory'],
    queryFn: fetchPublishHistory,
    refetchOnWindowFocus: true,
  });

  const { data: previewData, isLoading: loadingPreview } = useQuery({
    queryKey: ['catalogPreview'],
    queryFn: fetchCatalogPreview,
    refetchOnWindowFocus: true,
  });

  const publishMutation = useMutation({
    mutationFn: publishCatalog,
    onSuccess: (data) => {
      setPublishResult({ type: 'success', data });
      queryClient.invalidateQueries({ queryKey: ['validationReport'] });
      queryClient.invalidateQueries({ queryKey: ['publishHistory'] });
      queryClient.invalidateQueries({ queryKey: ['catalogPreview'] });
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      setPublishResult({ 
        type: 'error', 
        message: error.response?.data?.detail || error.message 
      });
    },
  });

  // Derived Preview Data
  const { allShows, allEpisodes, allLanguages, sectionsList = [] } = useMemo(() => {
    if (!previewData || Object.keys(previewData).length === 0) return { allShows: [], allEpisodes: [], allLanguages: [], sectionsCount: 0 };
    
    const shows = [];
    const episodes = [];
    const langs = new Set();
    const uniqueSections = new Set();

    Object.entries(previewData).forEach(([section, sectionShows]) => {
      if (sectionShows.length > 0) uniqueSections.add(section);
      
      sectionShows.forEach(show => {
        let epCount = show.trailers?.length || 0;
        let showLangs = new Set();
        let artworkUrl = null;
        
        if (show.trailers) {
            show.trailers.forEach(t => {
                if (t.languages) t.languages.forEach(l => { langs.add(l); showLangs.add(l); });
                episodes.push({ ...t, showTitle: show.title, season: 0 });
                if (!artworkUrl && t.artwork && t.artwork['16x9']) artworkUrl = t.artwork['16x9'];
            });
        }
        
        if (show.seasons) {
            show.seasons.forEach(season => {
                epCount += (season.episodes?.length || 0);
                if (season.episodes) {
                    season.episodes.forEach(e => {
                        if (e.languages) e.languages.forEach(l => { langs.add(l); showLangs.add(l); });
                        episodes.push({ ...e, showTitle: show.title, season: season.season_number });
                        if (!artworkUrl && e.artwork && e.artwork['16x9']) artworkUrl = e.artwork['16x9'];
                    });
                }
            });
        }
        
        shows.push({
          id: show.show_id,
          title: show.title,
          section: section,
          episodeCount: epCount,
          languages: Array.from(showLangs),
          status: 'Published',
          categories: show.categories || [],
          artwork: artworkUrl
        });
      });
    });

    return {
      allShows: shows,
      allEpisodes: episodes,
      allLanguages: Array.from(langs).map(code => ({ code })), 
      sectionsList: Array.from(uniqueSections)
    };
  }, [previewData]);

  const pageSize = 10;
  const paginatedShows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allShows.slice(start, start + pageSize);
  }, [allShows, currentPage]);

  const paginatedEpisodes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allEpisodes.slice(start, start + pageSize);
  }, [allEpisodes, currentPage]);

  const paginatedLanguages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allLanguages.slice(start, start + pageSize);
  }, [allLanguages, currentPage]);

  // Adjust pagination if data changes
  useEffect(() => {
      const activeData = activeTab === 'shows' ? allShows : (activeTab === 'episodes' ? allEpisodes : allLanguages);
      const totalPages = Math.max(1, Math.ceil(activeData.length / pageSize));
      if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [allShows, allEpisodes, allLanguages, activeTab, currentPage, pageSize]);

  if (loadingReport || loadingHistory || loadingPreview) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
        <div style={{ height: '40px', width: '300px', backgroundColor: '#f1f5f9', borderRadius: '8px', margin: '8px 0 32px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px' }}>
          <div>
            <div style={{ height: '150px', backgroundColor: '#f1f5f9', borderRadius: '16px', marginBottom: '24px' }} />
            <div style={{ height: '400px', backgroundColor: '#f1f5f9', borderRadius: '16px' }} />
          </div>
          <div>
            <div style={{ height: '250px', backgroundColor: '#f1f5f9', borderRadius: '16px', marginBottom: '16px' }} />
            <div style={{ height: '250px', backgroundColor: '#f1f5f9', borderRadius: '16px' }} />
          </div>
        </div>
      </div>
    );
  }

  const isBlocked = report?.blocked_records_count > 0;
  const isAdmin = user?.role === 'admin';
  
  let publishDisabledReason = null;
  if (!isAdmin) {
    publishDisabledReason = "Only administrators can publish the catalogue.";
  } else if (isBlocked) {
    publishDisabledReason = "Publishing is disabled because there are blocking validation issues.";
  }

  const lastRun = history && history.length > 0 ? history[0] : null;

  // Validation Checks breakdown - using EXACT issue_type strings from admin.py
  const hasArtworkIssue = report?.issues?.some(i => i.issue_type === 'Missing Artwork');
  const hasDurationIssue = report?.issues?.some(i => i.issue_type === 'Missing Duration');
  const hasSectionIssue = report?.issues?.some(i => i.issue_type === 'Missing Show Section');
  const hasDuplicateIssue = report?.issues?.some(i => i.issue_type === 'Duplicate Content Group');

  const ChecklistItem = ({ passed, title, description }) => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      {passed ? (
          <CheckCircle size={16} style={{ color: '#10b981', marginTop: '2px' }} />
      ) : (
          <XCircle size={16} style={{ color: '#ef4444', marginTop: '2px' }} />
      )}
      <div>
        <div style={{ fontWeight: 700, fontSize: '13px', color: passed ? 'var(--navy-900)' : '#b91c1c' }}>{title}</div>
        <div style={{ fontSize: '12px', color: passed ? 'var(--text-muted)' : '#b91c1c', marginTop: '2px', opacity: passed ? 1 : 0.8 }}>{description}</div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '8px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: '800', fontSize: '28px', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
            Publish Catalogue
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            Review your content and publish the catalogue for viewers.
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

          <button 
            className="btn btn-primary" 
            onClick={() => publishMutation.mutate()}
            disabled={!isAdmin || isBlocked || publishMutation.isPending}
            style={{ 
              height: '40px', 
              padding: '0 24px', 
              borderRadius: '8px', 
              fontWeight: '600', 
              fontSize: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              backgroundColor: '#4325c2', 
              color: '#FFFFFF', 
              border: 'none', 
              boxShadow: (!isAdmin || isBlocked || publishMutation.isPending) ? 'none' : '0 4px 12px rgba(109, 40, 217, 0.25)', 
              cursor: (!isAdmin || isBlocked || publishMutation.isPending) ? 'not-allowed' : 'pointer', 
              whiteSpace: 'nowrap', 
              flexShrink: 0,
              opacity: (!isAdmin || isBlocked || publishMutation.isPending) ? 0.6 : 1
            }}
            title={publishDisabledReason || ''}
          >
            {publishMutation.isPending ? 'Publishing...' : (
              <>
                <Send size={16} /> Publish Changes
              </>
            )}
          </button>
        </div>
      </div>

      {publishResult && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: publishResult.type === 'success' ? '#dcfce7' : '#fee2e2', 
          color: publishResult.type === 'success' ? '#166534' : '#991b1b',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600
        }}>
          {publishResult.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {publishResult.type === 'success' ? 'Catalogue published successfully.' : `Publish failed: ${publishResult.message}`}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px' }}>
        {/* Left Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          
          {/* Summary Card */}
          <div className="card" style={{ padding: '24px', marginBottom: 0 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
               <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--navy-900)' }}>Catalogue Summary</h3>
               <button 
                 className="btn btn-outline" 
                 onClick={() => setShowPreviewModal(true)}
                 style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
               >
                 <Eye size={14} /> Preview JSON
               </button>
             </div>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Tv size={24} />
                 </div>
                 <div>
                   <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--navy-900)', lineHeight: '1' }}>{allShows.length}</div>
                   <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>Shows</div>
                 </div>
               </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <PlaySquare size={24} />
                 </div>
                 <div>
                   <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--navy-900)', lineHeight: '1' }}>{allEpisodes.length}</div>
                   <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>Episodes</div>
                 </div>
               </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Globe size={24} />
                 </div>
                 <div>
                   <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--navy-900)', lineHeight: '1' }}>{allLanguages.length}</div>
                   <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>Languages</div>
                 </div>
               </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ffedd5', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Briefcase size={24} />
                 </div>
                 <div>
                   <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--navy-900)', lineHeight: '1' }}>{sectionsList.length}</div>
                   <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>Sections</div>
                 </div>
               </div>
             </div>
          </div>

          {/* Data Tables */}
          <div className="card" style={{ padding: '24px', marginBottom: 0 }}>
             <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '24px', color: 'var(--navy-900)' }}>Content to be Published</h3>
             
             {/* Tabs */}
             <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
               <button 
                 onClick={() => { setActiveTab('shows'); setCurrentPage(1); }}
                 style={{ 
                   padding: '0 0 12px 0', 
                   background: 'none', 
                   border: 'none', 
                   borderBottom: activeTab === 'shows' ? '2px solid var(--purple-600)' : '2px solid transparent',
                   color: activeTab === 'shows' ? 'var(--navy-900)' : 'var(--text-muted)',
                   fontWeight: activeTab === 'shows' ? 700 : 600,
                   fontSize: '14px',
                   cursor: 'pointer',
                   display: 'flex', alignItems: 'center', gap: '8px'
                 }}
               >
                 <Tv size={16} /> Shows <span style={{ backgroundColor: activeTab === 'shows' ? 'var(--purple-100)' : '#f1f5f9', color: activeTab === 'shows' ? 'var(--purple-700)' : 'var(--text-muted)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{allShows.length}</span>
               </button>
               <button 
                 onClick={() => { setActiveTab('episodes'); setCurrentPage(1); }}
                 style={{ 
                   padding: '0 0 12px 0', 
                   background: 'none', 
                   border: 'none', 
                   borderBottom: activeTab === 'episodes' ? '2px solid var(--purple-600)' : '2px solid transparent',
                   color: activeTab === 'episodes' ? 'var(--navy-900)' : 'var(--text-muted)',
                   fontWeight: activeTab === 'episodes' ? 700 : 600,
                   fontSize: '14px',
                   cursor: 'pointer',
                   display: 'flex', alignItems: 'center', gap: '8px'
                 }}
               >
                 <PlaySquare size={16} /> Episodes <span style={{ backgroundColor: activeTab === 'episodes' ? 'var(--purple-100)' : '#f1f5f9', color: activeTab === 'episodes' ? 'var(--purple-700)' : 'var(--text-muted)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{allEpisodes.length}</span>
               </button>
               <button 
                 onClick={() => { setActiveTab('languages'); setCurrentPage(1); }}
                 style={{ 
                   padding: '0 0 12px 0', 
                   background: 'none', 
                   border: 'none', 
                   borderBottom: activeTab === 'languages' ? '2px solid var(--purple-600)' : '2px solid transparent',
                   color: activeTab === 'languages' ? 'var(--navy-900)' : 'var(--text-muted)',
                   fontWeight: activeTab === 'languages' ? 700 : 600,
                   fontSize: '14px',
                   cursor: 'pointer',
                   display: 'flex', alignItems: 'center', gap: '8px'
                 }}
               >
                 <Globe size={16} /> Languages <span style={{ backgroundColor: activeTab === 'languages' ? 'var(--purple-100)' : '#f1f5f9', color: activeTab === 'languages' ? 'var(--purple-700)' : 'var(--text-muted)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{allLanguages.length}</span>
               </button>
             </div>

            <div style={{ overflowX: 'auto', margin: '0 -24px', padding: '0 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  {activeTab === 'shows' && (
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>SHOW</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>SECTION</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>EPISODES</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>LANGUAGES</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'left' }}>STATUS</th>
                    </tr>
                  )}
                  {activeTab === 'episodes' && (
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>EPISODE</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>SHOW</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>SEASON</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>DURATION</th>
                      <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>LANGUAGES</th>
                    </tr>
                  )}
                  {activeTab === 'languages' && (
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <th style={{ padding: '12px 20px', fontWeight: 600 }}>LANGUAGE CODE</th>
                    </tr>
                  )}
                </thead>
                <tbody style={{ fontSize: '14px' }}>
                  {activeTab === 'shows' && paginatedShows.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No shows to publish</td></tr>
                  )}
                  {activeTab === 'shows' && paginatedShows.map(show => {
                    const sectionColors = {
                      'featured': { bg: '#f3e8ff', text: '#a855f7' },
                      'series': { bg: '#dbeafe', text: '#3b82f6' },
                      'minisodes': { bg: '#ffedd5', text: '#f97316' },
                      'songs': { bg: '#fef3c7', text: '#eab308' }
                    };
                    const sc = sectionColors[show.section?.toLowerCase()] || { bg: '#f1f5f9', text: '#64748b' };
                    
                    return (
                      <tr key={show.id}>
                        <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '64px', height: '36px', borderRadius: '8px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA', flexShrink: 0, overflow: 'hidden' }}>
                              {show.artwork ? (
                                <img 
                                  src={show.artwork} 
                                  alt={show.title} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-film"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>';
                                  }}
                                />
                              ) : (
                                <Film size={20} />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '14px' }}>{show.title}</div>
                              {show.categories && show.categories.length > 0 && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  {show.categories.join(' • ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ 
                            backgroundColor: sc.bg, 
                            color: sc.text, 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '12px', 
                            fontWeight: 600,
                            textTransform: 'lowercase'
                          }}>
                            {show.section || 'unassigned'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: '14px', fontWeight: 500 }}>
                          {show.episodeCount}
                        </td>
                        <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {show.languages.map(l => (
                              <span key={l} style={{ 
                                backgroundColor: '#dcfce7', 
                                color: '#10b981', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '11px', 
                                fontWeight: 700
                              }}>
                                {l.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>Published</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {activeTab === 'episodes' && paginatedEpisodes.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No episodes to publish</td></tr>
                  )}
                  {activeTab === 'episodes' && paginatedEpisodes.map(ep => (
                    <tr key={ep.content_group}>
                      <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--navy-900)' }}>{ep.title}</td>
                      <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>{ep.showTitle}</td>
                      <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {ep.season === 0 ? <span style={{backgroundColor:'#f3f4f6', color:'#4b5563', padding:'2px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:700}}>TRAILER</span> : `Season ${ep.season}`}
                      </td>
                      <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 500 }}>{Math.floor(ep.duration_seconds / 60)}m {ep.duration_seconds % 60}s</td>
                      <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {ep.languages.map(l => (
                            <span key={l} style={{ backgroundColor: '#dcfce7', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              {l.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'languages' && paginatedLanguages.length === 0 && (
                    <tr><td style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No languages to publish</td></tr>
                  )}
                  {activeTab === 'languages' && paginatedLanguages.map(lang => (
                    <tr key={lang.code}>
                      <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--navy-900)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--purple-50)', color: 'var(--purple-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                            {lang.code.toUpperCase()}
                          </div>
                          {lang.code.toUpperCase()} Language
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {((activeTab === 'shows' && allShows.length > pageSize) || 
              (activeTab === 'episodes' && allEpisodes.length > pageSize) ||
              (activeTab === 'languages' && allLanguages.length > pageSize)) && (() => {
                const totalItems = activeTab === 'shows' ? allShows.length : (activeTab === 'episodes' ? allEpisodes.length : allLanguages.length);
                const totalPages = Math.ceil(totalItems / pageSize);
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <span>
                      Showing <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)}</span> of <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{totalItems}</span> {activeTab}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            backgroundColor: currentPage === p ? '#4325c2' : '#fff', 
                            border: currentPage === p ? '1px solid #4325c2' : '1px solid var(--border)', 
                            borderRadius: '6px', 
                            color: currentPage === p ? '#fff' : 'var(--navy-900)', 
                            fontSize: '13px', 
                            fontWeight: 700,
                            cursor: 'pointer' 
                          }}
                        >
                          {p}
                        </button>
                      ))}
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
            })()}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Publish Readiness */}
          <div className="card" style={{ padding: '24px', marginBottom: 0 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', color: 'var(--navy-900)' }}>Publish Readiness</h3>
            
            {isBlocked ? (
              <div style={{ backgroundColor: 'var(--red-50)', padding: '16px', borderRadius: '8px', border: '1px solid var(--red-100)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red-700)', marginBottom: '8px' }}>
                  <XCircle size={18} />
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>Blocking Issues Found</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--red-800)' }}>Publishing is disabled until resolved.</div>
                <Link to="/validation" style={{ display: 'block', marginTop: '12px', fontSize: '13px', color: 'var(--red-700)', textDecoration: 'underline', fontWeight: 600 }}>
                  View Validation Report →
                </Link>
              </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '15px' }}>All validations passed</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Your catalogue is ready to publish.</div>
                  </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <ChecklistItem 
                passed={report?.blocked_records_count === 0} 
                title={report?.blocked_records_count === 0 ? "No critical issues" : "Critical issues found"} 
                description={report?.blocked_records_count === 0 ? "All blocking issues resolved" : "Publishing is disabled until resolved"} 
              />
              <ChecklistItem 
                passed={!hasArtworkIssue} 
                title="Artwork uploaded" 
                description={!hasArtworkIssue ? "All required artwork is available" : `${report?.issues?.filter(i => i.issue_type === 'Missing Artwork').length} episode${report?.issues?.filter(i => i.issue_type === 'Missing Artwork').length > 1 ? 's are' : ' is'} missing artwork`} 
              />
              <ChecklistItem 
                passed={!hasDurationIssue} 
                title="Duration available" 
                description={!hasDurationIssue ? "All episodes have duration" : `${report?.issues?.filter(i => i.issue_type === 'Missing Duration').length} episode${report?.issues?.filter(i => i.issue_type === 'Missing Duration').length > 1 ? 's are' : ' is'} missing duration`} 
              />
              <ChecklistItem 
                passed={!hasSectionIssue} 
                title="Show section assigned" 
                description={!hasSectionIssue ? "All published shows have a section" : `${report?.issues?.filter(i => i.issue_type === 'Missing Show Section').length} episode${report?.issues?.filter(i => i.issue_type === 'Missing Show Section').length > 1 ? 's belong' : ' belongs'} to a show missing a section`} 
              />
              <ChecklistItem 
                passed={!hasDuplicateIssue} 
                title="Variants unique" 
                description={!hasDuplicateIssue ? "No duplicate languages for a content group" : `${report?.issues?.filter(i => i.issue_type === 'Duplicate Content Group').length} duplicate language variant${report?.issues?.filter(i => i.issue_type === 'Duplicate Content Group').length > 1 ? 's' : ''} found`} 
              />
            </div>
          </div>

          {/* Last Publish Run */}
          <div className="card" style={{ padding: '24px', marginBottom: 0 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', color: 'var(--navy-900)' }}>Last Publish Run</h3>
            
            {!lastRun ? (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>No publish run yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ backgroundColor: lastRun.status === 'success' ? '#f0fdf4' : '#fee2e2', border: lastRun.status === 'success' ? '1px solid #dcfce7' : '1px solid #fecaca', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#fff', border: lastRun.status === 'success' ? '2px solid #10b981' : '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: lastRun.status === 'success' ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                    {lastRun.status === 'success' ? <Check size={14} strokeWidth={3} /> : <XCircle size={14} strokeWidth={3} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: lastRun.status === 'success' ? '#166534' : '#991b1b' }}>{lastRun.status === 'success' ? 'Published Successfully' : 'Failed'}</div>
                    <div style={{ fontSize: '11px', color: lastRun.status === 'success' ? '#15803d' : '#7f1d1d', marginTop: '2px' }}>
                      {format(parseUtcDate(lastRun.created_at), 'MMM d, h:mm a')} {lastRun.triggered_by ? 'by Admin' : ''}
                    </div>
                  </div>
                </div>

                {lastRun.stats && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>{lastRun.stats.shows}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Shows</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>{lastRun.stats.episodes}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Episodes</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>{lastRun.stats.languages}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Languages</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>{lastRun.stats.sections}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sections</div>
                      </div>
                    </div>
                )}
                {!lastRun.stats && lastRun.status === 'success' && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Published {lastRun.published_records} records. Detailed stats unavailable.
                    </div>
                )}

                <Link to="/history" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '10px', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: 'var(--purple-700)', 
                  textDecoration: 'none' 
                }}>
                  View Publish History →
                </Link>
              </div>
            )}
          </div>

          {/* About Publishing */}
          <div className="card" style={{ padding: '24px', marginBottom: 0, backgroundColor: 'var(--purple-50)', border: '1px solid #e9d5ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--purple-700)' }}>
              <Info size={18} />
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>About Publishing</h3>
            </div>
             <p style={{ fontSize: '13px', color: 'var(--purple-800)', lineHeight: '1.6', margin: 0 }}>
               Publishing will generate the <code style={{backgroundColor:'rgba(255,255,255,0.5)', color:'var(--purple-800)', padding:'2px 4px', borderRadius:'4px', fontWeight: 600}}>catalogue.json</code> file that powers the viewer experience. 
               <br /><br />
               The process is atomic and safe. Viewers will not see partial updates.
             </p>
          </div>

        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '80%', maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 800 }}>
                 <FileJson size={22} style={{ color: 'var(--purple-600)' }}/>
                 Catalogue JSON Preview
               </h3>
               <button className="btn btn-outline" onClick={() => setShowPreviewModal(false)} style={{ padding: '8px 16px', fontWeight: 600 }}>Close Preview</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0f172a', padding: '24px', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
               <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#e2e8f0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '13px', lineHeight: '1.5' }}>
                 {JSON.stringify(previewData, null, 2)}
               </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Publish;
