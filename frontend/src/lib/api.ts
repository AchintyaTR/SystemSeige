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

// Removed flawed interceptor that caused /api/api/ endpoints
