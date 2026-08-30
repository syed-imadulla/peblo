import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pagination } from '../components/ui/Pagination';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  History, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Send,
  FileJson,
  X,
  RefreshCw
} from 'lucide-react';
import { Dropdown } from '../components/ui/Dropdown';
import { parseISO, format, formatDistanceToNow, isAfter, subDays, subHours } from 'date-fns';

const fetchPublishHistory = async ({ queryKey }) => {
  const [_key, { page, pageSize, search, status, dateRange }] = queryKey;
  const params = new URLSearchParams({
    page,
    page_size: pageSize,
    search: search || '',
    status: status || 'all',
    date_range: dateRange || 'all'
  });
  const { data } = await axios.get(`/api/admin/publish-history?${params.toString()}`);
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
  const [pageSize, setPageSize] = useState(10);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [selectedRunCache, setSelectedRunCache] = useState(null);

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['publishHistory', { page: currentPage, pageSize, search: searchTerm, status: statusFilter, dateRange: dateFilter }],
    queryFn: fetchPublishHistory,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    keepPreviousData: true,
  });

  const paginatedHistory = response?.data || [];
  const totalPages = response?.total_pages || 1;
  const totalCount = response?.total_count || 0;
  
  const stats = response?.global_stats || { total: 0, success: 0, failed: 0, avgDuration: null };
  const formattedStats = {
    total: stats.total,
    success: stats.success,
    failed: stats.failed,
    avgDuration: formatDuration(stats.avgDuration)
  };

  const latestRun = response?.latest_run || null;

  // Realtime Modal Update Logic
  useEffect(() => {
    if (selectedRunId && response?.data) {
      const freshRun = response.data.find(r => r.id === selectedRunId);
      if (freshRun) {
        setSelectedRunCache(freshRun);
      }
    }
  }, [selectedRunId, response?.data]);

  const handleOpenModal = (run) => {
    setSelectedRunId(run.id);
    setSelectedRunCache(run);
  };
  
  const handleCloseModal = () => {
    setSelectedRunId(null);
    setSelectedRunCache(null);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, pageSize]);

  // Clamp page when dataset shrinks
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Escape key closes the modal
  useEffect(() => {
    if (!selectedRunId) return;
    const handler = (e) => { if (e.key === 'Escape') handleCloseModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedRunId]);

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
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '80px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <XCircle size={28} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy-900)', margin: '0 0 8px' }}>Failed to load publish history</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 24px' }}>{error.message}</p>
        <button
          onClick={() => refetch()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#4325c2', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
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
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', position: 'relative', zIndex: 100 }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '16px', top: '13px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by run ID, user, or date..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
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
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Dropdown 
            label="Status" 
            value={statusFilter === 'all' ? 'All Statuses' : statusFilter === 'success' ? 'Success' : 'Failed'}
            onChange={(val) => {
              if (val === 'All Statuses') setStatusFilter('all');
              else if (val === 'Success') setStatusFilter('success');
              else setStatusFilter('failed');
            }} 
            options={['All Statuses', 'Success', 'Failed']} 
            minWidth="160px"
          />
          <Dropdown 
            label="Date Range" 
            value={dateFilter === 'all' ? 'All Time' : dateFilter === '24h' ? 'Last 24 Hours' : dateFilter === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            onChange={(val) => {
              if (val === 'All Time') setDateFilter('all');
              else if (val === 'Last 24 Hours') setDateFilter('24h');
              else if (val === 'Last 7 Days') setDateFilter('7d');
              else setDateFilter('30d');
            }} 
            options={['All Time', 'Last 24 Hours', 'Last 7 Days', 'Last 30 Days']} 
            minWidth="160px"
          />
          <button 
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateFilter('all'); }}
            style={{ height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '20px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
          >
            <Filter size={14} /> Clear Filters
          </button>
        </div>
      </div>

      <div className="dashboard-layout" style={{ alignItems: 'start' }}>
        
        {/* Main Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', padding: '0 24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '20px 24px 20px 0', fontWeight: 700, whiteSpace: 'nowrap' }}>RUN ID</th>
                  <th style={{ padding: '20px 24px 20px 0', fontWeight: 700, whiteSpace: 'nowrap' }}>PUBLISHED BY</th>
                  <th style={{ padding: '20px 24px 20px 0', fontWeight: 700, whiteSpace: 'nowrap' }}>STATUS</th>
                  <th style={{ padding: '20px 24px 20px 0', fontWeight: 700, width: '100%' }}>CONTENT INCLUDED</th>
                  <th style={{ padding: '20px 24px 20px 0', fontWeight: 700, whiteSpace: 'nowrap' }}>DURATION</th>
                  <th style={{ padding: '20px 24px 20px 0', fontWeight: 700, whiteSpace: 'nowrap' }}>PUBLISHED AT</th>
                  <th style={{ padding: '20px 0', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right' }}>ACTIONS</th>
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
                    
                    // Published By resolution:
                    // - If triggered_by has a matching user: show real role + real email
                    // - If triggered_by is a UUID but user no longer exists: show deleted-user state
                    // - If triggered_by is NULL: this is a system-initiated run; "System" is accurate,
                    //   but we do NOT invent an email address for it.
                    let displayRole;
                    let displayEmail;

                    if (run.user) {
                      // Real user found via JOIN
                      displayRole = run.user.role
                        ? run.user.role.charAt(0).toUpperCase() + run.user.role.slice(1)
                        : 'Unknown Role';
                      displayEmail = run.user.email;
                    } else if (run.triggered_by) {
                      // UUID exists but user was deleted from DB
                      displayRole = 'Deleted User';
                      displayEmail = `ID: ${run.triggered_by.substring(0, 8)}…`;
                    } else {
                      // NULL triggered_by — system/script triggered
                      displayRole = 'System';
                      displayEmail = null; // no email to show
                    }

                    const isSuccess = run.status === 'success';

                    return (
                      <tr key={run.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '20px 24px 20px 0', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isSuccess ? '#10b981' : '#f43f5e', flexShrink: 0 }} />
                            <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>pub_{run.id.substring(0, 8)}</div>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px 20px 0', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{displayRole}</div>
                          {displayEmail && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{displayEmail}</div>
                          )}
                        </td>
                        <td style={{ padding: '20px 24px 20px 0' }}>
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
                           {!isSuccess && run.error_log && Array.isArray(run.error_log) && run.error_log.length > 0 && (
                             <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '4px', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                               {run.error_log[0].issue_type || run.error_log[0].type || 'Validation failed'}
                             </div>
                           )}
                        </td>
                        <td style={{ padding: '20px 24px 20px 0' }}>
                          {run.stats ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ color: 'var(--navy-900)', fontSize: '13px', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: 600 }}>{run.stats.shows}</span> Shows<br/>
                                <span style={{ fontWeight: 600 }}>{run.stats.episodes}</span> Episodes
                              </div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                {run.stats.languages} Languages · {run.stats.sections} Sections
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '20px 24px 20px 0', color: 'var(--navy-900)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {formatDuration(run.duration_seconds)}
                        </td>
                        <td style={{ padding: '20px 24px 20px 0', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{formattedDate}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{formattedTime}</div>
                        </td>
                        <td style={{ padding: '20px 0', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button 
                            onClick={() => handleOpenModal(run)}
                            aria-label={`View details for run ${run.id.substring(0, 8)}`}
                            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none' }}
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
          {totalCount > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={pageSize}
              setCurrentPage={setCurrentPage}
              setItemsPerPage={setPageSize}
              itemName="runs"
            />
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
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#166534', lineHeight: 1 }}>{formattedStats.success}</div>
                <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 600, marginTop: '4px' }}>Successful</div>
              </div>
              
              <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fee2e2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <XCircle size={16} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#991b1b', lineHeight: 1 }}>{formattedStats.failed}</div>
                <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600, marginTop: '4px' }}>Failed</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <History size={16} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy-900)', lineHeight: 1 }}>{formattedStats.total}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>Total Runs</div>
              </div>

              <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #e0f2fe', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <Clock size={16} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#075985', lineHeight: 1 }}>{formattedStats.avgDuration}</div>
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
                      {format(parseUtcDate(latestRun.created_at), 'MMM d, yyyy h:mm a')}
                      {latestRun.user
                        ? ` by ${latestRun.user.role ? latestRun.user.role.charAt(0).toUpperCase() + latestRun.user.role.slice(1) : 'User'}`
                        : latestRun.triggered_by
                          ? ' by Deleted User'
                          : ' by System'}
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
                  onClick={() => handleOpenModal(latestRun)}
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
          <div className="card" style={{ padding: '24px', marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--purple-700)' }}>
              <Send size={18} />
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--navy-900)' }}>Quick Actions</h3>
            </div>
            
            <Link to="/publish" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: 'var(--purple-50)', borderRadius: '12px', textDecoration: 'none', marginBottom: '12px', border: '1px solid #e9d5ff', transition: 'border-color 0.2s' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff', color: 'var(--purple-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Send size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--purple-900)' }}>Publish Catalogue</div>
                <div style={{ fontSize: '12px', color: 'var(--purple-700)' }}>Generate and publish latest catalogue</div>
              </div>
            </Link>

            <Link to="/validation" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '12px', textDecoration: 'none', border: '1px solid var(--border)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <FileJson size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)' }}>View Validation Report</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>See what's blocking publish</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRunCache && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }} onClick={handleCloseModal}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', padding: 0 }} role="dialog" aria-modal="true" aria-label="Publish Run Details">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)' }}>Publish Run Details</h3>
              <button onClick={handleCloseModal} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>RUN ID</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>pub_{selectedRunCache.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>STATUS</div>
                  <span style={{ 
                     backgroundColor: selectedRunCache.status === 'success' ? '#dcfce7' : '#fee2e2', 
                     color: selectedRunCache.status === 'success' ? '#166534' : '#991b1b', 
                     padding: '2px 8px', 
                     borderRadius: '12px', 
                     fontSize: '12px', 
                     fontWeight: 600,
                     display: 'inline-block'
                   }}>
                     {selectedRunCache.status === 'success' ? 'Success' : 'Failed'}
                   </span>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>TIMESTAMP</div>
                  <div style={{ fontSize: '14px', color: 'var(--navy-900)' }}>{format(parseUtcDate(selectedRunCache.created_at), 'MMMM d, yyyy h:mm:ss a')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>TRIGGERED BY</div>
                  <div style={{ fontSize: '14px', color: 'var(--navy-900)' }}>
                    {selectedRunCache.user
                      ? selectedRunCache.user.email
                      : selectedRunCache.triggered_by
                        ? `ID: ${selectedRunCache.triggered_by}`
                        : 'System'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>DURATION</div>
                  <div style={{ fontSize: '14px', color: 'var(--navy-900)' }}>{formatDuration(selectedRunCache.duration_seconds)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>RECORDS PROCESSED</div>
                  <div style={{ fontSize: '14px', color: 'var(--navy-900)' }}>{selectedRunCache.total_records_processed} total ({selectedRunCache.published_records} published, {selectedRunCache.blocked_records} blocked)</div>
                </div>
              </div>

              {selectedRunCache.stats && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>CONTENT STATISTICS</div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)' }}>{selectedRunCache.stats.shows}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Shows</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)' }}>{selectedRunCache.stats.episodes}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Episodes</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)' }}>{selectedRunCache.stats.languages}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Languages</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)' }}>{selectedRunCache.stats.sections}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sections</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedRunCache.error_log && Array.isArray(selectedRunCache.error_log) && selectedRunCache.error_log.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600, marginBottom: '8px' }}>ERROR LOG ({selectedRunCache.error_log.length} Issues)</div>
                  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#7f1d1d', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(selectedRunCache.error_log, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button 
                onClick={handleCloseModal}
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
