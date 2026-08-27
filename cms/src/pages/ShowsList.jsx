import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Search } from 'lucide-react';

const fetchShows = async () => {
  const { data } = await axios.get('/api/admin/shows');
  return data;
};

const ShowsList = () => {
  const [search, setSearch] = useState('');
  
  const { data: shows, isLoading, error } = useQuery({
    queryKey: ['shows'],
    queryFn: fetchShows,
  });

  if (isLoading) return <div>Loading shows...</div>;
  if (error) return <div className="badge badge-error">Error loading shows: {error.message}</div>;

  const filteredShows = shows.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    (s.section && s.section.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Shows</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your content library.</p>
        </div>
        <button className="btn-primary">
          + Add New Show
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div className="input-group" style={{ margin: 0, flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search shows..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          {/* Add more filters here as needed */}
        </div>

        {filteredShows.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <strong>Nothing found yet.</strong>
            <p>Try another title or category.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Section</th>
                <th>Categories</th>
                <th>Seasons</th>
                <th>Artwork</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShows.map((show) => (
                <tr key={show.id}>
                  <td style={{ fontWeight: '600' }}>{show.title}</td>
                  <td>{show.section || '-'}</td>
                  <td>
                    {show.categories.length > 0 
                      ? show.categories.join(', ') 
                      : <span style={{ color: 'var(--text-muted)' }}>None</span>
                    }
                  </td>
                  <td>{show.seasons?.length || 0}</td>
                  <td>
                    {show.artwork?.length > 0 ? (
                      <span className="badge badge-published">{show.artwork.length} files</span>
                    ) : (
                      <span className="badge badge-error">Missing</span>
                    )}
                  </td>
                  <td>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ShowsList;
