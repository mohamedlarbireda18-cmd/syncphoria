// ========================
// CONFIGURATION
// ========================

// Détection automatique : si on est sur localhost ou pas
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// URLs Ngrok (pour accès externe)
const NGROK_URL = 'https://uncheck-sternness-scope.ngrok-free.dev';

// URLs locales (pour développement PC)
const LOCAL_API = 'http://localhost:5000';

// ✅ Switch automatique
const BASE_URL = isLocalhost ? LOCAL_API : NGROK_URL;

export const API_URL = `${BASE_URL}/api`;
export const SOCKET_URL = BASE_URL;
export const UPLOADS_URL = BASE_URL;