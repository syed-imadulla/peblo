import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft, ChevronDown, Check, X, Image as ImageIcon, UploadCloud, AlertCircle, Info, Lock, Save, Clock, Globe, MapPin, Edit3, Target, Type } from 'lucide-react';

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' }
];

// Custom Dropdown Component
const CustomDropdown = ({ value, options, onChange, label, placeholder, helperText, required = true, disabled = false }) => {
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
  const isActuallyDisabled = disabled || options.length === 0;

  return (
    <div className="form-group" ref={ref}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <div 
          className="form-control"
          onClick={() => !isActuallyDisabled && setIsOpen(!isOpen)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            cursor: isActuallyDisabled ? 'not-allowed' : 'pointer',
            backgroundColor: isActuallyDisabled ? '#F8FAFC' : '#FFFFFF',
            boxShadow: isOpen ? '0 0 0 3px var(--purple-50)' : 'none', borderColor: isOpen ? 'var(--purple-500)' : undefined,
            color: value ? 'var(--navy-900)' : 'var(--text-muted)'
          }}
          tabIndex={isActuallyDisabled ? -1 : 0}
          onKeyDown={(e) => {
            if (isActuallyDisabled) return;
            if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen);
            if (e.key === 'Escape') setIsOpen(false);
          }}
        >
          {displayValue}
          <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: isActuallyDisabled ? 0.5 : 1 }} />
        </div>
        
        {isOpen && !isActuallyDisabled && (
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


const EpisodeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    show_id: '',
    season_id: '',
    episode_number: '',
    episode_title: '',
    slug: '',
    synopsis: '',
    content_group: '',
    language: 'en',
    duration: '',
    status: 'draft',
    availability: 'All Regions'
  });
  
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
      
      // Format duration_seconds to MM:SS
      let formattedDuration = '';
      if (episode.duration_seconds != null) {
        const m = Math.floor(episode.duration_seconds / 60).toString().padStart(2, '0');
        const s = (episode.duration_seconds % 60).toString().padStart(2, '0');
        formattedDuration = `${m}:${s}`;
      }

      setFormData({
        show_id: foundShowId,
        season_id: episode.season_id || '',
        episode_number: episode.episode_number || '', // Local only
        episode_title: episode.episode_title || '',
        slug: episode.slug || '', // Local only
        synopsis: episode.synopsis || '', // Local only
        content_group: episode.content_group || '',
        language: episode.language || 'en',
        duration: formattedDuration,
        status: episode.status || 'draft',
        availability: episode.availability || 'All Regions' // Local only
      });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.season_id || !formData.episode_title || !formData.content_group) return;
    
    // Parse MM:SS to seconds
    let parsedSeconds = null;
    if (formData.duration) {
      const parts = formData.duration.split(':');
      if (parts.length === 2) {
        parsedSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      } else {
        parsedSeconds = parseInt(formData.duration, 10);
      }
    }

    const submissionData = {
      season_id: formData.season_id,
      episode_title: formData.episode_title,
      slug: formData.slug || `${formData.content_group}-${formData.language}`,
      episode_number: formData.episode_number ? parseInt(formData.episode_number, 10) : null,
      synopsis: formData.synopsis || null,
      content_group: formData.content_group,
      language: formData.language,
      status: formData.status,
      duration_seconds: isNaN(parsedSeconds) ? null : parsedSeconds
    };
    
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
              className="btn btn-primary" style={{ height: '40px', padding: '0 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--purple-500)', color: '#FFFFFF', border: 'none' }}>
              {isSaving && <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', animation: 'spin 1s linear infinite' }}/>}
              {!isSaving && isSaved ? <Check size={16} /> : (!isSaving && <Save size={16} />)}
              {isSaving ? 'Saving...' : isSaved ? 'Saved' : isEditMode ? 'Save Episode' : 'Create Episode'}
            </button>
          </div>
        </div>
        
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--navy-900)', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            {isEditMode ? 'Edit Episode' : 'Create New Episode'}
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {isEditMode ? "Update the episode's information and artwork. All fields marked with * are required." : "Add a new episode to a show. All fields marked with * are required."}
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
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-sm)', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--purple-700)" />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--navy-900)', margin: 0 }}>
                Basic Information
              </h2>
            </div>
            
            <div className="grid-cols-3" style={{ display: 'grid', gap: '24px' }}>
              <CustomDropdown 
                label="Show *"
                placeholder="Select show"
                value={formData.show_id}
                options={showOptions}
                onChange={val => handleChange('show_id', val)}
                helperText="Choose the show this episode belongs to."
              />
              <CustomDropdown 
                label="Season (Optional)"
                placeholder={formData.show_id ? "Select season" : "Select show first"}
                value={formData.season_id}
                options={seasonOptions}
                onChange={val => handleChange('season_id', val)}
                helperText="Select season if this episode is part of a series."
                required={false}
              />
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Episode Number <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  value={formData.episode_number} 
                  onChange={e => handleChange('episode_number', e.target.value)}
                  placeholder="e.g. 1, 2, 3"
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Episode number in this season.</div>
              </div>
            </div>

            <div className="grid-cols-2" style={{ display: 'grid', gap: '24px' }}>
              <div className="form-group">
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

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Content Group <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  value={formData.content_group} 
                  onChange={e => handleChange('content_group', e.target.value)}
                  placeholder="e.g. motis-many-lives-s01e01"
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Episodes with the same content group are language variants of the same episode.</div>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                Synopsis (Optional)
              </label>
              <textarea 
                className="form-control"
                value={formData.synopsis} 
                onChange={e => handleChange('synopsis', e.target.value)}
                placeholder="Write a brief synopsis about this episode..."
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                <span>Brief description of what this episode is about.</span>
                <span>{formData.synopsis.length} / 500</span>
              </div>
            </div>

            <div className="grid-cols-2" style={{ display: 'grid', gap: '24px' }}>

              <CustomDropdown 
                label="Primary Language *"
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
                    value={formData.duration} 
                    onChange={e => handleChange('duration', e.target.value)}
                    placeholder="MM:SS"
                  />
                  <Clock size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '12px' }} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Episode duration (e.g. 12:30).</div>
              </div>
            </div>

            <div className="grid-cols-2" style={{ display: 'grid', gap: '24px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Status <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '4px', height: '40px', border: '1px solid #CBD5E1' }}>
                  {[ {label: 'Draft', value: 'draft'}, {label: 'Review', value: 'Review'}, {label: 'Published', value: 'published'}].map(s => (
                    <div 
                      key={s.value}
                      onClick={() => handleChange('status', s.value)}
                      style={{ 
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer', 
                        backgroundColor: formData.status === s.value ? (s.value === 'draft' ? '#FFEDD5' : s.value === 'published' ? '#DCFCE7' : '#E0E7FF') : 'transparent', 
                        color: formData.status === s.value ? (s.value === 'draft' ? '#C2410C' : s.value === 'published' ? '#15803D' : '#4338CA') : 'var(--navy-900)',
                        boxShadow: formData.status === s.value ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                      }}>
                      {s.value === 'draft' ? <span style={{marginRight: '6px', fontSize: '16px', lineHeight: 1}}>•</span> : null} 
                      {s.label}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Only published episodes are visible to viewers.</div>
              </div>


            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Artwork */}
        <div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-sm)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--navy-900)', marginBottom: '8px', marginTop: 0 }}>
              Episode Artwork
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
              Upload images that represent your episode.<br/>Images are required for publishing.
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
            
            <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--purple-50)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start', border: '1px solid var(--purple-100)' }}>
                <Info size={18} color="var(--purple-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--purple-700)', fontSize: '13px', marginBottom: '4px' }}>
                    Artwork Guidelines
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--purple-700)', opacity: 0.8, lineHeight: '1.5', marginBottom: '8px' }}>
                    Ensure images meet the size, aspect ratio and file size requirements.
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--purple-700)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    View Artwork Specification &rarr;
                  </div>
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
