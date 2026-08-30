import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ShowDetails from './pages/ShowDetails';
import EpisodePlayer from './pages/EpisodePlayer';
import Search from './pages/Search';
import Profile from './pages/Profile';
import * as api from './api';

// Mock the API calls
vi.mock('./api');

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const mockCatalog = {
  featured: [
    {
      show_id: '1',
      title: 'Featured Show',
      slug: 'featured-show',
      synopsis: 'A wonderful featured learning adventure.',
      categories: ['adventure', 'learning'],
      seasons: [
        {
          season_number: 1,
          episodes: [
            {
              content_group: 'featured-show-s01e01',
              title: 'First Episode',
              duration_seconds: 480,
              languages: ['en', 'hi'],
              artwork: { poster: '/assets/poster.jpg', thumbnail: '/assets/thumb.jpg' },
            },
          ],
        },
      ],
      trailers: [
        {
          content_group: 'featured-show-s00e01',
          title: 'Official Trailer',
          duration_seconds: 60,
          languages: ['en'],
          artwork: { thumbnail: '/assets/trailer.jpg' },
        },
      ],
    },
  ],
  series: [
    {
      show_id: '2',
      title: 'Moti Lives',
      slug: 'moti-lives',
      synopsis: 'Adventures across India.',
      categories: ['india', 'friendship'],
      seasons: [],
      trailers: [],
    },
  ],
};

describe('Viewer App', () => {
  it('renders loading state on Home', () => {
    api.getCatalog.mockReturnValue(new Promise(() => {})); // Never resolves
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders catalogue sections on Home', async () => {
    api.getCatalog.mockResolvedValue({
      featured: [{ show_id: '1', title: 'Featured Show', slug: 'featured-show' }],
    });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('featured')).toBeInTheDocument();
      expect(screen.getByText('Featured Show')).toBeInTheDocument();
    });
  });

  it('Search handles empty input', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/search']}>
          <Search />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Enter a search term above.')).toBeInTheDocument();
  });

  it('Search handles no results', async () => {
    api.searchCatalog.mockResolvedValue([]);

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/search?q=xyz123']}>
          <Search />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No results found for "xyz123".')).toBeInTheDocument();
    });
  });

  it('renders Browse page with show cards and filters', async () => {
    api.getCatalog.mockResolvedValue(mockCatalog);
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/browse']}>
          <Browse />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Browse Shows')).toBeInTheDocument();
      expect(screen.getByText('Featured Show')).toBeInTheDocument();
      expect(screen.getByText('Moti Lives')).toBeInTheDocument();
      expect(screen.getByText('All Sections')).toBeInTheDocument();
    });
  });

  it('renders ShowDetails page with metadata, trailers, and seasons', async () => {
    api.getCatalog.mockResolvedValue(mockCatalog);
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/show/featured-show']}>
          <Routes>
            <Route path="/show/:slug" element={<ShowDetails />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Featured Show')).toBeInTheDocument();
      expect(screen.getByText('A wonderful featured learning adventure.')).toBeInTheDocument();
      expect(screen.getByText('Season 1')).toBeInTheDocument();
      expect(screen.getByText('First Episode')).toBeInTheDocument();
      expect(screen.getByText('Trailers & Previews')).toBeInTheDocument();
    });
  });

  it('renders EpisodePlayer page with controls and metadata', async () => {
    api.getCatalog.mockResolvedValue(mockCatalog);
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/episode/featured-show-s01e01']}>
          <Routes>
            <Route path="/episode/:contentGroup" element={<EpisodePlayer />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('First Episode').length).toBeGreaterThan(0);
      expect(screen.getByText(/Back to Featured Show/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Seek playback position')).toBeInTheDocument();
    });
  });

  it('renders Profile page with viewer playback preferences', async () => {
    api.getCatalog.mockResolvedValue(mockCatalog);
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/profile']}>
          <Profile />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Profile & Preferences')).toBeInTheDocument();
      expect(screen.getByText('English (EN)')).toBeInTheDocument();
      expect(screen.getByText('Hindi (HI)')).toBeInTheDocument();
      expect(screen.getByText('Autoplay Next Episode')).toBeInTheDocument();
    });
  });
});
