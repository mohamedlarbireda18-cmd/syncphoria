import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
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

// ✅ Middleware CORS manuel - TOUT accepter
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
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

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join-room', (roomCode: string, username: string) => {
    socket.join(roomCode);
    socket.to(roomCode).emit('user-joined', { socketId: socket.id, username });
  });

  socket.on('leave-room', (roomCode: string, username: string) => {
    socket.leave(roomCode);
    socket.to(roomCode).emit('user-left', { socketId: socket.id, username });
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

  socket.on('screen-share-started', (roomCode: string) => socket.to(roomCode).emit('screen-share-started', { hostId: socket.id }));
  socket.on('screen-share-stopped', (roomCode: string) => socket.to(roomCode).emit('screen-share-stopped'));
  socket.on('webrtc-offer', (roomCode: string, data: { offer: any; to: string }) => io.to(data.to).emit('webrtc-offer', { offer: data.offer, from: socket.id }));
  socket.on('webrtc-answer', (roomCode: string, data: { answer: any; to: string }) => io.to(data.to).emit('webrtc-answer', { answer: data.answer, from: socket.id }));
  socket.on('webrtc-ice-candidate', (roomCode: string, data: { candidate: any; to: string }) => io.to(data.to).emit('webrtc-ice-candidate', { candidate: data.candidate, from: socket.id }));

  socket.on('disconnect', () => console.log('🔌 User disconnected:', socket.id));
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));