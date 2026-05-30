import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/api';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User) => void;
}

// ✅ Récupérer le user depuis le localStorage
const storedUser = localStorage.getItem('user');
const parsedUser = storedUser ? JSON.parse(storedUser) : null;

export const useAuthStore = create<AuthStore>((set) => ({
  user: parsedUser,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); // ✅ Persister
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Erreur de connexion',
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register({ username, email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); // ✅ Persister
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Erreur d\'inscription',
        isLoading: false 
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // ✅ Nettoyer
    set({ user: null, token: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user)); // ✅ Persister
    set({ user });
  },
}));