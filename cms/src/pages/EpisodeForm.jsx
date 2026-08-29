import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ChevronDown, Check, Image as ImageIcon, UploadCloud, AlertCircle, Info, Lock, Save, Clock, CheckSquare, Lightbulb } from 'lucide-react';

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' }
];

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

  const selectedOption = options.find(opt => (opt.value || opt) === value);
  const displayValue = selectedOption ? (selectedOption.label || selectedOption) : placeholder;

  return (
    <div className="form-group" ref={ref}>
      {label && (
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
          {label} <span style={{ color: '#DC2626' }}>*</span>
        </label>
      )}
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
          {displayValue}
          <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
        
        {isOpen && (
          <div className="custom-scrollbar" style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', 
            borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 100, padding: '6px', maxHeight: '180px', overflowY: 'auto'
          }}>
            {options.map(opt => {
              const optValue = opt.value || opt;
              const optLabel = opt.label || opt;
              return (
                <div 
                  key={optValue}
                  onClick={() => { onChange(optValue); setIsOpen(false); }}
                  style={{
                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: value === optValue ? '#F5F3FF' : 'transparent', color: value === optValue ? 'var(--purple-700)' : 'var(--navy-900)',
                    fontSize: '14px', fontWeight: value === optValue ? '500' : '400', transition: 'background-color 0.1s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = value === optValue ? '#F5F3FF' : '#F8FAFC'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = value === optValue ? '#F5F3FF' : 'transparent'}
                >
                  {optLabel}
                  {value === optValue && <Check size={16} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {helperText && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>{helperText}</div>}
    </div>
  );
};

// Component for individual artwork slots
const ArtworkUploadCard = ({ type, aspectText, width, height, maxKb, entityId, existingArtwork, onUploadSuccess, isDisabled }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const currentArt = existingArtwork?.[type.toLowerCase()];

  const handleFileChange = async (e) => {
    if (isDisabled) return;
    const file = e.target.files[0];
    if (!file) return;
    
    setError('');
    
    if (file.size > maxKb * 1024) {
      setError(`File exceeds maximum size of ${maxKb}KB`);
      return;
    }

    const formData = new FormData();
    formData.append('entity_type', 'episode');
    formData.append('entity_id', entityId);
    formData.append('type', type.toLowerCase());
    formData.append('file', file);

    setIsUploading(true);
    try {
      await axios.post('/api/admin/artwork', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const previewWidth = type === 'Poster' ? '72px' : '112px';
  const previewHeight = type === 'Poster' ? '108px' : '63px';

  return (
    <div style={{ 
      display: 'flex', padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', 
      borderRadius: '12px', marginBottom: '16px', gap: '16px', transition: 'border-color 0.2s' 
    }}>
      <div style={{ 
        width: previewWidth, 
        height: previewHeight, 
        backgroundColor: '#F8FAFC', borderRadius: '8px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed #CBD5E1', flexShrink: 0,
        position: 'relative'
      }}>
        {currentArt ? (
          <img src={currentArt.url} alt={type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8' }}>
            <ImageIcon size={type === 'Poster' ? 20 : 18} style={{ marginBottom: type === 'Poster' ? '6px' : '2px' }} />
            <span style={{ fontSize: '11px', fontWeight: '600' }}>{aspectText}</span>
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <div style={{ fontWeight: '600', color: 'var(--navy-900)', fontSize: '14px', marginBottom: '4px' }}>
          {type} <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '13px' }}>({aspectText}) <span style={{color: '#DC2626'}}>*</span></span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          {width} × {height} px • Max {maxKb} KB<br/>
          {type === 'Thumbnail' && 'Used in episode lists and rows.'}
          {type === 'Banner' && 'Displayed on episode detail page.'}
          {type === 'Poster' && 'Best for episode detail and sharing.'}
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


const EpisodeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    show_id: '',
    season_id: '',
    episode_title: '',
    content_group: '',
    language: 'en',
    duration_seconds: '',
    status: 'draft'
  });
  
  const [durationInput, setDurationInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Queries
  const { data: shows } = useQuery({
    queryKey: ['shows'],
    queryFn: async () => {
      const { data } = await axios.get('/api/admin/shows');
      return data;
    }
  });

  const { data: episode, isLoading, refetch: refetchEpisode } = useQuery({
    queryKey: ['episode', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/admin/episodes/${id}`);
      return data;
    },
    enabled: isEditMode
  });

  // Calculate Dropdown Options
  const showOptions = useMemo(() => {
    if (!shows) return [];
    return shows.map(s => ({ label: s.title, value: s.id }));
  }, [shows]);

  const seasonOptions = useMemo(() => {
    if (!shows || !formData.show_id) return [];
    const show = shows.find(s => s.id === formData.show_id);
    if (!show || !show.seasons) return [];
    const sorted = [...show.seasons].sort((a, b) => a.season_number - b.season_number);
    return sorted.map(s => ({ label: `Season ${s.season_number}`, value: s.id }));
  }, [shows, formData.show_id]);

  // Load Initial Data
  useEffect(() => {
    if (episode && shows) {
      let foundShowId = '';
      for (const show of shows) {
        if (show.seasons && show.seasons.some(s => s.id === episode.season_id)) {
          foundShowId = show.id;
          break;
        }
      }
      
      setFormData({
        show_id: foundShowId,
        season_id: episode.season_id || '',
        episode_title: episode.episode_title || '',
        content_group: episode.content_group || '',
        language: episode.language || 'en',
        duration_seconds: episode.duration_seconds || '',
        status: episode.status || 'draft'
      });
      
      if (episode.duration_seconds) {
        const m = Math.floor(episode.duration_seconds / 60).toString().padStart(2, '0');
        const s = (episode.duration_seconds % 60).toString().padStart(2, '0');
        setDurationInput(`${m}:${s}`);
      }

      setIsDirty(false);
    }
  }, [episode, shows]);

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
  const createMutation = useMutation({
    mutationFn: (data) => axios.post('/api/admin/episodes', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['shows']);
      queryClient.invalidateQueries(['episodes']);
      queryClient.invalidateQueries(['validationReport']);
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
      queryClient.invalidateQueries(['episodes']);
      queryClient.invalidateQueries(['episode', id]);
      queryClient.invalidateQueries(['validationReport']);
      setIsDirty(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  });

  const handleChange = (field, value) => {
    // If show changes, reset season
    if (field === 'show_id') {
      setFormData(prev => ({ ...prev, show_id: value, season_id: '' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    setIsDirty(true);
    setIsSaved(false);
  };

  const handleDurationChange = (e) => {
    setDurationInput(e.target.value);
    setIsDirty(true);
    setIsSaved(false);
  };

  const handleDurationBlur = () => {
    const parts = durationInput.split(':');
    let totalSeconds = 0;
    if (parts.length === 2) {
      totalSeconds = parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
    } else {
      totalSeconds = parseInt(durationInput || '0', 10);
    }
    
    handleChange('duration_seconds', totalSeconds);
    
    if (totalSeconds > 0) {
      const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const s = (totalSeconds % 60).toString().padStart(2, '0');
      setDurationInput(`${m}:${s}`);
    } else {
      setDurationInput('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.season_id || !formData.episode_title || !formData.content_group) return;
    
    const submissionData = {
      season_id: formData.season_id,
      episode_title: formData.episode_title,
      content_group: formData.content_group,
      language: formData.language,
      status: formData.status
    };

    if (formData.duration_seconds) {
      submissionData.duration_seconds = parseInt(formData.duration_seconds, 10);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--purple-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='var(--navy-900)'} onMouseOut={e => e.target.style.color='var(--text-muted)'} onClick={() => navigate('/episodes')}>Episodes</span>
            <span style={{ color: 'var(--purple-300)' }}>&gt;</span>
            <span style={{ color: 'var(--purple-700)' }}>{isEditMode ? 'Edit Episode' : 'Create New Episode'}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => {
                if (isDirty && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
                navigate('/episodes');
              }}
              className="btn btn-outline" style={{ height: '40px', padding: '0 20px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', backgroundColor: '#FFFFFF', color: 'var(--navy-900)', border: '1px solid #CBD5E1' }}>
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSaving || !formData.season_id || !formData.episode_title || !formData.content_group}
              className="btn btn-primary" style={{ height: '40px', padding: '0 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--purple-600)', color: '#FFFFFF', border: 'none' }}>
              {isSaving && <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', animation: 'spin 1s linear infinite' }}/>}
              {!isSaving && isSaved ? <Check size={16} /> : (!isSaving && <Save size={16} />)}
              {isSaving ? 'Saving...' : isSaved ? 'Saved' : isEditMode ? 'Save Changes' : 'Create Episode'}
              {!isSaving && !isSaved && <ChevronDown size={16} style={{ marginLeft: '4px' }} />}
            </button>
          </div>
        </div>
        
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--navy-900)', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            {isEditMode ? 'Edit Episode' : 'Create New Episode'}
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {isEditMode ? "Update the episode's information and artwork. All fields marked with * are required." : "Add a new episode to the show. All fields marked with * are required."}
          </div>
        </div>
      </div>
      
      {saveError && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          {saveError.response?.data?.detail || 'An error occurred while saving.'}
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="show-form-layout">
        
        {/* LEFT COLUMN: Basic Info */}
        <div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <Info size={18} color="var(--purple-700)" />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--navy-900)', margin: 0 }}>
                Episode Information
              </h2>
            </div>
            
            {/* ROW 1: 3-Column Grid, but 3rd column is intentionally blank as requested since it's unsupported */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
              <CustomDropdown 
                label="Show"
                placeholder="Select show"
                value={formData.show_id}
                options={showOptions}
                onChange={val => handleChange('show_id', val)}
                helperText="Choose the show this episode belongs to."
              />
              <CustomDropdown 
                label="Season"
                placeholder={formData.show_id ? "Select season" : "Select show first"}
                value={formData.season_id}
                options={seasonOptions}
                onChange={val => handleChange('season_id', val)}
                helperText="Select season if this episode is part of a series."
              />
              <div style={{ display: 'none' }} className="responsive-spacer"></div>
            </div>

            {/* ROW 2: Episode Title */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Episode Title <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  value={formData.episode_title} 
                  onChange={e => handleChange('episode_title', e.target.value)}
                  placeholder="Enter episode title"
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Enter a clear and engaging title for the episode.</div>
              </div>
            </div>

            {/* ROW 3: Content Group, Language, Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Content Group <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <CustomDropdown 
                  label={null}
                  placeholder="Select content group"
                  value={formData.content_group}
                  options={[
                    {label: 'motis-many-lives-s01e01', value: 'motis-many-lives-s01e01'},
                    {label: 'motis-many-lives-s01e02', value: 'motis-many-lives-s01e02'},
                    {label: 'unspecified', value: 'unspecified'}
                  ]}
                  onChange={val => handleChange('content_group', val)}
                  helperText="Episodes with the same content group are language variants of the same episode."
                />
              </div>

              <CustomDropdown 
                label="Primary Language"
                placeholder="Select language"
                value={formData.language}
                options={LANGUAGES}
                onChange={val => handleChange('language', val)}
                helperText="Default audio track language."
              />

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Duration <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="form-control"
                    value={durationInput}
                    onChange={handleDurationChange}
                    onBlur={handleDurationBlur}
                    placeholder="MM:SS"
                  />
                  <Clock size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '12px' }} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Episode duration (e.g. 12:30).
                </div>
              </div>
            </div>

            {/* ROW 4: Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Status <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '4px', height: '40px', border: '1px solid #CBD5E1' }}>
                  {[ {label: 'Draft', value: 'draft'}, {label: 'Published', value: 'published'}].map(s => (
                    <div 
                      key={s.value}
                      onClick={() => handleChange('status', s.value)}
                      style={{ 
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer', 
                        backgroundColor: formData.status === s.value ? (s.value === 'draft' ? '#FFEDD5' : '#F5F3FF') : 'transparent', 
                        color: formData.status === s.value ? (s.value === 'draft' ? '#C2410C' : 'var(--purple-700)') : 'var(--navy-900)',
                        boxShadow: formData.status === s.value ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                      }}>
                      {s.value === 'draft' && formData.status === s.value ? <span style={{marginRight: '6px', color: '#F97316'}}>●</span> : null} 
                      {s.label}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Only published episodes are visible to viewers.</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Episode Artwork Card */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ImageIcon size={18} color="var(--purple-700)" />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--navy-900)', margin: 0 }}>
                Episode Artwork
              </h2>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
              Upload images that represent this episode.<br/>Images are required for publishing.
            </div>

            <div>
              <ArtworkUploadCard 
                type="Thumbnail" aspectText="16:9" width="640" height="360" maxKb="200" 
                entityId={id} existingArtwork={artworkMap} onUploadSuccess={refetchEpisode} isDisabled={!isEditMode}
              />
              <ArtworkUploadCard 
                type="Banner" aspectText="16:9" width="1280" height="720" maxKb="200" 
                entityId={id} existingArtwork={artworkMap} onUploadSuccess={refetchEpisode} isDisabled={!isEditMode}
              />
              <ArtworkUploadCard 
                type="Poster" aspectText="2:3" width="600" height="900" maxKb="200" 
                entityId={id} existingArtwork={artworkMap} onUploadSuccess={refetchEpisode} isDisabled={!isEditMode}
              />
            </div>
          </div>
          
          {/* Artwork Guidelines Card */}
          <div style={{ padding: '20px', backgroundColor: '#F5F3FF', border: '1px solid #E0E7FF', borderRadius: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Info size={18} color="var(--purple-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: '700', color: 'var(--purple-800)', fontSize: '14px', marginBottom: '6px' }}>
                  Artwork Guidelines
                </div>
                <div style={{ fontSize: '13px', color: 'var(--purple-700)', opacity: 0.85, lineHeight: '1.5', marginBottom: '12px' }}>
                  Ensure images meet the size, aspect ratio and file size requirements.
                </div>
                <a href="#" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--purple-700)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View Artwork Specification <span style={{ fontSize: '16px', lineHeight: 1 }}>→</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Tips Card */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Lightbulb size={18} color="var(--purple-700)" />
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy-900)', margin: 0 }}>
                Quick Tips
              </h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#F5F3FF', color: 'var(--purple-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckSquare size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy-900)', marginBottom: '2px' }}>Use clear titles</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Keep episode titles short and engaging</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy-900)', marginBottom: '2px' }}>Add accurate duration</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Helps viewers know what to expect</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckSquare size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy-900)', marginBottom: '2px' }}>Choose correct content group</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ensures proper categorization and discovery</div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default EpisodeForm;
