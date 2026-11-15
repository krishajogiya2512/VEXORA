import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// In-flight GET request deduplication cache
const inFlightRequests = new Map();

function getRequestKey(config) {
  if (config.method?.toLowerCase() !== 'get') return null;
  const paramsKey = config.params ? JSON.stringify(config.params) : '';
  return `${config.url}?${paramsKey}`;
}

// Request interceptor – attach JWT token & deduplicate identical GETs
api.interceptors.request.use(
  (config) => {
    // Validate and attach authentication token
    try {
      const token = localStorage.getItem('vexora_token');
      if (token && token.trim()) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }
    } catch (_) {}

    // Avoid duplicate concurrent GET requests
    const key = getRequestKey(config);
    if (key && inFlightRequests.has(key)) {
      config.adapter = () => inFlightRequests.get(key);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle auth expiration and extract clean errors
api.interceptors.response.use(
  (response) => {
    const key = getRequestKey(response.config);
    if (key) inFlightRequests.delete(key);
    return response;
  },
  (error) => {
    if (error.config) {
      const key = getRequestKey(error.config);
      if (key) inFlightRequests.delete(key);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('vexora_token');
      localStorage.removeItem('vexora_user');
      window.dispatchEvent(new CustomEvent('vexora:auth-expired'));
    }

    // Attach user-friendly normalized message
    error.userMessage = getErrorMessage(error);

    return Promise.reject(error);
  }
);

/**
 * Normalizes API error objects into a consistent human-readable string.
 */
export function getErrorMessage(error, defaultMsg = 'An unexpected error occurred') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message === 'Network Error') return 'Unable to connect to VEXORA backend server.';
  if (error?.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  return error?.message || defaultMsg;
}

export default api;
