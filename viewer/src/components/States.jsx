import React from 'react';
import { Loader2, AlertCircle, Ghost } from 'lucide-react';

export const LoadingState = ({ message = "Loading..." }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--purple-700)' }}>
    <Loader2 size={48} style={{ animation: 'spin 2s linear infinite', marginBottom: '1rem' }} />
    <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{message}</p>
    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

export const ErrorState = ({ message = "Something went wrong" }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--red-500)', textAlign: 'center' }}>
    <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Oops!</h2>
    <p style={{ color: 'var(--navy-900)' }}>{message}</p>
  </div>
);

export const EmptyState = ({ message = "Nothing found here!" }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', textAlign: 'center' }}>
    <Ghost size={48} style={{ marginBottom: '1rem', color: 'var(--purple-100)' }} />
    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--navy-900)' }}>It's quiet...</h2>
    <p>{message}</p>
  </div>
);
