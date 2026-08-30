import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
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

const getPaginationWindow = (current, total) => {
  if (total <= 7) {
    return Array.from({length: total}, (_, i) => i + 1);
  }
  
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-1', total];
  }
  
  if (current >= total - 3) {
    return [1, 'ellipsis-1', total - 4, total - 3, total - 2, total - 1, total];
  }
  
  return [1, 'ellipsis-1', current - 1, current, current + 1, 'ellipsis-2', total];
};

const Dropdown = ({ label, options, value, onChange, minWidth = '140px', prefix, placement = 'bottom', height = '42px', padding = '0 12px 0 16px' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicPlacement, setDynamicPlacement] = useState(placement);
  const ref = useRef(null);

  useEffect(() => {
    if (isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Dropdown max-height is 280px + search box ~45px = ~325px.
      // If we don't have 325px below, but have more space above, open upwards.
      if (spaceBelow < 325 && spaceAbove > spaceBelow) {
        setDynamicPlacement('top');
      } else {
        setDynamicPlacement('bottom');
      }
    } else {
      setSearchQuery(''); // reset search when closed
    }
  }, [isOpen]);

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

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          ...(dynamicPlacement === 'top' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }), 
          left: 0, 
          minWidth: '100%', 
          backgroundColor: '#FFFFFF', 
          border: '1px solid #E2E8F0', 
          borderRadius: '16px', 
          boxShadow: '0 10px 40px -10px rgba(109, 40, 217, 0.15)', 
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {options.length > 10 && (
            <div style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}
          <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '6px' }} className="custom-scrollbar">
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
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
            )) : (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PublishHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRun, setSelectedRun] = useState(null);
  const pageSize = 10;

  const { data: history, isLoading, error, refetch } = useQuery({
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

  // Clamp page when dataset shrinks (e.g. after filter change or polling update)
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Escape key closes the modal
  useEffect(() => {
    if (!selectedRun) return;
    const handler = (e) => { if (e.key === 'Escape') setSelectedRun(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedRun]);

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
                            onClick={() => setSelectedRun(run)}
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
          {filteredHistory.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)', backgroundColor: '#fff', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                Showing <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{(currentPage - 1) * pageSize + 1}</span> to <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{Math.min(currentPage * pageSize, filteredHistory.length)}</span> of <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{filteredHistory.length}</span> runs
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', flex: 2, minWidth: '200px' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={16} />
                </button>
                
                {getPaginationWindow(currentPage, totalPages).map((p) => {
                  if (typeof p === 'string') {
                    return <span key={p} style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', padding: '0 4px' }}>…</span>;
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
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
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
              </div>

              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', minWidth: '120px' }}>
                <select style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', color: 'var(--navy-900)', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' }} defaultValue={10}>
                  <option value={10}>10 per page</option>
                </select>
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
      {selectedRun && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedRun(null)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', padding: 0 }} role="dialog" aria-modal="true" aria-label="Publish Run Details">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)' }}>Publish Run Details</h3>
              <button onClick={() => setSelectedRun(null)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  <div style={{ fontSize: '14px', color: 'var(--navy-900)' }}>
                    {selectedRun.user
                      ? selectedRun.user.email
                      : selectedRun.triggered_by
                        ? `ID: ${selectedRun.triggered_by}`
                        : 'System'}
                  </div>
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

              {selectedRun.error_log && Array.isArray(selectedRun.error_log) && selectedRun.error_log.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600, marginBottom: '8px' }}>ERROR LOG ({selectedRun.error_log.length} Issues)</div>
                  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#7f1d1d', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto' }}>
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
