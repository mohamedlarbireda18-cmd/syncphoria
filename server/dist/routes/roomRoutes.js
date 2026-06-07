import { Router } from 'express';
import { createRoom, joinRoom, getRoom, getMyRooms, leaveRoom, getMessages } from '../controllers/roomController';
import { protect } from '../middleware/authMiddleware';
const router = Router();
router.post('/create', protect, createRoom);
router.post('/join', protect, joinRoom);
router.get('/my-rooms', protect, getMyRooms);
router.get('/:roomCode/messages', protect, getMessages); // ✅ AVANT /:roomCode
router.get('/:roomCode', protect, getRoom);
router.delete('/:roomCode/leave', protect, leaveRoom);
export default router;
//# sourceMappingURL=roomRoutes.js.map