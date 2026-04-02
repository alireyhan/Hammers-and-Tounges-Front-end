// export const API_CONFIG = {
//   BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://207.180.233.44:8001',

//   TIMEOUT: 30000,
//   IS_PRODUCTION: import.meta.env.PROD,
//   IS_DEVELOPMENT: import.meta.env.DEV,
//   APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
// };

const getBaseUrl = () => {
  // Enforce relative paths in production to leverage Netlify/Vercel proxies
  if (import.meta.env.PROD) return '/api';

  // If someone explicitly configured the env var, prefer it
  const envUrlRaw = import.meta.env.VITE_API_BASE_URL;
  const envUrl = typeof envUrlRaw === 'string' ? envUrlRaw.trim() : '';

  if (envUrl) {
    // If it's already a path (e.g. '/api'), just use it as-is.
    if (envUrl.startsWith('/')) return envUrl;

    // Absolute URL: append '/api' if missing.
    const base = envUrl;
    return base.endsWith('/api') ? base : `${base.replace(/\/$/, '')}/api`;
  }

  // Defaults fallback
  return 'https://developer.hashverx.com/api';
};

const getWebSocketBaseUrl = () => {
  const envUrlRaw = import.meta.env.VITE_API_BASE_URL;
  const envUrl = typeof envUrlRaw === 'string' ? envUrlRaw.trim() : '';

  // If it's a relative path like '/api', keep it (assumes websocket is under same prefix).
  if (envUrl && envUrl.startsWith('/')) return envUrl;

  const base = envUrl || 'https://developer.hashverx.com';
  const clean = base.replace(/\/$/, '').replace(/^http/, 'ws');
  return clean;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  WEB_SOCKET_URL: getWebSocketBaseUrl(),
  TIMEOUT: 30000,

  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
  MEDIA_BASE_URL: import.meta.env.VITE_MEDIA_BASE_URL,
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
};

// export const API_CONFIG = {
//   BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://207.180.233.44:8001/api',
//   MEDIA_BASE_URL: import.meta.env.VITE_MEDIA_BASE_URL,

//   TIMEOUT: 30000,
//   IS_PRODUCTION: import.meta.env.PROD,
//   IS_DEVELOPMENT: import.meta.env.DEV,
//   APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
// };

// export const API_CONFIG = {
//   BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://207.180.233.44:8001',
//   MEDIA_BASE_URL: import.meta.env.VITE_MEDIA_BASE_URL || 'http://207.180.233.44:8001',
//   TIMEOUT: 30000,
//   IS_PRODUCTION: import.meta.env.PROD,
//   IS_DEVELOPMENT: import.meta.env.DEV,
//   APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
// };

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  if (API_CONFIG.IS_PRODUCTION) {
    // In production, use relative URLs that will be proxied by Netlify
    return `/${cleanEndpoint}`;
  }

  // In development, use full URL
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

// Helper function to get full media URL
export const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return '';

  let path = String(mediaPath);

  // 1. Handle the specific insecure backend origin
  if (path.startsWith('http://207.180.233.44:8001')) {
    // Backwards compatibility for old deployments
    path = path.replace('http://207.180.233.44:8001', '');
  } else if (path.startsWith('https://developer.hashverx.com')) {
    // New API/media host
    path = path.replace('https://developer.hashverx.com', '');
  } else if (path.startsWith('http://') || path.startsWith('https://')) {
    // 2. Handle other full URLs (e.g. unsplash)
    return path;
  }

  // 3. Normalize leading slashes
  while (path.startsWith('/')) {
    path = path.slice(1);
  }

  // 4. In production, we want it to be relative to the domain (proxied by Netlify)
  if (API_CONFIG.IS_PRODUCTION) {
    // If it already starts with 'media/', just ensure it has a single leading slash
    if (path.startsWith('media/')) {
      return `/${path}`;
    }
    // Otherwise, prepend '/media/'
    return `/media/${path}`;
  }

  // 5. In development, use MEDIA_BASE_URL
  // If path already starts with 'media/', we might need to be careful.
  // Assuming MEDIA_BASE_URL is the origin (http://...:8001)
  if (path.startsWith('media/')) {
    return `${API_CONFIG.MEDIA_BASE_URL || 'http://207.180.233.44:8001'}/${path}`;
  }

  return `${API_CONFIG.MEDIA_BASE_URL || 'http://207.180.233.44:8001'}/media/${path}`;
};

