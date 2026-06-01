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
    const isAuthCheckRequest = originalRequest.url?.includes('/api/auth/me');

    // If 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthCheckRequest) {
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

// ==================== PIN API FUNCTIONS ====================

//Save a pin

export const savePin = async (pinData) => {
  const response = await api.post('/api/pins/save', pinData);
  return response.data;
};

// Unsave a pin
export const unsavePin = async (imageId) => {
  const response = await api.post(`/api/pins/unsave/${imageId}`);
  return response.data;
};

// Get saved pins (paginated)
export const getSavedPins = async (page = 1, limit = 20) => {
  const response = await api.get('/api/pins/saved', {
    params: { page, limit }
  });
  return response.data;
};

// Check if pin is saved
export const checkPinSaved = async (imageId) => {
  const response = await api.get(`/api/pins/saved/${imageId}`);
  return response.data;
};

// Like a pin
export const likePin = async (imageId) => {
  const response = await api.post(`/api/pins/like/${imageId}`);
  return response.data;
};

// Unlike a pin
export const unlikePin = async (imageId) => {
  const response = await api.post(`/api/pins/unlike/${imageId}`);
  return response.data;
};

// Get total likes for a pin
export const getPinLikes = async (imageId) => {
  const response = await api.get(`/api/pins/likes/${imageId}`);
  return response.data;
};

// Check if pin is liked by current user
export const checkPinLiked = async (imageId) => {
  const response = await api.get(`/api/pins/liked/${imageId}`);
  return response.data;
};

export default api;

