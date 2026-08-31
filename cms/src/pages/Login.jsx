import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Eye, EyeOff, Lock, User, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError('');
    
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
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'linear-gradient(180deg, #EBE0FF 0%, #F3EDFF 50%, #F8F9FF 100%)',
      fontFamily: 'var(--font-sans, "Inter", system-ui, sans-serif)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle decorative background glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(ellipse, rgba(142, 81, 255, 0.18) 0%, rgba(235, 224, 255, 0.05) 70%, transparent 80%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Login Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '40px 32px',
        boxShadow: '0 12px 36px rgba(75, 39, 181, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(241, 243, 245, 0.9)',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: 'var(--purple-50, #F3EDFF)',
            border: '1px solid var(--purple-100, #EBE0FF)',
          }}>
            <img 
              src="/peblo-logo.avif" 
              alt="Peblo TV" 
              style={{ height: '24px', objectFit: 'contain', display: 'block' }} 
            />
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              color: 'var(--purple-700, #4B27B5)',
              borderLeft: '1px solid rgba(75, 39, 181, 0.2)',
              paddingLeft: '10px',
            }}>
              TV CMS
            </span>
          </div>

          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '800',
            color: 'var(--navy-900, #1B1833)',
            letterSpacing: '-0.4px',
          }}>
            Welcome back
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text-muted, #83859C)',
            lineHeight: 1.5,
          }}>
            Sign in to manage your Peblo TV content.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div 
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--red-50, #FFEBEB)',
              border: '1px solid var(--red-100, #FFD6D6)',
              color: 'var(--red-500, #EF4444)',
              fontSize: '13px',
              lineHeight: 1.4,
              marginBottom: '20px',
              fontWeight: '500',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, color: 'var(--red-500, #EF4444)' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username Field */}
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="username"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--navy-900, #1B1833)',
                marginBottom: '8px',
              }}
            >
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #83859C)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}>
                <User size={18} />
              </div>
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
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 16px 0 42px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  color: 'var(--text-main, #3B3C4A)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--purple-500, #8E51FF)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(142, 81, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '28px' }}>
            <label 
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--navy-900, #1B1833)',
                marginBottom: '8px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #83859C)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}>
                <Lock size={18} />
              </div>
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
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 46px 0 42px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  color: 'var(--text-main, #3B3C4A)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--purple-500, #8E51FF)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(142, 81, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #83859C)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--navy-900, #1B1833)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted, #83859C)'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: loading ? '#94A3B8' : 'var(--purple-700, #4B27B5)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(75, 39, 181, 0.25)',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#3D1F99';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(75, 39, 181, 0.35)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'var(--purple-700, #4B27B5)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(75, 39, 181, 0.25)';
              }
            }}
            onMouseDown={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(1px)';
              }
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div style={{
          marginTop: '28px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted, #83859C)',
        }}>
          Peblo TV Management Console &bull; Internal Access Only
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
