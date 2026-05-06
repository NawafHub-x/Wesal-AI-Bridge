// Dynamic Base URL configuration for Wesal AI Bridge
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '0.0.0.0' ||
                    window.location.hostname.includes('local');

const API_URL = isLocalhost
  ? 'http://localhost:5000'
  : 'https://wesal-ai-bridge-production.up.railway.app';

export default API_URL;
