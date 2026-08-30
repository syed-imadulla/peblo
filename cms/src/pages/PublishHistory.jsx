import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  History, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Calendar,
  MoreHorizontal,
  Bell,
  Clock,
  Info,
  ChevronLeft,
  ChevronRight,
  Send,
  FileJson,
  X
} from 'lucide-react';
import { parseISO, format, formatDistanceToNow, isAfter, subDays, subHours } from 'date-fns';

const fetchPublishHistory = async () => {
  const { data } = await axios.get('/api/admin/publish-history');
  return data;
};

const parseUtcDate = (dateString) => {
  if (!dateString) return null;
  if (!dateString.endsWith('Z')) dateString += 'Z';
  return parseISO(dateString);
};

const formatDuration = (seconds) => {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const PublishHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRun, setSelectedRun] = useState(null);
  const pageSize = 10;

  const { data: history, isLoading, error } = useQuery({
    queryKey: ['publishHistory'],
    queryFn: fetchPublishHistory,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    
    let filtered = [...history];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(run => 
        run.id.toLowerCase().includes(term) ||
        (run.user?.email && run.user.email.toLowerCase().includes(term)) ||
        (run.user?.role && run.user.role.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(run => run.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(run => {
        const d = parseUtcDate(run.created_at);
        if (dateFilter === '24h') return isAfter(d, subHours(now, 24));
        if (dateFilter === '7d') return isAfter(d, subDays(now, 7));
        if (dateFilter === '30d') return isAfter(d, subDays(now, 30));
        return true;
      });
    }

    return filtered;
  }, [history, searchTerm, statusFilter, dateFilter]);

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

  // Statistics
  const stats = useMemo(() => {
    if (!history) return { total: 0, success: 0, failed: 0, avgDuration: '—' };
    const success = history.filter(r => r.status === 'success').length;
    const failed = history.filter(r => r.status === 'failed').length;
    
    const runsWithDuration = history.filter(r => r.duration_seconds != null);
    let avgDuration = '—';
    if (runsWithDuration.length > 0) {
      const totalSeconds = runsWithDuration.reduce((acc, r) => acc + r.duration_seconds, 0);
      avgDuration = formatDuration(Math.round(totalSeconds / runsWithDuration.length));
    }

    return { total: history.length, success, failed, avgDuration };
  }, [history]);

  const latestRun = history && history.length > 0 ? history[0] : null;

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
        <div style={{ height: '40px', width: '300px', backgroundColor: '#f1f5f9', borderRadius: '8px', margin: '8px 0 32px' }} />
        <div style={{ height: '60px', backgroundColor: '#f1f5f9', borderRadius: '16px', marginBottom: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px' }}>
          <div style={{ height: '500px', backgroundColor: '#f1f5f9', borderRadius: '16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ height: '200px', backgroundColor: '#f1f5f9', borderRadius: '16px' }} />
            <div style={{ height: '200px', backgroundColor: '#f1f5f9', borderRadius: '16px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="badge badge-error">Error loading history: {error.message}</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '8px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <History size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: '800', fontSize: '28px', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
              Publish History
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Track your catalogue publish runs and their outcomes.
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <button style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <Bell size={18} />
            </button>
          </div>
          <Link 
            to="/publish"
            className="btn btn-primary" 
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
              boxShadow: '0 4px 12px rgba(109, 40, 217, 0.25)', 
              cursor: 'pointer', 
              whiteSpace: 'nowrap', 
              textDecoration: 'none'
            }}
          >
            <Send size={16} /> Publish Catalogue
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by run ID, user, or date..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              height: '44px', 
              paddingLeft: '44px', 
              paddingRight: '16px', 
              borderRadius: '22px', 
              border: '1px solid var(--border)', 
              backgroundColor: '#f8fafc',
              fontSize: '14px',
              outline: 'none',
              color: 'var(--navy-900)'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Status</span>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ height: '40px', padding: '0 32px 0 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', fontSize: '14px', color: 'var(--navy-900)', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Date Range</span>
            <select 
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ height: '40px', padding: '0 32px 0 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', fontSize: '14px', color: 'var(--navy-900)', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <button 
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateFilter('all'); }}
            style={{ height: '40px', padding: '0 16px', marginTop: '18px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <Filter size={14} /> Clear Filters
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Main Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', padding: '0 24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '16px 0', fontWeight: 700 }}>RUN ID</th>
                  <th style={{ padding: '16px 0', fontWeight: 700 }}>PUBLISHED BY</th>
                  <th style={{ padding: '16px 0', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '16px 0', fontWeight: 700 }}>CONTENT INCLUDED</th>
                  <th style={{ padding: '16px 0', fontWeight: 700 }}>DURATION</th>
                  <th style={{ padding: '16px 0', fontWeight: 700 }}>PUBLISHED AT</th>
                  <th style={{ padding: '16px 0', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13px' }}>
                {paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No publish runs found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map(run => {
                    const date = parseUtcDate(run.created_at);
                    const formattedDate = format(date, 'MMM d, yyyy');
                    const formattedTime = format(date, 'hh:mm a');
                    
                    let displayRole = 'System';
                    let displayEmail = 'system@peblo.tv';
                    
                    if (run.user) {
                      displayRole = run.user.role ? run.user.role.charAt(0).toUpperCase() + run.user.role.slice(1) : 'Unknown Role';
                      displayEmail = run.user.email;
                    } else if (run.triggered_by) {
                      displayRole = 'Deleted User';
                      displayEmail = `ID: ${run.triggered_by.substring(0, 8)}...`;
                    }

                    const isSuccess = run.status === 'success';

                    return (
                      <tr key={run.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: isSuccess ? '#F5F3FF' : '#fff1f2', color: isSuccess ? '#8b5cf6' : '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Send size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>pub_{run.id.substring(0, 8)}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{formattedDate} {formattedTime}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 0' }}>
                          <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{displayRole}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{displayEmail}</div>
                        </td>
                        <td style={{ padding: '16px 0' }}>
                           <span style={{ 
                             backgroundColor: isSuccess ? '#dcfce7' : '#fee2e2', 
                             color: isSuccess ? '#166534' : '#991b1b', 
                             padding: '4px 10px', 
                             borderRadius: '12px', 
                             fontSize: '12px', 
                             fontWeight: 600,
                             display: 'inline-flex',
                             alignItems: 'center',
                             gap: '6px'
                           }}>
                             <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSuccess ? '#10b981' : '#ef4444' }}></div>
                             {isSuccess ? 'Success' : 'Failed'}
                           </span>
                           {!isSuccess && run.error_log && run.error_log.length > 0 && (
                             <div style={{ fontSize: '11px', color: 'var(--red-700)', marginTop: '4px', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                               {run.error_log[0].issue_type || run.error_log[0].type || 'Validation failed'}
                             </div>
                           )}
                        </td>
                        <td style={{ padding: '16px 0', fontSize: '12px', lineHeight: '1.4' }}>
                          {run.stats ? (
                            <>
                              <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{run.stats.shows}</span> Shows<br/>
                              <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{run.stats.episodes}</span> Episodes<br/>
                              <span style={{ color: 'var(--text-muted)' }}>{run.stats.languages} Languages • {run.stats.sections} Sections</span>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 0', color: 'var(--navy-900)', fontWeight: 500 }}>
                          {formatDuration(run.duration_seconds)}
                        </td>
                        <td style={{ padding: '16px 0' }}>
                          <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{formattedDate}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{formattedTime}</div>
                        </td>
                        <td style={{ padding: '16px 0', textAlign: 'right' }}>
                          <button 
                            onClick={() => setSelectedRun(run)}
                            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredHistory.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)', backgroundColor: '#fff' }}>
              <span>
                Showing <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredHistory.length)}</span> of <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{filteredHistory.length}</span> runs
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                  if (totalPages > 7) {
                    if (p !== 1 && p !== totalPages && Math.abs(currentPage - p) > 1) {
                      if (p === 2 || p === totalPages - 1) return <span key={p}>...</span>;
                      return null;
                    }
                  }
                  return (
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
                  );
                })}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronRight size={16} />
                </button>
                <div style={{ marginLeft: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <select style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', fontSize: '13px', color: 'var(--navy-900)', outline: 'none' }} defaultValue={10}>
                    <option value={10}>10 per page</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Publish Summary */}
          <div className="card" style={{ padding: '24px', marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--purple-700)' }}>
              <History size={18} />
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--navy-900)' }}>Publish Summary</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #dcfce7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <CheckCircle size={16} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#166534', lineHeight: 1 }}>{stats.success}</div>
                <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 600, marginTop: '4px' }}>Successful</div>
              </div>
              
              <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fee2e2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <XCircle size={16} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#991b1b', lineHeight: 1 }}>{stats.failed}</div>
                <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600, marginTop: '4px' }}>Failed</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <History size={16} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy-900)', lineHeight: 1 }}>{stats.total}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>Total Runs</div>
              </div>

              <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #e0f2fe', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <Clock size={16} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#075985', lineHeight: 1 }}>{stats.avgDuration}</div>
                <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600, marginTop: '4px' }}>Avg. Duration</div>
              </div>
            </div>
          </div>

          {/* Latest Run */}
          <div className="card" style={{ padding: '24px', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--navy-900)' }}>Latest Run</h3>
              {latestRun && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {formatDistanceToNow(parseUtcDate(latestRun.created_at), { addSuffix: true })}
                </span>
              )}
            </div>
            
            {!latestRun ? (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>No publish run yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ backgroundColor: latestRun.status === 'success' ? '#f0fdf4' : '#fee2e2', border: latestRun.status === 'success' ? '1px solid #dcfce7' : '1px solid #fecaca', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#fff', border: latestRun.status === 'success' ? '2px solid #10b981' : '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: latestRun.status === 'success' ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                    {latestRun.status === 'success' ? <CheckCircle size={14} strokeWidth={3} /> : <XCircle size={14} strokeWidth={3} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: latestRun.status === 'success' ? '#166534' : '#991b1b' }}>
                      {latestRun.status === 'success' ? 'Published Successfully' : 'Publish Failed'}
                    </div>
                    <div style={{ fontSize: '11px', color: latestRun.status === 'success' ? '#15803d' : '#7f1d1d', marginTop: '2px' }}>
                      {format(parseUtcDate(latestRun.created_at), 'MMM d, yyyy h:mm a')} by {latestRun.user ? (latestRun.user.role ? latestRun.user.role.charAt(0).toUpperCase() + latestRun.user.role.slice(1) : 'Unknown User') : (latestRun.triggered_by ? 'Deleted User' : 'System')}
                    </div>
                  </div>
                </div>

                {latestRun.stats && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>{latestRun.stats.shows}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Shows</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>{latestRun.stats.episodes}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Episodes</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>{latestRun.stats.languages}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Languages</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)' }}>{latestRun.stats.sections}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sections</div>
                      </div>
                    </div>
                )}
                
                <button 
                  onClick={() => setSelectedRun(latestRun)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '10px', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: 'var(--purple-700)', 
                    backgroundColor: 'var(--purple-50)',
                    cursor: 'pointer' 
                  }}>
                  View Details →
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--purple-700)' }}>
              <Send size={18} />
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--navy-900)' }}>Quick Actions</h3>
            </div>
            
            <Link to="/publish" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: 'var(--purple-50)', borderRadius: '12px', textDecoration: 'none', marginBottom: '12px', border: '1px solid transparent', transition: 'border-color 0.2s' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff', color: 'var(--purple-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Send size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--purple-900)' }}>Publish Catalogue</div>
                <div style={{ fontSize: '12px', color: 'var(--purple-700)' }}>Generate and publish latest catalogue</div>
              </div>
            </Link>

            <Link to="/validation" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '12px', textDecoration: 'none', border: '1px solid transparent' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <FileJson size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)' }}>View Validation Report</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>See what's blocking publish</div>
              </div>
            </Link>
          </div>

          {/* About Publish History */}
          <div className="card" style={{ padding: '24px', marginBottom: 0, backgroundColor: 'var(--purple-50)', border: '1px solid #e9d5ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--purple-700)' }}>
              <Info size={18} />
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>About Publish History</h3>
            </div>
             <p style={{ fontSize: '13px', color: 'var(--purple-800)', lineHeight: '1.6', margin: 0 }}>
               Each publish run generates a new <code style={{backgroundColor:'rgba(255,255,255,0.5)', color:'var(--purple-800)', padding:'2px 4px', borderRadius:'4px', fontWeight: 600}}>catalogue.json</code> file with the latest content and metadata.
             </p>
          </div>

        </div>
      </div>

      {/* Details Modal */}
      {selectedRun && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedRun(null)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)' }}>Publish Run Details</h3>
              <button onClick={() => setSelectedRun(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>RUN ID</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>pub_{selectedRun.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>STATUS</div>
                  <span style={{ 
                     backgroundColor: selectedRun.status === 'success' ? '#dcfce7' : '#fee2e2', 
                     color: selectedRun.status === 'success' ? '#166534' : '#991b1b', 
                     padding: '2px 8px', 
                     borderRadius: '12px', 
                     fontSize: '12px', 
                     fontWeight: 600,
                     display: 'inline-block'
                   }}>
                     {selectedRun.status === 'success' ? 'Success' : 'Failed'}
                   </span>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>TIMESTAMP</div>
                  <div style={{ fontSize: '14px', color: 'var(--navy-900)' }}>{format(parseUtcDate(selectedRun.created_at), 'MMMM d, yyyy h:mm:ss a')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>TRIGGERED BY</div>
                  <div style={{ fontSize: '14px', color: 'var(--navy-900)' }}>{selectedRun.user ? selectedRun.user.email : (selectedRun.triggered_by ? `ID: ${selectedRun.triggered_by}` : 'System')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>DURATION</div>
                  <div style={{ fontSize: '14px', color: 'var(--navy-900)' }}>{formatDuration(selectedRun.duration_seconds)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>RECORDS PROCESSED</div>
                  <div style={{ fontSize: '14px', color: 'var(--navy-900)' }}>{selectedRun.total_records_processed} total ({selectedRun.published_records} published, {selectedRun.blocked_records} blocked)</div>
                </div>
              </div>

              {selectedRun.stats && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>CONTENT STATISTICS</div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)' }}>{selectedRun.stats.shows}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Shows</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)' }}>{selectedRun.stats.episodes}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Episodes</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)' }}>{selectedRun.stats.languages}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Languages</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)' }}>{selectedRun.stats.sections}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sections</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedRun.error_log && selectedRun.error_log.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--red-700)', fontWeight: 600, marginBottom: '8px' }}>ERROR LOG ({selectedRun.error_log.length} Issues)</div>
                  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--red-800)', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(selectedRun.error_log, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button 
                onClick={() => setSelectedRun(null)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PublishHistory;
