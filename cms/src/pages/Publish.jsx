import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { AlertTriangle, CheckCircle, Info, UploadCloud, ChevronRight, FileText } from 'lucide-react';

const fetchValidationReport = async () => {
  const { data } = await axios.get('/api/admin/validation-report');
  return data;
};

const publishCatalog = async () => {
  const { data } = await axios.post('/api/admin/catalog/publish');
  return data;
};

const Publish = () => {
  const { user } = useAuth();
  const [publishResult, setPublishResult] = useState(null);

  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['validationReport'],
    queryFn: fetchValidationReport,
  });

  const publishMutation = useMutation({
    mutationFn: publishCatalog,
    onSuccess: (data) => {
      setPublishResult({ type: 'success', data });
      refetch();
    },
    onError: (error) => {
      setPublishResult({ 
        type: 'error', 
        message: error.response?.data?.detail || error.message 
      });
    },
  });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
      Loading validation report...
    </div>
  );
  if (error) return <div className="badge badge-error">Error loading validation report: {error.message}</div>;

  const isBlocked = report.blocked_records_count > 0;
  const isAdmin = user?.role === 'admin';
  
  let publishDisabledReason = null;
  if (!isAdmin) {
    publishDisabledReason = "Only administrators can publish the catalogue.";
  } else if (isBlocked) {
    publishDisabledReason = "Publishing is disabled because there are blocking validation issues.";
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px' }}>Publish Catalogue</h1>
        <p className="text-muted">Review validation issues and publish your changes to the live Viewer.</p>
      </div>

      {publishDisabledReason && (
        <div style={{ backgroundColor: 'var(--amber-100)', color: 'var(--amber-500)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #FCD34D' }}>
          <Info size={24} />
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Publishing Disabled</strong>
            <span style={{ fontSize: '14px', color: '#B45309' }}>{publishDisabledReason}</span>
          </div>
        </div>
      )}

      {publishResult?.type === 'success' && (
        <div style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-500)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #86EFAC' }}>
          <CheckCircle size={24} />
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Successfully Published!</strong>
            <span style={{ fontSize: '14px', color: '#166534' }}>Published {publishResult.data.published_records} records to the live catalogue.</span>
          </div>
        </div>
      )}

      {publishResult?.type === 'error' && (
        <div style={{ backgroundColor: 'var(--red-100)', color: 'var(--red-500)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #FCA5A5' }}>
          <AlertTriangle size={24} />
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Publish Failed</strong>
            <span style={{ fontSize: '14px', color: '#991B1B' }}>{publishResult.message}</span>
          </div>
        </div>
      )}

      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px' }}>
        <div>
          <h2 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Current Status
            {isBlocked ? (
               <span className="badge badge-error">Blocked</span>
            ) : (
               <span className="badge badge-success">Ready</span>
            )}
          </h2>
          {isBlocked ? (
            <p className="text-muted">{report.blocked_records_count} record(s) have blocking issues.</p>
          ) : (
            <p className="text-muted">No blocking issues found. The catalogue is ready to be published.</p>
          )}
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => publishMutation.mutate()}
          disabled={!isAdmin || isBlocked || publishMutation.isPending}
          style={{ padding: '14px 28px', fontSize: '16px' }}
        >
          {publishMutation.isPending ? 'Publishing...' : (
            <>
              <UploadCloud size={20} /> Publish Now
            </>
          )}
        </button>
      </div>

      <Link to="/validation" className="card" style={{ display: 'block', textDecoration: 'none', transition: 'box-shadow 0.2s', ':hover': { boxShadow: 'var(--shadow-md)' } }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: isBlocked ? 'var(--red-100)' : 'var(--green-100)', color: isBlocked ? 'var(--red-500)' : 'var(--green-500)' }}>
              {isBlocked ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
            </div>
            <div>
              <h3 style={{ color: 'var(--navy-900)', marginBottom: '4px' }}>Validation Report</h3>
              <p className="text-muted" style={{ fontSize: '14px', margin: 0 }}>View detailed information about {report.blocked_records_count} validation issues.</p>
            </div>
          </div>
          <ChevronRight size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
      </Link>
    </div>
  );
};

export default Publish;
