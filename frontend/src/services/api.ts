import axios, { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Simple In-Memory Cache for lightning fast UI navigation
const requestCache = new Map<string, { timestamp: number; data: any; promise?: Promise<any> }>();
const CACHE_TTL = 30000; // 30 seconds

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('campusfix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Bust cache on any mutation
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      requestCache.clear();
    }

    // Return cached data immediately if available and fresh
    if (config.method?.toLowerCase() === 'get') {
      const cacheKey = `${config.url}?${new URLSearchParams(config.params || {}).toString()}`;
      const cached = requestCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (cached.data) {
          config.adapter = () => Promise.resolve({
            data: cached.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          });
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    if (response.config.method?.toLowerCase() === 'get') {
      const cacheKey = `${response.config.url}?${new URLSearchParams(response.config.params || {}).toString()}`;
      requestCache.set(cacheKey, { timestamp: Date.now(), data: response.data });
    }
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('campusfix_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const apiError = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network request failed'
    };
    return Promise.reject(apiError);
  }
);
