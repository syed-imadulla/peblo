import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Cloud, 
  Settings as SettingsIcon, 
  Edit3, 
  Image as ImageIcon,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';

const fetchSettings = async () => {
  const { data } = await axios.get('/api/admin/settings');
  return data;
};

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    refetchInterval: 5000,
  });

  const [editSection, setEditSection] = useState(null); // 'site', 'content', 'publishing', null
  const [formData, setFormData] = useState({});
  const [testStorageStatus, setTestStorageStatus] = useState(null); // { loading, success, message }

  // Extract variables
  const dbSettings = response?.db_settings || {};
  const systemInfo = response?.system_info || {};

  const updateSiteMutation = useMutation({
    mutationFn: (data) => axios.put('/api/admin/settings/site', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      setEditSection(null);
    }
  });

  const updateContentMutation = useMutation({
    mutationFn: (data) => axios.put('/api/admin/settings/content', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      setEditSection(null);
    }
  });

  const updatePublishingMutation = useMutation({
    mutationFn: (data) => axios.put('/api/admin/settings/publishing', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      setEditSection(null);
    }
  });

  const testStorageMutation = useMutation({
    mutationFn: () => axios.post('/api/admin/settings/storage/test'),
    onSuccess: (res) => {
      setTestStorageStatus({ loading: false, success: res.data.success, message: res.data.message });
      setTimeout(() => setTestStorageStatus(null), 4000);
    },
    onError: (err) => {
      setTestStorageStatus({ loading: false, success: false, message: 'Storage connection test failed.' });
      setTimeout(() => setTestStorageStatus(null), 4000);
    }
  });

  const handleEdit = (section) => {
    if (user?.role !== 'admin') {
      alert("Only administrators can modify settings.");
      return;
    }
    setEditSection(section);
    setFormData({ ...dbSettings });
  };

  const handleCancel = () => {
    setEditSection(null);
  };

  const handleSave = (section) => {
    if (section === 'site') {
      updateSiteMutation.mutate({
        site_name: formData.site_name,
        admin_email: formData.admin_email,
        site_url: formData.site_url,
        timezone: formData.timezone
      });
    } else if (section === 'content') {
      updateContentMutation.mutate({
        default_section: formData.default_section,
        default_languages: typeof formData.default_languages === 'string' ? formData.default_languages.split(',').map(s=>s.trim()) : formData.default_languages,
        default_status: formData.default_status,
        season_0_handling: formData.season_0_handling,
        content_grouping: formData.content_grouping
      });
    } else if (section === 'publishing') {
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

  // Build artwork specs dynamically
  const artworkSpecs = systemInfo.artwork_specs || {};
  const renderSpec = (title, specData) => {
    if (!specData) return null;
    const px = specData.target_px ? `${specData.target_px[0]} × ${specData.target_px[1]} px` : '';
    return (
      <React.Fragment key={title}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f8fafc', color: 'var(--purple-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
            <ImageIcon size={14} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy-900)' }}>{title}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{specData.aspect} • {px} • Max {specData.max_kb} KB</div>
          </div>
        </div>
        <div style={{ height: '1px', backgroundColor: 'var(--border)' }}></div>
      </React.Fragment>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header (No Bell Icon) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '8px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: '800', fontSize: '28px', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
            Settings
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            Manage your CMS preferences.
          </div>
        </div>
      </div>

      <div className="show-form-layout">
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Card 1: Site Information */}
          <div className="card" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '24px' }}>
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
                {editSection !== 'site' && (
                  <button 
                    onClick={() => handleEdit('site')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e9d5ff', backgroundColor: '#fff', color: '#7e22ce', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                )}
              </div>

              {editSection === 'site' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label>Site Name</label>
                    <input type="text" className="form-control" value={formData.site_name || ''} onChange={e => setFormData({...formData, site_name: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Admin Email</label>
                    <input type="email" className="form-control" value={formData.admin_email || ''} onChange={e => setFormData({...formData, admin_email: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Site URL</label>
                    <input type="url" className="form-control" value={formData.site_url || ''} onChange={e => setFormData({...formData, site_url: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Timezone</label>
                    <input type="text" className="form-control" value={formData.timezone || ''} onChange={e => setFormData({...formData, timezone: e.target.value})} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Site Name</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{dbSettings.site_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Admin Email</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{dbSettings.admin_email}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: 'var(--border)' }}></div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Site URL</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{dbSettings.site_url}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Timezone</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{dbSettings.timezone}</div>
                  </div>
                </div>
              )}
            </div>
            {editSection === 'site' && (
              <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={handleCancel} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
                <button onClick={() => handleSave('site')} className="btn btn-primary" style={{ padding: '8px 24px', fontSize: '13px', borderRadius: '8px' }} disabled={isSaving}>
                  {updateSiteMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Default Content Settings */}
          <div className="card" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '24px' }}>
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
                {editSection !== 'content' && (
                  <button 
                    onClick={() => handleEdit('content')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e9d5ff', backgroundColor: '#fff', color: '#7e22ce', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                )}
              </div>

              {editSection === 'content' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label>Default Section</label>
                    <input type="text" className="form-control" value={formData.default_section || ''} onChange={e => setFormData({...formData, default_section: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Default Languages (comma separated)</label>
                    <input type="text" className="form-control" value={Array.isArray(formData.default_languages) ? formData.default_languages.join(', ') : (formData.default_languages || '')} onChange={e => setFormData({...formData, default_languages: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Default Status</label>
                    <select className="form-control" value={formData.default_status || ''} onChange={e => setFormData({...formData, default_status: e.target.value})}>
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Season 0 Handling</label>
                    <input type="text" className="form-control" value={formData.season_0_handling || ''} onChange={e => setFormData({...formData, season_0_handling: e.target.value})} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Content Grouping</label>
                    <input type="text" className="form-control" value={formData.content_grouping || ''} onChange={e => setFormData({...formData, content_grouping: e.target.value})} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '8px' }}>Default Section</div>
                    <span style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>{dbSettings.default_section}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '8px' }}>Default Languages</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {(dbSettings.default_languages || []).map(lang => (
                        <span key={lang} style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>{lang}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '8px' }}>Default Status</div>
                    <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>{dbSettings.default_status}</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: 'var(--border)' }}></div>
                  <div style={{ gridColumn: '1 / 2' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Season 0 Handling</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{dbSettings.season_0_handling}</div>
                  </div>
                  <div style={{ gridColumn: '2 / -1' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Content Grouping</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{dbSettings.content_grouping}</div>
                  </div>
                </div>
              )}
            </div>
            {editSection === 'content' && (
              <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={handleCancel} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
                <button onClick={() => handleSave('content')} className="btn btn-primary" style={{ padding: '8px 24px', fontSize: '13px', borderRadius: '8px' }} disabled={isSaving}>
                  {updateContentMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Publishing Preferences */}
          <div className="card" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '24px' }}>
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
                {editSection !== 'publishing' && (
                  <button 
                    onClick={() => handleEdit('publishing')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e9d5ff', backgroundColor: '#fff', color: '#7e22ce', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                )}
              </div>

              {editSection === 'publishing' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>
                    <input type="checkbox" checked={formData.auto_publish || false} onChange={e => setFormData({...formData, auto_publish: e.target.checked})} style={{ width: '18px', height: '18px' }}/>
                    Auto Publish
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>
                    <input type="checkbox" checked={formData.generate_backup || false} onChange={e => setFormData({...formData, generate_backup: e.target.checked})} style={{ width: '18px', height: '18px' }}/>
                    Generate Backup
                  </label>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Catalogue Format</label>
                    <select className="form-control" value={formData.catalogue_format || ''} onChange={e => setFormData({...formData, catalogue_format: e.target.value})}>
                      <option value="JSON">JSON</option>
                      <option value="XML">XML</option>
                    </select>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>
                    <input type="checkbox" checked={formData.atomic_publish || false} onChange={e => setFormData({...formData, atomic_publish: e.target.checked})} style={{ width: '18px', height: '18px' }}/>
                    Atomic Publish
                  </label>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Auto Publish</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>{dbSettings.auto_publish ? 'Enabled' : 'Disabled'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{dbSettings.auto_publish ? 'Publishes on change' : 'Manual publish only'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Generate Backup</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>{dbSettings.generate_backup ? 'Enabled' : 'Disabled'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{dbSettings.generate_backup ? 'Backup previous catalogue before publish' : 'No backups'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Catalogue Format</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>{dbSettings.catalogue_format}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>catalogue.{dbSettings.catalogue_format?.toLowerCase() || 'json'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: 'var(--border)' }}></div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Atomic Publish</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>{dbSettings.atomic_publish ? 'Enabled' : 'Disabled'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{dbSettings.atomic_publish ? 'Ensure safe and atomic publishing' : 'Standard publish'}</div>
                  </div>
                </div>
              )}
            </div>
            {editSection === 'publishing' && (
              <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={handleCancel} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
                <button onClick={() => handleSave('publishing')} className="btn btn-primary" style={{ padding: '8px 24px', fontSize: '13px', borderRadius: '8px' }} disabled={isSaving}>
                  {updatePublishingMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
          
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
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
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{systemInfo.storage_provider || 'Unknown'}</div>
                  <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 700 }}>Connected</span>
                </div>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border)' }}></div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Data Path</div>
                <div style={{ fontSize: '14px', color: 'var(--purple-700)' }}>{systemInfo.data_path || 'data/'}</div>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border)' }}></div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px' }}>Assets Path</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{systemInfo.assets_path || '/assets'}</div>
              </div>
            </div>
            
            <button 
              onClick={() => { setTestStorageStatus({ loading: true }); testStorageMutation.mutate(); }}
              disabled={testStorageStatus?.loading}
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px', border: '1px solid #e9d5ff', backgroundColor: '#fcfaff', color: 'var(--purple-700)', fontSize: '14px', fontWeight: 600, cursor: testStorageStatus?.loading ? 'not-allowed' : 'pointer', outline: 'none' }}
            >
              {testStorageStatus?.loading ? 'Testing...' : <><Cloud size={16} /> Test Connection</>}
            </button>
            {testStorageStatus && !testStorageStatus.loading && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: testStorageStatus.success ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <div style={{ marginTop: '2px' }}>
                  {testStorageStatus.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                </div>
                <div>{testStorageStatus.message}</div>
              </div>
            )}
          </div>

          {/* Card 5: Artwork Specifications */}
          <div className="card" style={{ padding: '24px', marginBottom: 0 }}>
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
              {renderSpec('Poster', artworkSpecs.poster)}
              {renderSpec('Banner', artworkSpecs.banner)}
              {renderSpec('Thumbnail', artworkSpecs.thumbnail)}
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

    </div>
  );
};

export default Settings;
