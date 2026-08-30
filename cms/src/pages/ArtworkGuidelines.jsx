import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const fetchSettings = async () => {
  const { data } = await axios.get('/api/admin/settings');
  return data;
};

const SPEC_LABELS = {
  poster: 'Poster',
  banner: 'Banner',
  thumbnail: 'Thumbnail',
};

const SPEC_DESCRIPTIONS = {
  poster: 'Show/episode cover art displayed in catalogues and search results. Portrait orientation.',
  banner: 'Wide banner image shown in featured/hero sections. Landscape orientation.',
  thumbnail: 'Small episode thumbnail shown in episode lists and grids. Landscape orientation.',
};

const SPEC_ENTITIES = {
  poster: 'Shows, Seasons, Episodes',
  banner: 'Shows, Episodes',
  thumbnail: 'Episodes',
};

const SpecCard = ({ specKey, spec }) => {
  const label = SPEC_LABELS[specKey] || specKey.charAt(0).toUpperCase() + specKey.slice(1);
  const description = SPEC_DESCRIPTIONS[specKey] || 'Artwork required for publishing.';
  const entities = SPEC_ENTITIES[specKey] || 'Shows, Episodes';
  const [w, h] = spec.target_px || [0, 0];

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ImageIcon size={20} />
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>{label}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{description}</div>
        </div>
      </div>
      <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Aspect Ratio</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>{spec.aspect}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Target Dimensions</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>{w} × {h} px</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Max File Size</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>{spec.max_kb} KB</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Used On</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>{entities}</div>
        </div>
      </div>
      <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Accepted Formats</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['JPEG', 'PNG', 'WEBP'].map(fmt => (
            <span key={fmt} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>{fmt}</span>
          ))}
        </div>
      </div>
      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: '1px' }} />
        <div style={{ fontSize: '12px', color: '#15803d', lineHeight: 1.5 }}>
          The backend enforces the aspect ratio (±10% tolerance) and file size limit on upload. Images outside these constraints are rejected with a 400 error.
        </div>
      </div>
    </div>
  );
};

const ArtworkGuidelines = () => {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const artworkSpecs = response?.system_info?.artwork_specs || {};
  const specKeys = Object.keys(artworkSpecs);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link
          to="/settings"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px' }}
        >
          <ArrowLeft size={14} />
          Back to Settings
        </Link>
        <div style={{ fontWeight: 800, fontSize: '28px', color: 'var(--navy-900)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
          Artwork Guidelines
        </div>
        <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
          Official PeBLo CMS artwork requirements for publishing. Specifications sourced from{' '}
          <code style={{ fontSize: '12px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>docs/challenge/reference.json</code>.
        </div>
      </div>

      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <Info size={18} style={{ color: '#2563eb', flexShrink: 0, marginTop: '1px' }} />
        <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.6 }}>
          <strong>Publishing requirement:</strong> Episodes must have artwork that passes validation before they can be included in the live catalogue. Artwork is validated on upload — invalid images are rejected immediately and never stored.
        </div>
      </div>

      <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '1px' }} />
        <div style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.6 }}>
          <strong>Season 0 (Trailers):</strong> Season 0 is reserved for trailers and is hidden from the viewer catalogue. Trailers appear under the show's <code style={{ fontSize: '12px', backgroundColor: '#fef3c7', padding: '1px 4px', borderRadius: '3px' }}>trailers</code> key in the catalogue, not in regular season episodes.
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading artwork specifications...</div>
      )}
      {error && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>Failed to load specifications: {error.message}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {specKeys.map(key => (
          <SpecCard key={key} specKey={key} spec={artworkSpecs[key]} />
        ))}
      </div>

      {!isLoading && !error && (
        <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Info size={18} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>Content Grouping & Language Variants</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>How multi-language episodes are handled in the catalogue.</div>
            </div>
          </div>
          <div style={{ height: '1px', backgroundColor: 'var(--border)', marginBottom: '16px' }} />
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Episodes sharing the same <strong style={{ color: 'var(--navy-900)' }}>content_group</strong> are language variants of the same episode.
            The publish pipeline collapses them into a <strong style={{ color: 'var(--navy-900)' }}>single catalogue entry</strong> with a <code style={{ fontSize: '12px', backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>languages</code> array.
            Duplicate content_group + language combinations in the same season are rejected by the backend.
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtworkGuidelines;
