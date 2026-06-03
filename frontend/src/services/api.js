import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cfa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-logout on login failures
      const isLoginRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/google-login');
      if (!isLoginRequest) {
        localStorage.removeItem('cfa_token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
