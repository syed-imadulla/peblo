import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft, ChevronDown, Check, X, Image as ImageIcon, UploadCloud, Trash2, AlertCircle } from 'lucide-react';

const SECTIONS = ['Featured', 'Series', 'Minisodes', 'Songs'];
const CATEGORIES = ['Adventure', 'Folk', 'Friendship', 'India', 'Language', 'Learning', 'Maths', 'Music', 'Nature', 'Reading', 'Science', 'Singalong', 'Stories', 'Travel', 'Vocabulary'];

// Custom Dropdown Component
const CustomDropdown = ({ value, options, onChange, label, placeholder }) => {
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
    <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }} ref={ref}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
        {label} <span style={{ color: '#DC2626' }}>*</span>
      </label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', height: '46px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border)', 
          backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px var(--purple-50)' : 'none', borderColor: isOpen ? 'var(--purple-500)' : 'var(--border)', outline: 'none', transition: 'all 0.2s',
          color: value ? 'var(--navy-900)' : 'var(--text-muted)', fontSize: '14px'
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
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid var(--border)', 
          borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, padding: '6px', maxHeight: '200px', overflowY: 'auto'
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
  );
};

// Custom Multi-Select Component
const MultiSelect = ({ selected, options, onChange, label }) => {
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
    <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }} ref={ref}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
        {label} <span style={{ color: '#DC2626' }}>*</span>
      </label>
      
      <div 
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%', minHeight: '46px', padding: '6px 36px 6px 8px', borderRadius: '12px', border: '1px solid var(--border)', 
          backgroundColor: '#FFFFFF', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', cursor: 'text',
          boxShadow: isOpen ? '0 0 0 3px var(--purple-50)' : 'none', borderColor: isOpen ? 'var(--purple-500)' : 'var(--border)', outline: 'none', transition: 'all 0.2s',
          position: 'relative'
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={selected.length === 0 ? "Select categories..." : ""}
          style={{ border: 'none', outline: 'none', flex: 1, minWidth: '120px', fontSize: '14px', background: 'transparent' }}
        />
        
        <ChevronDown size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '16px', top: '14px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid var(--border)', 
          borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, padding: '6px', maxHeight: '240px', overflowY: 'auto'
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
                  <div style={{ 
                    width: '16px', height: '16px', borderRadius: '4px', border: isSelected ? 'none' : '1px solid #CBD5E1', 
                    backgroundColor: isSelected ? 'var(--purple-600)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isSelected && <Check size={12} color="#FFF" />}
                  </div>
                  {opt}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// Artwork Upload Component
const ArtworkUploadCard = ({ type, aspectText, width, height, maxKb, showId, existingArtwork, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const currentArt = existingArtwork?.find(a => a.type === type.toLowerCase());

  const handleFileChange = async (e) => {
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
    <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
      {/* Preview Area */}
      <div style={{ 
        width: type === 'Poster' ? '100px' : '140px', 
        height: type === 'Poster' ? '150px' : '79px', 
        backgroundColor: '#F8FAFC', borderRadius: '8px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E2E8F0', flexShrink: 0
      }}>
        {currentArt ? (
          <img src={currentArt.url} alt={type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <ImageIcon size={24} color="#CBD5E1" />
        )}
      </div>
      
      {/* Details & Action */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div style={{ fontWeight: '600', color: 'var(--navy-900)', fontSize: '15px' }}>
            {type} <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '13px' }}>({aspectText})</span>
          </div>
          {currentArt && <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', border: '1px solid #BBF7D0' }}>Uploaded</span>}
        </div>
        
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
          {width} × {height} px • Max {maxKb} KB
        </div>
        
        {error && <div style={{ color: '#DC2626', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14}/> {error}</div>}
        
        <div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn btn-outline" style={{ height: '36px', borderRadius: '8px', padding: '0 16px', fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {isUploading ? <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--purple-200)', borderTopColor: 'var(--purple-600)', animation: 'spin 1s linear infinite' }}/> : <UploadCloud size={14} />}
            {isUploading ? 'Uploading...' : currentArt ? 'Replace Image' : 'Upload Image'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
          />
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
    categories: []
  });
  
  const [isDirty, setIsDirty] = useState(false);
  
  // Fetch show if edit mode
  const { data: show, isLoading, refetch: refetchShow } = useQuery({
    queryKey: ['show', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/admin/shows/${id}`);
      return data;
    },
    enabled: isEditMode,
    onSuccess: (data) => {
      setFormData({
        title: data.title || '',
        slug: data.slug || '',
        synopsis: data.synopsis || '',
        section: data.section || '',
        categories: data.categories || []
      });
      setIsDirty(false);
    }
  });

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

  const isSaving = createMutation.isLoading || updateMutation.isLoading;
  const saveError = createMutation.error || updateMutation.error;

  if (isEditMode && isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--purple-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s', fontWeight: '500' }} onMouseOver={e => e.currentTarget.style.color = 'var(--navy-900)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'} onClick={() => navigate('/shows')}>Shows</span>
            <span>/</span>
            <span style={{ color: 'var(--navy-900)', fontWeight: '700' }}>{isEditMode ? 'Edit Show' : 'Create Show'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => {
              if (isDirty && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
              navigate('/shows');
            }}
            className="btn btn-outline" style={{ height: '44px', borderRadius: '12px', padding: '0 20px', fontWeight: '600' }}>
            <ArrowLeft size={16} style={{ marginRight: '6px' }}/> Back to Shows
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={isSaving || !formData.title || !formData.slug || !formData.section || formData.categories.length === 0}
            className="btn btn-primary" style={{ height: '44px', borderRadius: '12px', padding: '0 24px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', backgroundColor: 'var(--purple-500)', border: 'none', color: '#FFF' }}>
            {isSaving && <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', animation: 'spin 1s linear infinite' }}/>}
            {!isSaving && isSaved && <Check size={16} />}
            {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Show'}
          </button>
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
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--navy-900)', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              Basic Information
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Show Title <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder="Enter a clear and engaging title"
                  style={{ width: '100%', height: '46px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', transition: 'all 0.2s', backgroundColor: '#FFFFFF' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--purple-500)'; e.target.style.boxShadow = '0 0 0 3px var(--purple-50)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                  Slug <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.slug} 
                  onChange={e => handleChange('slug', e.target.value)}
                  placeholder="url-friendly-identifier"
                  style={{ width: '100%', height: '46px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', transition: 'all 0.2s', fontFamily: 'monospace', backgroundColor: '#FFFFFF' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--purple-500)'; e.target.style.boxShadow = '0 0 0 3px var(--purple-50)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Unique identifier used in URLs.</div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--navy-900)' }}>
                Synopsis
              </label>
              <textarea 
                value={formData.synopsis} 
                onChange={e => handleChange('synopsis', e.target.value)}
                placeholder="Brief description of the show..."
                style={{ width: '100%', height: '140px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', transition: 'all 0.2s', resize: 'vertical', backgroundColor: '#FFFFFF' }}
                onFocus={e => { e.target.style.borderColor = 'var(--purple-500)'; e.target.style.boxShadow = '0 0 0 3px var(--purple-50)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                {formData.synopsis?.length || 0} / 500 characters
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <MultiSelect 
                label="Categories"
                selected={formData.categories}
                options={CATEGORIES}
                onChange={val => handleChange('categories', val)}
              />
              <CustomDropdown 
                label="Section"
                placeholder="Select a section"
                value={formData.section}
                options={SECTIONS}
                onChange={val => handleChange('section', val)}
              />
            </div>
            
          </div>
        </div>

        {/* RIGHT COLUMN: Artwork */}
        <div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--navy-900)', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              Show Artwork
            </h2>

            {!isEditMode ? (
              <div style={{ backgroundColor: '#FAFAFC', border: '1px dashed #CBD5E1', borderRadius: '12px', padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ImageIcon size={32} color="#94A3B8" style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--navy-900)', marginBottom: '8px' }}>Save Show First</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '200px', lineHeight: '1.5' }}>You must save the basic information before uploading artwork.</div>
              </div>
            ) : (
              <div>
                <ArtworkUploadCard 
                  type="Poster" aspectText="2:3" width="600" height="900" maxKb="200" 
                  showId={id} existingArtwork={show?.artwork} onUploadSuccess={refetchShow}
                />
                <ArtworkUploadCard 
                  type="Banner" aspectText="16:9" width="1280" height="720" maxKb="200" 
                  showId={id} existingArtwork={show?.artwork} onUploadSuccess={refetchShow}
                />
                <ArtworkUploadCard 
                  type="Thumbnail" aspectText="16:9" width="640" height="360" maxKb="200" 
                  showId={id} existingArtwork={show?.artwork} onUploadSuccess={refetchShow}
                />
              </div>
            )}
            
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--purple-50)', borderRadius: '12px', border: '1px solid var(--purple-100)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <AlertCircle size={18} color="var(--purple-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
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
  );
};

export default ShowForm;
