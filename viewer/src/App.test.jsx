import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import Search from './pages/Search';
import * as api from './api';

// Mock the API calls
vi.mock('./api');

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

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
      featured: [
        { show_id: '1', title: 'Featured Show', slug: 'featured-show' }
      ]
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
});
