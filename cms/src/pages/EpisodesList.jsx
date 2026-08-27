import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Search, Edit2 } from 'lucide-react';

const fetchShows = async () => {
  const { data } = await axios.get('/api/admin/shows');
  return data;
};

const EpisodesList = () => {
  const [search, setSearch] = useState('');
  
  const { data: shows, isLoading, error } = useQuery({
    queryKey: ['shows'],
    queryFn: fetchShows,
  });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
      Loading episodes...
    </div>
  );
  if (error) return <div className="badge badge-error">Error loading episodes: {error.message}</div>;

  // Flatten all episodes from all shows and seasons
  const allEpisodes = [];
  shows?.forEach(show => {
    show.seasons?.forEach(season => {
      season.episodes?.forEach(episode => {
        allEpisodes.push({
          ...episode,
          showTitle: show.title,
          seasonNumber: season.season_number
        });
      });
    });
  });

  const filteredEpisodes = allEpisodes.filter(ep => 
    ep.episode_title.toLowerCase().includes(search.toLowerCase()) || 
    ep.showTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Episodes</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage individual episodes and their metadata.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '16px', padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <div className="input-group" style={{ margin: 0, width: '320px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by episode or show title..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        {filteredEpisodes.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--purple-100)', color: 'var(--purple-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Search size={24} />
            </div>
            <h3 style={{ color: 'var(--navy-900)', marginBottom: '8px' }}>No episodes found</h3>
            <p>Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Episode Title</th>
                  <th>Show</th>
                  <th>Season</th>
                  <th>Language</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th style={{ paddingRight: '24px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEpisodes.map((ep) => (
                  <tr key={ep.id}>
                    <td style={{ fontWeight: '600', paddingLeft: '24px', color: 'var(--navy-900)' }}>{ep.episode_title}</td>
                    <td>{ep.showTitle}</td>
                    <td>S{ep.seasonNumber}</td>
                    <td>{ep.language || <span className="text-muted">-</span>}</td>
                    <td>{ep.duration_seconds ? `${Math.floor(ep.duration_seconds / 60)}m ${ep.duration_seconds % 60}s` : <span className="text-muted">-</span>}</td>
                    <td>
                      {ep.status === 'published' ? (
                        <span className="badge badge-success">Published</span>
                      ) : (
                        <span className="badge badge-draft">Draft</span>
                      )}
                    </td>
                    <td style={{ paddingRight: '24px', textAlign: 'right' }}>
                      <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }}>
                        <Edit2 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EpisodesList;
