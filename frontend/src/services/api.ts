import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========================
// AUTH SERVICE
// ========================
export const authService = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  verifyEmail: (data: { email: string; code: string }) =>
    api.post('/auth/verify-email', data),

  getProfile: () =>
    api.get('/auth/profile'),

  updateProfile: (data: { username?: string; email?: string }) =>
    api.put('/auth/profile', data),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),

  deleteAccount: () =>
    api.delete('/auth/account'),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ========================
// ROOM SERVICE
// ========================
export const roomService = {
  createRoom: (data?: { title?: string }) =>
    api.post('/rooms/create', data || {}),

  joinRoom: (data: { roomCode: string }) =>
    api.post('/rooms/join', data),

  getRoom: (roomCode: string) =>
    api.get(`/rooms/${roomCode}`),

  getMessages: (roomCode: string) =>
    api.get(`/rooms/${roomCode}/messages`),

  getMyRooms: () =>
    api.get('/rooms/my-rooms'),

  leaveRoom: (roomCode: string) =>
    api.delete(`/rooms/${roomCode}/leave`),
};

export default api;