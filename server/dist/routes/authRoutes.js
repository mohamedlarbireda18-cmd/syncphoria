import { Router } from 'express';
import { register, verifyEmail, login, getProfile, googleCallback, updateProfile, updatePassword, uploadAvatar, deleteAccount, upload } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import passport from '../config/passport';
const router = Router();
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/account', protect, deleteAccount);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), googleCallback);
export default router;
//# sourceMappingURL=authRoutes.js.map