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

// Store pour suivre les utilisateurs dans les rooms
// roomCode -> Map<userId, { socketId, username }>
const roomParticipants = new Map<string, Map<string, { socketId: string; username: string }>>();

// ✅ Middleware CORS
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

  // JOIN ROOM avec userId
  socket.on('join-room', (roomCode: string, username: string, userId: string) => {
    console.log(`📡 ${username} (${userId}) joined room ${roomCode} with socket ${socket.id}`);
    
    socket.join(roomCode);
    
    // Stocker le participant
    if (!roomParticipants.has(roomCode)) {
      roomParticipants.set(roomCode, new Map());
    }
    roomParticipants.get(roomCode)!.set(userId, { socketId: socket.id, username });
    
    // Envoyer la liste complète des participants au nouveau venu
    const participantsList = Array.from(roomParticipants.get(roomCode)!.entries()).map(([uid, data]) => ({
      userId: uid,
      username: data.username,
      socketId: data.socketId
    }));
    
    console.log(`📋 Sending participants list to ${username}:`, participantsList);
    socket.emit('room-participants', { participants: participantsList });
    
    // Notifier les autres
    socket.to(roomCode).emit('user-joined', { 
      socketId: socket.id, 
      username, 
      userId,
      participants: participantsList 
    });
  });

  // LEAVE ROOM
  socket.on('leave-room', (roomCode: string, username: string, userId: string) => {
    console.log(`📡 ${username} left room ${roomCode}`);
    
    socket.leave(roomCode);
    
    const roomMap = roomParticipants.get(roomCode);
    if (roomMap) {
      roomMap.delete(userId);
      if (roomMap.size === 0) {
        roomParticipants.delete(roomCode);
      }
    }
    
    socket.to(roomCode).emit('user-left', { socketId: socket.id, username, userId });
  });

  // SEND MESSAGE
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
      username: data.username, 
      message: data.message, 
      avatar: data.avatar, 
      timestamp: new Date().toISOString(),
      userId: data.userId
    });
  });

  // SCREEN SHARE EVENTS
  socket.on('screen-share-started', (roomCode: string) => {
    console.log(`📺 Screen share started by ${socket.id} in room ${roomCode}`);
    socket.to(roomCode).emit('screen-share-started', { hostId: socket.id });
  });
  
  socket.on('screen-share-stopped', (roomCode: string) => {
    console.log(`🛑 Screen share stopped in room ${roomCode}`);
    socket.to(roomCode).emit('screen-share-stopped');
  });

  // WEBRTC SIGNALING avec logs détaillés
  socket.on('webrtc-offer', (roomCode: string, data: { offer: any; to: string }) => {
    console.log(`📤 [OFFER] from ${socket.id} to ${data.to}`);
    console.log(`📤 Offer type: ${data.offer?.type}, sdp length: ${data.offer?.sdp?.length || 0}`);
    io.to(data.to).emit('webrtc-offer', { offer: data.offer, from: socket.id });
  });
  
  socket.on('webrtc-answer', (roomCode: string, data: { answer: any; to: string }) => {
    console.log(`📤 [ANSWER] from ${socket.id} to ${data.to}`);
    console.log(`📤 Answer type: ${data.answer?.type}, sdp length: ${data.answer?.sdp?.length || 0}`);
    io.to(data.to).emit('webrtc-answer', { answer: data.answer, from: socket.id });
  });
  
  socket.on('webrtc-ice-candidate', (roomCode: string, data: { candidate: any; to: string }) => {
    const candidateType = data.candidate?.candidate?.split(' ')[7] || 'unknown';
    const protocol = data.candidate?.candidate?.split(' ')[2] || 'unknown';
    console.log(`🧊 [ICE] from ${socket.id} to ${data.to} | type: ${candidateType} | protocol: ${protocol}`);
    
    if (data.candidate?.candidate) {
      console.log(`🧊 Candidate details: ${data.candidate.candidate.substring(0, 100)}...`);
    }
    
    io.to(data.to).emit('webrtc-ice-candidate', { candidate: data.candidate, from: socket.id });
  });

  // GET PARTICIPANTS
  socket.on('get-room-participants', (roomCode: string) => {
    console.log(`📋 Getting participants for room ${roomCode}`);
    const roomMap = roomParticipants.get(roomCode);
    if (roomMap) {
      const participants = Array.from(roomMap.entries()).map(([userId, data]) => ({
        userId,
        username: data.username,
        socketId: data.socketId
      }));
      console.log(`📋 Sending participants list:`, participants);
      socket.emit('room-participants-list', { participants });
    } else {
      console.log(`📋 No participants found for room ${roomCode}`);
      socket.emit('room-participants-list', { participants: [] });
    }
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
    // Nettoyer
    for (const [roomCode, roomMap] of roomParticipants.entries()) {
      for (const [userId, data] of roomMap.entries()) {
        if (data.socketId === socket.id) {
          roomMap.delete(userId);
          console.log(`🗑️ Removed user ${userId} (${data.username}) from room ${roomCode}`);
          // Notifier les autres
          io.to(roomCode).emit('user-left', { socketId: socket.id, username: data.username, userId });
          break;
        }
      }
      if (roomMap.size === 0) {
        roomParticipants.delete(roomCode);
        console.log(`🗑️ Room ${roomCode} is now empty, removed from store`);
      }
    }
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));