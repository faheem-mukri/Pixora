import axios from 'axios';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Send cookies automatically
});

// Response interceptor: Handle token refresh and common errors
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(
          `${API_URL}/api/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        if (data.data?.accessToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken || refreshToken);
          
          // Retry original request with new token (now in cookie)
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

