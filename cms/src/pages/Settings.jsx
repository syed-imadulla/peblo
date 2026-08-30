import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Cloud,
  Settings as SettingsIcon,
  Edit3,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';

const fetchSettings = async () => {
  const { data } = await axios.get('/api/admin/settings');
  return data;
};

/* ─── Shared sub-components ─────────────────────────────────────── */

const CardIconContainer = ({ children }) => (
  <div style={{
    width: '40px', height: '40px', borderRadius: '12px',
    backgroundColor: '#f3e8ff', color: '#7e22ce',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>
    {children}
  </div>
);

const CardHeader = ({ icon, title, subtitle, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
      <CardIconContainer>{icon}</CardIconContainer>
      <div>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--navy-900)', lineHeight: '1.3' }}>{title}</h3>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</div>
      </div>
    </div>
    {action}
  </div>
);

const EditButton = ({ onClick }) => (
  <button
    onClick={onClick}
    aria-label="Edit"
    style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '6px 12px', borderRadius: '8px',
      border: '1px solid #e9d5ff', backgroundColor: '#fff',
      color: '#7e22ce', fontSize: '13px', fontWeight: 600,
      cursor: 'pointer', flexShrink: 0, lineHeight: 1,
    }}
  >
    <Edit3 size={13} /> Edit
  </button>
);

const EditFooter = ({ onCancel, onSave, isSaving, saveLabel = 'Save Changes', errorMsg }) => (
  <div style={{ padding: '14px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)' }}>
    {errorMsg && (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '10px', fontSize: '13px', color: '#dc2626' }}>
        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>{errorMsg}</span>
      </div>
    )}
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
      <button onClick={onCancel} className="btn btn-outline" style={{ padding: '7px 14px', fontSize: '13px' }}>
        Cancel
      </button>
      <button
        onClick={onSave}
        className="btn btn-primary"
        style={{ padding: '7px 20px', fontSize: '13px', borderRadius: '8px' }}
        disabled={isSaving}
      >
        {isSaving ? 'Saving…' : saveLabel}
      </button>
    </div>
  </div>
);

const FieldLabel = ({ children }) => (
  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '4px', letterSpacing: '0.1px' }}>
    {children}
  </div>
);

const FieldValue = ({ children, color }) => (
  <div style={{ fontSize: '14px', color: color || 'var(--text-muted)' }}>{children || '—'}</div>
);

const Divider = ({ span } = {}) => (
  <div style={{ height: '1px', backgroundColor: 'var(--border)', gridColumn: span ? '1 / -1' : undefined }} />
);

const Badge = ({ children, color, bg }) => (
  <span style={{
    backgroundColor: bg, color,
    padding: '3px 10px', borderRadius: '14px',
    fontSize: '12px', fontWeight: 600, display: 'inline-block',
  }}>
    {children}
  </span>
);

/* ─── Artwork Spec Row ───────────────────────────────────────────── */
const ArtworkSpecRow = ({ specKey, spec, isLast }) => {
  const label = specKey.charAt(0).toUpperCase() + specKey.slice(1);
  const [w, h] = spec.target_px || [0, 0];
  return (
    <React.Fragment>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '8px',
          backgroundColor: '#f8fafc', color: 'var(--purple-700)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border)', flexShrink: 0,
        }}>
          <ImageIcon size={13} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy-900)' }}>{label}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
            {spec.aspect} • {w} × {h} px • Max {spec.max_kb} KB
          </div>
        </div>
      </div>
      {!isLast && <Divider />}
    </React.Fragment>
  );
};

