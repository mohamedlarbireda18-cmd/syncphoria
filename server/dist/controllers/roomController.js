import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// ========================
// GÉNÉRER UN CODE ROOM
// ========================
const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
// ========================
// CRÉER UNE ROOM
// ========================
const createRoom = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title } = req.body;
        let roomCode;
        let exists = true;
        do {
            roomCode = generateRoomCode();
            const existing = await prisma.room.findUnique({ where: { roomCode } });
            if (!existing)
                exists = false;
        } while (exists);
        const room = await prisma.room.create({
            data: {
                roomCode,
                title: title || null,
                hostId: userId,
                participants: {
                    create: { userId },
                },
            },
            include: {
                host: { select: { id: true, username: true, avatar: true } },
                participants: {
                    include: { user: { select: { id: true, username: true, avatar: true } } },
                },
            },
        });
        res.status(201).json({ message: 'Room created', room });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ========================
// REJOINDRE UNE ROOM
// ========================
const joinRoom = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roomCode } = req.body;
        const room = await prisma.room.findUnique({ where: { roomCode } });
        if (!room) {
            res.status(404).json({ message: 'Room not found' });
            return;
        }
        if (!room.isActive) {
            res.status(400).json({ message: 'Room is no longer active' });
            return;
        }
        const alreadyIn = await prisma.roomParticipant.findUnique({
            where: { roomId_userId: { roomId: room.id, userId } },
        });
        if (alreadyIn) {
            const fullRoom = await prisma.room.findUnique({
                where: { roomCode },
                include: {
                    host: { select: { id: true, username: true, avatar: true } },
                    participants: {
                        include: { user: { select: { id: true, username: true, avatar: true } } },
                    },
                },
            });
            res.json({ message: 'Already in room', room: fullRoom });
            return;
        }
        await prisma.roomParticipant.create({
            data: { roomId: room.id, userId },
        });
        const updatedRoom = await prisma.room.findUnique({
            where: { roomCode },
            include: {
                host: { select: { id: true, username: true, avatar: true } },
                participants: {
                    include: { user: { select: { id: true, username: true, avatar: true } } },
                },
            },
        });
        res.json({ message: 'Joined room', room: updatedRoom });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ========================
// INFOS D'UNE ROOM
// ========================
const getRoom = async (req, res) => {
    try {
        const roomCode = req.params.roomCode;
        const room = await prisma.room.findUnique({
            where: { roomCode },
            include: {
                host: { select: { id: true, username: true, avatar: true } },
                participants: {
                    include: { user: { select: { id: true, username: true, avatar: true } } },
                },
            },
        });
        if (!room) {
            res.status(404).json({ message: 'Room not found' });
            return;
        }
        res.json({ room });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ========================
// GET MESSAGES
// ========================
const getMessages = async (req, res) => {
    try {
        const roomCode = req.params.roomCode;
        const room = await prisma.room.findUnique({ where: { roomCode } });
        if (!room) {
            res.status(404).json({ message: 'Room not found' });
            return;
        }
        const messages = await prisma.message.findMany({
            where: { roomId: room.id },
            orderBy: { createdAt: 'asc' },
            take: 100,
        });
        res.json({ messages });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ========================
// MES ROOMS
// ========================
const getMyRooms = async (req, res) => {
    try {
        const userId = req.user.id;
        const rooms = await prisma.room.findMany({
            where: {
                participants: { some: { userId } },
            },
            include: {
                host: { select: { id: true, username: true, avatar: true } },
                participants: {
                    include: { user: { select: { id: true, username: true, avatar: true } } },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json({ rooms });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ========================
// QUITTER UNE ROOM
// ========================
const leaveRoom = async (req, res) => {
    try {
        const userId = req.user.id;
        const roomCode = req.params.roomCode;
        const room = await prisma.room.findUnique({ where: { roomCode } });
        if (!room) {
            res.status(404).json({ message: 'Room not found' });
            return;
        }
        if (room.hostId === userId) {
            await prisma.room.delete({ where: { id: room.id } });
            res.json({ message: 'Room deleted (you were the host)' });
            return;
        }
        await prisma.roomParticipant.delete({
            where: { roomId_userId: { roomId: room.id, userId } },
        });
        res.json({ message: 'Left room' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
export { createRoom, joinRoom, getRoom, getMessages, getMyRooms, leaveRoom };
//# sourceMappingURL=roomController.js.map