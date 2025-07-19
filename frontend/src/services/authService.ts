import api from '@/lib/api';
import axios from 'axios';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    user_id: string;
    full_name: string;
    email: string;
    role: string;
  };
  token: string;
}

export interface RegisterData extends AuthCredentials {
  full_name: string;
}

const authService = {
  login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data.message || 'Login failed');
        } else if (error.request) {
          console.error('No response received:', error.request);
          throw new Error('Could not connect to the server. Please try again.');
        }
      }
      throw error;
    }
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data.message || 'Registration failed');
        } else if (error.request) {
          console.error('No response received:', error.request);
          throw new Error('Could not connect to the server. Please try again.');
        }
      }
      throw error;
    }
  },

  verifyToken: async (): Promise<{ valid: boolean; user?: any }> => {
    try {
      const response = await api.get('/auth/verify');
      return { valid: true, user: response.data };
    } catch (error) {
      return { valid: false };
    }
  }
};

export default authService;
