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

export const disconnectSocket = (): void => {
  const s = getSocket();

  if (s.connected) {
    s.disconnect();
  }
};

export const resetSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};