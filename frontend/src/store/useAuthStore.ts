import { create } from 'zustand';
import { AuthResponse } from '@/services/authService';
import { Session } from '@supabase/supabase-js';

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
  session: Session | null;
  isAuthenticated: boolean;
  setAuth: (auth: AuthResponse | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  setAuth: (auth) => set({
    user: auth?.user || null,
    session: auth?.session || null,
    isAuthenticated: !!auth?.user
  }),
  clearAuth: () => set({
    user: null,
    session: null,
    isAuthenticated: false
  })
}));
