import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import passport from './config/passport';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

// ✅ CORS simplifié pour la production
app.use(cors({ origin: true, credentials: true }));

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Watch Party API is running...' });
});

// ========================
// SOCKET.IO
// ========================
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join-room', (roomCode: string, username: string) => {
    socket.join(roomCode);
    console.log(`${username} joined room ${roomCode}`);
    socket.to(roomCode).emit('user-joined', { socketId: socket.id, username });
    const clients = io.sockets.adapter.rooms.get(roomCode);
    const participants = clients ? Array.from(clients) : [];
    io.to(roomCode).emit('participants-update', { participants });
  });

  socket.on('leave-room', (roomCode: string, username: string) => {
    socket.leave(roomCode);
    console.log(`${username} left room ${roomCode}`);
    socket.to(roomCode).emit('user-left', { socketId: socket.id, username });
    const clients = io.sockets.adapter.rooms.get(roomCode);
    const participants = clients ? Array.from(clients) : [];
    io.to(roomCode).emit('participants-update', { participants });
  });

  socket.on('send-message', async (roomCode: string, data: { username: string; message: string; avatar?: string; userId: string }) => {
    try {
      const room = await prisma.room.findUnique({ where: { roomCode } });
      if (room) {
        await prisma.message.create({
          data: { roomId: room.id, userId: data.userId, username: data.username, message: data.message },
        });
      }
    } catch (err) { console.error('Failed to save message:', err); }

    io.to(roomCode).emit('receive-message', {
      username: data.username, message: data.message, avatar: data.avatar, timestamp: new Date().toISOString(),
    });
  });

  // WebRTC
  socket.on('screen-share-started', (roomCode: string) => {
    console.log(`🖥️ Screen share started in room ${roomCode} by ${socket.id}`);
    socket.to(roomCode).emit('screen-share-started', { hostId: socket.id });
  });

  socket.on('screen-share-stopped', (roomCode: string) => {
    console.log(`🖥️ Screen share stopped in room ${roomCode}`);
    socket.to(roomCode).emit('screen-share-stopped');
  });

  socket.on('webrtc-offer', (roomCode: string, data: { offer: any; to: string }) => {
    console.log(`📤 WebRTC offer from ${socket.id} to ${data.to}`);
    io.to(data.to).emit('webrtc-offer', { offer: data.offer, from: socket.id });
  });

  socket.on('webrtc-answer', (roomCode: string, data: { answer: any; to: string }) => {
    console.log(`📥 WebRTC answer from ${socket.id} to ${data.to}`);
    io.to(data.to).emit('webrtc-answer', { answer: data.answer, from: socket.id });
  });

  socket.on('webrtc-ice-candidate', (roomCode: string, data: { candidate: any; to: string }) => {
    io.to(data.to).emit('webrtc-ice-candidate', { candidate: data.candidate, from: socket.id });
  });

  socket.on('disconnect', () => console.log('🔌 User disconnected:', socket.id));
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));