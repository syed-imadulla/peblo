import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Send, 
  Eye, 
  History, 
  LayoutGrid, 
  Folder, 
  Languages, 
  ListVideo, 
  Check, 
  XCircle,
  FileJson,
  Tv,
  Globe,
  Briefcase,
  PlaySquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

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

// Utilities for date parsing
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

  const { data: report, isLoading: loadingReport, refetch: refetchReport } = useQuery({
    queryKey: ['validationReport'],
    queryFn: fetchValidationReport,
  });

  const { data: history, isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['publishHistory'],
    queryFn: fetchPublishHistory,
  });

  const { data: previewData, isLoading: loadingPreview, refetch: refetchPreview } = useQuery({
    queryKey: ['catalogPreview'],
    queryFn: fetchCatalogPreview,
  });

  const publishMutation = useMutation({
    mutationFn: publishCatalog,
    onSuccess: (data) => {
      setPublishResult({ type: 'success', data });
      refetchReport();
      refetchHistory();
      refetchPreview();
      // Invalidate relevant queries
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
    if (!previewData) return { allShows: [], allEpisodes: [], allLanguages: [], sectionsCount: 0 };
    
    const shows = [];
    const episodes = [];
    const langs = new Set();
    const uniqueSections = new Set();

    Object.entries(previewData).forEach(([section, sectionShows]) => {
      if (sectionShows.length > 0) uniqueSections.add(section);
      
      sectionShows.forEach(show => {
        let epCount = show.trailers.length;
        let showLangs = new Set();
        
        show.trailers.forEach(t => {
          t.languages.forEach(l => { langs.add(l); showLangs.add(l); });
          episodes.push({ ...t, showTitle: show.title, season: 0 });
        });
        
        show.seasons.forEach(season => {
          epCount += season.episodes.length;
          season.episodes.forEach(e => {
            e.languages.forEach(l => { langs.add(l); showLangs.add(l); });
            episodes.push({ ...e, showTitle: show.title, season: season.season_number });
          });
        });
        
        shows.push({
          id: show.show_id,
          title: show.title,
          section: section,
          episodeCount: epCount,
          languages: Array.from(showLangs),
          status: 'Published',
          categories: show.categories || []
        });
      });
    });

    return {
      allShows: shows,
      allEpisodes: episodes,
      allLanguages: Array.from(langs).map(code => ({ code })), // just code for now
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


  if (loadingReport || loadingHistory || loadingPreview) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
        Loading publish dashboard...
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

  // Validation Checks breakdown
  const hasArtworkIssue = report?.issues.some(i => i.issue_type === 'missing_artwork');
  const hasDurationIssue = report?.issues.some(i => i.issue_type === 'missing_duration');
  const hasSectionIssue = report?.issues.some(i => i.issue_type === 'missing_section');
  const hasDuplicateIssue = report?.issues.some(i => i.issue_type === 'duplicate_variant');

  const ChecklistItem = ({ passed, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: passed ? 'var(--green-700)' : 'var(--red-600)', fontSize: '14px' }}>
      {passed ? <Check size={16} /> : <XCircle size={16} />}
      <span>{text}</span>
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
                <Send size={18} /> Publish Catalogue
              </>
            )}
          </button>
        </div>
      </div>

      {publishResult?.type === 'success' && (
        <div style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-700)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #86EFAC' }}>
          <CheckCircle size={24} style={{ color: 'var(--green-500)' }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Successfully Published!</strong>
            <span style={{ fontSize: '14px' }}>Published {publishResult.data.published_records} records to the live catalogue.</span>
          </div>
        </div>
      )}

      {publishResult?.type === 'error' && (
        <div style={{ backgroundColor: 'var(--red-100)', color: 'var(--red-700)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #FCA5A5' }}>
          <AlertTriangle size={24} style={{ color: 'var(--red-500)' }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Publish Failed</strong>
            <span style={{ fontSize: '14px' }}>{publishResult.message}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Catalogue Summary Card */}
          <div className="card" style={{ padding: '24px', marginBottom: 0 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px', color: 'var(--navy-900)' }}>Catalogue Summary</h2>
            <p className="text-muted" style={{ fontSize: '14px', margin: 0, marginBottom: '24px' }}>Only published content will be included in the catalogue.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(67, 37, 194, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4325c2', flexShrink: 0 }}>
                  <Tv size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy-900)', lineHeight: '1.2' }}>{allShows.length}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)', marginTop: '2px' }}>Shows</div>
                  <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 500, marginTop: '2px' }}>Published</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                  <PlaySquare size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy-900)', lineHeight: '1.2' }}>{allEpisodes.length}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)', marginTop: '2px' }}>Episodes</div>
                  <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 500, marginTop: '2px' }}>Published</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                  <Globe size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy-900)', lineHeight: '1.2' }}>{allLanguages.length}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)', marginTop: '2px' }}>Languages</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{allLanguages.map(l => l.code.toUpperCase()).join(', ')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
                  <Briefcase size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy-900)', lineHeight: '1.2' }}>{sectionsList.length}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)', marginTop: '2px' }}>Sections</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{sectionsList.join(', ')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content to be Published Card */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px', color: 'var(--navy-900)' }}>Content to be Published</h2>
                <p className="text-muted" style={{ fontSize: '14px', margin: 0 }}>This is the exact content that will be included in the published catalogue.</p>
              </div>
              <button 
                className="btn btn-outline"
                onClick={() => setShowPreviewModal(true)}
                style={{ height: '36px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--navy-900)', fontWeight: 600 }}
              >
                <Eye size={16} style={{ color: 'var(--text-muted)' }} /> Preview Catalogue
              </button>
            </div>

            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: '16px', paddingBottom: '0' }}>
              {['shows', 'episodes', 'languages'].map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '0 0 12px 0',
                    borderBottom: activeTab === tab ? '2px solid #4325c2' : '2px solid transparent',
                    color: activeTab === tab ? '#4325c2' : 'var(--text-muted)',
                    fontWeight: activeTab === tab ? 800 : 600,
                    textTransform: 'capitalize',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {tab} ({tab === 'shows' ? allShows.length : tab === 'episodes' ? allEpisodes.length : allLanguages.length})
                </button>
              ))}
            </div>

            {/* Tables */}
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  {activeTab === 'shows' && (
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <th style={{ padding: '12px 8px', fontWeight: 600 }}>SHOW</th>
                      <th style={{ padding: '12px 8px', fontWeight: 600 }}>SECTION</th>
                      <th style={{ padding: '12px 8px', fontWeight: 600 }}>EPISODES</th>
                      <th style={{ padding: '12px 8px', fontWeight: 600 }}>LANGUAGES</th>
                      <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>STATUS</th>
                    </tr>
                  )}
                  {activeTab === 'episodes' && (
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <th style={{ padding: '12px 8px', fontWeight: 600 }}>EPISODE</th>
                      <th style={{ padding: '12px 8px', fontWeight: 600 }}>SHOW</th>
                      <th style={{ padding: '12px 8px', fontWeight: 600 }}>SEASON</th>
                      <th style={{ padding: '12px 8px', fontWeight: 600 }}>DURATION</th>
                      <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>LANGUAGES</th>
                    </tr>
                  )}
                  {activeTab === 'languages' && (
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <th style={{ padding: '12px 8px', fontWeight: 600 }}>LANGUAGE CODE</th>
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
                            <div style={{ width: '48px', height: '36px', borderRadius: '6px', backgroundColor: '#5b21b6', flexShrink: 0 }}></div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Publish Readiness */}
          <div className="card" style={{ padding: '24px', marginBottom: 0 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', color: 'var(--navy-900)' }}>Publish Readiness</h3>
            
            {isBlocked ? (
              <div style={{ backgroundColor: 'var(--red-50)', padding: '16px', borderRadius: '8px', border: '1px solid var(--red-100)' }}>
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
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '15px' }}>All validations passed</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Your catalogue is ready to publish.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <CheckCircle size={16} style={{ color: '#10b981', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--navy-900)' }}>No critical issues</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>All blocking issues resolved</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <CheckCircle size={16} style={{ color: '#10b981', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--navy-900)' }}>Artwork uploaded</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>All required artwork is available</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <CheckCircle size={16} style={{ color: '#10b981', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--navy-900)' }}>Duration available</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>All episodes have duration</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <CheckCircle size={16} style={{ color: '#10b981', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--navy-900)' }}>Content grouped</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Language variants are grouped correctly</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <CheckCircle size={16} style={{ color: '#10b981', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--navy-900)' }}>Required fields complete</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>All mandatory fields are filled</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Last Publish Run */}
          <div className="card" style={{ padding: '24px', marginBottom: 0 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', color: 'var(--navy-900)' }}>Last Publish Run</h3>
            
            {!lastRun ? (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>No publish run yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#fff', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>Published Successfully</div>
                    <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
                      Today, 10:30 AM by Admin User
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>8</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Shows</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>85</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Episodes</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>2</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Languages</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>4</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sections</div>
                  </div>
                </div>

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
               The process is atomic and safe.
             </p>
          </div>

        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '80%', maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <FileJson size={20} style={{ color: 'var(--purple-600)' }}/>
                 Catalogue JSON Preview
               </h3>
               <button className="btn btn-outline" onClick={() => setShowPreviewModal(false)} style={{ padding: '6px 12px' }}>Close</button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', backgroundColor: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace', fontSize: '13px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
               <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
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
