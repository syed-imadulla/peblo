import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AlertTriangle, AlertCircle, FileText } from 'lucide-react';

const fetchValidationReport = async () => {
  const { data } = await axios.get('/api/admin/validation-report');
  return data;
};

const Validation = () => {
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['validationReport'],
    queryFn: fetchValidationReport,
  });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
      Loading validation report...
    </div>
  );
  if (error) return <div className="badge badge-error">Error loading validation report: {error.message}</div>;

  const isBlocked = report.blocked_records_count > 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Validation Report</h1>
          <p className="text-muted">Detailed list of issues preventing content from being published.</p>
        </div>
        {isBlocked ? (
          <div className="badge badge-error" style={{ fontSize: '14px', padding: '6px 12px' }}>
            <AlertTriangle size={16} /> {report.blocked_records_count} Blocking Issues
          </div>
        ) : (
          <div className="badge badge-success" style={{ fontSize: '14px', padding: '6px 12px' }}>
            <FileText size={16} /> All Clear
          </div>
        )}
      </div>

      {!isBlocked ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--green-100)', color: 'var(--green-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FileText size={32} />
          </div>
          <h2 style={{ marginBottom: '8px' }}>Great news!</h2>
          <p className="text-muted">No validation issues found. The catalogue is ready for publishing.</p>
        </div>
      ) : (
        <div className="grid">
          {report.issues.map((issue, idx) => (
            <div key={idx} className="card" style={{ marginBottom: '0', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: issue.severity === 'error' ? 'var(--red-100)' : 'var(--amber-100)', color: issue.severity === 'error' ? 'var(--red-500)' : 'var(--amber-500)' }}>
                {issue.severity === 'error' ? <AlertCircle size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, color: 'var(--navy-900)' }}>{issue.issue_type}</h3>
                  <span className={`badge ${issue.severity === 'error' ? 'badge-error' : 'badge-warning'}`} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                    {issue.severity}
                  </span>
                </div>
                
                <p style={{ color: 'var(--text-main)', marginBottom: '16px', fontSize: '15px' }}>{issue.message}</p>
                
                <div style={{ backgroundColor: 'var(--background)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', marginBottom: '4px' }}>
                    <strong style={{ width: '100px' }}>Entity:</strong> 
                    <span style={{ color: 'var(--navy-900)', fontFamily: 'monospace' }}>{issue.entity_type} {issue.entity_id && `(${issue.entity_id})`}</span>
                  </div>
                  {issue.context && Object.keys(issue.context).length > 0 && (
                    <div style={{ display: 'flex' }}>
                      <strong style={{ width: '100px' }}>Context:</strong> 
                      <span style={{ fontFamily: 'monospace' }}>{JSON.stringify(issue.context)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Validation;
