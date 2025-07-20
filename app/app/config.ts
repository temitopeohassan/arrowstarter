const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export const NEXT_PUBLIC_URL = isLocalhost
  ? 'http://localhost:3000'
  : 'https://arrowstarter.vercel.app';

export const API_BASE_URL = isLocalhost
  ? 'http://localhost:8080'
  : 'https://arrowstarter-backend.vercel.app';

export const BACK_END_API = API_BASE_URL; // reuse the same base
