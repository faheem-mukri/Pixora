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
});

// Request interceptor: Add auth token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pixora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error (no response from server)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.userMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.message === 'Network Error') {
        error.userMessage = 'Network error. Please check your internet connection.';
      } else {
        error.userMessage = 'Unable to connect to the server. Please try again later.';
      }
      return Promise.reject(error);
    }

    // Handle specific HTTP status codes
    switch (error.response.status) {
      case 401:
        // Unauthorized - token expired or invalid
        localStorage.removeItem('pixora_token');
        localStorage.removeItem('pixora_user');
        error.userMessage = 'Your session has expired. Please login again.';
        // Redirect to login if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
        break;
      
      case 400:
        // Bad request - validation error
        error.userMessage = error.response.data?.msg || 'Invalid request. Please check your input.';
        break;
      
      case 403:
        // Forbidden
        error.userMessage = 'You do not have permission to perform this action.';
        break;
      
      case 404:
        // Not found
        error.userMessage = error.response.data?.msg || 'The requested resource was not found.';
        break;
      
      case 429:
        // Too many requests - rate limit
        error.userMessage = 'Too many requests. Please slow down and try again later.';
        break;
      
      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        error.userMessage = 'Server error. Our team has been notified. Please try again later.';
        break;
      
      default:
        error.userMessage = error.response.data?.msg || 'An unexpected error occurred. Please try again.';
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to make API calls with retry logic
 * @param {Function} apiCall - The API call function to execute
 * @param {number} maxRetries - Maximum number of retries (default: 2)
 * @returns {Promise} - The API response
 */
export const withRetry = async (apiCall, maxRetries = 2) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) except 429
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (i === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, i), 5000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

/**
 * Get user-friendly error message from API error
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Use custom userMessage if available
  if (error.userMessage) {
    return error.userMessage;
  }
  
  // Try to get message from response
  if (error.response?.data?.msg) {
    return error.response.data.msg;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  // Fallback to error message
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// ==================== PIN API FUNCTIONS ====================

/**
 * Save a pin
 */
export const savePin = async (pinData) => {
  const response = await api.post('/api/pins/save', pinData);
  return response.data;
};

/**
 * Unsave a pin
 */
export const unsavePin = async (imageId) => {
  const response = await api.delete(`/api/pins/unsave/${imageId}`);
  return response.data;
};

/**
 * Get saved pins (paginated)
 */
export const getSavedPins = async (page = 1, limit = 20) => {
  const response = await api.get('/api/pins/saved', {
    params: { page, limit }
  });
  return response.data;
};

/**
 * Check if pin is saved
 */
export const checkPinSaved = async (imageId) => {
  const response = await api.get(`/api/pins/saved/${imageId}`);
  return response.data;
};

/**
 * Like a pin
 */
export const likePin = async (imageId) => {
  const response = await api.post(`/api/pins/like/${imageId}`);
  return response.data;
};

/**
 * Unlike a pin
 */
export const unlikePin = async (imageId) => {
  const response = await api.delete(`/api/pins/unlike/${imageId}`);
  return response.data;
};

/**
 * Get pin likes
 */
export const getPinLikes = async (imageId, includeUsers = false) => {
  const response = await api.get(`/api/pins/likes/${imageId}`, {
    params: { includeUsers }
  });
  return response.data;
};

/**
 * Check if pin is liked
 */
export const checkPinLiked = async (imageId) => {
  const response = await api.get(`/api/pins/liked/${imageId}`);
  return response.data;
};

export default api;

