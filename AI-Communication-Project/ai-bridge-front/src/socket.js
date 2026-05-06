import { io } from 'socket.io-client';

// In production (Railway/Vercel), VITE_SOCKET_URL is set to the Railway backend URL.
// In local dev, fall back to empty string '' so the Vite proxy (vite.config.js) handles
// the Socket.io connection to http://127.0.0.1:5000 — no hardcoded localhost in the bundle.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  // Required for cookie-based auth in production when credentials are needed.
  withCredentials: false,
});

export default socket;
