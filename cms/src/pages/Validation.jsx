import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle, AlertTriangle, Info, CheckCircle, Play, Search, X,
  ChevronDown, ChevronLeft, ChevronRight, Eye, RefreshCw, Clock,
  Shield, BarChart2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────
const api = {
  report:  () => axios.get('/api/admin/validation-report').then(r => r.data),
  shows:   () => axios.get('/api/admin/shows').then(r => r.data),
  history: () => axios.get('/api/admin/publish-history').then(r => r.data),
  run:     () => axios.post('/api/admin/run-validation').then(r => r.data),
};

// ─────────────────────────────────────────────────────────────────
// Date utils
// ─────────────────────────────────────────────────────────────────
const relative = s => {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d)) return null;
  const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dy = Math.floor(h / 24);
  if (dy < 7) return `${dy}d ago`;
  return `${Math.floor(dy / 7)}w ago`;
};

const fmt = s => {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────
const SEV = {
  critical: { label: 'Critical', color: '#DC2626', light: '#FEF2F2', chart: '#EF4444', Icon: AlertCircle },
  warning:  { label: 'Warning',  color: '#D97706', light: '#FFFBEB', chart: '#F59E0B', Icon: AlertTriangle },
  info:     { label: 'Info',     color: '#2563EB', light: '#EFF6FF', chart: '#3B82F6', Icon: Info },
};

const BADGE = {
  Thumbnail:       { bg: '#F5F3FF', color: '#6D28D9' },
  Duration:        { bg: '#FEF3C7', color: '#92400E' },
  Section:         { bg: '#DBEAFE', color: '#1E40AF' },
  Synopsis:        { bg: '#DCFCE7', color: '#166534' },
  'Content Group': { bg: '#FDE8D8', color: '#9A3412' },
  Banner:          { bg: '#FCE7F3', color: '#9D174D' },
};
const badge = t => BADGE[t] || { bg: '#F1F5F9', color: '#475569' };

// ─────────────────────────────────────────────────────────────────
// SVG Donut Chart — no deps
// ─────────────────────────────────────────────────────────────────
const DonutChart = ({ critical = 0, warning = 0, info = 0 }) => {
  const total = critical + warning + info;
  if (total === 0) return (
    <div style={{ textAlign: 'center', padding: '14px 0' }}>
      <CheckCircle size={34} color="#16A34A" />
      <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500', marginTop: '6px' }}>No issues found</div>
    </div>
  );

  const CX = 54, CY = 54, R = 38, SW = 13;
  const CIRC = 2 * Math.PI * R;
  const GAP = 0.015;

  const segs = [
    { v: critical, c: '#EF4444' },
    { v: warning,  c: '#F59E0B' },
    { v: info,     c: '#3B82F6' },
  ].filter(s => s.v > 0);

  let cum = 0;
  const arcs = segs.map(({ v, c }, i) => {
    const frac = v / total;
    const dash = Math.max(0, frac * CIRC - GAP * CIRC);
    const off = CIRC - cum * CIRC;
    cum += frac;
    return (
      <circle key={i} cx={CX} cy={CY} r={R}
        fill="none" stroke={c} strokeWidth={SW}
        strokeDasharray={`${dash} ${CIRC - dash}`}
        strokeDashoffset={off} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px`, transition: 'stroke-dasharray 0.35s ease' }}
      />
    );
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', flexShrink: 0, width: 108, height: 108 }}>
        <svg width={108} height={108} viewBox={`0 0 ${CX*2} ${CY*2}`}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F1F5F9" strokeWidth={SW} />
          {arcs}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontWeight: '800', fontSize: '20px', color: '#0F172A', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Issues</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {[['Critical', critical, '#EF4444'], ['Warnings', warning, '#F59E0B'], ['Info', info, '#3B82F6']].map(([lbl, cnt, clr]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#475569' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: clr, display: 'inline-block' }} />
              {lbl}
            </span>
            <span style={{ fontWeight: '700', color: '#0F172A' }}>{cnt}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Pill dropdown
// ─────────────────────────────────────────────────────────────────
const PillDrop = ({ value, onChange, options, minW = '110px' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', minWidth: minW, flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', height: '36px', padding: '0 10px 0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '5px', background: open ? '#F5F3FF' : '#FFF', border: open ? '1px solid #A78BFA' : '1px solid #E2E8F0', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', color: open ? '#6D28D9' : '#475569', fontWeight: '500', whiteSpace: 'nowrap' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
        <ChevronDown size={13} color={open ? '#6D28D9' : '#94A3B8'} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.07)', zIndex: 300, padding: '4px', maxHeight: '240px', overflowY: 'auto' }}>
          {options.map(opt => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', background: value === opt ? '#F5F3FF' : 'transparent', color: value === opt ? '#6D28D9' : '#334155', fontWeight: value === opt ? '600' : '400' }}
              onMouseOver={e => { if (value !== opt) e.currentTarget.style.background = '#F8FAFC'; }}
              onMouseOut={e => { if (value !== opt) e.currentTarget.style.background = 'transparent'; }}
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
// Skeleton
// ─────────────────────────────────────────────────────────────────
const Sk = ({ w = '100%', h = '14px', r = '6px' }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#F1F5F9 25%,#E8EDF2 50%,#F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'sk 1.4s ease-in-out infinite' }} />
);

// ─────────────────────────────────────────────────────────────────
// Summary card
// ─────────────────────────────────────────────────────────────────
const Card = ({ Icon, value, label, sub, iColor, iBg, bColor }) => (
  <div style={{ flex: '1 1 0', minWidth: '136px', background: '#FFF', borderRadius: '14px', border: `1px solid ${bColor}`, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
    <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: iBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={18} color={iColor} />
    </div>
    <div>
      <div style={{ fontWeight: '800', fontSize: '24px', color: '#0F172A', lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontWeight: '600', fontSize: '12px', color: '#334155', marginTop: '3px' }}>{label}</div>
      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{sub}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Severity badge
// ─────────────────────────────────────────────────────────────────
const SevBadge = ({ sev }) => {
  const cfg = SEV[sev] || SEV.info;
  const { Icon } = cfg;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: cfg.color, fontWeight: '700', fontSize: '13px' }}>
      <Icon size={14} /> {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────
// Latest Run card content — reflects real-time validation executions
// ─────────────────────────────────────────────────────────────────
const LatestRunCard = ({ report, historyRun, loading }) => {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Sk h="52px" r="10px" /><Sk h="36px" r="8px" />
    </div>
  );

  const timestamp = report?.validated_at || historyRun?.created_at;
  const total = report?.total_records_processed ?? historyRun?.total_records_processed ?? 95;
  const blocked = report?.blocked_records_count ?? historyRun?.blocked_records ?? 0;
  const valid = report?.valid_records_count ?? historyRun?.published_records ?? (total - blocked);
  const isClean = blocked === 0;

  return (
    <>
      {/* Status banner */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '10px', 
        background: isClean ? '#F0FDF4' : '#FEF2F2', 
        border: `1px solid ${isClean ? '#BBF7D0' : '#FECACA'}`, 
        borderRadius: '10px', padding: '11px 14px', marginBottom: '14px' 
      }}>
        {isClean ? <CheckCircle size={18} color="#16A34A" /> : <AlertCircle size={18} color="#DC2626" />}
        <div>
          <div style={{ fontWeight: '700', fontSize: '13px', color: isClean ? '#15803D' : '#991B1B' }}>
            {isClean ? 'Validation Passed' : 'Validation Completed'}
          </div>
          <div style={{ fontSize: '11px', color: isClean ? '#16A34A' : '#B91C1C', marginTop: '1px' }}>
            {fmt(timestamp)}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
        {[
          { label: 'Valid',   value: valid,   color: '#15803D' },
          { label: 'Blocked', value: blocked, color: blocked > 0 ? '#DC2626' : '#64748B' },
          { label: 'Total',   value: total,   color: '#0F172A' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '8px 4px' }}>
            <div style={{ fontWeight: '800', fontSize: '18px', color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>{label}</div>
          </div>
        ))}
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────
const Validation = () => {
  const qc = useQueryClient();
  const nav = useNavigate();

  const [search,   setSearch]   = useState('');
  const [fShow,    setFShow]    = useState('All Shows');
  const [fStatus,  setFStatus]  = useState('All Status');
  const [fSev,     setFSev]     = useState('All Severity');
  const [page,     setPage]     = useState(1);
  const [perPage,  setPerPage]  = useState(10);
  const [toast,    setToast]    = useState(null);

  const flashToast = t => { setToast(t); setTimeout(() => setToast(null), 5000); };

  // Queries
  const { data: report, isLoading: rLoading, error: rError, refetch: rRefetch } =
    useQuery({ queryKey: ['valReport'], queryFn: api.report, staleTime: 30_000 });

  const { data: shows } =
    useQuery({ queryKey: ['adminShows'], queryFn: api.shows, staleTime: 60_000 });

  const { data: history, isLoading: hLoading } =
    useQuery({ queryKey: ['pubHistory'], queryFn: api.history, staleTime: 30_000 });

  // Run mutation
  const runMut = useMutation({
    mutationFn: api.run,
    onSuccess: data => {
      qc.setQueryData(['valReport'], data);
      qc.invalidateQueries(['pubHistory']);
      const n = data.total_issues;
      flashToast({ ok: true, msg: `Done — ${n} issue${n !== 1 ? 's' : ''} found.` });
    },
    onError: () => flashToast({ ok: false, msg: 'Validation failed. Try again.' }),
  });

  useEffect(() => setPage(1), [search, fShow, fStatus, fSev, perPage]);

  const showNames = useMemo(() =>
    shows ? [...new Set(shows.map(s => s.title))].sort() : [],
    [shows]
  );

  const allIssues = report?.issues || [];

  const filtered = useMemo(() => allIssues.filter(i => {
    const q = search.trim().toLowerCase();
    const mQ = !q || [i.issue_type, i.episode_title, i.show_title, i.description].some(f => f?.toLowerCase().includes(q));
    const mS = fShow    === 'All Shows'    || i.show_title === fShow;
    const mSt = fStatus === 'All Status'   || i.status     === fStatus.toLowerCase();
    const mSv = fSev    === 'All Severity' || i.severity   === fSev.toLowerCase();
    return mQ && mS && mSt && mSv;
  }), [allIssues, search, fShow, fStatus, fSev]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePg   = Math.min(page, totalPgs);
  const paged    = filtered.slice((safePg - 1) * perPage, safePg * perPage);
  const hasFilt  = search || fShow !== 'All Shows' || fStatus !== 'All Status' || fSev !== 'All Severity';
  const clearAll = () => { setSearch(''); setFShow('All Shows'); setFStatus('All Status'); setFSev('All Severity'); };

  const latestRunTimestamp = report?.validated_at || history?.[0]?.created_at;

  // Error state
  if (rError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center', gap: '12px' }}>
      <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={26} color="#DC2626" />
      </div>
      <div style={{ fontWeight: '700', fontSize: '16px', color: '#0F172A' }}>Unable to load validation results</div>
      <div style={{ color: '#94A3B8', fontSize: '14px' }}>There was a problem connecting to the server.</div>
      <button onClick={() => rRefetch()} style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px', background: '#4B27B5', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
        <RefreshCw size={14} /> Try Again
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes sk  { 0%,100%{background-position:200% 0} 50%{background-position:-200% 0} }
        @keyframes spin{ to{transform:rotate(360deg)} }
        @keyframes fin { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:none} }
        .vr-row:hover td { background:#FAFAFF !important; }
        .vr-act:hover { background:#F5F3FF !important; border-color:#C4B5FD !important; color:#6D28D9 !important; }
        .val-grid { display:grid; grid-template-columns:1fr 268px; gap:18px; align-items:start; }
        @media(max-width:1080px){ .val-grid { grid-template-columns:1fr; } }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 3px', fontSize: '26px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>Validation</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>Review and fix issues before publishing content.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {toast && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 13px', borderRadius: '10px', background: toast.ok ? '#DCFCE7' : '#FEF2F2', color: toast.ok ? '#15803D' : '#DC2626', fontSize: '13px', fontWeight: '600', animation: 'fin 0.2s ease' }}>
              {toast.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {toast.msg}
            </div>
          )}
          <button
            onClick={() => runMut.mutate()}
            disabled={runMut.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px', background: '#4B27B5', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: runMut.isPending ? 'not-allowed' : 'pointer', opacity: runMut.isPending ? 0.75 : 1, boxShadow: '0 4px 14px rgba(75,39,181,0.26)', whiteSpace: 'nowrap', transition: 'opacity 0.2s' }}
          >
            {runMut.isPending
              ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <Play size={14} fill="white" style={{ marginLeft: '1px' }} />}
            {runMut.isPending ? 'Running…' : 'Run Validation'}
          </button>
        </div>
      </div>

      {/* ── Two-column grid ─────────────────────────────────────── */}
      <div className="val-grid">

        {/* ════ LEFT ════ */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Summary cards */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {rLoading ? [1,2,3,4].map(i => (
              <div key={i} style={{ flex:'1 1 136px', background:'#FFF', borderRadius:'14px', border:'1px solid #E2E8F0', padding:'16px 18px', display:'flex', gap:'12px' }}>
                <Sk w="40px" h="40px" r="11px" />
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'6px' }}>
                  <Sk h="22px" w="48px" /><Sk h="12px" w="75%" /><Sk h="11px" w="55%" />
                </div>
              </div>
            )) : (
              <>
                <Card Icon={Shield}        value={report?.total_issues    ?? 0} label="Total Issues"    sub="Across all severities" iColor="#7C3AED" iBg="#F5F3FF" bColor="#EDE9FE" />
                <Card Icon={AlertCircle}   value={report?.critical_count  ?? 0} label="Critical Issues" sub="Must fix to publish"    iColor="#DC2626" iBg="#FEF2F2" bColor="#FECACA" />
                <Card Icon={AlertTriangle} value={report?.warning_count   ?? 0} label="Warnings"        sub="Should fix"            iColor="#D97706" iBg="#FFFBEB" bColor="#FDE68A" />
                <Card Icon={Info}          value={report?.info_count      ?? 0} label="Info"            sub="For your review"       iColor="#2563EB" iBg="#EFF6FF" bColor="#BFDBFE" />
              </>
            )}
          </div>

          {/* Filter bar */}
          <div style={{ background: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ flex: '1 1 170px', display: 'flex', alignItems: 'center', gap: '7px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '0 12px', height: '36px' }}>
              <Search size={13} color="#94A3B8" style={{ flexShrink: 0 }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search issues by title, episode, or show…"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#334155', width: '100%', fontFamily: 'inherit' }}
              />
              {search && <X size={13} color="#94A3B8" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setSearch('')} />}
            </div>
            <PillDrop value={fShow}   onChange={setFShow}   options={['All Shows',    ...showNames]}                          minW="120px" />
            <PillDrop value={fStatus} onChange={setFStatus} options={['All Status',   'Open', 'Resolved']}                   minW="104px" />
            <PillDrop value={fSev}    onChange={setFSev}    options={['All Severity', 'Critical', 'Warning', 'Info']}        minW="114px" />
            {hasFilt && (
              <button onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 13px', height: '36px', borderRadius: '20px', border: '1px solid #E2E8F0', background: '#FFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {/* Table card */}
          <div style={{ background: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            {rLoading ? (
              <div style={{ padding: '18px' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: '18px', alignItems: 'center' }}>
                    <Sk w="70px" h="17px" /><Sk w="26%" h="17px" /><Sk w="10%" h="17px" />
                    <Sk w="20%" h="17px" /><Sk w="7%" h="17px" /><Sk w="7%" h="17px" /><Sk w="28px" h="28px" r="7px" />
                  </div>
                ))}
              </div>
            ) : paged.length === 0 ? (
              /* Empty state */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 24px', textAlign: 'center' }}>
                {allIssues.length === 0 ? (
                  <>
                    <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                      <CheckCircle size={28} color="#16A34A" />
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#0F172A', marginBottom: '5px' }}>No validation issues found</div>
                    <div style={{ color: '#94A3B8', fontSize: '14px', maxWidth: '300px' }}>All content passes validation. Ready to publish.</div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <Search size={21} color="#94A3B8" />
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#0F172A', marginBottom: '5px' }}>No matching issues</div>
                    <div style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '12px' }}>Try adjusting your search or filters.</div>
                    <button onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#FFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      <X size={12} /> Clear Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
                  <thead>
                    <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
                      {[
                        { l: 'SEVERITY', w: '90px' },
                        { l: 'ISSUE' },
                        { l: 'CONTENT', w: '88px' },
                        { l: 'SHOW / EPISODE' },
                        { l: 'STATUS', w: '78px' },
                        { l: 'ADDED', w: '76px' },
                        { l: 'ACTIONS', w: '60px', c: true },
                      ].map(({ l, w, c }) => (
                        <th key={l} style={{ padding: '10px 13px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: c ? 'center' : 'left', whiteSpace: 'nowrap', width: w }}>
                          {l}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((issue, idx) => {
                      const isLast = idx === paged.length - 1;
                      const bc = badge(issue.content_type);
                      const bStyle = { borderBottom: isLast ? 'none' : '1px solid #F8FAFC' };
                      return (
                        <tr key={issue.id} className="vr-row">
                          <td style={{ padding: '12px 13px', ...bStyle }}><SevBadge sev={issue.severity} /></td>

                          <td style={{ padding: '12px 13px', maxWidth: '190px', ...bStyle }}>
                            <div style={{ fontWeight: '600', fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.issue_type}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.description}</div>
                          </td>

                          <td style={{ padding: '12px 13px', ...bStyle }}>
                            <span style={{ background: bc.bg, color: bc.color, padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                              {issue.content_type}
                            </span>
                          </td>

                          <td style={{ padding: '12px 13px', maxWidth: '170px', ...bStyle }}>
                            <div style={{ fontWeight: '600', fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.episode_title || '—'}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px', overflow: 'hidden' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.show_title}</span>
                              {issue.season_number != null && <>
                                <span style={{ flexShrink: 0 }}>·</span>
                                <span style={{ flexShrink: 0 }}>{issue.season_number === 0 ? 'Trailer' : `S${issue.season_number}`}</span>
                              </>}
                              {issue.language && <>
                                <span style={{ flexShrink: 0 }}>·</span>
                                <span style={{ textTransform: 'uppercase', flexShrink: 0 }}>{issue.language}</span>
                              </>}
                            </div>
                          </td>

                          <td style={{ padding: '12px 13px', ...bStyle }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', background: issue.status === 'resolved' ? '#DCFCE7' : '#FFF7ED', color: issue.status === 'resolved' ? '#16A34A' : '#EA580C' }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                              {issue.status === 'resolved' ? 'Resolved' : 'Open'}
                            </span>
                          </td>

                          <td style={{ padding: '12px 13px', fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap', ...bStyle }}>
                            {relative(issue.created_at) || '—'}
                          </td>

                          <td style={{ padding: '12px 13px', textAlign: 'center', ...bStyle }}>
                            <button
                              className="vr-act"
                              title="Go to episode"
                              onClick={() => issue.episode_id && nav(`/episodes/${issue.episode_id}/edit`)}
                              style={{ width: '29px', height: '29px', borderRadius: '7px', border: '1px solid #E2E8F0', background: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'all 0.15s' }}
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

            {/* Pagination */}
            {!rLoading && paged.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>
                  Showing <b>{(safePg - 1) * perPage + 1}</b>–<b>{Math.min(safePg * perPage, filtered.length)}</b> of <b>{filtered.length}</b>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePg === 1}
                    style={{ width: '29px', height: '29px', border: '1px solid #E2E8F0', borderRadius: '7px', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: safePg === 1 ? 'not-allowed' : 'pointer', opacity: safePg === 1 ? 0.4 : 1 }}>
                    <ChevronLeft size={13} />
                  </button>

                  {Array.from({ length: Math.min(totalPgs, 5) }, (_, i) => {
                    let p;
                    if (totalPgs <= 5) p = i + 1;
                    else if (safePg <= 3) p = i + 1;
                    else if (safePg >= totalPgs - 2) p = totalPgs - 4 + i;
                    else p = safePg - 2 + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        style={{ width: '29px', height: '29px', border: `1px solid ${safePg === p ? '#7C3AED' : '#E2E8F0'}`, borderRadius: '7px', background: safePg === p ? '#7C3AED' : '#FFF', color: safePg === p ? '#FFF' : '#475569', fontSize: '13px', fontWeight: safePg === p ? '700' : '400', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p}
                      </button>
                    );
                  })}

                  <button onClick={() => setPage(p => Math.min(totalPgs, p + 1))} disabled={safePg === totalPgs}
                    style={{ width: '29px', height: '29px', border: '1px solid #E2E8F0', borderRadius: '7px', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: safePg === totalPgs ? 'not-allowed' : 'pointer', opacity: safePg === totalPgs ? 0.4 : 1 }}>
                    <ChevronRight size={13} />
                  </button>

                  <div style={{ marginLeft: '6px' }}>
                    <PillDrop
                      value={`${perPage} / page`}
                      onChange={v => setPerPage(parseInt(v))}
                      options={['10 / page', '25 / page', '50 / page']}
                      minW="96px"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Issues by Severity */}
          <div style={{ background: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', marginBottom: '13px' }}>Issues by Severity</div>
            {rLoading ? (
              <div style={{ display: 'flex', gap: '13px', alignItems: 'center' }}>
                <Sk w="108px" h="108px" r="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  <Sk h="13px" /><Sk h="13px" /><Sk h="13px" />
                </div>
              </div>
            ) : (
              <DonutChart
                critical={report?.critical_count ?? 0}
                warning={report?.warning_count  ?? 0}
                info={report?.info_count     ?? 0}
              />
            )}
          </div>

          {/* Blocked from Publishing */}
          <div style={{ background: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', marginBottom: '5px' }}>Blocked from Publishing</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '12px', lineHeight: 1.4 }}>Fix all critical issues before publishing.</div>
            {rLoading ? <Sk h="54px" r="10px" /> : (report?.critical_count ?? 0) > 0 ? (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '11px', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: '13px' }}>
                <span style={{ fontWeight: '800', fontSize: '26px', color: '#DC2626', lineHeight: 1, flexShrink: 0 }}>{report.critical_count}</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#991B1B' }}>Critical Issues</div>
                  <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '2px' }}>Must be resolved</div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '11px', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="#16A34A" />
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#15803D' }}>Ready to publish</div>
                  <div style={{ fontSize: '12px', color: '#16A34A', marginTop: '2px' }}>No critical issues blocking</div>
                </div>
              </div>
            )}
          </div>

          {/* Latest Run */}
          <div style={{ background: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', marginBottom: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Latest Run</span>
              {latestRunTimestamp && (
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '400' }}>
                  {relative(latestRunTimestamp)}
                </span>
              )}
            </div>
            <LatestRunCard report={report} historyRun={history?.[0]} loading={rLoading || hLoading} />
          </div>

        </div>
      </div>
    </>
  );
};

export default Validation;
