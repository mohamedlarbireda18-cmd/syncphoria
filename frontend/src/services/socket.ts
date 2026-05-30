import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (): Socket => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  // Plus de déconnexion automatique
};

export const leaveRoom = (roomCode: string, username: string) => {
  if (socket?.connected) {
    socket.emit('leave-room', roomCode, username);
  }
};

export const fullDisconnect = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};