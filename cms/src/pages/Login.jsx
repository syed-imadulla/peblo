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
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#0c0a17',
      backgroundImage: `
        radial-gradient(circle at 50% -20%, rgba(142, 81, 255, 0.25), transparent 70%),
        radial-gradient(circle at 100% 100%, rgba(75, 39, 181, 0.18), transparent 50%),
        radial-gradient(circle at 0% 100%, rgba(109, 40, 217, 0.15), transparent 50%)
      `,
      fontFamily: 'var(--font-sans, "Inter", system-ui, sans-serif)',
    }}>
      {/* Ambient background glow elements */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '350px',
        background: 'radial-gradient(ellipse, rgba(142, 81, 255, 0.15) 0%, rgba(75, 39, 181, 0.05) 50%, transparent 80%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Login Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'rgba(23, 20, 43, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(142, 81, 255, 0.08)',
        borderRadius: '24px',
        padding: '40px 32px',
        color: '#FFFFFF',
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
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
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
              color: '#A78BFA',
              borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
              paddingLeft: '10px',
            }}>
              TV CMS
            </span>
          </div>

          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: '-0.4px',
          }}>
            Welcome back
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#94A3B8',
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
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              fontSize: '13px',
              lineHeight: 1.4,
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, color: '#EF4444' }} />
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
                color: '#CBD5E1',
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
                color: '#64748B',
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
                  backgroundColor: 'rgba(15, 13, 29, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8E51FF';
                  e.target.style.boxShadow = '0 0 0 3px rgba(142, 81, 255, 0.25)';
                  e.target.style.backgroundColor = 'rgba(15, 13, 29, 0.9)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = 'rgba(15, 13, 29, 0.6)';
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
                color: '#CBD5E1',
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
                color: '#64748B',
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
                  backgroundColor: 'rgba(15, 13, 29, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8E51FF';
                  e.target.style.boxShadow = '0 0 0 3px rgba(142, 81, 255, 0.25)';
                  e.target.style.backgroundColor = 'rgba(15, 13, 29, 0.9)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = 'rgba(15, 13, 29, 0.6)';
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
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
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
              background: loading 
                ? 'rgba(109, 40, 217, 0.5)' 
                : 'linear-gradient(135deg, #8E51FF 0%, #6D28D9 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(142, 81, 255, 0.35)',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(142, 81, 255, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(142, 81, 255, 0.35)';
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
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>

        {/* Subtle footer info */}
        <div style={{
          marginTop: '28px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748B',
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
