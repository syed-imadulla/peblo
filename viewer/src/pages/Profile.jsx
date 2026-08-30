import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Volume2, Play, CheckCircle, Info, Sparkles, Sliders, Shield } from 'lucide-react';
import { getCatalog } from '../api';
import { CustomDropdown } from '../components/CustomDropdown';
import { getAllShows, getShowTotalEpisodes } from '../utils/catalogue';

const Profile = () => {
  const [preferredLang, setPreferredLang] = useState(() => {
    return localStorage.getItem('peblo_pref_lang') || 'en';
  });
  const [autoplayNext, setAutoplayNext] = useState(() => {
    return localStorage.getItem('peblo_autoplay') !== 'false';
  });
  const [videoQuality, setVideoQuality] = useState(() => {
    return localStorage.getItem('peblo_quality') || 'auto';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const { data: catalog } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog,
  });

  const allShows = getAllShows(catalog);
  const totalEpisodes = allShows.reduce((acc, show) => acc + getShowTotalEpisodes(show), 0);

  const handleSave = () => {
    localStorage.setItem('peblo_pref_lang', preferredLang);
    localStorage.setItem('peblo_autoplay', String(autoplayNext));
    localStorage.setItem('peblo_quality', videoQuality);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--purple-700)', fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
          <User size={16} /> Viewer Account
        </div>
        <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--navy-900)' }}>
          Profile & Preferences
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
          Customize your Peblo TV streaming playback and audio preferences.
        </p>
      </div>

      {/* Preferences Card */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--purple-100)',
              color: 'var(--purple-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sliders size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--navy-900)', margin: 0, fontWeight: 700 }}>
              Playback Settings
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Set your preferred language and stream behaviors
            </div>
          </div>
        </div>

        {/* Preferred Language */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)' }}>
            Default Audio Language
          </label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setPreferredLang('en')}
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '2px solid',
                borderColor: preferredLang === 'en' ? 'var(--purple-700)' : 'var(--border)',
                backgroundColor: preferredLang === 'en' ? 'var(--purple-100)' : 'var(--background)',
                color: preferredLang === 'en' ? 'var(--purple-700)' : 'var(--navy-900)',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              English (EN)
            </button>

            <button
              onClick={() => setPreferredLang('hi')}
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '2px solid',
                borderColor: preferredLang === 'hi' ? 'var(--purple-700)' : 'var(--border)',
                backgroundColor: preferredLang === 'hi' ? 'var(--purple-100)' : 'var(--background)',
                color: preferredLang === 'hi' ? 'var(--purple-700)' : 'var(--navy-900)',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              Hindi (HI)
            </button>
          </div>
        </div>

        {/* Autoplay Next Episode */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy-900)' }}>
              Autoplay Next Episode
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Automatically queue and start the next episode in a season
            </div>
          </div>

          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoplayNext}
              onChange={(e) => setAutoplayNext(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: autoplayNext ? 'var(--purple-700)' : 'var(--border)',
                borderRadius: '999px',
                transition: 'background-color 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  height: '20px',
                  width: '20px',
                  left: autoplayNext ? '24px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#ffffff',
                  borderRadius: '50%',
                  transition: 'left 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </span>
          </label>
        </div>

        {/* Streaming Quality */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy-900)' }}>
              Streaming Quality
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Adapt video bitrate and resolution
            </div>
          </div>

          <CustomDropdown
            value={videoQuality}
            onChange={setVideoQuality}
            minWidth="180px"
            ariaLabel="Streaming Quality"
            options={[
              { value: 'auto', label: 'Auto (Adaptive)' },
              { value: 'hd', label: 'High Definition (HD)' },
              { value: 'saver', label: 'Data Saver' },
            ]}
          />
        </div>

        {/* Save Button & Feedback */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div>
            {savedSuccess && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--green-500)', fontSize: '0.88rem', fontWeight: 600 }}>
                <CheckCircle size={16} /> Preferences saved!
              </span>
            )}
          </div>

          <button onClick={handleSave} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
            Save Preferences
          </button>
        </div>
      </div>

      {/* Catalogue & App Info Card */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--yellow-100)',
              color: '#925400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Info size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--navy-900)', margin: 0, fontWeight: 700 }}>
              Peblo TV Mini Overview
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Live catalogue stats and platform build
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Published Shows
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '4px' }}>
              {allShows.length}
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Published Episodes
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '4px' }}>
              {totalEpisodes}
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Catalogue Status
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--green-500)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--green-500)' }} />
              Live & Synced
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Peblo TV Mini Viewer v1.0.0 • Read-only catalogue client powered by FastAPI & React.
        </div>
      </div>
    </div>
  );
};

export default Profile;
