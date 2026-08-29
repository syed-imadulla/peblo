import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle, AlertTriangle, Info, CheckCircle, Play, Search, X,
  ChevronDown, ChevronLeft, ChevronRight, Eye, RefreshCw, Clock,
  Shield, Zap
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────
const fetchReport  = () => axios.get('/api/admin/validation-report').then(r => r.data);
const fetchShows   = () => axios.get('/api/admin/shows').then(r => r.data);
const fetchHistory = () => axios.get('/api/admin/publish-history').then(r => r.data);
const runValidation = () => axios.post('/api/admin/run-validation').then(r => r.data);

// ─────────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────────
const relativeDate = s => {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  const ms = Date.now() - d.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

const formatDate = s => {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─────────────────────────────────────────────────────────────────
// Severity config
// ─────────────────────────────────────────────────────────────────
const SEV = {
  critical: { label: 'Critical', color: '#DC2626', light: '#FEF2F2', border: '#FECACA', chart: '#EF4444', Icon: AlertCircle },
  warning:  { label: 'Warning',  color: '#D97706', light: '#FFFBEB', border: '#FDE68A', chart: '#F59E0B', Icon: AlertTriangle },
  info:     { label: 'Info',     color: '#2563EB', light: '#EFF6FF', border: '#BFDBFE', chart: '#3B82F6', Icon: Info },
};

// ─────────────────────────────────────────────────────────────────
// Content-type badge colors
// ─────────────────────────────────────────────────────────────────
const BADGE_COLORS = {
  Thumbnail: { bg: '#F5F3FF', color: '#6D28D9' },
  Duration:  { bg: '#FEF3C7', color: '#92400E' },
  Section:   { bg: '#DBEAFE', color: '#1E40AF' },
  Synopsis:  { bg: '#DCFCE7', color: '#166534' },
  Banner:    { bg: '#FDE8D8', color: '#9A3412' },
  Poster:    { bg: '#FCE7F3', color: '#9D174D' },
};
const getBadgeStyle = type => BADGE_COLORS[type] || { bg: '#F1F5F9', color: '#475569' };

// ─────────────────────────────────────────────────────────────────
// SVG Donut Chart — pure SVG, no external dependencies
// ─────────────────────────────────────────────────────────────────
const DonutChart = ({ critical = 0, warning = 0, info = 0 }) => {
  const total = critical + warning + info;

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <CheckCircle size={36} color="#16A34A" style={{ marginBottom: '8px' }} />
        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>No issues found</div>
      </div>
    );
  }

  const CX = 54, CY = 54, R = 38, STROKE = 12;
  const CIRC = 2 * Math.PI * R;
  const GAP_FRAC = 0.012; // small gap between segments

  const rawSegs = [
    { value: critical, color: '#EF4444' },
    { value: warning,  color: '#F59E0B' },
    { value: info,     color: '#3B82F6' },
  ].filter(s => s.value > 0);

  let cum = 0;
  const arcs = rawSegs.map((seg, i) => {
    const frac = seg.value / total;
    const dash = Math.max(0, frac * CIRC - GAP_FRAC * CIRC);
    const offset = CIRC - cum * CIRC;
    cum += frac;
    return (
      <circle
        key={i}
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={seg.color}
        strokeWidth={STROKE}
        strokeDasharray={`${dash} ${CIRC - dash}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px` }}
      />
    );
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
      <div style={{ position: 'relative', flexShrink: 0, width: 108, height: 108 }}>
        <svg width={108} height={108} viewBox={`0 0 ${CX * 2} ${CY * 2}`}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F1F5F9" strokeWidth={STROKE} />
          {arcs}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontWeight: '800', fontSize: '20px', color: '#0F172A', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' }}>Issues</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {[['Critical', critical, '#EF4444'], ['Warnings', warning, '#F59E0B'], ['Info', info, '#3B82F6']].map(([label, count, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, display: 'inline-block', flexShrink: 0 }} />
              {label}
            </div>
            <span style={{ fontWeight: '700', color: '#0F172A' }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Pill Dropdown — for filters
// ─────────────────────────────────────────────────────────────────
const PillDropdown = ({ value, onChange, options, minWidth = '110px' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', minWidth, flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', height: '36px', padding: '0 10px 0 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
          backgroundColor: open ? '#F5F3FF' : '#FFFFFF',
          border: open ? '1px solid #A78BFA' : '1px solid #E2E8F0',
          borderRadius: '20px', cursor: 'pointer',
          fontSize: '13px', color: open ? '#6D28D9' : '#475569', fontWeight: '500',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
        <ChevronDown size={13} color={open ? '#6D28D9' : '#94A3B8'} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%',
          backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 200,
          padding: '4px', maxHeight: '240px', overflowY: 'auto',
        }}>
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                backgroundColor: value === opt ? '#F5F3FF' : 'transparent',
                color: value === opt ? '#6D28D9' : '#334155',
                fontWeight: value === opt ? '600' : '400',
              }}
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

// ─────────────────────────────────────────────────────────────────
// Skeleton block
// ─────────────────────────────────────────────────────────────────
const Skel = ({ w = '100%', h = '14px', r = '6px' }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#F1F5F9 25%,#E8EDF2 50%,#F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'skelAnim 1.4s ease-in-out infinite' }} />
);

// ─────────────────────────────────────────────────────────────────
// Summary card
// ─────────────────────────────────────────────────────────────────
const SummaryCard = ({ Icon, value, label, sub, iconColor, iconBg, borderColor }) => (
  <div style={{
    flex: '1 1 0', minWidth: '140px',
    backgroundColor: '#FFFFFF', borderRadius: '14px',
    border: `1px solid ${borderColor}`, padding: '18px 20px',
    display: 'flex', alignItems: 'center', gap: '14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }}>
    <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={19} color={iconColor} />
    </div>
    <div>
      <div style={{ fontWeight: '800', fontSize: '26px', color: '#0F172A', lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontWeight: '600', fontSize: '12px', color: '#334155', marginTop: '3px' }}>{label}</div>
      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{sub}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Severity badge (icon + text)
// ─────────────────────────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
  const cfg = SEV[severity] || SEV.info;
  const { Icon } = cfg;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: cfg.color, fontWeight: '700', fontSize: '13px' }}>
      <Icon size={14} /> {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────
// Main Validation Component
// ─────────────────────────────────────────────────────────────────
const Validation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search,         setSearch]         = useState('');
  const [filterShow,     setFilterShow]     = useState('All Shows');
  const [filterStatus,   setFilterStatus]   = useState('All Status');
  const [filterSeverity, setFilterSeverity] = useState('All Severity');
  const [page,           setPage]           = useState(1);
  const [perPage,        setPerPage]        = useState(10);
  const [toast,          setToast]          = useState(null);

  const toast$ = ref => { setToast(ref); if (ref) setTimeout(() => setToast(null), 5000); };

  // ── Queries ────────────────────────────────────────────────────
  const { data: report,  isLoading: reportLoading,  error: reportError,  refetch: refetchReport } =
    useQuery({ queryKey: ['validationReport'], queryFn: fetchReport, staleTime: 30_000 });

  const { data: shows } =
    useQuery({ queryKey: ['adminShows'], queryFn: fetchShows, staleTime: 60_000 });

  const { data: history } =
    useQuery({ queryKey: ['publishHistory'], queryFn: fetchHistory, staleTime: 30_000 });

  // ── Run mutation ───────────────────────────────────────────────
  const runMut = useMutation({
    mutationFn: runValidation,
    onSuccess: data => {
      queryClient.setQueryData(['validationReport'], data);
      toast$({ type: 'success', msg: `Done — ${data.total_issues} issue${data.total_issues !== 1 ? 's' : ''} found.` });
    },
    onError: () => toast$({ type: 'error', msg: 'Validation failed. Try again.' }),
  });

  // ── Reset page on filter change ────────────────────────────────
  useEffect(() => setPage(1), [search, filterShow, filterStatus, filterSeverity, perPage]);

  // ── Derived data ───────────────────────────────────────────────
  const showNames = useMemo(() =>
    shows ? [...new Set(shows.map(s => s.title))].sort() : [],
    [shows]);

  const allIssues = report?.issues || [];

  const filtered = useMemo(() => allIssues.filter(issue => {
    const q = search.trim().toLowerCase();
    const matchQ = !q || [issue.issue_type, issue.episode_title, issue.show_title, issue.description]
      .some(f => f?.toLowerCase().includes(q));
    const matchShow = filterShow     === 'All Shows'    || issue.show_title  === filterShow;
    const matchStat = filterStatus   === 'All Status'   || issue.status      === filterStatus.toLowerCase();
    const matchSev  = filterSeverity === 'All Severity' || issue.severity    === filterSeverity.toLowerCase();
    return matchQ && matchShow && matchStat && matchSev;
  }), [allIssues, search, filterShow, filterStatus, filterSeverity]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const hasFilters = search || filterShow !== 'All Shows' || filterStatus !== 'All Status' || filterSeverity !== 'All Severity';
  const clearAll   = () => { setSearch(''); setFilterShow('All Shows'); setFilterStatus('All Status'); setFilterSeverity('All Severity'); };

  const latestRun = history?.[0] || null;

  // ─────────────────────────────────────────────────────────────────
  // Error state
  // ─────────────────────────────────────────────────────────────────
  if (reportError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', gap: '12px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={28} color="#DC2626" />
      </div>
      <div style={{ fontWeight: '700', fontSize: '16px', color: '#0F172A' }}>Unable to load validation results</div>
      <div style={{ color: '#94A3B8', fontSize: '14px' }}>There was a problem connecting to the server.</div>
      <button onClick={() => refetchReport()} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', backgroundColor: '#4B27B5', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
        <RefreshCw size={15} /> Try Again
      </button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes skelAnim { 0%,100%{background-position:200% 0} 50%{background-position:-200% 0} }
        @keyframes spin      { to { transform:rotate(360deg) } }
        @keyframes fadeIn    { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
        .val-layout { display:grid; grid-template-columns:1fr 272px; gap:20px; align-items:start; }
        @media(max-width:1100px){ .val-layout{ grid-template-columns:1fr; } }
        .val-row:hover td { background:#FAFAFF !important; }
        .act-btn:hover { background:#F5F3FF !important; border-color:#C4B5FD !important; color:#6D28D9 !important; }
      `}</style>

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>Validation</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>Review and fix issues before publishing content.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {toast && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', backgroundColor: toast.type === 'success' ? '#DCFCE7' : '#FEF2F2', color: toast.type === 'success' ? '#15803D' : '#DC2626', fontSize: '13px', fontWeight: '600', animation: 'fadeIn 0.2s ease' }}>
              {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {toast.msg}
            </div>
          )}
          <button
            onClick={() => runMut.mutate()}
            disabled={runMut.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#4B27B5', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: runMut.isPending ? 'not-allowed' : 'pointer', opacity: runMut.isPending ? 0.75 : 1, boxShadow: '0 4px 14px rgba(75,39,181,0.28)', whiteSpace: 'nowrap', transition: 'opacity 0.2s' }}
          >
            {runMut.isPending
              ? <RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <Play size={15} fill="white" style={{ marginLeft: '2px' }} />}
            {runMut.isPending ? 'Running…' : 'Run Validation'}
          </button>
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────────── */}
      <div className="val-layout">

        {/* ════════════════ LEFT COLUMN ════════════════ */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Summary Cards */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {reportLoading ? [1,2,3,4].map(i => (
              <div key={i} style={{ flex:'1 1 140px', backgroundColor:'#FFFFFF', borderRadius:'14px', border:'1px solid #E2E8F0', padding:'18px 20px', display:'flex', alignItems:'center', gap:'14px' }}>
                <Skel w="42px" h="42px" r="12px" />
                <div style={{ flex:1 }}>
                  <Skel h="24px" w="48px" r="4px" />
                  <div style={{marginTop:'6px'}}><Skel h="12px" w="80%" /></div>
                  <div style={{marginTop:'4px'}}><Skel h="11px" w="60%" /></div>
                </div>
              </div>
            )) : (
              <>
                <SummaryCard Icon={Shield}        value={report?.total_issues    ?? 0} label="Total Issues"    sub="Blocking publish"    iconColor="#7C3AED" iconBg="#F5F3FF" borderColor="#EDE9FE" />
                <SummaryCard Icon={AlertCircle}   value={report?.critical_count  ?? 0} label="Critical Issues" sub="Must fix to publish"  iconColor="#DC2626" iconBg="#FEF2F2" borderColor="#FECACA" />
                <SummaryCard Icon={AlertTriangle} value={report?.warning_count   ?? 0} label="Warnings"        sub="Should fix"          iconColor="#D97706" iconBg="#FFFBEB" borderColor="#FDE68A" />
                <SummaryCard Icon={Info}          value={report?.info_count      ?? 0} label="Info"            sub="For your review"     iconColor="#2563EB" iconBg="#EFF6FF" borderColor="#BFDBFE" />
              </>
            )}
          </div>

          {/* Filter bar */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            {/* Search */}
            <div style={{ flex: '1 1 180px', minWidth: '180px', display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '0 12px', height: '36px' }}>
              <Search size={13} color="#94A3B8" style={{ flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search issues by title, episode, or show…"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#334155', width: '100%', fontFamily: 'inherit' }}
              />
              {search && <X size={13} color="#94A3B8" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setSearch('')} />}
            </div>

            <PillDropdown value={filterShow}     onChange={setFilterShow}     options={['All Shows',    ...showNames]}                                minWidth="120px" />
            <PillDropdown value={filterStatus}   onChange={setFilterStatus}   options={['All Status',   'Open', 'Resolved']}                          minWidth="106px" />
            <PillDropdown value={filterSeverity} onChange={setFilterSeverity} options={['All Severity', 'Critical', 'Warning', 'Info']}               minWidth="116px" />

            {hasFilters && (
              <button onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 14px', height: '36px', borderRadius: '20px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <X size={12} /> Clear Filters
              </button>
            )}
          </div>

          {/* Issues Table */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>

            {reportLoading ? (
              <div style={{ padding: '20px' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
                    <Skel w="70px" h="18px" /><Skel w="28%" h="18px" /><Skel w="12%" h="18px" />
                    <Skel w="20%" h="18px" /><Skel w="8%" h="18px" /><Skel w="8%" h="18px" /><Skel w="30px" h="30px" r="8px" />
                  </div>
                ))}
              </div>
            ) : paged.length === 0 ? (
              /* Empty state */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', textAlign: 'center' }}>
                {allIssues.length === 0 ? (
                  <>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                      <CheckCircle size={30} color="#16A34A" />
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '17px', color: '#0F172A', marginBottom: '6px' }}>No validation issues found</div>
                    <div style={{ color: '#94A3B8', fontSize: '14px', maxWidth: '320px' }}>All content currently passes validation. You're ready to publish.</div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                      <Search size={22} color="#94A3B8" />
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#0F172A', marginBottom: '6px' }}>No matching issues</div>
                    <div style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '14px' }}>Try adjusting your search or filters.</div>
                    <button onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 18px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      <X size={13} /> Clear Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* Table */
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
                      {[
                        { label: 'SEVERITY', w: '100px' },
                        { label: 'ISSUE',    w: undefined },
                        { label: 'CONTENT',  w: '90px' },
                        { label: 'SHOW / EPISODE', w: undefined },
                        { label: 'STATUS',   w: '80px' },
                        { label: 'ADDED',    w: '80px' },
                        { label: 'ACTIONS',  w: '64px', center: true },
                      ].map(({ label, w, center }) => (
                        <th key={label} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: center ? 'center' : 'left', whiteSpace: 'nowrap', width: w }}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((issue, idx) => {
                      const isLast = idx === paged.length - 1;
                      const bc = getBadgeStyle(issue.content_type);
                      return (
                        <tr key={issue.id} className="val-row">
                          {/* Severity */}
                          <td style={{ padding: '13px 14px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC' }}>
                            <SeverityBadge severity={issue.severity} />
                          </td>

                          {/* Issue */}
                          <td style={{ padding: '13px 14px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC', maxWidth: '200px' }}>
                            <div style={{ fontWeight: '600', fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.issue_type}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.description}</div>
                          </td>

                          {/* Content badge */}
                          <td style={{ padding: '13px 14px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC' }}>
                            <span style={{ backgroundColor: bc.bg, color: bc.color, padding: '3px 9px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                              {issue.content_type}
                            </span>
                          </td>

                          {/* Show / Episode */}
                          <td style={{ padding: '13px 14px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC', maxWidth: '180px' }}>
                            <div style={{ fontWeight: '600', fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {issue.episode_title || '—'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'nowrap', overflow: 'hidden' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.show_title}</span>
                              {issue.season_number !== null && issue.season_number !== undefined && (
                                <>
                                  <span>·</span>
                                  <span style={{ flexShrink: 0 }}>{issue.season_number === 0 ? 'Trailer' : `S${issue.season_number}`}</span>
                                </>
                              )}
                              {issue.language && (
                                <>
                                  <span>·</span>
                                  <span style={{ textTransform: 'uppercase', flexShrink: 0 }}>{issue.language}</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '13px 14px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', backgroundColor: issue.status === 'resolved' ? '#DCFCE7' : '#FFF7ED', color: issue.status === 'resolved' ? '#16A34A' : '#EA580C' }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                              {issue.status === 'resolved' ? 'Resolved' : 'Open'}
                            </span>
                          </td>

                          {/* Added */}
                          <td style={{ padding: '13px 14px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC', fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                            {relativeDate(issue.created_at) || '—'}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '13px 14px', borderBottom: isLast ? 'none' : '1px solid #F8FAFC', textAlign: 'center' }}>
                            <button
                              className="act-btn"
                              onClick={() => issue.episode_id && navigate(`/episodes/${issue.episode_id}/edit`)}
                              title="View and fix episode"
                              style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'all 0.15s' }}
                            >
                              <Eye size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination — only when we have rows */}
            {!reportLoading && paged.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>
                  Showing <b>{(safePage - 1) * perPage + 1}</b>–<b>{Math.min(safePage * perPage, filtered.length)}</b> of <b>{filtered.length}</b> issue{filtered.length !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {/* Prev */}
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                    style={{ width: '30px', height: '30px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: safePage === 1 ? 'not-allowed' : 'pointer', opacity: safePage === 1 ? 0.4 : 1 }}>
                    <ChevronLeft size={14} />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p;
                    if (totalPages <= 5) p = i + 1;
                    else if (safePage <= 3) p = i + 1;
                    else if (safePage >= totalPages - 2) p = totalPages - 4 + i;
                    else p = safePage - 2 + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        style={{ width: '30px', height: '30px', border: `1px solid ${safePage === p ? '#7C3AED' : '#E2E8F0'}`, borderRadius: '8px', background: safePage === p ? '#7C3AED' : '#FFF', color: safePage === p ? '#FFF' : '#475569', fontSize: '13px', fontWeight: safePage === p ? '700' : '400', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p}
                      </button>
                    );
                  })}

                  {/* Next */}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    style={{ width: '30px', height: '30px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', opacity: safePage === totalPages ? 0.4 : 1 }}>
                    <ChevronRight size={14} />
                  </button>

                  {/* Per-page selector */}
                  <div style={{ marginLeft: '6px' }}>
                    <PillDropdown
                      value={`${perPage} per page`}
                      onChange={v => setPerPage(parseInt(v))}
                      options={['10 per page', '25 per page', '50 per page']}
                      minWidth="108px"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════ RIGHT SIDEBAR ════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Issues by Severity */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', marginBottom: '14px' }}>Issues by Severity</div>
            {reportLoading ? (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <Skel w="108px" h="108px" r="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Skel h="14px" /><Skel h="14px" /><Skel h="14px" />
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
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', marginBottom: '6px' }}>Blocked from Publishing</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '14px', lineHeight: 1.4 }}>You must fix all critical issues before publishing.</div>
            {reportLoading ? <Skel h="56px" r="12px" /> : (report?.critical_count ?? 0) > 0 ? (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontWeight: '800', fontSize: '28px', color: '#DC2626', lineHeight: 1, flexShrink: 0 }}>{report.critical_count}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#991B1B' }}>Critical Issues</div>
                  <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '2px' }}>Must be resolved</div>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={22} color="#16A34A" />
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#15803D' }}>Ready to publish</div>
                  <div style={{ fontSize: '12px', color: '#16A34A', marginTop: '2px' }}>No critical issues blocking</div>
                </div>
              </div>
            )}
          </div>

          {/* Latest Run */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', marginBottom: '14px' }}>Latest Run</div>
            {!latestRun ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <Clock size={28} color="#CBD5E1" />
                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', marginTop: '8px' }}>No runs yet</div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Run validation to get started.</div>
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: latestRun.status === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${latestRun.status === 'success' ? '#BBF7D0' : '#FECACA'}`, borderRadius: '10px', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  {latestRun.status === 'success'
                    ? <CheckCircle size={17} color="#16A34A" />
                    : <AlertCircle size={17} color="#DC2626" />}
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: latestRun.status === 'success' ? '#15803D' : '#991B1B' }}>
                      {latestRun.status === 'success' ? 'Passed' : 'Failed'}
                    </div>
                    <div style={{ fontSize: '11px', color: latestRun.status === 'success' ? '#16A34A' : '#B91C1C', marginTop: '2px' }}>
                      {formatDate(latestRun.created_at)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                  {[
                    { label: 'Published', value: latestRun.published_records ?? 0, color: '#0F172A' },
                    { label: 'Blocked',   value: latestRun.blocked_records   ?? 0, color: '#DC2626' },
                    { label: 'Total',     value: latestRun.total_records_processed ?? 0, color: '#0F172A' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div style={{ fontWeight: '700', fontSize: '17px', color }}>{value}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Tips */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', marginBottom: '12px' }}>Quick Tips</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { Icon: AlertCircle,   color: '#DC2626', text: 'Critical issues block publishing' },
                { Icon: AlertTriangle, color: '#D97706', text: "Warnings don't block publishing" },
                { Icon: Info,          color: '#2563EB', text: 'Info items are recommendations' },
              ].map(({ Icon, color, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: '#475569' }}>
                  <Icon size={14} color={color} style={{ flexShrink: 0 }} />
                  {text}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
              <a href="/publish" style={{ fontSize: '13px', color: '#6D28D9', fontWeight: '600', textDecoration: 'none' }}>
                Learn more about validation →
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Validation;
