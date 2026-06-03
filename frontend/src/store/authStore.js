import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('cfa_token') || null,
  user: null,
  isAuthenticated: !!localStorage.getItem('cfa_token'),
  login: (token, user) => {
    localStorage.setItem('cfa_token', token);
    set({ token, user, isAuthenticated: true });
  },
  setUser: (user) => {
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('cfa_token');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
