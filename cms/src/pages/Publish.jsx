import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../components/AuthProvider';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

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

  if (isLoading) return <div>Loading validation report...</div>;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Publish Catalogue</h1>
          <p style={{ color: 'var(--text-muted)' }}>Review validation issues and publish changes to the Viewer.</p>
        </div>
        <div>
          <button 
            className="btn-primary" 
            onClick={() => publishMutation.mutate()}
            disabled={!isAdmin || isBlocked || publishMutation.isPending}
            style={{ padding: '12px 24px', fontSize: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            {publishMutation.isPending ? 'Publishing...' : 'Publish Catalogue'}
          </button>
        </div>
      </div>

      {publishDisabledReason && (
        <div style={{ backgroundColor: 'var(--red-100)', color: 'var(--red-500)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Info size={24} />
          <strong>{publishDisabledReason}</strong>
        </div>
      )}

      {publishResult?.type === 'success' && (
        <div style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-500)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={24} />
          <div>
            <strong>Successfully Published!</strong>
            <div>Published {publishResult.data.published_records} records.</div>
          </div>
        </div>
      )}

      {publishResult?.type === 'error' && (
        <div style={{ backgroundColor: 'var(--red-100)', color: 'var(--red-500)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={24} />
          <div>
            <strong>Publish Failed</strong>
            <div>{publishResult.message}</div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Current Status
          {isBlocked ? (
             <span className="badge badge-error">Blocked</span>
          ) : (
             <span className="badge badge-published">Ready</span>
          )}
        </h2>
        
        {isBlocked ? (
          <p>{report.blocked_records_count} record(s) have blocking issues.</p>
        ) : (
          <p>No blocking issues found. The catalogue is ready to be published.</p>
        )}
      </div>

      {isBlocked && (
        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>Validation Report</h2>
          <div className="grid">
            {report.issues.map((issue, idx) => (
              <div key={idx} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>{issue.issue_type}</strong>
                  <span className="badge badge-error">{issue.severity}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>{issue.message}</p>
                <div style={{ fontSize: '13px', backgroundColor: 'var(--background)', padding: '8px', borderRadius: '4px' }}>
                  <div><strong>Entity:</strong> {issue.entity_type} {issue.entity_id && `(${issue.entity_id})`}</div>
                  {issue.context && Object.keys(issue.context).length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      <strong>Context:</strong> {JSON.stringify(issue.context)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Publish;
