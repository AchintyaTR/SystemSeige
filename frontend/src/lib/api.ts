import axios from 'axios';

// The backend runs on port 8000
// Always use relative path so Next.js rewrites can proxy it to the backend!
const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for sending/receiving httpOnly JWT cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: forces Axios to prepend /api if a leading slash is accidentally used
api.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('/') && !config.url.startsWith('/api')) {
    config.url = `/api${config.url}`;
  }
  return config;
});
