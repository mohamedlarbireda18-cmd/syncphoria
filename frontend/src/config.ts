// ========================
// CONFIGURATION
// ========================

// Détection automatique : si on est sur production ou local
const PROD_API = 'https://syncphoria-api.onrender.com';

// URL locale : utilise le même host que la page actuelle
const LOCAL_API = typeof window !== 'undefined' 
  ? `http://${window.location.hostname}:5000`
  : 'http://localhost:5000';

// ✅ Détecte si on est sur production ou localhost
const isProduction = typeof window !== 'undefined' && 
  !window.location.hostname.includes('localhost') && 
  !window.location.hostname.startsWith('192') && 
  !window.location.hostname.startsWith('127');

const BASE_URL = isProduction ? PROD_API : LOCAL_API;

export const API_URL = `${BASE_URL}/api`;
export const SOCKET_URL = BASE_URL;
export const UPLOADS_URL = BASE_URL;