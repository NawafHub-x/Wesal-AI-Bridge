import { io } from 'socket.io-client';

// Get token from localStorage or use null
const getToken = () => {
  return localStorage.getItem('bridge_token') || null;
};

const socket = io('http://localhost:5000', {
  auth: {
    token: getToken()
  }
});

// Update token when user logs in
const updateToken = (newToken) => {
  socket.auth.token = newToken;
  socket.connect();
};

export { updateToken };
export default socket;
