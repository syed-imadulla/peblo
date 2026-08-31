import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Eye, EyeOff, Lock, User, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotNotice, setForgotNotice] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError('');
    setForgotNotice(false);

    try {
      await login(username.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      {/* Ambient background soft glowing blobs */}
      <div className="ambient-blob blob-top-left" />
      <div className="ambient-blob blob-bottom-right" />
      <div className="ambient-blob blob-center-glow" />

      {/* Main 2-Column Authentication Card */}
      <div className="login-card">
        {/* LEFT COLUMN: Marketing & Dashboard Illustration */}
        <div className="marketing-panel">
          {/* Decorative background organic glows */}
          <div className="panel-glow panel-glow-1" />
          <div className="panel-glow panel-glow-2" />

          {/* Dots Grid in top right */}
          <div className="dots-grid" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="dot" />
            ))}
          </div>

          {/* Floating Sparkle Stars */}
          <svg className="sparkle sparkle-left" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C12 7 7 12 0 12C7 12 12 17 12 24C12 17 17 12 24 12C17 12 12 7 12 0Z" />
          </svg>
          <svg className="sparkle sparkle-top" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C12 7 7 12 0 12C7 12 12 17 12 24C12 17 17 12 24 12C17 12 12 7 12 0Z" />
          </svg>
          <svg className="sparkle sparkle-right" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C12 7 7 12 0 12C7 12 12 17 12 24C12 17 17 12 24 12C17 12 12 7 12 0Z" />
          </svg>

          {/* Header Brand Logo using official asset */}
          <div className="brand-header">
            <img 
              src="/eoEf12a30xBVz5Q1VMqOk8gbgs.avif" 
              alt="PeBlo Logo" 
              className="brand-img"
              onError={(e) => {
                e.target.src = '/peblo-logo.avif';
              }}
            />
            <span className="brand-cms-pill">CMS</span>
          </div>

          {/* Headline */}
          <h1 className="marketing-headline">
            Manage <span className="purple-emphasis">Content.</span>
            <br />
            Deliver <span className="purple-emphasis">Stories.</span>
          </h1>

          {/* Supporting Text */}
          <p className="marketing-description">
            PeBlo CMS helps you organize shows, episodes, and assets — and publish them beautifully to millions.
          </p>

          {/* 3D-styled CMS Illustration Preview */}
          <div className="illustration-container">
            {/* Ground shadow beneath objects */}
            <div className="ground-drop-shadow" />

            {/* Left Plant Pot with 3D lavender leaves */}
            <div className="plant-wrapper" aria-hidden="true">
              <svg width="88" height="118" viewBox="0 0 88 118" fill="none">
                <defs>
                  <linearGradient id="pot-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="50%" stopColor="#F9F7FF" />
                    <stop offset="100%" stopColor="#DDD4FA" />
                  </linearGradient>
                  <linearGradient id="pot-rim-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#DDD4FA" />
                  </linearGradient>
                  <linearGradient id="leaf-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C4B5FD" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                  <linearGradient id="leaf-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#DDD6FE" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                  <linearGradient id="leaf-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#6D28D9" />
                  </linearGradient>
                  <linearGradient id="leaf-grad-4" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EDE9FE" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                  <linearGradient id="leaf-grad-center" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#F5F3FF" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>

                {/* Leaves Background */}
                <path d="M44 62 C26 52 12 34 22 20 C32 6 42 42 44 62Z" fill="url(#leaf-grad-1)" />
                <path d="M44 62 C62 52 76 34 66 20 C56 6 46 42 44 62Z" fill="url(#leaf-grad-2)" />
                <path d="M44 64 C20 62 6 46 14 32 C22 18 36 46 44 64Z" fill="url(#leaf-grad-3)" />
                <path d="M44 64 C68 62 82 46 74 32 C66 18 52 46 44 64Z" fill="url(#leaf-grad-4)" />
                
                {/* Center Forefront Leaf */}
                <path d="M44 60 C44 38 36 16 44 6 C52 16 44 38 44 60Z" fill="url(#leaf-grad-center)" />

                {/* Pot Rim & Base */}
                <ellipse cx="44" cy="67" rx="21" ry="4.2" fill="url(#pot-rim-grad)" />
                <path d="M23 67 L28 104 C29 110 59 110 60 104 L65 67 Z" fill="url(#pot-body-grad)" />
                <ellipse cx="44" cy="104" rx="16" ry="3.8" fill="#C4B5FD" />
              </svg>
            </div>

            {/* Desktop Monitor Screen */}
            <div className="monitor-wrapper">
              <div className="monitor-screen-outer">
                {/* Screen Header Bar */}
                <div className="monitor-topbar">
                  <div className="topbar-logo">
                    <img 
                      src="/eoEf12a30xBVz5Q1VMqOk8gbgs.avif" 
                      alt="PeBlo" 
                      style={{ height: '12px', objectFit: 'contain', display: 'block' }} 
                      onError={(e) => { e.target.src = '/peblo-logo.avif'; }}
                    />
                    <span className="logo-badge">CMS</span>
                  </div>
                  <div className="topbar-heading">Dashboard</div>
                  <div className="topbar-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                {/* Screen Inner Dashboard Display */}
                <div className="monitor-screen-inner">
                  {/* Left Mini-Sidebar */}
                  <div className="mini-sidebar">
                    <div className="mini-nav-icon nav-active" />
                    <div className="mini-nav-icon" />
                    <div className="mini-nav-icon" />
                    <div className="mini-nav-icon" />
                    <div className="mini-nav-icon" />
                  </div>

                  {/* Main Preview Content */}
                  <div className="preview-main">
                    {/* Top Stat Cards */}
                    <div className="cards-grid">
                      {/* Video Stat Card */}
                      <div className="preview-card card-highlight">
                        <div className="card-video-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF">
                            <polygon points="6 4 20 12 6 20 6 4" />
                          </svg>
                        </div>
                        <div className="card-skeleton">
                          <div className="skel-line line-light" />
                          <div className="skel-line line-dark" />
                        </div>
                      </div>

                      {/* Folder Stat Card */}
                      <div className="preview-card">
                        <div className="card-folder-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#8B5CF6">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                        </div>
                        <div className="card-skeleton">
                          <div className="skel-line line-light" />
                          <div className="skel-line line-dark" />
                        </div>
                      </div>

                      {/* Analytics Stat Card */}
                      <div className="preview-card">
                        <div className="card-chart-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#8B5CF6">
                            <rect x="3" y="12" width="4" height="8" rx="1" />
                            <rect x="10" y="7" width="4" height="13" rx="1" />
                            <rect x="17" y="3" width="4" height="17" rx="1" />
                          </svg>
                        </div>
                        <div className="card-skeleton">
                          <div className="skel-line line-light" />
                          <div className="skel-line line-dark" />
                        </div>
                      </div>
                    </div>

                    {/* Table Rows Preview Card */}
                    <div className="table-preview-box">
                      <div className="preview-row">
                        <div className="row-dot dot-emerald" />
                        <div className="row-bar bar-w-1" />
                        <div className="row-pill pill-emerald" />
                      </div>
                      <div className="preview-row">
                        <div className="row-dot dot-purple" />
                        <div className="row-bar bar-w-2" />
                        <div className="row-pill pill-purple" />
                      </div>
                      <div className="preview-row">
                        <div className="row-dot dot-amber" />
                        <div className="row-bar bar-w-3" />
                        <div className="row-pill pill-emerald" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monitor Stand & Base */}
              <div className="monitor-neck" />
              <div className="monitor-foot" />
            </div>

            {/* Right Coffee Cup with eye logo badge */}
            <div className="cup-wrapper" aria-hidden="true">
              <svg width="68" height="96" viewBox="0 0 68 96" fill="none">
                <defs>
                  <linearGradient id="cup-body-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="65%" stopColor="#F5F3FF" />
                    <stop offset="100%" stopColor="#DDD4FA" />
                  </linearGradient>
                </defs>

                {/* Lid */}
                <rect x="9" y="6" width="50" height="8" rx="4" fill="#6D28D9" />
                <rect x="16" y="2" width="36" height="5" rx="2.5" fill="#5B21B6" />

                {/* Cup Body */}
                <path d="M11 14 L18 85 C18.5 90 49.5 90 50 85 L57 14 Z" fill="url(#cup-body-gradient)" />

                {/* Purple Center Band */}
                <path d="M13.5 37 L15.5 63 C16 65 52 65 52.5 63 L54.5 37 Z" fill="#8B5CF6" />

                {/* Eye Icon on Band */}
                <ellipse cx="34" cy="50" rx="9" ry="5.2" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
                <circle cx="34" cy="50" r="2.8" fill="#FFFFFF" />
              </svg>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sign In Form */}
        <div className="login-form-panel">
          {/* Form Header */}
          <div className="form-header">
            <h2 className="welcome-title">Welcome back 👋</h2>
            <p className="welcome-subtitle">Sign in to access your PeBlo CMS</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={18} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Forgot Password notice info */}
          {forgotNotice && (
            <div className="info-banner" role="status">
              <span>Please contact your system administrator to reset your credentials.</span>
            </div>
          )}

          {/* Unified Login Form */}
          <form onSubmit={handleSubmit} noValidate className="auth-form">
            {/* Username Input */}
            <div className="field-group">
              <label htmlFor="username" className="field-label">
                Username
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon-left" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                  className="text-input"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="field-group">
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="text-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                  className="toggle-password-btn"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="form-options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="remember-checkbox"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotNotice(true)}
                className="forgot-password-link"
              >
                Forgot password?
              </button>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className={`submit-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin-loader" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom Security Trust Badge */}
          <div className="security-badge-container">
            <div className="shield-icon-wrap">
              <ShieldCheck size={18} className="shield-icon" />
            </div>
            <div className="security-text-wrap">
              <div className="security-title">Secure access to PeBlo CMS</div>
              <div className="security-subtitle">Manage. Validate. Publish.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scoped CSS styling */}
      <style>{`
        .login-viewport {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: linear-gradient(135deg, #EDE5FC 0%, #F1EAFC 50%, #F6F1FF 100%);
          font-family: var(--font-sans, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
          position: relative;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        /* Ambient Glow Blobs */
        .ambient-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }
        .blob-top-left {
          top: -100px;
          left: -100px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, rgba(237, 229, 252, 0) 70%);
        }
        .blob-bottom-right {
          bottom: -120px;
          right: -120px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(246, 241, 255, 0) 70%);
        }
        .blob-center-glow {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 700px;
          height: 450px;
          background: radial-gradient(ellipse, rgba(192, 132, 252, 0.12) 0%, transparent 70%);
        }

        /* Main 2-Column Authentication Card */
        .login-card {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          width: 100%;
          max-width: 1020px;
          min-height: 630px;
          background-color: #FFFFFF;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 24px 60px -12px rgba(88, 28, 135, 0.14), 0 8px 24px -4px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(233, 222, 255, 0.8);
        }

        /* LEFT MARKETING PANEL */
        .marketing-panel {
          position: relative;
          background: linear-gradient(165deg, #F4EEFE 0%, #EFE8FD 60%, #E8DCFD 100%);
          padding: 48px 44px 32px 48px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          pointer-events: none;
        }
        .panel-glow-1 {
          top: -40px;
          left: -40px;
          width: 240px;
          height: 240px;
          background: rgba(216, 180, 254, 0.4);
        }
        .panel-glow-2 {
          bottom: 40px;
          right: -40px;
          width: 280px;
          height: 280px;
          background: rgba(192, 132, 252, 0.3);
        }

        /* Dots Matrix */
        .dots-grid {
          position: absolute;
          top: 40px;
          right: 44px;
          display: grid;
          grid-template-columns: repeat(5, 5px);
          gap: 8px;
          opacity: 0.35;
        }
        .dots-grid .dot {
          width: 4px;
          height: 4px;
          background-color: #7C3AED;
          border-radius: 50%;
        }

        /* Floating Sparkle Stars */
        .sparkle {
          position: absolute;
          color: #8B5CF6;
          opacity: 0.65;
          pointer-events: none;
        }
        .sparkle-left {
          top: 108px;
          left: 24px;
        }
        .sparkle-top {
          top: 72px;
          right: 110px;
        }
        .sparkle-right {
          top: 148px;
          right: 42px;
        }

        /* Brand Wordmark & CMS Badge */
        .brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 26px;
          position: relative;
          z-index: 2;
        }
        .brand-img {
          height: 32px;
          width: auto;
          object-fit: contain;
          display: block;
        }
        .brand-cms-pill {
          background-color: #6D35E8;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        /* Headline */
        .marketing-headline {
          font-size: 34px;
          font-weight: 800;
          line-height: 1.16;
          color: #181335;
          margin: 0 0 16px 0;
          letter-spacing: -0.6px;
          position: relative;
          z-index: 2;
        }
        .purple-emphasis {
          color: #6D35E8;
        }

        /* Subtext */
        .marketing-description {
          font-size: 14px;
          line-height: 1.55;
          color: #64748B;
          margin: 0 0 28px 0;
          max-width: 380px;
          position: relative;
          z-index: 2;
        }

        /* 3D Illustration Area */
        .illustration-container {
          position: relative;
          margin-top: auto;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 6px;
          z-index: 2;
        }

        .ground-drop-shadow {
          position: absolute;
          bottom: 2px;
          left: 8%;
          width: 84%;
          height: 16px;
          background: radial-gradient(ellipse, rgba(109, 40, 217, 0.22) 0%, rgba(109, 40, 217, 0) 75%);
          filter: blur(5px);
        }

        .plant-wrapper {
          position: relative;
          z-index: 3;
          margin-right: -16px;
          margin-bottom: 0px;
          filter: drop-shadow(0 8px 14px rgba(109, 40, 217, 0.14));
        }

        .monitor-wrapper {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .monitor-screen-outer {
          width: 290px;
          height: 174px;
          background: #25144A;
          border-radius: 12px;
          padding: 6px;
          box-shadow: 0 16px 36px rgba(37, 20, 74, 0.32), inset 0 1px 1px rgba(255, 255, 255, 0.2);
          display: flex;
          flex-direction: column;
        }

        .monitor-topbar {
          height: 22px;
          background: #FFFFFF;
          border-top-left-radius: 7px;
          border-top-right-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
          border-bottom: 1px solid #EDE9FE;
        }

        .topbar-logo {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .logo-badge {
          font-size: 6.5px;
          background: #6D35E8;
          color: #FFF;
          padding: 1px 3px;
          border-radius: 2px;
          font-weight: 700;
        }

        .topbar-heading {
          font-size: 9px;
          font-weight: 700;
          color: #6B7280;
        }

        .topbar-dots {
          display: flex;
          gap: 3px;
        }
        .topbar-dots span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #CBD5E1;
        }

        .monitor-screen-inner {
          flex: 1;
          background: #FAF8FF;
          border-bottom-left-radius: 7px;
          border-bottom-right-radius: 7px;
          display: flex;
          padding: 8px;
          gap: 8px;
        }

        .mini-sidebar {
          width: 16px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          align-items: center;
          padding-top: 3px;
          border-right: 1px solid #EDE9FE;
        }
        .mini-nav-icon {
          width: 9px;
          height: 9px;
          background: #DDD6FE;
          border-radius: 2px;
        }
        .mini-nav-icon.nav-active {
          background: #7C3AED;
        }

        .preview-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .cards-grid {
          display: flex;
          gap: 6px;
        }
        .preview-card {
          flex: 1;
          background: #FFFFFF;
          border-radius: 5px;
          padding: 5px;
          border: 1px solid #F3EDFF;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .card-video-icon {
          width: 16px;
          height: 16px;
          background: #7C3AED;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-folder-icon, .card-chart-icon {
          width: 16px;
          height: 16px;
          background: #F3EDFF;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-skeleton {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .skel-line {
          border-radius: 1px;
        }
        .line-light {
          width: 14px;
          height: 2px;
          background: #CBD5E1;
        }
        .line-dark {
          width: 26px;
          height: 3px;
          background: #94A3B8;
        }

        .table-preview-box {
          background: #FFFFFF;
          border-radius: 5px;
          padding: 6px;
          border: 1px solid #F3EDFF;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .preview-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .row-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
        }
        .dot-emerald { background: #10B981; }
        .dot-purple { background: #8B5CF6; }
        .dot-amber { background: #F59E0B; }
        .row-bar {
          height: 4px;
          background: #E2E8F0;
          border-radius: 2px;
        }
        .bar-w-1 { width: 100px; }
        .bar-w-2 { width: 80px; }
        .bar-w-3 { width: 90px; }
        .row-pill {
          width: 18px;
          height: 6px;
          border-radius: 2px;
          margin-left: auto;
        }
        .pill-emerald { background: #D1FAE5; }
        .pill-purple { background: #EDE9FE; }

        .monitor-neck {
          width: 18px;
          height: 20px;
          background: linear-gradient(180deg, #3B1B7A 0%, #25144A 100%);
        }
        .monitor-foot {
          width: 96px;
          height: 8px;
          background: linear-gradient(180deg, #4C2899 0%, #2E145E 100%);
          border-radius: 5px;
          box-shadow: 0 5px 12px rgba(46, 20, 94, 0.4);
        }

        .cup-wrapper {
          position: relative;
          z-index: 3;
          margin-left: -14px;
          margin-bottom: 0px;
          filter: drop-shadow(0 8px 14px rgba(109, 40, 217, 0.14));
        }

        /* RIGHT LOGIN FORM PANEL */
        .login-form-panel {
          padding: 52px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background-color: #FFFFFF;
        }

        .form-header {
          margin-bottom: 28px;
        }
        .welcome-title {
          font-size: 30px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 6px 0;
          letter-spacing: -0.5px;
        }
        .welcome-subtitle {
          font-size: 14.5px;
          color: #6B7280;
          margin: 0;
          line-height: 1.4;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          background-color: #FEF2F2;
          border: 1px solid #FEE2E2;
          color: #DC2626;
          font-size: 13.5px;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .error-icon {
          flex-shrink: 0;
          color: #EF4444;
        }

        .info-banner {
          padding: 12px 14px;
          border-radius: 10px;
          background-color: #F3EDFF;
          border: 1px solid #E9DEFD;
          color: #5B21B6;
          font-size: 13px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .field-label {
          font-size: 13.5px;
          font-weight: 600;
          color: #1F2937;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon-left {
          position: absolute;
          left: 14px;
          color: #9CA3AF;
          pointer-events: none;
        }

        .text-input {
          width: 100%;
          height: 48px;
          padding: 0 16px 0 44px;
          background-color: #FFFFFF;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          color: #111827;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
          font-family: inherit;
        }
        .text-input:focus {
          border-color: #6D35E8;
          box-shadow: 0 0 0 4px rgba(109, 53, 232, 0.12);
        }
        .text-input::placeholder {
          color: #9CA3AF;
        }

        .toggle-password-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: #9CA3AF;
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: color 0.15s ease;
        }
        .toggle-password-btn:hover {
          color: #4B5563;
        }

        .form-options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: -2px;
        }
        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: #4B5563;
          cursor: pointer;
          user-select: none;
        }
        .remember-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #6D35E8;
          border-radius: 4px;
          cursor: pointer;
        }

        .forgot-password-link {
          background: none;
          border: none;
          color: #6D35E8;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease, text-decoration 0.15s ease;
        }
        .forgot-password-link:hover {
          color: #5B21B6;
          text-decoration: underline;
        }

        .submit-btn {
          width: 100%;
          height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: #6D35E8;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(109, 53, 232, 0.32);
          transition: all 0.2s ease;
          outline: none;
          margin-top: 6px;
        }
        .submit-btn:hover:not(:disabled) {
          background-color: #5B21B6;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(109, 53, 232, 0.4);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-btn:disabled {
          background-color: #A78BFA;
          cursor: not-allowed;
          box-shadow: none;
        }

        .spin-loader {
          animation: spin 1s linear infinite;
        }

        /* Bottom Security Trust Badge */
        .security-badge-container {
          margin-top: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 18px;
          background-color: #FAF8FF;
          border: 1px solid #F3EEFE;
          border-radius: 14px;
        }
        .shield-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #F3EDFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .shield-icon {
          color: #6D35E8;
        }
        .security-text-wrap {
          display: flex;
          flex-direction: column;
        }
        .security-title {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        .security-subtitle {
          font-size: 11.5px;
          color: #9CA3AF;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive Layout */
        @media (max-width: 768px) {
          .login-card {
            grid-template-columns: 1fr;
            max-width: 460px;
            border-radius: 20px;
          }
          .marketing-panel {
            padding: 32px 24px 20px;
          }
          .illustration-container {
            display: none;
          }
          .marketing-headline {
            font-size: 26px;
            margin-bottom: 10px;
          }
          .marketing-description {
            font-size: 13px;
            margin-bottom: 10px;
          }
          .login-form-panel {
            padding: 28px 24px 36px;
          }
          .dots-grid {
            top: 24px;
            right: 24px;
          }
        }

        @media (max-width: 480px) {
          .login-viewport {
            padding: 16px 12px;
          }
          .welcome-title {
            font-size: 24px;
          }
          .login-form-panel {
            padding: 24px 18px 30px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
