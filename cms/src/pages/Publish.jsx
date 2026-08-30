import React, { useState, useMemo } from 'react';
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
  FileJson
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
  const { allShows, allEpisodes, allLanguages, sectionsCount } = useMemo(() => {
    if (!previewData) return { allShows: [], allEpisodes: [], allLanguages: [], sectionsCount: 0 };
    
    const shows = [];
    const episodes = [];
    const langs = new Set();
    let sections = 0;

    Object.entries(previewData).forEach(([section, sectionShows]) => {
      if (sectionShows.length > 0) sections++;
      
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
          status: 'Published'
        });
      });
    });

    return {
      allShows: shows,
      allEpisodes: episodes,
      allLanguages: Array.from(langs).map(code => ({ code })), // just code for now
      sectionsCount: sections
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Publish Catalogue</h1>
          <p className="text-muted" style={{ margin: 0 }}>Review your content and publish the catalogue for viewers.</p>
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={() => publishMutation.mutate()}
          disabled={!isAdmin || isBlocked || publishMutation.isPending}
          style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {publishMutation.isPending ? 'Publishing...' : (
            <>
              <Send size={18} /> Publish Catalogue
            </>
          )}
        </button>
      </div>

      {publishDisabledReason && (
        <div style={{ backgroundColor: 'var(--amber-100)', color: 'var(--amber-700)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #FCD34D' }}>
          <Info size={24} style={{ color: 'var(--amber-500)' }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Publishing Disabled</strong>
            <span style={{ fontSize: '14px' }}>{publishDisabledReason}</span>
          </div>
        </div>
      )}

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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Catalogue Summary Card */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Catalogue Summary</h2>
            <p className="text-muted" style={{ fontSize: '14px', marginBottom: '24px' }}>Only published content will be included in the catalogue.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--purple-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <Folder size={20} style={{ color: 'var(--purple-600)' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--navy-900)', lineHeight: '1' }}>{allShows.length}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-700)', marginTop: '8px' }}>Shows</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Published</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--purple-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <ListVideo size={20} style={{ color: 'var(--purple-600)' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--navy-900)', lineHeight: '1' }}>{allEpisodes.length}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-700)', marginTop: '8px' }}>Episodes</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Published</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--purple-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <Languages size={20} style={{ color: 'var(--purple-600)' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--navy-900)', lineHeight: '1' }}>{allLanguages.length}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-700)', marginTop: '8px' }}>Languages</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Represented</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--purple-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <LayoutGrid size={20} style={{ color: 'var(--purple-600)' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--navy-900)', lineHeight: '1' }}>{sectionsCount}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-700)', marginTop: '8px' }}>Sections</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In use</div>
              </div>

            </div>
          </div>

          {/* Content to be Published Card */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Content to be Published</h2>
                <p className="text-muted" style={{ fontSize: '14px', margin: 0 }}>This is the exact content that will be included in the published catalogue.</p>
              </div>
              <button className="btn btn-outline" onClick={() => setShowPreviewModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px' }}>
                <Eye size={16} /> Preview Catalogue
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <button 
                onClick={() => {setActiveTab('shows'); setCurrentPage(1);}} 
                style={{ 
                  padding: '12px 0', 
                  border: 'none', 
                  background: 'none', 
                  fontSize: '14px',
                  fontWeight: 600,
                  color: activeTab === 'shows' ? 'var(--purple-600)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'shows' ? '2px solid var(--purple-600)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Shows ({allShows.length})
              </button>
              <button 
                onClick={() => {setActiveTab('episodes'); setCurrentPage(1);}} 
                style={{ 
                  padding: '12px 0', 
                  border: 'none', 
                  background: 'none', 
                  fontSize: '14px',
                  fontWeight: 600,
                  color: activeTab === 'episodes' ? 'var(--purple-600)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'episodes' ? '2px solid var(--purple-600)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Episodes ({allEpisodes.length})
              </button>
              <button 
                onClick={() => {setActiveTab('languages'); setCurrentPage(1);}} 
                style={{ 
                  padding: '12px 0', 
                  border: 'none', 
                  background: 'none', 
                  fontSize: '14px',
                  fontWeight: 600,
                  color: activeTab === 'languages' ? 'var(--purple-600)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'languages' ? '2px solid var(--purple-600)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Languages ({allLanguages.length})
              </button>
            </div>

            {/* Tables */}
            <div style={{ minHeight: '300px' }}>
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
                  {activeTab === 'shows' && paginatedShows.map(show => (
                    <tr key={show.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 500, color: 'var(--navy-900)' }}>{show.title}</span>
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{show.section}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{show.episodeCount}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                        {show.languages.map(l => l.toUpperCase()).join(', ')}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <span className="badge badge-success">Published</span>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'episodes' && paginatedEpisodes.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No episodes to publish</td></tr>
                  )}
                  {activeTab === 'episodes' && paginatedEpisodes.map(ep => (
                    <tr key={ep.content_group} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 500, color: 'var(--navy-900)' }}>{ep.title}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{ep.showTitle}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{ep.season === 0 ? 'Trailer' : ep.season}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{ep.duration_seconds}s</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>{ep.languages.map(l => l.toUpperCase()).join(', ')}</td>
                    </tr>
                  ))}

                  {activeTab === 'languages' && paginatedLanguages.length === 0 && (
                    <tr><td style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No languages to publish</td></tr>
                  )}
                  {activeTab === 'languages' && paginatedLanguages.map(lang => (
                    <tr key={lang.code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 500, color: 'var(--navy-900)', textTransform: 'uppercase' }}>{lang.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {((activeTab === 'shows' && allShows.length > pageSize) || 
              (activeTab === 'episodes' && allEpisodes.length > pageSize) ||
              (activeTab === 'languages' && allLanguages.length > pageSize)) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '14px' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px' }}
                >
                  Previous
                </button>
                <span style={{ color: 'var(--text-muted)' }}>Page {currentPage}</span>
                <button 
                  className="btn btn-outline" 
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={
                    (activeTab === 'shows' && currentPage * pageSize >= allShows.length) ||
                    (activeTab === 'episodes' && currentPage * pageSize >= allEpisodes.length) ||
                    (activeTab === 'languages' && currentPage * pageSize >= allLanguages.length)
                  }
                  style={{ padding: '6px 12px' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Publish Readiness */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Publish Readiness</h3>
            
            {isBlocked ? (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <XCircle size={20} style={{ color: 'var(--red-500)', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--red-700)', margin: 0, marginBottom: '4px' }}>Blocking Issues Found</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Publishing is disabled until resolved.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', backgroundColor: 'var(--red-50)', borderRadius: '8px' }}>
                  <ChecklistItem passed={!isBlocked} text="No critical issues" />
                  <ChecklistItem passed={!hasArtworkIssue} text="Artwork uploaded" />
                  <ChecklistItem passed={!hasDurationIssue} text="Duration available" />
                  <ChecklistItem passed={!hasSectionIssue} text="Show has section" />
                  <ChecklistItem passed={!hasDuplicateIssue} text="No duplicate variants" />
                </div>
                <Link to="/validation" style={{ display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'var(--purple-600)', textDecoration: 'none', fontWeight: 500 }}>
                  View Validation Report →
                </Link>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <CheckCircle size={20} style={{ color: 'var(--green-500)', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green-700)', margin: 0, marginBottom: '4px' }}>All validations passed</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Your catalogue is ready to publish.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', backgroundColor: 'var(--green-50)', borderRadius: '8px' }}>
                  <ChecklistItem passed={true} text="No critical issues" />
                  <ChecklistItem passed={true} text="Artwork uploaded" />
                  <ChecklistItem passed={true} text="Duration available" />
                  <ChecklistItem passed={true} text="Show has section" />
                  <ChecklistItem passed={true} text="No duplicate variants" />
                </div>
              </>
            )}
          </div>

          {/* Last Publish Run */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Last Publish Run</h3>
            
            {!lastRun ? (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>No publish run yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Status</span>
                  {lastRun.status === 'success' ? (
                    <span className="badge badge-success">Success</span>
                  ) : (
                    <span className="badge badge-error">Failed</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Time</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--navy-900)' }}>
                    {formatDistanceToNow(parseUtcDate(lastRun.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Records Published</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--navy-900)' }}>{lastRun.published_records}</span>
                </div>
              </div>
            )}
            <Link to="/publish-history" style={{ display: 'block', marginTop: '16px', fontSize: '14px', color: 'var(--purple-600)', textDecoration: 'none', fontWeight: 500 }}>
              View Publish History →
            </Link>
          </div>

          {/* About Publishing */}
          <div className="card" style={{ padding: '24px' }}>
             <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>About Publishing</h3>
             <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
               Publishing generates a fresh <code style={{backgroundColor:'var(--purple-50)', color:'var(--purple-700)', padding:'2px 4px', borderRadius:'4px'}}>catalogue.json</code> file representing all valid, published content. The operation is atomic—meaning viewers will never see a partially updated or broken catalogue during the publish process.
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
