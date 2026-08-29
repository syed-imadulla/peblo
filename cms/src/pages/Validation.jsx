import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle, AlertTriangle, Info, CheckCircle, Play, Search, X,
  ChevronDown, ChevronLeft, ChevronRight, Eye, RefreshCw, Bell, Zap,
  Shield, TrendingUp, Clock
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────
const fetchReport = () => axios.get('/api/admin/validation-report').then(r => r.data);
const fetchShows = () => axios.get('/api/admin/shows').then(r => r.data);
const fetchHistory = () => axios.get('/api/admin/publish-history').then(r => r.data);
const runValidationApi = () => axios.post('/api/admin/run-validation').then(r => r.data);

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────
const safeDate = (s, relative = false) => {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  if (relative) {
    const ms = Date.now() - d.getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  }
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    dotColor: '#EF4444',
    Icon: AlertCircle,
  },
  warning: {
    label: 'Warning',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    dotColor: '#F59E0B',
    Icon: AlertTriangle,
  },
  info: {
    label: 'Info',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    dotColor: '#3B82F6',
    Icon: Info,
  },
};

// ─────────────────────────────────────────────────────
// Mini Donut Chart (SVG, no external deps)
// ─────────────────────────────────────────────────────
const DonutChart = ({ critical, warning, info }) => {
  const total = critical + warning + info;
  if (total === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: '#94A3B8', fontSize: '13px' }}>
        <CheckCircle size={32} color="#10B981" style={{ marginBottom: '8px' }} />
        No issues found
      </div>
    );
  }

  const cx = 60, cy = 60, r = 45, stroke = 14;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { value: critical, color: '#EF4444', label: 'Critical' },
    { value: warning, color: '#F59E0B', label: 'Warning' },
    { value: info, color: '#3B82F6', label: 'Info' },
  ].filter(s => s.value > 0);

  let cumulativePercent = 0;
  const paths = segments.map((seg, i) => {
    const percent = seg.value / total;
    const offset = circumference - cumulativePercent * circumference;
    const dash = percent * circumference;
    cumulativePercent += percent;
    return (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={offset}
        strokeLinecap="butt"
        style={{ transform: `rotate(-90deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.4s ease' }}
      />
    );
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={120} height={120} viewBox={`0 0 ${cx * 2} ${cy * 2}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
          {paths}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div style={{ fontWeight: '800', fontSize: '22px', color: '#0F172A', lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Issues</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[['critical', critical, '#EF4444'], ['warning', warning, '#F59E0B'], ['info', info, '#3B82F6']].map(([key, count, color]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
              <span style={{ color: '#475569', textTransform: 'capitalize' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            </div>
            <span style={{ fontWeight: '700', color: '#0F172A' }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────
// Severity Badge
// ─────────────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;
  const { Icon } = cfg;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: cfg.color, fontSize: '13px', fontWeight: '700' }}>
      <Icon size={14} />
      {cfg.label}
    </div>
  );
};

// ─────────────────────────────────────────────────────
// Content Type Badge
// ─────────────────────────────────────────────────────
const ContentBadge = ({ type }) => {
  const colors = {
    Thumbnail: { bg: '#F5F3FF', color: '#7C3AED' },
    Duration: { bg: '#FEF3C7', color: '#92400E' },
    Section: { bg: '#DBEAFE', color: '#1E40AF' },
    Synopsis: { bg: '#DCFCE7', color: '#166534' },
    Banner: { bg: '#FDE8D8', color: '#9A3412' },
    Poster: { bg: '#FCE7F3', color: '#9D174D' },
  };
  const c = colors[type] || { bg: '#F1F5F9', color: '#475569' };
  return (
    <span style={{ backgroundColor: c.bg, color: c.color, padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
      {type}
    </span>
  );
};

// ─────────────────────────────────────────────────────
// Dropdown component (reusable, used for filters)
// ─────────────────────────────────────────────────────
const FilterDropdown = ({ value, onChange, options, minWidth = '120px' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', minWidth, flexShrink: 0 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ height: '38px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between', backgroundColor: open ? '#F5F3FF' : '#FFFFFF', border: open ? '1px solid #A78BFA' : '1px solid #E2E8F0', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', color: open ? '#6D28D9' : '#334155', whiteSpace: 'nowrap' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '4px', fontWeight: '500' }}>{value}</span>
        <ChevronDown size={13} style={{ flexShrink: 0, color: '#94A3B8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 99, overflow: 'hidden', padding: '4px' }}>
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', backgroundColor: value === opt ? '#F5F3FF' : 'transparent', color: value === opt ? '#6D28D9' : '#334155', fontWeight: value === opt ? '600' : '400' }}
              onMouseOver={e => { if (value !== opt) e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
              onMouseOut={e => { if (value !== opt) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────
const Skeleton = ({ w = '100%', h = '16px', r = '6px', mb = '0' }) => (
  <div style={{ width: w, height: h, borderRadius: r, backgroundColor: '#F1F5F9', marginBottom: mb, animation: 'pulse 1.5s ease-in-out infinite', background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', backgroundSize: '200% 100%' }} />
);

// ─────────────────────────────────────────────────────
// Summary Card
// ─────────────────────────────────────────────────────
const SummaryCard = ({ icon: Icon, value, label, sub, accentColor, accentBg, borderColor }) => (
  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: `1px solid ${borderColor || '#E2E8F0'}`, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', flex: 1, minWidth: 0 }}>
    <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={accentColor} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontWeight: '800', fontSize: '28px', color: '#0F172A', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontWeight: '700', fontSize: '13px', color: '#334155', marginTop: '2px' }}>{label}</div>
      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{sub}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────
// Main Validation Page
// ─────────────────────────────────────────────────────
const Validation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State
  const [search, setSearch] = useState('');
  const [filterShow, setFilterShow] = useState('All Shows');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterSeverity, setFilterSeverity] = useState('All Severity');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [runFeedback, setRunFeedback] = useState(null); // { type: 'success'|'error', msg }

  // Queries
  const { data: report, isLoading: reportLoading, error: reportError, refetch: refetchReport } = useQuery({
    queryKey: ['validationReport'],
    queryFn: fetchReport,
    staleTime: 30000,
  });

  const { data: shows } = useQuery({
    queryKey: ['shows'],
    queryFn: fetchShows,
    staleTime: 60000,
  });

  const { data: history } = useQuery({
    queryKey: ['publishHistory'],
    queryFn: fetchHistory,
    staleTime: 30000,
  });

  // Run validation mutation
  const runMutation = useMutation({
    mutationFn: runValidationApi,
    onSuccess: (data) => {
      queryClient.setQueryData(['validationReport'], data);
      setRunFeedback({ type: 'success', msg: `Validation complete — ${data.total_issues} issue${data.total_issues !== 1 ? 's' : ''} found.` });
      setTimeout(() => setRunFeedback(null), 5000);
    },
    onError: () => {
      setRunFeedback({ type: 'error', msg: 'Validation failed. Please try again.' });
      setTimeout(() => setRunFeedback(null), 5000);
    },
  });

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, filterShow, filterStatus, filterSeverity, perPage]);

  // Derived data
  const showTitles = useMemo(() => {
    if (!shows) return [];
    return [...new Set(shows.map(s => s.title))].sort();
  }, [shows]);

  const issues = report?.issues || [];

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        issue.issue_type?.toLowerCase().includes(q) ||
        issue.episode_title?.toLowerCase().includes(q) ||
        issue.show_title?.toLowerCase().includes(q) ||
        issue.description?.toLowerCase().includes(q);
      const matchShow = filterShow === 'All Shows' || issue.show_title === filterShow;
      const matchStatus = filterStatus === 'All Status' || issue.status === filterStatus.toLowerCase();
      const matchSeverity = filterSeverity === 'All Severity' || issue.severity === filterSeverity.toLowerCase();
      return matchSearch && matchShow && matchStatus && matchSeverity;
    });
  }, [issues, search, filterShow, filterStatus, filterSeverity]);

  const totalPages = Math.ceil(filteredIssues.length / perPage);
  const paginatedIssues = filteredIssues.slice((page - 1) * perPage, page * perPage);

  const latestRun = history?.[0] || null;

  const hasFilters = search || filterShow !== 'All Shows' || filterStatus !== 'All Status' || filterSeverity !== 'All Severity';

  const clearFilters = () => {
    setSearch('');
    setFilterShow('All Shows');
    setFilterStatus('All Status');
    setFilterSeverity('All Severity');
  };

  // ── Render ──
  if (reportError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={28} color="#DC2626" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '700', fontSize: '16px', color: '#0F172A', marginBottom: '4px' }}>Unable to load validation results</div>
          <div style={{ color: '#94A3B8', fontSize: '14px' }}>There was a problem connecting to the server.</div>
        </div>
        <button onClick={() => refetchReport()} className="btn btn-primary" style={{ borderRadius: '12px' }}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* ── Header (outside Layout's header, since Validation has its own CTA) ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>Validation</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>Review and fix issues before publishing content.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {runFeedback && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', backgroundColor: runFeedback.type === 'success' ? '#DCFCE7' : '#FEF2F2', color: runFeedback.type === 'success' ? '#15803D' : '#DC2626', fontSize: '13px', fontWeight: '600' }}>
              {runFeedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {runFeedback.msg}
            </div>
          )}
          <button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', backgroundColor: runMutation.isPending ? '#7C3AED' : '#4B27B5', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: runMutation.isPending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(75, 39, 181, 0.28)', transition: 'all 0.2s', opacity: runMutation.isPending ? 0.75 : 1, whiteSpace: 'nowrap' }}
          >
            {runMutation.isPending ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={16} fill="white" />}
            {runMutation.isPending ? 'Running…' : 'Run Validation'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
      `}</style>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>

        {/* ═══ LEFT COLUMN ═══ */}
        <div style={{ minWidth: 0 }}>

          {/* Summary Cards */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {reportLoading ? (
              [1,2,3,4].map(i => (
                <div key={i} style={{ flex: 1, minWidth: '120px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px 24px' }}>
                  <Skeleton h="28px" w="60px" mb="8px" r="6px" />
                  <Skeleton h="14px" w="80%" mb="4px" />
                  <Skeleton h="12px" w="60%" />
                </div>
              ))
            ) : (
              <>
                <SummaryCard icon={Shield} value={report?.total_issues ?? 0} label="Total Issues" sub="Blocking publish" accentColor="#7C3AED" accentBg="#F5F3FF" borderColor="#EDE9FE" />
                <SummaryCard icon={AlertCircle} value={report?.critical_count ?? 0} label="Critical Issues" sub="Must fix to publish" accentColor="#DC2626" accentBg="#FEF2F2" borderColor="#FECACA" />
                <SummaryCard icon={AlertTriangle} value={report?.warning_count ?? 0} label="Warnings" sub="Should fix" accentColor="#D97706" accentBg="#FFFBEB" borderColor="#FDE68A" />
                <SummaryCard icon={Info} value={report?.info_count ?? 0} label="Info" sub="For your review" accentColor="#2563EB" accentBg="#EFF6FF" borderColor="#BFDBFE" />
              </>
            )}
          </div>

          {/* Filter / Search bar */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '0 14px', height: '38px' }}>
              <Search size={14} color="#94A3B8" style={{ flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search issues by title, episode, or show…"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#334155', width: '100%' }}
              />
              {search && (
                <X size={14} color="#94A3B8" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setSearch('')} />
              )}
            </div>

            {/* Show filter */}
            <FilterDropdown
              value={filterShow}
              onChange={setFilterShow}
              options={['All Shows', ...showTitles]}
              minWidth="130px"
            />

            {/* Status filter */}
            <FilterDropdown
              value={filterStatus}
              onChange={setFilterStatus}
              options={['All Status', 'Open', 'Resolved']}
              minWidth="110px"
            />

            {/* Severity filter */}
            <FilterDropdown
              value={filterSeverity}
              onChange={setFilterSeverity}
              options={['All Severity', 'Critical', 'Warning', 'Info']}
              minWidth="120px"
            />

            {/* Clear Filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '38px', borderRadius: '20px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <X size={13} /> Clear Filters
              </button>
            )}
          </div>

          {/* Issues Table */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            {reportLoading ? (
              <div style={{ padding: '24px' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
                    <Skeleton w="80px" h="20px" />
                    <Skeleton w="30%" h="20px" />
                    <Skeleton w="15%" h="20px" />
                    <Skeleton w="20%" h="20px" />
                    <Skeleton w="10%" h="20px" />
                    <Skeleton w="10%" h="20px" />
                  </div>
                ))}
              </div>
            ) : filteredIssues.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
                {issues.length === 0 ? (
                  <>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <CheckCircle size={32} color="#16A34A" />
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '18px', color: '#0F172A', marginBottom: '6px' }}>No validation issues found</div>
                    <div style={{ color: '#94A3B8', fontSize: '14px' }}>All content currently passes validation.</div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                      <Search size={24} color="#94A3B8" />
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#0F172A', marginBottom: '6px' }}>No matching issues</div>
                    <div style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '16px' }}>Try adjusting your search or filters.</div>
                    <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      <X size={14} /> Clear Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '700px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#FAFAFA' }}>
                        {['SEVERITY', 'ISSUE', 'CONTENT', 'SHOW / EPISODE', 'STATUS', 'ADDED', 'ACTIONS'].map((col, i) => (
                          <th key={col} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: i === 6 ? 'center' : 'left', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedIssues.map((issue, idx) => {
                        const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.info;
                        const isLast = idx === paginatedIssues.length - 1;
                        return (
                          <tr
                            key={issue.id}
                            style={{ transition: 'background-color 0.12s' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#FAFAFF'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {/* Severity */}
                            <td style={{ padding: '14px 16px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC' }}>
                              <SeverityBadge severity={issue.severity} />
                            </td>

                            {/* Issue */}
                            <td style={{ padding: '14px 16px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC', maxWidth: '220px' }}>
                              <div style={{ fontWeight: '600', fontSize: '13px', color: '#0F172A', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {issue.issue_type}
                              </div>
                              <div style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {issue.description}
                              </div>
                            </td>

                            {/* Content type */}
                            <td style={{ padding: '14px 16px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC' }}>
                              <ContentBadge type={issue.content_type} />
                            </td>

                            {/* Show / Episode */}
                            <td style={{ padding: '14px 16px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC', maxWidth: '200px' }}>
                              <div style={{ fontWeight: '600', fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {issue.episode_title}
                              </div>
                              <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <span>{issue.show_title}</span>
                                {issue.season_number !== null && issue.season_number !== undefined && (
                                  <>
                                    <span style={{ opacity: 0.4 }}>·</span>
                                    <span>{issue.season_number === 0 ? 'Trailer' : `S${issue.season_number}`}</span>
                                  </>
                                )}
                                {issue.language && (
                                  <>
                                    <span style={{ opacity: 0.4 }}>·</span>
                                    <span style={{ textTransform: 'uppercase' }}>{issue.language}</span>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* Status */}
                            <td style={{ padding: '14px 16px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: issue.status === 'resolved' ? '#DCFCE7' : '#FFF7ED', color: issue.status === 'resolved' ? '#16A34A' : '#EA580C', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                                {issue.status === 'resolved' ? 'Resolved' : 'Open'}
                              </span>
                            </td>

                            {/* Added */}
                            <td style={{ padding: '14px 16px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC', fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                              {safeDate(issue.created_at, true) || '—'}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '14px 16px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC', textAlign: 'center' }}>
                              <button
                                onClick={() => issue.episode_id && navigate(`/episodes/${issue.episode_id}/edit`)}
                                title="View episode"
                                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'all 0.15s' }}
                                onMouseOver={e => { e.currentTarget.style.backgroundColor = '#F5F3FF'; e.currentTarget.style.borderColor = '#C4B5FD'; e.currentTarget.style.color = '#6D28D9'; }}
                                onMouseOut={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}
                              >
                                <Eye size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    Showing <strong>{(page - 1) * perPage + 1}</strong> to <strong>{Math.min(page * perPage, filteredIssues.length)}</strong> of <strong>{filteredIssues.length}</strong> issue{filteredIssues.length !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
                    >
                      <ChevronLeft size={15} />
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let p;
                      if (totalPages <= 5) p = i + 1;
                      else if (page <= 3) p = i + 1;
                      else if (page >= totalPages - 2) p = totalPages - 4 + i;
                      else p = page - 2 + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${page === p ? '#7C3AED' : '#E2E8F0'}`, backgroundColor: page === p ? '#7C3AED' : '#FFFFFF', color: page === p ? '#FFFFFF' : '#475569', fontSize: '13px', fontWeight: page === p ? '700' : '400', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {p}
                        </button>
                      );
                    })}

                    {totalPages > 5 && page < totalPages - 2 && (
                      <span style={{ color: '#94A3B8', fontSize: '13px', padding: '0 4px' }}>…</span>
                    )}

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || totalPages === 0}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (page === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', opacity: (page === totalPages || totalPages === 0) ? 0.4 : 1 }}
                    >
                      <ChevronRight size={15} />
                    </button>

                    {/* Per page */}
                    <div style={{ marginLeft: '8px' }}>
                      <FilterDropdown
                        value={`${perPage} per page`}
                        onChange={v => setPerPage(parseInt(v))}
                        options={[10, 25, 50].map(n => `${n} per page`)}
                        minWidth="110px"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Issues by Severity (Donut) */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A', marginBottom: '16px' }}>Issues by Severity</div>
            {reportLoading ? (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Skeleton w="120px" h="120px" r="50%" />
                <div style={{ flex: 1 }}>
                  {[1,2,3].map(i => <Skeleton key={i} h="16px" mb="10px" />)}
                </div>
              </div>
            ) : (
              <DonutChart
                critical={report?.critical_count ?? 0}
                warning={report?.warning_count ?? 0}
                info={report?.info_count ?? 0}
              />
            )}
          </div>

          {/* Blocked from Publishing */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A', marginBottom: '6px' }}>Blocked from Publishing</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '14px' }}>You must fix all critical issues before publishing.</div>
            {reportLoading ? (
              <Skeleton h="56px" r="12px" />
            ) : (report?.critical_count ?? 0) > 0 ? (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontWeight: '800', fontSize: '28px', color: '#DC2626', lineHeight: 1 }}>{report.critical_count}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#991B1B' }}>Critical Issues</div>
                  <div style={{ fontSize: '12px', color: '#B91C1C' }}>Must be resolved</div>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={24} color="#16A34A" />
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#15803D' }}>Ready to publish</div>
                  <div style={{ fontSize: '12px', color: '#16A34A' }}>No critical issues blocking</div>
                </div>
              </div>
            )}
          </div>

          {/* Latest Run */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A', marginBottom: '14px' }}>Latest Run</div>
            {reportLoading ? (
              <Skeleton h="60px" r="12px" />
            ) : !latestRun ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Clock size={28} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>No validation run yet</div>
                <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '4px' }}>Run validation to check your content.</div>
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: latestRun.status === 'success' ? '#DCFCE7' : '#FEF2F2', border: `1px solid ${latestRun.status === 'success' ? '#BBF7D0' : '#FECACA'}`, borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  {latestRun.status === 'success' ? <CheckCircle size={18} color="#16A34A" /> : <AlertCircle size={18} color="#DC2626" />}
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: latestRun.status === 'success' ? '#15803D' : '#991B1B' }}>
                      {latestRun.status === 'success' ? 'Passed' : 'Failed'}
                    </div>
                    <div style={{ fontSize: '11px', color: latestRun.status === 'success' ? '#16A34A' : '#B91C1C' }}>
                      {safeDate(latestRun.created_at) || '—'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '18px', color: '#0F172A' }}>{latestRun.published_records ?? 0}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Published</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#F1F5F9' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '18px', color: '#DC2626' }}>{latestRun.blocked_records ?? 0}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Blocked</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#F1F5F9' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '18px', color: '#0F172A' }}>{latestRun.total_records_processed ?? 0}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Total</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Tips */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A', marginBottom: '14px' }}>Quick Tips</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: AlertCircle, color: '#DC2626', text: 'Critical issues block publishing' },
                { icon: AlertTriangle, color: '#D97706', text: "Warnings don't block publishing" },
                { icon: Info, color: '#2563EB', text: 'Info items are recommendations' },
              ].map(({ icon: Icon, color, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569' }}>
                  <Icon size={14} color={color} style={{ flexShrink: 0 }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Responsive: stack right sidebar on smaller screens */}
      <style>{`
        @media (max-width: 1100px) {
          .validation-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Validation;
