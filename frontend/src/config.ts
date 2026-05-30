// ========================
// CONFIGURATION
// ========================

// Détection automatique : si on est sur localhost ou pas
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// URL de production (Render)
const PROD_API = 'https://syncphoria-api.onrender.com';

// URL locale (développement PC)
const LOCAL_API = 'http://localhost:5000';

// ✅ Switch automatique
const BASE_URL = isLocalhost ? LOCAL_API : PROD_API;

export const API_URL = `${BASE_URL}/api`;
export const SOCKET_URL = BASE_URL;
export const UPLOADS_URL = BASE_URL;