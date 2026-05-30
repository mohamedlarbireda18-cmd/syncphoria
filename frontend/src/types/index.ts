// Types pour l'authentification
export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Types pour les rooms
export interface Room {
  _id: string;
  roomCode: string;
  hostId: string;
  participants: User[];
  createdAt: string;
}

export interface RoomState {
  currentRoom: Room | null;
  participants: User[];
  isHost: boolean;
}

// Types pour le chat
export interface Message {
  _id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
}