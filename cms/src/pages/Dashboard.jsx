import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Film, PlaySquare, FileText, AlertTriangle, 
  CheckCircle, Tv, UploadCloud, Plus, 
  Bell, ChevronDown, ChevronRight, Clock, Image, Settings
} from 'lucide-react';

const fetchShows = async () => {
  const { data } = await axios.get('/api/admin/shows');
  return data;
};

const fetchValidation = async () => {
  const { data } = await axios.get('/api/admin/validation-report');
  return data;
};

const fetchPublishHistory = async () => {
  const { data } = await axios.get('/api/admin/publish-history');
  return data;
};

const parseUtcDate = s => {
  if (!s) return null;
  let str = String(s).trim();
  if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    str += 'Z';
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const safeFormatDate = (dateString, relative = false) => {
  const d = parseUtcDate(dateString);
  if (!d) return '';
  
  if (relative) {
    const ms = Date.now() - d.getTime();
    if (ms < 0 && ms > -60000) return 'Just now';
    const m = Math.floor(ms / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours/24)}d ago`;
  }
  
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const DashboardEmptyState = ({ icon: Icon, title, subtitle }) => (
  <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 0 32px 0' }}>
    {Icon && (
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid #F1F5F9', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <Icon size={20} color="#94A3B8" strokeWidth={2} />
      </div>
    )}
    <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748B', marginBottom: '4px' }}>{title}</div>
    <div style={{ fontSize: '13px', color: '#94A3B8' }}>{subtitle}</div>
  </div>
);

const Dashboard = () => {
  const { data: shows, isLoading: showsLoading } = useQuery({ queryKey: ['adminShows'], queryFn: fetchShows, refetchInterval: 5000 });
  const { data: validation, isLoading: valLoading } = useQuery({ queryKey: ['adminValidation'], queryFn: fetchValidation, refetchInterval: 5000 });
  const { data: history, isLoading: histLoading } = useQuery({ queryKey: ['adminHistory'], queryFn: fetchPublishHistory, refetchInterval: 5000 });

  if (showsLoading || valLoading || histLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', width: '100%' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading dashboard data...</div>
      </div>
    );
  }

  // --- Real Data Calculations ---
  const totalShows = shows?.length || 0;
  let totalEpisodes = 0;
  let publishedShows = 0;
  let publishedEpisodes = 0;
  let draftEpisodes = 0;
  let episodesWithoutArtwork = 0;
  let episodesWithoutDuration = 0;
  let languages = new Set();
  
  shows?.forEach(show => {
    let showHasPublished = false;
    show.seasons?.forEach(season => {
      totalEpisodes += season.episodes?.length || 0;
      season.episodes?.forEach(ep => {
        if (ep.status === 'published') {
          showHasPublished = true;
          publishedEpisodes++;
        } else {
          draftEpisodes++;
        }
        
        if (!ep.artwork || ep.artwork.length === 0) {
          episodesWithoutArtwork++;
        }
        if (ep.duration_seconds === null || ep.duration_seconds === undefined) {
          episodesWithoutDuration++;
        }
        if (ep.language) {
          languages.add(ep.language);
        }
      });
    });
    if (showHasPublished) publishedShows++;
  });
  
  const draftShows = totalShows - publishedShows;
  const validationIssues = validation?.blocked_records_count || 0;
  const showsWithIssues = validation?.issues 
    ? new Set(validation.issues.map(i => i.show_title)).size 
    : 0;
  const publishRuns = history?.total_count ?? (Array.isArray(history) ? history.length : (history?.data?.length || 0));
  const historyData = Array.isArray(history) ? history : (history?.data || []);
  const lastPublish = history?.latest_run || historyData[0] || null;

  // --- Recent Shows (Sorted by created_at) ---
  const recentShows = shows ? [...shows].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5) : [];

  // --- Recent Activity (Derived ONLY from genuine historical records) ---
  const allEvents = [];

  // Add publish events (genuine audit records)
  historyData.forEach(run => {
    if (run.created_at) {
      const isSuccess = run.status === 'success';
      allEvents.push({
        type: 'publish_run',
        timestamp: new Date(run.created_at),
        title: isSuccess ? 'Catalogue published successfully' : 'Catalogue publish failed',
        subtitle: `Publish #${run.id.substring(0,8)} • ${run.published_records} items`,
        icon: isSuccess ? <CheckCircle size={16} color="var(--green-500)" strokeWidth={2.5} /> : <AlertTriangle size={16} color="var(--red-500)" strokeWidth={2.5} />,
        bg: isSuccess ? 'var(--green-100)' : 'var(--red-100)'
      });
    }
  });

  // Sort all true timestamp events and take top 5
  const recentActivity = allEvents.sort((a,b) => b.timestamp - a.timestamp).slice(0, 5);

  const StatCard = ({ value, title, subtitle, icon: Icon, color, bgColor }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', flex: 1, minWidth: 0 }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} strokeWidth={2.5} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--navy-900)', lineHeight: '1.2' }}>{value}</div>
        </div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>
      </div>
    </div>
  );

  const QuickAction = ({ title, desc, icon: Icon, color, linkTo, bgColor }) => (
    <Link to={linkTo} style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: bgColor, borderRadius: '12px', padding: '16px', transition: 'transform 0.2s, box-shadow 0.2s', textDecoration: 'none', flex: '1 1 calc(50% - 16px)', minWidth: '180px' }} className="hover-scale">
      <div style={{ color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={24} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: '600', color: 'var(--navy-900)', fontSize: '14px', marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <div style={{ color: color, flexShrink: 0 }}>
        <ChevronRight size={18} strokeWidth={2} />
      </div>
    </Link>
  );

  const RealtimeRow = ({ title, subtitle, value, icon: Icon, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <Icon size={18} color={color} style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ fontSize: '18px', fontWeight: '700', color, flexShrink: 0 }}>{value}</div>
    </div>
  );

  return (
    <div>
      <style>{`
        .hover-scale:hover { transform: translateY(-2px); }
        .kpi-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; width: 100%; }
        .main-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; width: 100%; }
        .bottom-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; width: 100%; }
        
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 12px; }
        .card-title { margin: 0; font-size: 18px; font-weight: 600; color: var(--navy-900); }
        .view-all { font-size: 13px; font-weight: 600; color: var(--purple-700); text-decoration: none; flex-shrink: 0; }
        
        @media (max-width: 1200px) {
          .kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .main-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 860px) {
          .main-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 580px) {
          .kpi-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header handled by Layout */}
      
      {/* 4 KPI Cards */}
      <div className="kpi-row">
        <StatCard value={totalShows} title="Total Shows" subtitle={`${publishedShows} Published • ${draftShows} Draft`} icon={Tv} color="var(--purple-700)" bgColor="var(--purple-50)" />
        <StatCard value={totalEpisodes} title="Total Episodes" subtitle={`${publishedEpisodes} Published • ${draftEpisodes} Draft`} icon={PlaySquare} color="var(--green-500)" bgColor="var(--green-50)" />
        <StatCard value={validationIssues} title="Validation Issues" subtitle="Blocking publish" icon={AlertTriangle} color="var(--amber-500)" bgColor="var(--amber-50)" />
        <StatCard value={publishRuns} title="Publish Runs" subtitle={lastPublish ? `Last: ${safeFormatDate(lastPublish.created_at)}` : 'Never published'} icon={UploadCloud} color="var(--purple-700)" bgColor="var(--purple-50)" />
      </div>

      {/* Main 3 Columns */}
      <div className="main-grid">
        {/* 1. Realtime Overview */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title" style={{ marginBottom: '24px' }}>Realtime Overview</h3>
          
          <div style={{ flex: 1 }}>
            <RealtimeRow title="Published Episodes" subtitle="Live on catalogue" value={publishedEpisodes} icon={CheckCircle} color="var(--green-500)" />
            <RealtimeRow title="Draft Episodes" subtitle="Not yet published" value={draftEpisodes} icon={FileText} color="var(--amber-500)" />
            <RealtimeRow title="Shows with Issues" subtitle="Fix validation errors" value={showsWithIssues} icon={AlertTriangle} color="var(--red-500)" />
            <RealtimeRow title="Episodes without Artwork" subtitle="Add missing artwork" value={episodesWithoutArtwork} icon={Image} color="var(--purple-700)" />
            <RealtimeRow title="Episodes without Duration" subtitle="Add duration to publish" value={episodesWithoutDuration} icon={Clock} color="var(--blue-500)" />
          </div>

          <Link to="/validation" style={{ display: 'block', textAlign: 'center', backgroundColor: 'var(--purple-50)', color: 'var(--purple-700)', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', marginTop: '24px' }}>
            View Validation Report →
          </Link>
        </div>

        {/* 2. Recent Shows */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Shows</h3>
            <Link to="/shows" className="view-all">View All</Link>
          </div>
          
          {recentShows.length === 0 ? (
            <DashboardEmptyState icon={Film} title="No shows yet" subtitle="Create your first show to get started." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentShows.map((show) => {
                const epCount = show.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0;
                const hasPublished = show.seasons?.some(s => s.episodes?.some(ep => ep.status === 'published'));

                // Traverse: show artwork → season artwork → episode artwork (prefer 'thumbnail' type)
                const findArtwork = (show) => {
                  const preferred = ['thumbnail', 'Thumbnail', 'poster', 'Poster', 'banner', 'Banner'];
                  // show-level
                  for (const t of preferred) {
                    const a = show.artwork?.find(x => x.type === t);
                    if (a?.url) return a.url;
                  }
                  // season-level
                  for (const season of show.seasons || []) {
                    for (const t of preferred) {
                      const a = season.artwork?.find(x => x.type === t);
                      if (a?.url) return a.url;
                    }
                    // episode-level
                    for (const ep of season.episodes || []) {
                      for (const t of preferred) {
                        const a = ep.artwork?.find(x => x.type === t);
                        if (a?.url) return a.url;
                      }
                    }
                  }
                  return null;
                };

                const sectionGradients = {
                  featured: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                  songs: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                  series: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                  minisodes: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                  shorts: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
                };
                const grad = sectionGradients[show.section?.toLowerCase()] || 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';

                const thumbnail = findArtwork(show);
                const initials = (show.title || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

                return (
                  <div key={show.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {thumbnail ? (
                      <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                        <img
                          src={thumbnail}
                          alt={show.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={e => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentNode.style.background = grad;
                            e.target.parentNode.innerHTML = `<span style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:rgba(255,255,255,0.9);letter-spacing:0.5px">${initials}</span>`;
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.5px' }}>{initials}</span>
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{show.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{epCount} Episodes • {show.categories?.[0] || 'Series'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {hasPublished ? (
                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--green-500)', backgroundColor: 'var(--green-50)', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginBottom: '4px' }}>Published</div>
                      ) : (
                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--amber-500)', backgroundColor: 'var(--amber-50)', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginBottom: '4px' }}>Draft</div>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{safeFormatDate(show.created_at, true)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Recent Activity */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          
          {recentActivity.length === 0 ? (
            <DashboardEmptyState icon={Clock} title="No activity history" subtitle="Activity will appear here once recorded." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentActivity.map((act, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: act.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {act.icon}
                  </div>
                  <div style={{ flex: 1, paddingTop: '2px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--navy-900)', lineHeight: '1.4', marginBottom: '2px' }}>{act.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{act.subtitle}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: '4px' }}>{safeFormatDate(act.timestamp, true)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="bottom-grid">
        {/* Quick Actions */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '24px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <QuickAction title="Create New Show" desc="Add a new show to the library" icon={Tv} color="var(--purple-700)" bgColor="var(--purple-50)" linkTo="/shows" />
            <QuickAction title="Add Episode" desc="Add an episode to a show" icon={PlaySquare} color="var(--green-500)" bgColor="var(--green-50)" linkTo="/episodes" />
            <QuickAction title="Run Validation" desc="Check content before publishing" icon={AlertTriangle} color="var(--amber-500)" bgColor="var(--amber-50)" linkTo="/validation" />
            <QuickAction title="Publish Catalogue" desc="Publish content to viewers" icon={UploadCloud} color="var(--red-500)" bgColor="var(--red-50)" linkTo="/publish" />
          </div>
        </div>

        {/* Last Publish */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3 className="card-title">Last Publish</h3>
            {lastPublish ? (
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--green-500)', backgroundColor: 'var(--green-50)', padding: '4px 10px', borderRadius: '12px' }}>Success</span>
            ) : null}
          </div>
          
          {lastPublish ? (
            <>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy-900)' }}>Publish #{lastPublish.id.substring(0,8)}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>{safeFormatDate(lastPublish.created_at)} {lastPublish.triggered_by ? 'by Admin User' : ''}</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tv size={20} color="var(--purple-700)" />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--navy-900)', lineHeight: '1' }}>{lastPublish.published_records || 0}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Published</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} color="var(--amber-500)" />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--navy-900)', lineHeight: '1' }}>{lastPublish.blocked_records || 0}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Blocked</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <DashboardEmptyState icon={UploadCloud} title="No catalogue published yet" subtitle="Publish your catalogue to see the latest run here." />
          )}
          
          <Link to="/publish-history" style={{ display: 'block', textAlign: 'center', backgroundColor: 'var(--purple-700)', color: 'white', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', marginTop: 'auto' }}>
            View Publish History →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
