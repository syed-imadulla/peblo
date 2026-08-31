import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft, ChevronDown, Check, X, Image as ImageIcon, UploadCloud, AlertCircle, Info, Lock, Save } from 'lucide-react';

const SECTIONS = ['Featured', 'Series', 'Minisodes', 'Songs'];
const CATEGORIES = ['Adventure', 'Folk', 'Friendship', 'India', 'Language', 'Learning', 'Maths', 'Music', 'Nature', 'Reading', 'Science', 'Singalong', 'Stories', 'Travel', 'Vocabulary'];

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

// Custom Multi-Select Component
const MultiSelect = ({ selected, options, onChange, label, helperText }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  const toggleOption = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(i => i !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="form-group" ref={ref}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
        {label} <span style={{ color: '#DC2626' }}>*</span>
      </label>
      
      <div style={{ position: 'relative' }}>
      <div 
        className="form-control"
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setTimeout(() => document.getElementById('multi-search')?.focus(), 10); }}
        style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', cursor: 'pointer', minHeight: '46px', height: 'auto', padding: '6px 16px',
          boxShadow: isOpen ? '0 0 0 3px var(--purple-50)' : 'none', borderColor: isOpen ? 'var(--purple-500)' : undefined
        }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
        }}
      >
        {selected.map(sel => (
          <div key={sel} style={{ 
            backgroundColor: 'var(--purple-50)', color: 'var(--purple-700)', padding: '4px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            {sel}
            <div 
              onClick={(e) => { e.stopPropagation(); toggleOption(sel); }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', padding: '2px', transition: 'background-color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--purple-100)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={14} />
            </div>
          </div>
        ))}
        
        <input 
          id="multi-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={selected.length === 0 ? "Select categories..." : ""}
          style={{ border: 'none', outline: 'none', flex: 1, minWidth: '120px', fontSize: '14px', background: 'transparent', color: 'var(--navy-900)', cursor: 'pointer' }}
        />
        
        <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginLeft: 'auto' }} />
      </div>

      {isOpen && (
        <div className="custom-scrollbar" style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', 
          borderRadius: '10px', boxShadow: '0 -10px 30px rgba(0,0,0,0.15)', zIndex: 100, padding: '6px', maxHeight: '180px', display: 'flex', flexDirection: 'column', overflowY: 'auto'
        }}>
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>No categories found</div>
          ) : (
            filteredOptions.map(opt => {
              const isSelected = selected.includes(opt);
              return (
                <div 
                  key={opt}
                  onClick={() => { toggleOption(opt); setSearch(''); }}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                    backgroundColor: isSelected ? '#F5F3FF' : 'transparent', color: isSelected ? 'var(--purple-700)' : 'var(--navy-900)',
                    fontSize: '14px', transition: 'background-color 0.1s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#F5F3FF' : '#F8FAFC'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#F5F3FF' : 'transparent'}
                >
                  <input type="checkbox" checked={isSelected} readOnly style={{ accentColor: 'var(--purple-500)', cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0, margin: 0 }} />
                  {opt}
                </div>
              );
            })
          )}
        </div>
      )}
      </div>
      {helperText && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>{helperText}</div>}
    </div>
  );
};

