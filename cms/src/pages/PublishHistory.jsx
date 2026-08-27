import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { History, CheckCircle, AlertTriangle } from 'lucide-react';

const fetchPublishHistory = async () => {
  const { data } = await axios.get('/api/admin/publish-history');
  return data;
};

const PublishHistory = () => {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['publishHistory'],
    queryFn: fetchPublishHistory,
  });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
      Loading publish history...
    </div>
  );
  
  if (error) return <div className="badge badge-error">Error loading history: {error.message}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Publish History</h1>
          <p className="text-muted">A record of all catalogue publish events.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {(!history || history.length === 0) ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--purple-100)', color: 'var(--purple-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <History size={24} />
            </div>
            <h3 style={{ color: 'var(--navy-900)', marginBottom: '8px' }}>No history found</h3>
            <p>The catalogue has not been published yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Date & Time</th>
                  <th>Status</th>
                  <th>Records Processed</th>
                  <th>Published</th>
                  <th>Blocked</th>
                  <th style={{ paddingRight: '24px' }}>Triggered By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((run) => {
                  const date = new Date(run.created_at);
                  const formattedDate = date.toLocaleDateString();
                  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <tr key={run.id}>
                      <td style={{ paddingLeft: '24px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--navy-900)' }}>{formattedDate}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formattedTime}</div>
                      </td>
                      <td>
                        {run.status === 'success' ? (
                          <span className="badge badge-success"><CheckCircle size={14} /> Success</span>
                        ) : (
                          <span className="badge badge-error"><AlertTriangle size={14} /> Failed</span>
                        )}
                      </td>
                      <td>{run.total_records_processed}</td>
                      <td>
                        <span style={{ color: 'var(--green-500)', fontWeight: '600' }}>
                          {run.published_records}
                        </span>
                      </td>
                      <td>
                        {run.blocked_records > 0 ? (
                           <span style={{ color: 'var(--red-500)', fontWeight: '600' }}>{run.blocked_records}</span>
                        ) : (
                           <span className="text-muted">0</span>
                        )}
                      </td>
                      <td style={{ paddingRight: '24px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {run.triggered_by || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishHistory;
