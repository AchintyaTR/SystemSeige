import axios from 'axios';

// The backend runs on port 8000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for sending/receiving httpOnly JWT cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
