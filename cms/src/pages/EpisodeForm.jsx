import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft, ChevronDown, Check, Image as ImageIcon, UploadCloud, AlertCircle, Lock, Save } from 'lucide-react';

const CONTENT_GROUPS = ['Series', 'Minisodes', 'Songs', 'Shorts'];
const LANGUAGES = ['EN', 'HI'];
const STATUSES = ['draft', 'published'];

// Custom Dropdown Component
const CustomDropdown = ({ value, options, onChange, label, placeholder, helperText }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="form-group" ref={ref}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
        {label} <span style={{ color: '#DC2626' }}>*</span>
      </label>
      <div style={{ position: 'relative' }}>
        <div 
          className="form-control"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px var(--purple-50)' : 'none', borderColor: isOpen ? 'var(--purple-500)' : undefined,
          color: value ? 'var(--navy-900)' : 'var(--text-muted)'
        }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen);
          if (e.key === 'Escape') setIsOpen(false);
        }}
      >
        {value || placeholder}
        <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      
      {isOpen && (
        <div className="custom-scrollbar" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', 
          borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 100, padding: '6px', maxHeight: '180px', overflowY: 'auto'
        }}>
          {options.map(opt => (
            <div 
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              style={{
                padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: value === opt ? '#F5F3FF' : 'transparent', color: value === opt ? 'var(--purple-700)' : 'var(--navy-900)',
                fontSize: '14px', fontWeight: value === opt ? '500' : '400', transition: 'background-color 0.1s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = value === opt ? '#F5F3FF' : '#F8FAFC'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = value === opt ? '#F5F3FF' : 'transparent'}
            >
              {opt}
              {value === opt && <Check size={16} />}
            </div>
          ))}
        </div>
      )}
      </div>
      {helperText && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>{helperText}</div>}
    </div>
  );
};

