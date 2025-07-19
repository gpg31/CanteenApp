import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import authService from '@/services/authService'

type UserRole = 'customer' | 'vendor' | 'admin'

interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  loginWithCredentials: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user: User, token: string) =>
        set({ user, token, isAuthenticated: true }),
      
      loginWithCredentials: async (email: string, password: string) => {
        try {
          const response = await authService.login({ email, password });
          
          if (response && response.token) {
            const user: User = {
              id: response.user.user_id,
              email: response.user.email,
              full_name: response.user.full_name,
              role: response.user.role as UserRole
            };
            
            set({ 
              user,
              token: response.token,
              isAuthenticated: true
            });
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },
      
      logout: async () => {
        try {
          // Optional: Call logout endpoint on backend
          // await authService.logout();
          set({ user: null, token: null, isAuthenticated: false });
        } catch (error) {
          console.error('Logout error:', error);
          // Still clear state even if API call fails
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
      
      checkAuth: async () => {
        try {
          if (!get().token) return false;
          
          // Verify the current token
          const { valid, user } = await authService.verifyToken();
          
          if (valid && user) {
            set({
              user: {
                id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role as UserRole
              },
              isAuthenticated: true
            });
            return true;
          } else {
            set({ user: null, token: null, isAuthenticated: false });
            return false;
          }
        } catch (error) {
          console.error('Token verification error:', error);
          set({ user: null, token: null, isAuthenticated: false });
          return false;
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)
