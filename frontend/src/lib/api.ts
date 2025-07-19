import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const API_URL = 'http://localhost:3005/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for CORS with credentials
});

// Add a request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    // Get the auth token from Zustand store
    const token = useAuthStore.getState().token;
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Logout user
      useAuthStore.getState().logout();
      
      // Redirect to login page - this needs client-side handling
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
