import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  role: 'customer' | 'vendor' | 'admin';
  vendor_id?: string;
  name?: string;
  phone?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => set({
    user,
    token,
    isAuthenticated: true
  }),
  logout: () => set({
    user: null,
    token: null,
    isAuthenticated: false
  })
}));
