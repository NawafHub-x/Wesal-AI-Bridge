import { io } from 'socket.io-client';
import API_URL from './config.js';

const socket = io(API_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  // Required for cookie-based auth in production when credentials are needed.
  withCredentials: false,
});

export default socket;