// Component for individual artwork slots
const ArtworkUploadCard = ({ type, aspectText, width, height, maxKb, episodeId, existingArtwork, onUploadSuccess, isDisabled }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const currentArt = existingArtwork?.[type.toLowerCase()];

  const handleFileChange = async (e) => {
    if (isDisabled) return;
    const file = e.target.files[0];
    if (!file) return;
    
    setError('');
    
    // File size check (client-side)
    if (file.size > maxKb * 1024) {
      setError(`File exceeds maximum size of ${maxKb}KB`);
      return;
    }

    // Upload
    const formData = new FormData();
    formData.append('entity_type', 'episode');
    formData.append('entity_id', episodeId);
    formData.append('type', type.toLowerCase());
    formData.append('file', file);

    setIsUploading(true);
    try {
      await axios.post('/api/admin/artwork', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploadSuccess(); // Trigger refetch
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ 
      display: 'flex', padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', 
      borderRadius: '12px', marginBottom: '16px', gap: '16px', transition: 'border-color 0.2s' 
    }}>
      {/* Left Box (Preview) */}
      <div style={{ 
        width: '112px', 
        height: '63px', 
        backgroundColor: '#F8FAFC', borderRadius: '8px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed #CBD5E1', flexShrink: 0,
        position: 'relative'
      }}>
        {currentArt ? (
          <img src={`http://127.0.0.1:8000/content${currentArt.url}`} alt={type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8' }}>
            <ImageIcon size={18} style={{ marginBottom: '2px' }} />
            <span style={{ fontSize: '11px', fontWeight: '600' }}>{aspectText}</span>
          </div>
        )}
      </div>
      
      {/* Right Details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <div style={{ fontWeight: '600', color: 'var(--navy-900)', fontSize: '14px', marginBottom: '4px' }}>
          {type} <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '13px' }}>({aspectText})</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          {width} × {height} px • Max {maxKb} KB
        </div>
        
        {error && <div style={{ color: '#DC2626', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14}/> {error}</div>}
        
        <div style={{ marginTop: 'auto' }}>
          <button 
            type="button"
            onClick={() => !isDisabled && fileInputRef.current?.click()}
            disabled={isUploading || isDisabled}
            className="btn btn-outline" style={{ height: '32px', borderRadius: '6px', padding: '0 12px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.6 : 1, width: 'fit-content' }}>
            {isUploading ? <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--navy-200)', borderTopColor: 'var(--navy-600)', animation: 'spin 1s linear infinite' }}/> : <UploadCloud size={14} />}
            {isUploading ? 'Uploading...' : currentArt ? 'Replace Image' : 'Upload Image'}
          </button>
          
          {isDisabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px', color: 'var(--purple-700)', fontSize: '11px', fontWeight: '600' }}>
              <Lock size={12} /> Save episode to enable uploads
            </div>
          )}

          {!isDisabled && (
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// MAIN PAGE COMPONENT
const EpisodeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    season_id: '',
    episode_title: '',
    status: 'draft',
    duration_seconds: '',
    language: 'EN',
    content_group: 'Series'
  });
  
  const [isDirty, setIsDirty] = useState(false);

  const { data: shows } = useQuery({
    queryKey: ['shows'],
    queryFn: async () => {
      const { data } = await axios.get('/api/admin/shows');
      return data;
    }
  });

  const showSeasonOptions = useMemo(() => {
    if (!shows) return [];
    const opts = [];
    shows.forEach(show => {
      show.seasons?.forEach(season => {
        opts.push({
          id: season.id,
          label: `${show.title} - Season ${season.season_number}`
        });
      });
    });
    return opts;
  }, [shows]);

  const showSeasonLabels = showSeasonOptions.map(opt => opt.label);
  const selectedSeasonLabel = showSeasonOptions.find(opt => opt.id === formData.season_id)?.label || '';
  
  // Fetch episode if edit mode
  const { data: episode, isLoading, refetch: refetchEpisode } = useQuery({
    queryKey: ['episode', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/admin/episodes/${id}`);
      return data;
    },
    enabled: isEditMode
  });

  useEffect(() => {
    if (episode) {
      setFormData({
        season_id: episode.season_id || '',
        episode_title: episode.episode_title || '',
        status: episode.status || 'draft',
        duration_seconds: episode.duration_seconds || '',
        language: episode.language || 'EN',
        content_group: episode.content_group || 'Series'
      });
      setIsDirty(false);
    }
  }, [episode]);

  // Handle Unsaved Changes Warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Mutations
  const [isSaved, setIsSaved] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => axios.post('/api/admin/episodes', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['shows']);
      setIsDirty(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      navigate(`/episodes/${res.data.id}/edit`, { replace: true });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => axios.put(`/api/admin/episodes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shows']);
      queryClient.invalidateQueries(['episode', id]);
      setIsDirty(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setIsSaved(false);
  };

  const handleSeasonChange = (label) => {
    const opt = showSeasonOptions.find(o => o.label === label);
    if (opt) {
      handleChange('season_id', opt.id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.season_id || !formData.episode_title || !formData.content_group) return;
    
    // Transform duration to integer if provided
    const submissionData = { ...formData };
    if (submissionData.duration_seconds) {
      submissionData.duration_seconds = parseInt(submissionData.duration_seconds, 10);
    } else {
      submissionData.duration_seconds = null;
    }
    
    if (isEditMode) {
      updateMutation.mutate(submissionData);
    } else {
      createMutation.mutate(submissionData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  const artworkMap = {};
  if (episode?.artwork) {
    episode.artwork.forEach(art => {
      artworkMap[art.type] = art;
    });
  }

  if (isEditMode && isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--purple-600)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        Loading episode data...
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .form-section { background-color: #FFFFFF; border-radius: 16px; padding: 24px; border: 1px solid #E2E8F0; margin-bottom: 24px; }
        .form-section-title { font-size: 16px; font-weight: 700; color: var(--navy-900); margin: 0 0 4px 0; }
        .form-section-desc { font-size: 13px; color: var(--text-muted); margin: 0 0 24px 0; }
        .form-group { margin-bottom: 20px; }
        .form-row { display: flex; gap: 24px; margin-bottom: 20px; }
        .form-row > * { flex: 1; }
        .form-control { width: 100%; padding: 10px 16px; border-radius: 10px; border: 1px solid #E2E8F0; font-size: 14px; outline: none; transition: all 0.2s; color: var(--navy-900); }
        .form-control:focus { border-color: var(--purple-500); box-shadow: 0 0 0 3px var(--purple-50); }
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => {
              if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) return;
              navigate('/episodes');
            }}
            style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer', color: 'var(--navy-900)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--navy-900)', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
              {isEditMode ? 'Edit Episode' : 'Create New Episode'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>{isEditMode ? episode?.episode_title : 'Enter episode details below'}</span>
              {isDirty && (
                <>
                  <span style={{ color: '#CBD5E1' }}>•</span>
                  <span style={{ color: '#D97706', fontWeight: '600' }}>Unsaved changes</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button"
            onClick={() => navigate('/episodes')}
            className="btn btn-outline" style={{ height: '40px', padding: '0 20px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: 'var(--navy-900)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || !formData.season_id || !formData.episode_title || !formData.content_group}
            className="btn btn-primary" style={{ height: '40px', padding: '0 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: isSaved ? '#16A34A' : 'var(--purple-700)', color: '#FFFFFF', border: 'none', cursor: (isSaving || !formData.season_id || !formData.episode_title || !formData.content_group) ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', opacity: (isSaving || !formData.season_id || !formData.episode_title || !formData.content_group) ? 0.7 : 1 }}>
            {isSaving ? (
              <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 1s linear infinite' }}/> Saving...</>
            ) : isSaved ? (
              <><Check size={16} /> Saved!</>
            ) : (
              <><Save size={16} /> Save Episode</>
            )}
          </button>
        </div>
      </div>

      {saveError && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontSize: '14px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          {saveError.response?.data?.detail || 'An error occurred while saving. Please try again.'}
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* LEFT COLUMN - MAIN DETAILS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="form-section">
            <h2 className="form-section-title">Core Information</h2>
            <p className="form-section-desc">The primary details that identify this episode.</p>
            
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Episode Title <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.episode_title}
                  onChange={(e) => handleChange('episode_title', e.target.value)}
                  className="form-control"
                  placeholder="e.g. The Big Adventure"
                />
              </div>
              <div style={{ flex: 1 }}>
                <CustomDropdown
                  label="Show & Season"
                  value={selectedSeasonLabel}
                  onChange={handleSeasonChange}
                  options={showSeasonLabels}
                  placeholder="Select Show & Season..."
                />
              </div>
            </div>

            <div className="form-row">
              <div style={{ flex: 1 }}>
                <CustomDropdown
                  label="Content Group"
                  value={formData.content_group}
                  onChange={(v) => handleChange('content_group', v)}
                  options={CONTENT_GROUPS}
                  placeholder="Select group..."
                />
              </div>
              <div style={{ flex: 1 }}>
                <CustomDropdown
                  label="Language"
                  value={formData.language}
                  onChange={(v) => handleChange('language', v)}
                  options={LANGUAGES}
                  placeholder="Select language..."
                />
              </div>
            </div>
            
            <div className="form-row" style={{ marginBottom: 0 }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Duration (Seconds)
                </label>
                <input 
                  type="number" 
                  value={formData.duration_seconds}
                  onChange={(e) => handleChange('duration_seconds', e.target.value)}
                  className="form-control"
                  placeholder="e.g. 120"
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  {formData.duration_seconds ? `${Math.floor(formData.duration_seconds / 60)}m ${formData.duration_seconds % 60}s` : 'Optional duration in seconds'}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <CustomDropdown
                  label="Status"
                  value={formData.status}
                  onChange={(v) => handleChange('status', v)}
                  options={STATUSES}
                  placeholder="Select status..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - MEDIA */}
        <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="form-section">
            <h2 className="form-section-title">Artwork</h2>
            <p className="form-section-desc">Visual assets for this episode.</p>
            
            <ArtworkUploadCard 
              type="Thumbnail"
              aspectText="16:9"
              width="1920"
              height="1080"
              maxKb="200"
              episodeId={id}
              existingArtwork={artworkMap}
              onUploadSuccess={refetchEpisode}
              isDisabled={!isEditMode}
            />
            
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default EpisodeForm;
