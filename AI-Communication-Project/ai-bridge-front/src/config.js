// Dynamic Base URL configuration for Wesal AI Bridge
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://wesal-ai-bridge-production.up.railway.app';

export default API_URL;
