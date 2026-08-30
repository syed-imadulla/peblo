import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Bell, 
  Cloud, 
  Settings as SettingsIcon, 
  Edit3, 
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';

const fetchSettings = async () => {
  const { data } = await axios.get('/api/admin/settings');
  return data;
};

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const [editModal, setEditModal] = useState(null); // 'site', 'content', 'publishing', null
  const [formData, setFormData] = useState({});
  const [testStorageStatus, setTestStorageStatus] = useState(null); // { loading, success, message }

  const updateSiteMutation = useMutation({
    mutationFn: (data) => axios.put('/api/admin/settings/site', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      setEditModal(null);
    }
  });

  const updateContentMutation = useMutation({
    mutationFn: (data) => axios.put('/api/admin/settings/content', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      setEditModal(null);
    }
  });

  const updatePublishingMutation = useMutation({
    mutationFn: (data) => axios.put('/api/admin/settings/publishing', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      setEditModal(null);
    }
  });

  const testStorageMutation = useMutation({
    mutationFn: () => axios.post('/api/admin/settings/storage/test'),
    onSuccess: (res) => {
      setTestStorageStatus({ loading: false, success: res.data.success, message: res.data.message });
      setTimeout(() => setTestStorageStatus(null), 3000);
    },
    onError: (err) => {
      setTestStorageStatus({ loading: false, success: false, message: 'Request failed' });
      setTimeout(() => setTestStorageStatus(null), 3000);
    }
  });

  const handleEdit = (section) => {
    if (user?.role !== 'admin') {
      alert("Only administrators can modify settings.");
      return;
    }
    setEditModal(section);
    setFormData({ ...settings });
  };

  const handleSave = () => {
    if (editModal === 'site') {
      updateSiteMutation.mutate({
        site_name: formData.site_name,
        admin_email: formData.admin_email,
        site_url: formData.site_url,
        timezone: formData.timezone
      });
    } else if (editModal === 'content') {
      updateContentMutation.mutate({
        default_section: formData.default_section,
        default_languages: typeof formData.default_languages === 'string' ? formData.default_languages.split(',').map(s=>s.trim()) : formData.default_languages,
        default_status: formData.default_status,
        season_0_handling: formData.season_0_handling,
        content_grouping: formData.content_grouping
      });
    } else if (editModal === 'publishing') {
      updatePublishingMutation.mutate({
        auto_publish: formData.auto_publish,
        generate_backup: formData.generate_backup,
        catalogue_format: formData.catalogue_format,
        atomic_publish: formData.atomic_publish
      });
    }
  };

  const isSaving = updateSiteMutation.isPending || updateContentMutation.isPending || updatePublishingMutation.isPending;

  if (isLoading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading settings...</div>;
  }

  if (error) {
    return <div style={{ padding: '40px', color: '#ef4444' }}>Error loading settings: {error.message}</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '8px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: '800', fontSize: '28px', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
            Settings
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            Manage your CMS preferences.
          </div>
        </div>
        
        <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '50%', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', cursor: 'pointer', color: 'var(--purple-700)' }}>
          <Bell size={20} />
          <div style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#6D28D9', color: '#FFF', fontSize: '11px', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #F8F9FF' }}>
            3
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 4fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Site Information */}
          <div className="card" style={{ padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cloud size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>Site Information</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Basic details about your PeBLo CMS.</div>
                </div>
              </div>
              <button 
                onClick={() => handleEdit('site')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e9d5ff', backgroundColor: '#fff', color: '#7e22ce', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Edit3 size={14} /> Edit
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Site Name</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{settings.site_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Admin Email</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{settings.admin_email}</div>
              </div>
              <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: 'var(--border)' }}></div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Site URL</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{settings.site_url}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Timezone</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{settings.timezone}</div>
              </div>
            </div>
          </div>

          {/* Card 2: Default Content Settings */}
          <div className="card" style={{ padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SettingsIcon size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>Default Content Settings</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Defaults applied when creating new content.</div>
                </div>
              </div>
              <button 
                onClick={() => handleEdit('content')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e9d5ff', backgroundColor: '#fff', color: '#7e22ce', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Edit3 size={14} /> Edit
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '8px' }}>Default Section</div>
                <span style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>{settings.default_section}</span>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '8px' }}>Default Languages</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {settings.default_languages.map(lang => (
                    <span key={lang} style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>{lang}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '8px' }}>Default Status</div>
                <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>{settings.default_status}</span>
              </div>
              <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: 'var(--border)' }}></div>
              <div style={{ gridColumn: '1 / 2' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Season 0 Handling</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{settings.season_0_handling}</div>
              </div>
              <div style={{ gridColumn: '2 / -1' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Content Grouping</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{settings.content_grouping}</div>
              </div>
            </div>
          </div>

          {/* Card 3: Publishing Preferences */}
          <div className="card" style={{ padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>Publishing Preferences</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Control how publishing and catalogue generation works.</div>
                </div>
              </div>
              <button 
                onClick={() => handleEdit('publishing')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e9d5ff', backgroundColor: '#fff', color: '#7e22ce', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Edit3 size={14} /> Edit
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Auto Publish</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>{settings.auto_publish ? 'Enabled' : 'Disabled'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{settings.auto_publish ? 'Publishes on change' : 'Manual publish only'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Generate Backup</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>{settings.generate_backup ? 'Enabled' : 'Disabled'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{settings.generate_backup ? 'Backup previous catalogue before publish' : 'No backups'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Catalogue Format</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>{settings.catalogue_format}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>catalogue.{settings.catalogue_format.toLowerCase()}</div>
              </div>
              <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: 'var(--border)' }}></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Atomic Publish</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>{settings.atomic_publish ? 'Enabled' : 'Disabled'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{settings.atomic_publish ? 'Ensure safe and atomic publishing' : 'Standard publish'}</div>
              </div>
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 4: Storage Connection */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cloud size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>Storage Connection</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Where your images and catalogue are stored.</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Provider</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Local Storage</div>
                  <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 700 }}>Connected</span>
                </div>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border)' }}></div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Base Path</div>
                <div style={{ fontSize: '14px', color: 'var(--purple-700)' }}>/uploads</div>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border)' }}></div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Public URL</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>http://localhost:8000/uploads</div>
              </div>
            </div>
            
            <button 
              onClick={() => { setTestStorageStatus({ loading: true }); testStorageMutation.mutate(); }}
              disabled={testStorageStatus?.loading}
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px', border: '1px solid #e9d5ff', backgroundColor: '#fcfaff', color: 'var(--purple-700)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
            >
              {testStorageStatus?.loading ? 'Testing...' : <><Cloud size={16} /> Test Connection</>}
            </button>
            {testStorageStatus && !testStorageStatus.loading && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: testStorageStatus.success ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                {testStorageStatus.success ? <CheckCircle size={14} /> : <XCircle size={14} />} {testStorageStatus.message}
              </div>
            )}
          </div>

          {/* Card 5: Artwork Specifications */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>Artwork Specifications</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Images required for publishing.</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f8fafc', color: 'var(--purple-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <ImageIcon size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy-900)' }}>Poster</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>2:3 • 600 × 900 px • Max 200 KB</div>
                </div>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border)' }}></div>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f8fafc', color: 'var(--purple-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <ImageIcon size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy-900)' }}>Banner</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>16:9 • 1280 × 720 px • Max 200 KB</div>
                </div>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border)' }}></div>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f8fafc', color: 'var(--purple-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <ImageIcon size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy-900)' }}>Thumbnail</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>16:9 • 640 × 360 px • Max 200 KB</div>
                </div>
              </div>
            </div>

            <button style={{ width: '100%', background: 'none', border: 'none', color: 'var(--purple-700)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: '8px 0', outline: 'none' }}>
              View full guidelines →
            </button>
          </div>

        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '24px 0', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
        <span>© 2025 PeBLo TV</span>
        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#cbd5e1' }}></span>
        <span>CMS v1.0.0</span>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setEditModal(null)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)' }}>
                {editModal === 'site' && 'Edit Site Information'}
                {editModal === 'content' && 'Edit Default Content Settings'}
                {editModal === 'publishing' && 'Edit Publishing Preferences'}
              </h3>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {editModal === 'site' && (
                <>
                  <label className="form-label">Site Name</label>
                  <input type="text" className="form-input" value={formData.site_name} onChange={e => setFormData({...formData, site_name: e.target.value})} />
                  
                  <label className="form-label">Admin Email</label>
                  <input type="email" className="form-input" value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} />
                  
                  <label className="form-label">Site URL</label>
                  <input type="url" className="form-input" value={formData.site_url} onChange={e => setFormData({...formData, site_url: e.target.value})} />
                  
                  <label className="form-label">Timezone</label>
                  <input type="text" className="form-input" value={formData.timezone} onChange={e => setFormData({...formData, timezone: e.target.value})} />
                </>
              )}

              {editModal === 'content' && (
                <>
                  <label className="form-label">Default Section</label>
                  <input type="text" className="form-input" value={formData.default_section} onChange={e => setFormData({...formData, default_section: e.target.value})} />
                  
                  <label className="form-label">Default Languages (comma separated)</label>
                  <input type="text" className="form-input" value={Array.isArray(formData.default_languages) ? formData.default_languages.join(', ') : formData.default_languages} onChange={e => setFormData({...formData, default_languages: e.target.value})} />
                  
                  <label className="form-label">Default Status</label>
                  <select className="form-input" value={formData.default_status} onChange={e => setFormData({...formData, default_status: e.target.value})}>
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>

                  <label className="form-label">Season 0 Handling</label>
                  <input type="text" className="form-input" value={formData.season_0_handling} onChange={e => setFormData({...formData, season_0_handling: e.target.value})} />

                  <label className="form-label">Content Grouping</label>
                  <input type="text" className="form-input" value={formData.content_grouping} onChange={e => setFormData({...formData, content_grouping: e.target.value})} />
                </>
              )}

              {editModal === 'publishing' && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                    <input type="checkbox" checked={formData.auto_publish} onChange={e => setFormData({...formData, auto_publish: e.target.checked})} />
                    Auto Publish
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                    <input type="checkbox" checked={formData.generate_backup} onChange={e => setFormData({...formData, generate_backup: e.target.checked})} />
                    Generate Backup
                  </label>
                  
                  <label className="form-label">Catalogue Format</label>
                  <select className="form-input" value={formData.catalogue_format} onChange={e => setFormData({...formData, catalogue_format: e.target.value})}>
                    <option value="JSON">JSON</option>
                    <option value="XML">XML</option>
                  </select>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                    <input type="checkbox" checked={formData.atomic_publish} onChange={e => setFormData({...formData, atomic_publish: e.target.checked})} />
                    Atomic Publish
                  </label>
                </>
              )}

            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f8fafc' }}>
              <button onClick={() => setEditModal(null)} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '14px' }}>Cancel</button>
              <button onClick={handleSave} className="btn btn-primary" style={{ padding: '8px 24px', fontSize: '14px', backgroundColor: '#6D28D9', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
