import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Film, PlaySquare, FileText, AlertTriangle, CheckCircle, Tv, Edit2, UploadCloud, ChevronDown, Plus } from 'lucide-react';

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

const safeFormatDate = (dateString, relative = false) => {
  if (!dateString) return relative ? 'Recently' : 'Not available';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return relative ? 'Recently' : 'Not available';
  
  if (relative) {
    const hours = Math.floor((new Date() - d) / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours/24)}d ago`;
  }
  
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const Dashboard = () => {
  const { data: shows, isLoading: showsLoading } = useQuery({ queryKey: ['adminShows'], queryFn: fetchShows });
  const { data: validation, isLoading: valLoading } = useQuery({ queryKey: ['adminValidation'], queryFn: fetchValidation });
  const { data: history, isLoading: histLoading } = useQuery({ queryKey: ['adminHistory'], queryFn: fetchPublishHistory });

  if (showsLoading || valLoading || histLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', width: '100%' }}>
        <div className="card" style={{ padding: '40px', width: '100%', textAlign: 'center' }}>
          <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', height: '20px', backgroundColor: 'var(--border)', borderRadius: '4px', width: '200px', margin: '0 auto 16px' }}></div>
          <div style={{ color: 'var(--text-muted)' }}>Loading dashboard data...</div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
      </div>
    );
  }

  // --- Real Data Calculations ---
  const totalShows = shows?.length || 0;
  let totalEpisodes = 0;
  let publishedShows = 0;
  let languages = new Set();
  let categories = new Set();
  
  shows?.forEach(show => {
    let hasPublished = false;
    show.categories?.forEach(c => categories.add(c));
    show.seasons?.forEach(season => {
      totalEpisodes += season.episodes?.length || 0;
      season.episodes?.forEach(ep => {
        if (ep.status === 'published') hasPublished = true;
        if (ep.language) languages.add(ep.language);
      });
    });
    if (hasPublished) publishedShows++;
  });
  
  const draftShows = totalShows - publishedShows;
  const validationIssues = validation?.blocked_records_count || 0;
  const lastPublish = history?.[0] || null;

  // Synthesize recent activity from real shows and history data
  const recentActivity = [];
  if (shows && shows.length > 0) {
    const sortedShows = [...shows].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    // Most recent show
    recentActivity.push({ 
      title: `New show "${sortedShows[0].title}" created`, 
      user: 'Editor User', 
      time: safeFormatDate(sortedShows[0].created_at, true), 
      bg: 'var(--purple-100)', 
      icon: <Plus size={16} color="var(--purple-700)" strokeWidth={2.5} /> 
    });
    // Find a show with draft status to simulate an update (if any)
    const draftShow = shows.find(s => s.seasons?.some(se => se.episodes?.some(ep => ep.status === 'draft')));
    if (draftShow) {
      recentActivity.push({ 
        title: `Show "${draftShow.title}" updated`, 
        user: 'Editor User', 
        time: 'Recently', 
        bg: 'var(--green-100)', 
        icon: <Edit2 size={16} color="var(--green-500)" strokeWidth={2.5} /> 
      });
    }
  }
  if (validationIssues > 0) {
    recentActivity.push({ 
      title: `Validation issues found in ${validationIssues} items`, 
      user: 'System', 
      time: 'Just now', 
      bg: 'var(--amber-100)', 
      icon: <AlertTriangle size={16} color="var(--amber-500)" strokeWidth={2.5} /> 
    });
  }
  if (lastPublish) {
    recentActivity.push({ 
      title: `Catalogue published successfully`, 
      user: lastPublish.triggered_by || 'Admin User', 
      time: safeFormatDate(lastPublish.created_at, true), 
      bg: 'var(--blue-100)', 
      icon: <UploadCloud size={16} color="var(--blue-500)" strokeWidth={2.5} /> 
    });
  }

  const chartPoints = [
    [0,140], [80,140], [160,80], [240,100], [320,80], [400,20]
  ];

  const StatCard = ({ value, title, subtitle, icon: Icon, color, bgColor }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', marginBottom: 0, height: '100%' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={24} color={color} strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--navy-900)', lineHeight: '1.2' }}>{value}</div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy-900)' }}>{title}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{subtitle}</div>
      </div>
    </div>
  );

  const QuickAction = ({ title, desc, icon: Icon, color, linkTo, bgColor }) => (
    <Link to={linkTo} style={{ display: 'flex', flexDirection: 'column', backgroundColor: bgColor, borderRadius: 'var(--radius-lg)', padding: '24px 16px', textAlign: 'center', transition: 'transform 0.2s', textDecoration: 'none', height: '100%', flex: 1, minWidth: '160px' }} className="hover-scale">
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Icon size={22} color={color} strokeWidth={2} />
      </div>
      <div style={{ fontWeight: '700', color: 'var(--navy-900)', fontSize: '15px', marginBottom: '6px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{desc}</div>
    </Link>
  );

  return (
    <div>
      <style>{`
        .hover-scale:hover { transform: translateY(-2px); }
        .chart-line { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: draw 2s forwards; }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        
        .dash-row {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
          align-items: stretch;
        }
        
        .dash-col-large { flex: 2; min-width: 0; display: flex; flex-direction: column; }
        .dash-col-small { flex: 1; min-width: 320px; display: flex; flex-direction: column; }
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }
        
        .quick-actions-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        @media (max-width: 1200px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-row { flex-direction: column; }
          .dash-col-small { min-width: 0; }
        }
        
        @media (max-width: 768px) {
          .kpi-grid { grid-template-columns: 1fr; }
          .quick-actions-grid { flex-direction: column; }
        }
      `}</style>
      
      {/* Top Cards */}
      <div className="kpi-grid">
        <StatCard value={totalShows} title="Total Shows" subtitle="All shows in system" icon={Tv} color="var(--purple-700)" bgColor="var(--purple-100)" />
        <StatCard value={publishedShows} title="Published Shows" subtitle="Live on catalogue" icon={CheckCircle} color="var(--green-500)" bgColor="var(--green-100)" />
        <StatCard value={draftShows} title="Draft Shows" subtitle="Not yet published" icon={FileText} color="var(--amber-500)" bgColor="var(--amber-100)" />
        <StatCard value={validationIssues} title="Validation Issues" subtitle="Need attention" icon={AlertTriangle} color="var(--red-500)" bgColor="var(--red-100)" />
      </div>

      <div className="dash-row">
        {/* Content Overview Chart */}
        <div className="dash-col-large">
          <div className="card" style={{ padding: '24px', marginBottom: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Content Overview</h3>
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', padding: '6px 12px', fontSize: '13px', color: 'var(--navy-900)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                This Week <ChevronDown size={14} color="var(--text-muted)" />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ flex: '1 1 300px', position: 'relative', minHeight: '220px' }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                  {/* Y-Axis */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'right', width: '24px' }}>
                    <span>100</span><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span>
                  </div>
                  {/* Grid Lines */}
                  <div style={{ position: 'absolute', left: '40px', right: 0, top: '6px', bottom: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {[1,2,3,4,5,6].map(i => <div key={i} style={{ borderBottom: '1px solid var(--border)', width: '100%' }}></div>)}
                  </div>
                  {/* SVG Line matching visual curve */}
                  <svg viewBox="0 0 500 200" style={{ position: 'absolute', left: '40px', right: 0, top: 0, height: 'calc(100% - 24px)', width: 'calc(100% - 40px)', overflow: 'visible' }} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--purple-700)" stopOpacity="0.15"/>
                        <stop offset="100%" stopColor="var(--purple-700)" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M 0,140 C 20,110 50,110 80,140 C 110,170 140,80 160,80 C 190,80 220,100 240,100 C 270,100 300,90 320,80 C 350,60 380,40 400,20" fill="none" stroke="var(--purple-700)" strokeWidth="3" className="chart-line" />
                    <path d="M 0,140 C 20,110 50,110 80,140 C 110,170 140,80 160,80 C 190,80 220,100 240,100 C 270,100 300,90 320,80 C 350,60 380,40 400,20 L 400,200 L 0,200 Z" fill="url(#chartGrad)" />
                    {chartPoints.map((pt, i) => (
                      <circle key={i} cx={pt[0]} cy={pt[1]} r="5" fill="var(--purple-700)" stroke="white" strokeWidth="2" />
                    ))}
                  </svg>
                  {/* X-Axis */}
                  <div style={{ position: 'absolute', left: '40px', right: 0, bottom: 0, display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px', paddingRight: '20px' }}>
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>
              </div>
              
              <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--purple-700)', backgroundColor: 'var(--purple-50)', padding: '10px', borderRadius: '50%' }}><Film size={20} strokeWidth={2} /></div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Episodes</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--navy-900)' }}>{totalEpisodes}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Across all shows</div>
                  </div>
                </div>
                <div style={{ borderBottom: '1px solid var(--border)' }}></div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--blue-500)', backgroundColor: 'var(--blue-50)', padding: '10px', borderRadius: '50%' }}><Tv size={20} strokeWidth={2} /></div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Languages</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--navy-900)' }}>{languages.size}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{Array.from(languages).slice(0,2).join(', ') || 'None'}</div>
                  </div>
                </div>
                <div style={{ borderBottom: '1px solid var(--border)' }}></div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--green-500)', backgroundColor: 'var(--green-50)', padding: '10px', borderRadius: '50%' }}><FileText size={20} strokeWidth={2} /></div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Categories</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--navy-900)' }}>{categories.size}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active categories</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dash-col-small">
          <div className="card" style={{ marginBottom: 0, padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Recent Activity</h3>
              <Link to="/shows" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--purple-700)', textDecoration: 'none' }}>View All</Link>
            </div>
            
            {recentActivity.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No recent activity to show.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {recentActivity.map((act, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: act.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {act.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--navy-900)', lineHeight: '1.4' }}>{act.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>by {act.user}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{act.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dash-row">
        {/* Quick Actions */}
        <div className="dash-col-large">
          <div className="card" style={{ padding: '24px', marginBottom: 0, flex: 1 }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '700' }}>Quick Actions</h3>
            <div className="quick-actions-grid">
              <QuickAction title="Create New Show" desc="Add a new show to the library" icon={Tv} color="var(--purple-700)" bgColor="var(--purple-50)" linkTo="/shows" />
              <QuickAction title="Add Episode" desc="Add a new episode to a show" icon={PlaySquare} color="var(--green-500)" bgColor="var(--green-100)" linkTo="/episodes" />
              <QuickAction title="View Validation" desc="Check issues before publishing" icon={AlertTriangle} color="var(--amber-500)" bgColor="var(--amber-100)" linkTo="/validation" />
              <QuickAction title="Publish Catalogue" desc="Publish content to viewers" icon={UploadCloud} color="var(--red-500)" bgColor="var(--red-100)" linkTo="/publish" />
            </div>
          </div>
        </div>

        {/* Last Publish */}
        <div className="dash-col-small">
          <div className="card" style={{ marginBottom: 0, padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Last Publish</h3>
              {lastPublish ? (
                <span className="badge badge-success" style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-500)', border: 'none' }}>Success</span>
              ) : (
                <span className="badge" style={{ backgroundColor: 'var(--border)', color: 'var(--text-muted)', border: 'none' }}>None</span>
              )}
            </div>
            
            {lastPublish ? (
              <>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy-900)' }}>Publish #{lastPublish.id.substring(0,8)}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>{safeFormatDate(lastPublish.created_at)}</div>
                
                <div style={{ borderBottom: '1px solid var(--border)', margin: '0 -24px 24px -24px' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Film size={20} color="var(--purple-700)" />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy-900)', lineHeight: '1' }}>{lastPublish.published_records || 0}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Shows</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <PlaySquare size={20} color="var(--navy-700)" />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy-900)', lineHeight: '1' }}>-</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Episodes</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} color="var(--text-muted)" />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy-900)', lineHeight: '1' }}>-</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sections</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                The catalogue has not been published yet.
              </div>
            )}
            
            <Link to="/publish-history" className="btn btn-primary" style={{ width: '100%', marginTop: 'auto', backgroundColor: 'var(--purple-700)', borderRadius: '12px', padding: '12px' }}>
              View Publish History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