export const API_ROUTES = {
  // Authentication
  REGISTER: '/users/register/',
  LOGIN: '/users/login/',
  VERIFY_OTP: '/users/verify-otp/',
  RESEND_OTP: '/users/resend-otp/',
  REFRESH_TOKEN: '/users/token/refresh/',
  PASSWORD_RESET_REQUEST: '/users/password-reset-request/',
  PASSWORD_OTP_VERIFY: '/users/password-OTP-verify/',
  PASSWORD_RESET_CONFIRM: '/users/password-reset-confirm/',

  // Profile (try /users/profile/ first; some backends use /users/me/)
  PROFILE: '/users/profile/',
  PROFILE_ME: '/users/me/',
  PROFILE_DELETE: '/users/profile/delete/',
  PROFILE_UPDATE: '/users/profile/',
  WALLET: '/users/wallet/',
  DEPOSIT: '/payments/deposit/',
  PAYMENTS_HISTORY: '/payments/history/',

  // Admin Routes
  ADMIN_DASHBOARD: '/inspections/admin/dashboard/',
  ADMIN_USER_ACTION: '/inspections/admin/user-action/',
  ADMIN_ASSIGN_AUCTION: '/inspections/admin/assign/',
  ADMIN_USERS_LIST: '/inspections/admin/users/',
  ADMIN_UPDATE_USER: '/users/admin/', // + userId + /update/
  ADMIN_CREATE_STAFF: '/users/admin/create-staff/',
  ADMIN_USER_MANAGEMENT: '/inspections/admin/user-management/', // POST create seller, PATCH + id + / for edit
  ADMIN_USER_PERMISSIONS: '/inspections/admin/user-permissions/', // GET/PATCH user feature permissions
  AUCTION_LISTINGS: '/auctions/listings/',
  FETCH_CATEGORIES: '/auctions/categories/',
  CREATE_CATEGORY: '/auctions/categories/',
  UPDATE_CATEGORY: '/auctions/categories/',
  DELETE_CATEGORY: '/auctions/categories/',
  TOGGLE_CATEGORY: '/auctions/categories/', // + categoryId + /toggle/

  // Manager Routes
  MANAGER_TASKS: '/inspections/manager/tasks/',
  MANAGER_INSPECT: '/inspections/manager/inspect/', // + auction_id
  INSPECTION_REPORTS: '/inspections/reports/',
  INSPECTION_REPORT_DETAIL: '/inspections/reports/', // + report_id

  // Checklist/Template Routes
  INSPECTION_TEMPLATES: '/inspections/templates/',
  INSPECTION_TEMPLATE_DETAIL: '/inspections/templates/', // + template_id

  //// Auction Routes (Common for all)
  AUCTIONS_EVENTS: '/auctions/events/',
  AUCTIONS_LOTS: '/auctions/lots/',
  AUCTIONS_LOTS_FACETS: '/auctions/lots/facets/',
  AUCTIONS_LIST: '/auctions/listings/',
  // AUCTION_DETAIL: '/auctions/listings/', // + auction_id
  AUCTION_CATEGORIES: '/auctions/categories/',
  AUCTION_CATEGORY_DETAIL: '/auctions/categories/', // + category_id

  // Seller Routes
  CREATE_AUCTION: '/auctions/listings/',
  UPDATE_AUCTION: '/auctions/listings/', // + auction_id
  DELETE_AUCTION: '/auctions/listings/', // + auction_id

  AUCTION_APPROVAL_REQUEST: '/auctions/listings/',
  AUCTION_ACTION: '/auctions/listings/', // + auction_id + /action/

  // Buyer Routes
  PLACE_BID: '/auctions/bid/',
  GET_AUCTION_BIDS: '/auctions/listings/', // + auction_id + /bids/

  AUCTION_BID_HISTORY: '/auctions/listings/', // + auction_id + /bid-history/
  BIDS_LIST: '/auctions/bids/my/',
  // BIDS_NO: '/auctions/bids//my/',

  WATCH_LIST: '/auctions/watchlist/',  // get all favorite auctions
  FAVORITE_AUCTIONS: '/auctions/listings/',  // get all favorite auctions

};