// Component for individual artwork slots
const ArtworkUploadCard = ({ type, aspectText, width, height, maxKb, showId, existingArtwork, onUploadSuccess, isDisabled }) => {
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
    formData.append('entity_type', 'show');
    formData.append('entity_id', showId);
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
        width: type === 'Poster' ? '72px' : '112px', 
        height: type === 'Poster' ? '108px' : '63px', 
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
              <Lock size={12} /> Save show to enable uploads
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
const ShowForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    synopsis: '',
    section: '',
    categories: [],
    primaryLanguage: 'English',
    showType: 'Series',
    status: 'Draft',
    releaseYear: '',
    ageGroup: '',
    tags: ''
  });
  
  const [isDirty, setIsDirty] = useState(false);
  
  // Fetch show if edit mode
  const { data: show, isLoading, refetch: refetchShow } = useQuery({
    queryKey: ['show', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/admin/shows/${id}`);
      return data;
    },
    enabled: isEditMode
  });

  useEffect(() => {
    if (show) {
      setFormData({
        title: show.title || '',
        slug: show.slug || '',
        synopsis: show.synopsis || '',
        section: show.section || '',
        categories: show.categories || [],
        primaryLanguage: 'English',
        showType: 'Series',
        status: 'Draft',
        releaseYear: '',
        ageGroup: '',
        tags: ''
      });
      setIsDirty(false);
    }
  }, [show]);

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
    mutationFn: (data) => axios.post('/api/admin/shows', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['shows']);
      setIsDirty(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      navigate(`/shows/${res.data.id}/edit`, { replace: true });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => axios.put(`/api/admin/shows/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shows']);
      queryClient.invalidateQueries(['show', id]);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.section || formData.categories.length === 0) return;
    
    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='var(--navy-900)'} onMouseOut={e => e.target.style.color='var(--text-muted)'} onClick={() => navigate('/shows')}>Shows</span>
            <span style={{ color: 'var(--purple-300)' }}>&gt;</span>
            <span style={{ color: 'var(--purple-700)' }}>{isEditMode ? 'Edit Show' : 'Create New Show'}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => {
                if (isDirty && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
                navigate('/shows');
              }}
              className="btn btn-outline" style={{ height: '40px', padding: '0 20px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', backgroundColor: '#FFFFFF', color: 'var(--navy-900)', border: '1px solid #CBD5E1' }}>
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSaving || !formData.title || !formData.slug || !formData.section || formData.categories.length === 0}
              className="btn btn-primary" style={{ height: '40px', padding: '0 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--purple-500)', color: '#FFFFFF', border: 'none' }}>
              {isSaving && <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', animation: 'spin 1s linear infinite' }}/>}
              {!isSaving && isSaved ? <Check size={16} /> : (!isSaving && <Save size={16} />)}
              {isSaving ? 'Saving...' : isSaved ? 'Saved' : isEditMode ? 'Save Show' : 'Create Show'}
            </button>
          </div>
        </div>
        
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--navy-900)', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            {isEditMode ? 'Edit Show' : 'Create New Show'}
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {isEditMode ? "Update the show's information and artwork. All fields marked with * are required." : "Add a new show to your library. All fields marked with * are required."}
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
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-sm)', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--purple-700)" />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--navy-900)', margin: 0 }}>
                Basic Information
              </h2>
            </div>
            
            <div className="grid-cols-2" style={{ display: 'grid', gap: '24px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Show Title <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  value={formData.title} 
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder="Enter show title"
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Enter a clear and engaging title for the show.</div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Slug <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  value={formData.slug} 
                  onChange={e => handleChange('slug', e.target.value)}
                  placeholder="show-slug"
                  style={{ fontFamily: 'monospace' }}
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>URL friendly unique identifier (auto-generated recommended).</div>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                Synopsis <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea 
                className="form-control"
                value={formData.synopsis} 
                onChange={e => handleChange('synopsis', e.target.value)}
                placeholder="Write a brief synopsis about your show..."
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                <span>Brief description of what the show is about.</span>
                <span>{formData.synopsis?.length || 0} / 500</span>
              </div>
            </div>

            <div className="grid-cols-3" style={{ display: 'grid', gap: '24px' }}>
              <CustomDropdown 
                label="Section *"
                placeholder="Select section"
                value={formData.section}
                options={SECTIONS}
                onChange={val => handleChange('section', val)}
                helperText="Where this show will appear."
              />
              
              <CustomDropdown 
                label="Primary Language *"
                placeholder="Select language"
                value={formData.primaryLanguage}
                options={['English', 'Hindi']}
                onChange={val => handleChange('primaryLanguage', val)}
                helperText="Default audio track language."
              />

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Show Type
                </label>
                <div style={{ display: 'flex', backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '4px', height: '40px', border: '1px solid #CBD5E1' }}>
                  <div 
                    onClick={() => handleChange('showType', 'Series')}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer', backgroundColor: formData.showType === 'Series' ? 'var(--purple-50)' : 'transparent', color: formData.showType === 'Series' ? 'var(--purple-700)' : 'var(--navy-900)' }}>
                    Series
                  </div>
                  <div 
                    onClick={() => handleChange('showType', 'Minisodes')}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer', backgroundColor: formData.showType === 'Minisodes' ? 'var(--purple-50)' : 'transparent', color: formData.showType === 'Minisodes' ? 'var(--purple-700)' : 'var(--navy-900)' }}>
                    Minisodes
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Choose the format of this show.</div>
              </div>
            </div>

            <div className="grid-cols-2" style={{ display: 'grid', gap: '24px' }}>
              <MultiSelect 
                label="Categories"
                selected={formData.categories}
                options={CATEGORIES}
                onChange={val => handleChange('categories', val)}
                helperText="Select one or more categories."
              />

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Status <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '4px', height: '40px', border: '1px solid #CBD5E1' }}>
                  {['Draft', 'Review', 'Published'].map(s => (
                    <div 
                      key={s}
                      onClick={() => handleChange('status', s)}
                      style={{ 
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer', 
                        backgroundColor: formData.status === s ? (s === 'Draft' ? '#FFEDD5' : s === 'Review' ? '#E0F2FE' : '#DCFCE7') : 'transparent', 
                        color: formData.status === s ? (s === 'Draft' ? '#C2410C' : s === 'Review' ? '#0369A1' : '#15803D') : 'var(--navy-900)',
                        boxShadow: formData.status === s ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                      }}>
                      {s === 'Draft' ? <span style={{marginRight: '6px', fontSize: '16px', lineHeight: 1}}>•</span> : null} 
                      {s}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Only published shows are visible to viewers.</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Artwork */}
        <div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-sm)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--navy-900)', marginBottom: '8px', marginTop: 0 }}>
              Show Artwork
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
              Upload images that represent your show.<br/>Images are required for publishing.
            </div>

            <div>
              <ArtworkUploadCard 
                type="Poster" aspectText="2:3" width="600" height="900" maxKb="200" 
                showId={id} existingArtwork={show?.artwork} onUploadSuccess={refetchShow} isDisabled={!isEditMode}
              />
              <ArtworkUploadCard 
                type="Banner" aspectText="16:9" width="1280" height="720" maxKb="200" 
                showId={id} existingArtwork={show?.artwork} onUploadSuccess={refetchShow} isDisabled={!isEditMode}
              />
              <ArtworkUploadCard 
                type="Thumbnail" aspectText="16:9" width="640" height="360" maxKb="200" 
                showId={id} existingArtwork={show?.artwork} onUploadSuccess={refetchShow} isDisabled={!isEditMode}
              />
            </div>
            
            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--purple-50)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Info size={18} color="var(--purple-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--purple-700)', fontSize: '13px', marginBottom: '4px' }}>
                    Artwork Guidelines
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--purple-700)', opacity: 0.8, lineHeight: '1.5' }}>
                    Ensure images meet the exact aspect ratio and file size requirements. Format must be JPG, PNG, or WEBP.
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

export default ShowForm;
