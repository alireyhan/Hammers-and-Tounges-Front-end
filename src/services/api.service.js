import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { cookieStorage } from '../utils/cookieStorage';

const baseURL = API_CONFIG.BASE_URL.endsWith('/')
  ? API_CONFIG.BASE_URL
  : `${API_CONFIG.BASE_URL}/`;

// Public endpoints - no Bearer token attached (avoids "Given token not valid" when old token exists)
// Note: auctions/events/ allows both guest (no token) and admin (with token) - token added when present
const PUBLIC_PATHS = [
  'users/login/',
  'users/register/',
  'users/verify-otp/',
  'users/resend-otp/',
  'users/token/refresh/',
  'users/password-reset-request/',
  'users/password-OTP-verify/',
  'users/password-reset-confirm/',
];

const isPublicPath = (url) => {
  const path = typeof url === 'string' ? url : '';
  return PUBLIC_PATHS.some((p) => path.includes(p));
};

const apiClient = axios.create({
  baseURL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const inFlightRequests = new Map();
const DEDUPE_METHODS = new Set(['get']);

const stableStringify = (value) => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value instanceof URLSearchParams) {
    return value.toString();
  }

  if (value instanceof FormData) {
    // FormData is mutable and can contain files/blobs; skip deep serialization.
    return '[form-data]';
  }

  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
};

const getRequestKey = (config) => {
  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';
  const params = stableStringify(config.params || {});
  const data = stableStringify(config.data || {});

  return `${method}|${url}|${params}|${data}`;
};

apiClient.interceptors.request.use((config) => {
  // Strip leading slash so path appends to baseURL (e.g. /auctions/events/ -> auctions/events/)
  if (typeof config.url === 'string' && config.url.startsWith('/')) {
    config.url = config.url.slice(1);
  }
  // For FormData, remove Content-Type so axios sets multipart/form-data with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  // Add auth token only for protected routes (skip for public/guest endpoints)
  if (!isPublicPath(config.url)) {
    const token = cookieStorage.getItem(cookieStorage.AUTH_KEYS.TOKEN);
    if (token && typeof token === 'string') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.isNetworkError = true;
    }
    return Promise.reject(error);
  }
);

const originalRequest = apiClient.request.bind(apiClient);

apiClient.request = (config = {}) => {
  const method = (config.method || 'get').toLowerCase();
  const shouldDedupe = DEDUPE_METHODS.has(method) && !config.skipDedupe;

  if (!shouldDedupe) {
    return originalRequest(config);
  }

  const requestKey = getRequestKey(config);
  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey);
  }

  const requestPromise = originalRequest(config).finally(() => {
    inFlightRequests.delete(requestKey);
  });

  inFlightRequests.set(requestKey, requestPromise);
  return requestPromise;
};

export default apiClient;
