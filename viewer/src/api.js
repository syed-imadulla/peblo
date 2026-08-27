import axios from 'axios';

const api = axios.create({
  baseURL: '/', // Uses Vite proxy to target backend
});

export const getCatalog = async () => {
  const response = await api.get('/catalog');
  return response.data;
};

export const searchCatalog = async (query) => {
  if (!query) return [];
  const response = await api.get('/catalog/search', { params: { q: query } });
  return response.data;
};