/* ─── Main Settings component ────────────────────────────────────── */
const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    // No refetchInterval — settings rarely change; invalidate on save instead.
  });

  const [editSection, setEditSection] = useState(null);
  const [formData, setFormData] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [testStatus, setTestStatus] = useState(null); // null | { loading } | { success, message }

  const dbSettings = response?.db_settings || {};
  const systemInfo = response?.system_info || {};
  const artworkSpecs = systemInfo.artwork_specs || {};
  const artworkSpecKeys = Object.keys(artworkSpecs);

  /* mutation factory */
  const makeMutation = (url) => ({
    mutationFn: (data) => axios.put(url, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setEditSection(null);
      setSaveError(null);
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to save settings.';
      setSaveError(msg);
    },
  });

  const updateSiteMutation = useMutation(makeMutation('/api/admin/settings/site'));
  const updateContentMutation = useMutation(makeMutation('/api/admin/settings/content'));
  const updatePublishingMutation = useMutation(makeMutation('/api/admin/settings/publishing'));

  const testStorageMutation = useMutation({
    mutationFn: () => axios.post('/api/admin/settings/storage/test'),
    onSuccess: (res) => {
      setTestStatus({ success: res.data.success, message: res.data.message });
      if (res.data.success) setTimeout(() => setTestStatus(null), 6000);
    },
    onError: (err) => {
      setTestStatus({ success: false, message: err?.response?.data?.detail || 'Storage connection test failed.' });
    },
  });

  const isSaving =
    updateSiteMutation.isPending ||
    updateContentMutation.isPending ||
    updatePublishingMutation.isPending;

  const handleEdit = (section) => {
    if (user?.role !== 'admin') return;
    setEditSection(section);
    setSaveError(null);
    setFormData({ ...dbSettings });
  };

  const handleCancel = () => {
    setEditSection(null);
    setSaveError(null);
  };

  const handleSave = (section) => {
    setSaveError(null);
    if (section === 'site') {
      updateSiteMutation.mutate({
        site_name: formData.site_name || '',
        admin_email: formData.admin_email || '',
        site_url: formData.site_url || '',
        timezone: formData.timezone || '',
      });
    } else if (section === 'content') {
      const langs = typeof formData.default_languages === 'string'
        ? formData.default_languages.split(',').map(s => s.trim()).filter(Boolean)
        : (formData.default_languages || []);
      updateContentMutation.mutate({
        default_section: formData.default_section || '',
        default_languages: langs,
        default_status: formData.default_status || 'Draft',
        season_0_handling: formData.season_0_handling || '',
        content_grouping: formData.content_grouping || '',
      });
    } else if (section === 'publishing') {
      updatePublishingMutation.mutate({
        auto_publish: !!formData.auto_publish,
        generate_backup: !!formData.generate_backup,
        catalogue_format: 'JSON', // only JSON is supported by the publish pipeline
        atomic_publish: !!formData.atomic_publish,
      });
    }
  };

  const handleTestStorage = () => {
    setTestStatus({ loading: true });
    testStorageMutation.mutate();
  };

  /* Loading / error states */
  if (isLoading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading settings…</div>;
  }
  if (error) {
    return <div style={{ padding: '40px', color: '#ef4444' }}>Error loading settings: {error.message}</div>;
  }

  /* Helpers */
  const field = (key, fallback = '—') => dbSettings[key] ?? fallback;
  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>

      {/* Page Header */}
      <div style={{ paddingTop: '8px', marginBottom: '28px' }}>
        <div style={{ fontWeight: 800, fontSize: '28px', color: 'var(--navy-900)', letterSpacing: '-0.5px' }}>
          Settings
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>
          Manage your CMS preferences.
        </div>
      </div>

      <div className="show-form-layout">

        {/* ════ LEFT COLUMN ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Card 1: Site Information */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <CardHeader
                  icon={<Cloud size={20} />}
                  title="Site Information"
                  subtitle="Basic details about your PeBLo CMS."
                  action={editSection !== 'site' && isAdmin && <EditButton onClick={() => handleEdit('site')} />}
                />
              </div>

              {editSection === 'site' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="input-group" style={{ marginBottom: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)', marginBottom: '6px' }}>Site Name</span>
                      <input type="text" className="form-control" value={formData.site_name || ''} onChange={e => setFormData({ ...formData, site_name: e.target.value })} />
                    </label>
                  </div>
                  <div>
                    <label className="input-group" style={{ marginBottom: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)', marginBottom: '6px' }}>Admin Email</span>
                      <input type="email" className="form-control" value={formData.admin_email || ''} onChange={e => setFormData({ ...formData, admin_email: e.target.value })} />
                    </label>
                  </div>
                  <div>
                    <label className="input-group" style={{ marginBottom: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)', marginBottom: '6px' }}>Site URL</span>
                      <input type="url" className="form-control" value={formData.site_url || ''} onChange={e => setFormData({ ...formData, site_url: e.target.value })} />
                    </label>
                  </div>
                  <div>
                    <label className="input-group" style={{ marginBottom: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)', marginBottom: '6px' }}>Timezone</span>
                      <input type="text" className="form-control" value={formData.timezone || ''} onChange={e => setFormData({ ...formData, timezone: e.target.value })} placeholder="e.g. Asia/Kolkata" />
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <FieldLabel>Site Name</FieldLabel>
                    <FieldValue>{field('site_name')}</FieldValue>
                  </div>
                  <div>
                    <FieldLabel>Admin Email</FieldLabel>
                    <FieldValue>{field('admin_email')}</FieldValue>
                  </div>
                  <Divider span />
                  <div>
                    <FieldLabel>Site URL</FieldLabel>
                    <FieldValue>{field('site_url')}</FieldValue>
                  </div>
                  <div>
                    <FieldLabel>Timezone</FieldLabel>
                    <FieldValue>{field('timezone')}</FieldValue>
                  </div>
                </div>
              )}
            </div>
            {editSection === 'site' && (
              <EditFooter
                onCancel={handleCancel}
                onSave={() => handleSave('site')}
                isSaving={updateSiteMutation.isPending}
                errorMsg={saveError}
              />
            )}
          </div>

          {/* Card 2: Default Content Settings */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <CardHeader
                  icon={<SettingsIcon size={20} />}
                  title="Default Content Settings"
                  subtitle="Defaults applied when creating new content."
                  action={editSection !== 'content' && isAdmin && <EditButton onClick={() => handleEdit('content')} />}
                />
              </div>

              {editSection === 'content' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ marginBottom: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)', marginBottom: '6px' }}>Default Section</span>
                      <select className="form-control" value={formData.default_section || ''} onChange={e => setFormData({ ...formData, default_section: e.target.value })}>
                        {['featured', 'series', 'minisodes', 'songs'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div>
                    <label style={{ marginBottom: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)', marginBottom: '6px' }}>Default Languages (comma separated)</span>
                      <input type="text" className="form-control"
                        value={Array.isArray(formData.default_languages) ? formData.default_languages.join(', ') : (formData.default_languages || '')}
                        onChange={e => setFormData({ ...formData, default_languages: e.target.value })}
                        placeholder="en, hi"
                      />
                    </label>
                  </div>
                  <div>
                    <label style={{ marginBottom: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)', marginBottom: '6px' }}>Default Status</span>
                      <select className="form-control" value={formData.default_status || ''} onChange={e => setFormData({ ...formData, default_status: e.target.value })}>
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                      </select>
                    </label>
                  </div>
                  <div>
                    <label style={{ marginBottom: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)', marginBottom: '6px' }}>Season 0 Handling</span>
                      <input type="text" className="form-control" value={formData.season_0_handling || ''} onChange={e => setFormData({ ...formData, season_0_handling: e.target.value })} />
                    </label>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ marginBottom: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)', marginBottom: '6px' }}>Content Grouping</span>
                      <input type="text" className="form-control" value={formData.content_grouping || ''} onChange={e => setFormData({ ...formData, content_grouping: e.target.value })} />
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <FieldLabel>Default Section</FieldLabel>
                    <div style={{ marginTop: '6px' }}>
                      <Badge bg="#f3e8ff" color="#7e22ce">{field('default_section')}</Badge>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Default Languages</FieldLabel>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {(dbSettings.default_languages || []).map(lang => (
                        <Badge key={lang} bg="#dcfce7" color="#166534">{lang.toUpperCase()}</Badge>
                      ))}
                      {(!dbSettings.default_languages || dbSettings.default_languages.length === 0) && <FieldValue>—</FieldValue>}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Default Status</FieldLabel>
                    <div style={{ marginTop: '6px' }}>
                      <Badge bg="#ffedd5" color="#c2410c">{field('default_status')}</Badge>
                    </div>
                  </div>
                  <Divider span />
                  <div>
                    <FieldLabel>Season 0 Handling</FieldLabel>
                    <FieldValue>{field('season_0_handling')}</FieldValue>
                  </div>
                  <div style={{ gridColumn: '2 / -1' }}>
                    <FieldLabel>Content Grouping</FieldLabel>
                    <FieldValue>{field('content_grouping')}</FieldValue>
                  </div>
                </div>
              )}
            </div>
            {editSection === 'content' && (
              <EditFooter
                onCancel={handleCancel}
                onSave={() => handleSave('content')}
                isSaving={updateContentMutation.isPending}
                errorMsg={saveError}
              />
            )}
          </div>

          {/* Card 3: Publishing Preferences */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <CardHeader
                  icon={<Pencil size={20} />}
                  title="Publishing Preferences"
                  subtitle="Control how publishing and catalogue generation works."
                  action={editSection !== 'publishing' && isAdmin && <EditButton onClick={() => handleEdit('publishing')} />}
                />
              </div>

              {editSection === 'publishing' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!formData.auto_publish} onChange={e => setFormData({ ...formData, auto_publish: e.target.checked })} style={{ width: '17px', height: '17px', accentColor: '#7e22ce' }} />
                    Auto Publish
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!formData.generate_backup} onChange={e => setFormData({ ...formData, generate_backup: e.target.checked })} style={{ width: '17px', height: '17px', accentColor: '#7e22ce' }} />
                    Generate Backup
                  </label>
                  <div>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)', marginBottom: '6px' }}>Catalogue Format</span>
                    {/* Only JSON is supported by the publish pipeline */}
                    <select className="form-control" value="JSON" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                      <option value="JSON">JSON</option>
                    </select>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Only JSON is currently supported.</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!formData.atomic_publish} onChange={e => setFormData({ ...formData, atomic_publish: e.target.checked })} style={{ width: '17px', height: '17px', accentColor: '#7e22ce' }} />
                    Atomic Publish
                  </label>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <FieldLabel>Auto Publish</FieldLabel>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)', marginTop: '2px' }}>{dbSettings.auto_publish ? 'Enabled' : 'Disabled'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{dbSettings.auto_publish ? 'Publishes on change' : 'Manual publish only'}</div>
                  </div>
                  <div>
                    <FieldLabel>Generate Backup</FieldLabel>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)', marginTop: '2px' }}>{dbSettings.generate_backup ? 'Enabled' : 'Disabled'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{dbSettings.generate_backup ? 'Backup previous catalogue before publish' : 'No backups'}</div>
                  </div>
                  <div>
                    <FieldLabel>Catalogue Format</FieldLabel>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)', marginTop: '2px' }}>{dbSettings.catalogue_format || 'JSON'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>catalogue.{(dbSettings.catalogue_format || 'JSON').toLowerCase()}</div>
                  </div>
                  <Divider span />
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FieldLabel>Atomic Publish</FieldLabel>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)', marginTop: '2px' }}>{dbSettings.atomic_publish ? 'Enabled' : 'Disabled'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{dbSettings.atomic_publish ? 'Ensure safe and atomic publishing' : 'Standard publish'}</div>
                  </div>
                </div>
              )}
            </div>
            {editSection === 'publishing' && (
              <EditFooter
                onCancel={handleCancel}
                onSave={() => handleSave('publishing')}
                isSaving={updatePublishingMutation.isPending}
                errorMsg={saveError}
              />
            )}
          </div>

        </div>

        {/* ════ RIGHT COLUMN ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Card 4: Storage Connection */}
          <div className="card" style={{ padding: '20px 24px 24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <CardHeader
                icon={<Cloud size={20} />}
                title="Storage Connection"
                subtitle="Where your images and catalogue are stored."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <FieldLabel>Provider</FieldLabel>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FieldValue color="var(--text-muted)">{systemInfo.storage_provider || 'Unavailable'}</FieldValue>
                  <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: 700 }}>
                    Connected
                  </span>
                </div>
              </div>
              <Divider />
              <div>
                <FieldLabel>Data Path</FieldLabel>
                <FieldValue color="var(--purple-700)">{systemInfo.data_path || 'Unavailable'}</FieldValue>
              </div>
              <Divider />
              <div>
                <FieldLabel>Assets Path</FieldLabel>
                <FieldValue color="var(--text-muted)">{systemInfo.assets_path || 'Unavailable'}</FieldValue>
              </div>
            </div>

            <button
              onClick={handleTestStorage}
              disabled={testStatus?.loading || testStorageMutation.isPending}
              aria-label="Test storage connection"
              style={{
                width: '100%', padding: '11px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                borderRadius: '8px', border: '1px solid #e9d5ff',
                backgroundColor: '#fcfaff', color: 'var(--purple-700)',
                fontSize: '14px', fontWeight: 600,
                cursor: (testStatus?.loading || testStorageMutation.isPending) ? 'not-allowed' : 'pointer',
                outline: 'none', transition: 'all 0.15s',
              }}
            >
              <Cloud size={15} />
              {testStatus?.loading || testStorageMutation.isPending ? 'Testing…' : 'Test Connection'}
            </button>

            {testStatus && !testStatus.loading && (
              <div style={{
                marginTop: '10px', fontSize: '13px',
                color: testStatus.success ? '#16a34a' : '#dc2626',
                display: 'flex', alignItems: 'flex-start', gap: '6px',
              }}>
                <div style={{ marginTop: '1px', flexShrink: 0 }}>
                  {testStatus.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                </div>
                <div>{testStatus.message}</div>
              </div>
            )}
          </div>

          {/* Card 5: Artwork Specifications */}
          <div className="card" style={{ padding: '20px 24px 20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <CardHeader
                icon={<ImageIcon size={20} />}
                title="Artwork Specifications"
                subtitle="Images required for publishing."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {artworkSpecKeys.length === 0 && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No specifications available.</div>
              )}
              {artworkSpecKeys.map((key, i) => (
                <ArtworkSpecRow
                  key={key}
                  specKey={key}
                  spec={artworkSpecs[key]}
                  isLast={i === artworkSpecKeys.length - 1}
                />
              ))}
            </div>

            <button
              onClick={() => navigate('/settings/artwork-guidelines')}
              style={{
                width: '100%', background: 'none', border: 'none',
                color: 'var(--purple-700)', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', padding: '8px 0', outline: 'none',
                textAlign: 'center',
              }}
              aria-label="View full artwork guidelines"
            >
              View full guidelines →
            </button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '32px', padding: '20px 0 0',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '10px',
        fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600,
      }}>
        <span>© 2025 PeBLo TV</span>
        <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'inline-block' }} />
        <span>CMS v1.0.0</span>
      </div>

    </div>
  );
};

export default Settings;
