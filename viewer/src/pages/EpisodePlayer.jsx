import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Tv,
  Globe,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getCatalog } from '../api';
import { CatalogueRow } from '../components/CatalogueRow';
import { EpisodeCard } from '../components/EpisodeCard';
import { CustomDropdown } from '../components/CustomDropdown';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { FallbackImage } from '../components/ShowCard';
import { findEpisodeByContentGroup, formatDuration, resolveAssetUrl } from '../utils/catalogue';

const EpisodePlayer = () => {
  const { contentGroup } = useParams();
  const navigate = useNavigate();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playerContainerRef = useRef(null);

  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog,
  });

  const episodeData = findEpisodeByContentGroup(catalog, contentGroup);

  // Set default language from available languages
  useEffect(() => {
    if (episodeData?.episode?.languages?.length) {
      setSelectedLanguage(episodeData.episode.languages[0]);
    }
    // Reset playback position on episode change
    setCurrentTime(0);
    setIsPlaying(false);
  }, [contentGroup, episodeData]);

  // Simulated playback timer
  useEffect(() => {
    let timer;
    if (isPlaying && episodeData?.episode?.duration_seconds) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= episodeData.episode.duration_seconds) {
            setIsPlaying(false);
            return episodeData.episode.duration_seconds;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, episodeData, playbackSpeed]);

  if (isLoading) return <LoadingState message="Loading episode..." />;
  if (error) return <ErrorState message="Could not load the episode player." />;
  if (!episodeData) return <EmptyState message="Episode not found in catalogue." />;

  const { episode, show, season, episodeIndex, isTrailer } = episodeData;
  const totalDuration = episode.duration_seconds || 300;

  const rawThumbnail = episode.artwork?.thumbnail || episode.artwork?.banner || episode.artwork?.poster;
  const thumbnail = resolveAssetUrl(rawThumbnail);

  // Calculate Previous and Next Episode
  const currentSeasonEpisodes = season?.episodes || (isTrailer ? show?.trailers : []);
  const prevEpisode =
    typeof episodeIndex === 'number' && episodeIndex > 0
      ? currentSeasonEpisodes[episodeIndex - 1]
      : null;
  const nextEpisode =
    typeof episodeIndex === 'number' && episodeIndex < currentSeasonEpisodes.length - 1
      ? currentSeasonEpisodes[episodeIndex + 1]
      : null;

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const skipTime = (seconds) => {
    setCurrentTime((prev) => Math.max(0, Math.min(totalDuration, prev + seconds)));
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Navigation Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <Link
          to={`/show/${show.slug || show.show_id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--purple-700)',
            fontWeight: 600,
            fontSize: '0.92rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--purple-100)',
          }}
        >
          <ArrowLeft size={16} /> Back to {show.title}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {prevEpisode && (
            <Link
              to={`/episode/${prevEpisode.content_group}`}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
            >
              <ChevronLeft size={16} /> Previous
            </Link>
          )}

          {nextEpisode && (
            <Link
              to={`/episode/${nextEpisode.content_group}`}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
            >
              Next Episode <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>

      {/* Cinematic Video Player Container */}
      <div
        ref={playerContainerRef}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          backgroundColor: 'var(--navy-950)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Backdrop Thumbnail / Canvas Preview */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={episode.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isPlaying ? 0.35 : 0.65,
                transition: 'opacity 0.3s ease',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', opacity: 0.2 }}>
              <FallbackImage aspect="16/9" />
            </div>
          )}

          {/* Animated Playback Waveform / Pulse Indicator */}
          {isPlaying && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem',
                color: '#ffffff',
                pointerEvents: 'none',
              }}
            >
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '36px' }}>
                <span className="wave-bar" style={{ width: '6px', height: '24px', backgroundColor: 'var(--purple-500)', borderRadius: '3px', animation: 'wave 1s infinite ease-in-out' }} />
                <span className="wave-bar" style={{ width: '6px', height: '36px', backgroundColor: 'var(--yellow-500)', borderRadius: '3px', animation: 'wave 1.2s infinite ease-in-out 0.2s' }} />
                <span className="wave-bar" style={{ width: '6px', height: '18px', backgroundColor: 'var(--purple-500)', borderRadius: '3px', animation: 'wave 0.8s infinite ease-in-out 0.4s' }} />
                <span className="wave-bar" style={{ width: '6px', height: '30px', backgroundColor: 'var(--green-500)', borderRadius: '3px', animation: 'wave 1.1s infinite ease-in-out 0.1s' }} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.85 }}>
                Playing in {selectedLanguage ? selectedLanguage.toUpperCase() : 'Stereo'}
              </span>
            </div>
          )}
        </div>

        {/* Center Giant Play/Pause Overlay */}
        <div
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'rgba(107, 53, 200, 0.9)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              transform: isPlaying ? 'scale(0.85)' : 'scale(1)',
              opacity: isPlaying ? 0 : 0.95,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} fill="#ffffff" style={{ marginLeft: '4px' }} />}
          </div>
        </div>

        {/* Top Floating Info */}
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            padding: '1.5rem',
            background: 'linear-gradient(180deg, rgba(15, 6, 30, 0.8) 0%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#ffffff',
          }}
        >
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--purple-200)', textTransform: 'uppercase' }}>
              {show.title} • {isTrailer ? 'Trailer' : `Season ${season?.season_number || 1}`}
            </span>
            <h2 style={{ fontSize: '1.25rem', color: '#ffffff', margin: '2px 0 0 0', fontWeight: 700 }}>
              {episode.title}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {episode.languages?.map((lang) => (
              <button
                key={lang}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLanguage(lang);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  backgroundColor: selectedLanguage === lang ? 'var(--purple-600)' : 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: '1px solid',
                  borderColor: selectedLanguage === lang ? 'var(--purple-500)' : 'transparent',
                }}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Media Controls Bar */}
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            padding: '1.5rem',
            background: 'linear-gradient(0deg, rgba(15, 6, 30, 0.95) 0%, rgba(15, 6, 30, 0.5) 60%, transparent 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            color: '#ffffff',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Seek Scrubber Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="range"
              min="0"
              max={totalDuration}
              value={currentTime}
              onChange={handleSeek}
              style={{
                flex: 1,
                accentColor: 'var(--purple-500)',
                cursor: 'pointer',
                height: '5px',
              }}
              aria-label="Seek playback position"
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', minWidth: '95px', textAlign: 'right' }}>
              {formatDuration(currentTime)} / {formatDuration(totalDuration)}
            </span>
          </div>

          {/* Action Buttons Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Play / Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} fill="#ffffff" />}
              </button>

              {/* Rewind 10s */}
              <button
                onClick={() => skipTime(-10)}
                style={{ color: '#ffffff', display: 'flex', alignItems: 'center' }}
                aria-label="Rewind 10 seconds"
              >
                <RotateCcw size={19} />
              </button>

              {/* Fast Forward 10s */}
              <button
                onClick={() => skipTime(10)}
                style={{ color: '#ffffff', display: 'flex', alignItems: 'center' }}
                aria-label="Fast forward 10 seconds"
              >
                <RotateCw size={19} />
              </button>

              {/* Mute toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                style={{ color: '#ffffff', display: 'flex', alignItems: 'center' }}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Speed Selector */}
              <CustomDropdown
                value={String(playbackSpeed)}
                onChange={(val) => setPlaybackSpeed(parseFloat(val))}
                minWidth="85px"
                size="sm"
                direction="up"
                ariaLabel="Playback speed"
                options={[
                  { value: '0.75', label: '0.75x' },
                  { value: '1', label: '1.0x' },
                  { value: '1.25', label: '1.25x' },
                  { value: '1.5', label: '1.5x' },
                ]}
              />

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                style={{ color: '#ffffff', display: 'flex', alignItems: 'center' }}
                aria-label="Toggle Fullscreen"
              >
                <Maximize2 size={19} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Episode Details Card */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
              <Link
                to={`/show/${show.slug || show.show_id}`}
                style={{ color: 'var(--purple-700)', fontWeight: 700, fontSize: '0.95rem' }}
              >
                {show.title}
              </Link>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                {isTrailer ? 'Official Trailer' : `Season ${season?.season_number || 1}`}
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--navy-900)', margin: 0, fontWeight: 800 }}>
              {episode.title}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'var(--purple-100)',
                color: 'var(--purple-700)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              <Clock size={13} /> {formatDuration(totalDuration)}
            </span>

            {selectedLanguage && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--yellow-100)',
                  color: '#925400',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                <Globe size={13} /> {selectedLanguage}
              </span>
            )}
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
          {show.synopsis || 'Enjoy this wonderful episode on Peblo TV!'}
        </p>
      </div>

      {/* Up Next / More in this Season */}
      {currentSeasonEpisodes.length > 1 && (
        <CatalogueRow
          title={`More in ${isTrailer ? 'Trailers' : `Season ${season?.season_number || 1}`}`}
          count={currentSeasonEpisodes.length}
        >
          {currentSeasonEpisodes.map((ep) => (
            <EpisodeCard key={ep.content_group} episode={ep} width="260px" />
          ))}
        </CatalogueRow>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

export default EpisodePlayer;
