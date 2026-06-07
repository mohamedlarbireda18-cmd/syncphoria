import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import passport from './config/passport.js';
const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();
const roomParticipants = new Map();
const roomShareState = new Map();
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS')
        return res.sendStatus(200);
    next();
});
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});
app.use(express.json());
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.get('/', (_req, res) => res.json({ message: 'API running...' }));
const buildParticipantsList = (roomCode) => {
    const roomMap = roomParticipants.get(roomCode);
    if (!roomMap)
        return [];
    return Array.from(roomMap.entries()).map(([uid, data]) => ({
        userId: uid,
        username: data.username,
        peerId: data.peerId,
    }));
};
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    socket.on('join-room', (roomCode, username, userId, peerId) => {
        if (!roomCode || !userId)
            return;
        socket.join(roomCode);
        if (!roomParticipants.has(roomCode)) {
            roomParticipants.set(roomCode, new Map());
        }
        const roomMap = roomParticipants.get(roomCode);
        const existing = roomMap.get(userId);
        const resolvedUsername = username ?? existing?.username ?? 'Unknown';
        const resolvedPeerId = peerId ?? existing?.peerId ?? '';
        roomMap.set(userId, {
            socketId: socket.id,
            username: resolvedUsername,
            peerId: resolvedPeerId,
        });
        const participantsList = buildParticipantsList(roomCode);
        socket.emit('room-participants', { participants: participantsList });
        console.log(`👥 join-room: ${resolvedUsername} (${userId}) joined ${roomCode} with peerId=${resolvedPeerId}`);
        const shareState = roomShareState.get(roomCode);
        if (shareState?.isSharing && shareState.peerId) {
            console.log(`📢 join-room: emitting active screen-share-started to ${socket.id}`);
            socket.emit('screen-share-started', { peerId: shareState.peerId });
        }
        socket.to(roomCode).emit('user-joined', {
            username: resolvedUsername,
            userId,
            peerId: resolvedPeerId,
        });
        io.to(roomCode).emit('room-participants', {
            participants: participantsList,
        });
    });
    socket.on('leave-room', (roomCode, _username, userId) => {
        socket.leave(roomCode);
        const roomMap = roomParticipants.get(roomCode);
        if (roomMap) {
            roomMap.delete(userId);
            if (roomMap.size === 0) {
                roomParticipants.delete(roomCode);
            }
        }
        const participantsList = buildParticipantsList(roomCode);
        io.to(roomCode).emit('user-left', { userId });
        io.to(roomCode).emit('room-participants', {
            participants: participantsList,
        });
    });
    socket.on('send-message', async (roomCode, data) => {
        try {
            const room = await prisma.room.findUnique({ where: { roomCode } });
            if (room) {
                await prisma.message.create({
                    data: {
                        roomId: room.id,
                        userId: data.userId,
                        username: data.username,
                        message: data.message,
                    },
                });
            }
        }
        catch (err) {
            console.error('Failed to save message:', err);
        }
        // Broadcast to all clients in the room, including the sender
        io.to(roomCode).emit('receive-message', data);
    });
    socket.on('screen-share-started', (roomCode, peerId) => {
        console.log(`📺 Screen share started by ${peerId} in room ${roomCode}`);
        roomShareState.set(roomCode, { isSharing: true, peerId });
        socket.to(roomCode).emit('screen-share-started', { peerId });
    });
    socket.on('screen-share-stopped', (roomCode) => {
        console.log(`🛑 Screen share stopped in room ${roomCode}`);
        roomShareState.set(roomCode, { isSharing: false });
        socket.to(roomCode).emit('screen-share-stopped');
    });
    // Receives condensed WebRTC stats from clients for debugging
    socket.on('webrtc-stats', (data) => {
        try {
            const { roomCode, peerId, label, stats, sdpLocal, sdpRemote } = data || {};
            console.log(`📊 webrtc-stats from socket=${socket.id} peerId=${peerId} room=${roomCode} label=${label}`);
            if (Array.isArray(stats)) {
                for (const entry of stats) {
                    try {
                        console.log('   -', entry.type || entry.id, JSON.stringify(entry.values || entry));
                    }
                    catch (e) {
                        console.log('   - (could not stringify entry)', entry);
                    }
                }
            }
            else {
                console.log('   stats payload:', stats);
            }
            if (sdpLocal)
                console.log('   local SDP snippet:', typeof sdpLocal === 'string' ? sdpLocal.slice(0, 1000) : sdpLocal);
            if (sdpRemote)
                console.log('   remote SDP snippet:', typeof sdpRemote === 'string' ? sdpRemote.slice(0, 1000) : sdpRemote);
            // Acknowledge receipt so client knows logs reached server
            if (roomCode)
                io.to(roomCode).emit('webrtc-stats-logged', { peerId, label, receivedAt: Date.now() });
        }
        catch (err) {
            console.warn('Failed to process webrtc-stats payload', err);
        }
    });
    socket.on('disconnect', () => {
        console.log('🔌 User disconnected:', socket.id);
        for (const [roomCode, roomMap] of roomParticipants.entries()) {
            for (const [userId, data] of roomMap.entries()) {
                if (data.socketId === socket.id) {
                    roomMap.delete(userId);
                    if (roomMap.size === 0) {
                        roomParticipants.delete(roomCode);
                    }
                    io.to(roomCode).emit('user-left', { userId });
                    io.to(roomCode).emit('room-participants', {
                        participants: buildParticipantsList(roomCode),
                    });
                    break;
                }
            }
        }
    });
});
const startServer = async () => {
    try {
        const { PeerServer } = await import('peer');
        PeerServer({
            host: '0.0.0.0',
            port: 9000,
            path: '/peerjs',
            allow_discovery: false,
        });
        console.log('✅ PeerJS server running on port 9000');
    }
    catch (error) {
        console.error('❌ Failed to start PeerJS server:', error);
    }
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};
startServer();
//# sourceMappingURL=server.js.map