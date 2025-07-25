import axios from "axios";

const API_BASE_URL = import.meta.env.MODE === "development" 
  ? "http://localhost:5002/api" 
  : "/api";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Thêm timestamp để prevent caching
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor với comprehensive error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response time nếu cần
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    if (duration > 3000) {
      console.warn(`Slow request detected: ${response.config.url} took ${duration}ms`);
    }
    return response;
  },
  (error) => {
    // SỬA LỖI: Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      // Timeout error
      error.message = 'Request timeout. Please check your connection and try again.';
    } else if (error.code === 'ERR_NETWORK') {
      // Network error
      error.message = 'Network error. Please check your internet connection.';
    } else if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - possibly expired token
          error.message = data?.message || 'Session expired. Please login again.';
          // Redirect to login if needed
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          error.message = data?.message || 'Access denied.';
          break;
        case 404:
          error.message = data?.message || 'Resource not found.';
          break;
        case 429:
          error.message = data?.message || 'Too many requests. Please try again later.';
          break;
        case 500:
          error.message = 'Server error. Please try again later.';
          break;
        default:
          error.message = data?.message || data?.error || 'An unexpected error occurred.';
      }
    } else if (error.request) {
      // Request made but no response received
      error.message = 'No response from server. Please check your connection.';
    }

    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      timestamp: new Date().toISOString()
    });

    return Promise.reject(error);
  }
);
