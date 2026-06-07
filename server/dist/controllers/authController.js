import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import generateToken from '../utils/generateToken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// ========================
// GOOGLE CALLBACK
// ========================
const googleCallback = async (req, res) => {
    try {
        const user = req.user;
        const token = generateToken(user.id);
        res.redirect(`http://localhost:5173/auth/google/callback?token=${token}`);
    }
    catch (error) {
        res.redirect('http://localhost:5173/login?error=google_auth_failed');
    }
};
// ========================
// GENERATE VERIFICATION CODE
// ========================
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
// ========================
// REGISTER
// ========================
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userExists = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });
        if (userExists) {
            res.status(400).json({
                message: userExists.email === email ? 'Email already in use' : 'Username already taken'
            });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const verificationCode = generateVerificationCode();
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                verificationCode,
                isVerified: false,
            },
        });
        res.status(201).json({
            message: 'Account created. Check your email for the verification code.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
            },
            verificationCode,
            needsVerification: true,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ========================
// VERIFY EMAIL
// ========================
const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (user.isVerified) {
            res.json({ message: 'Email already verified', token: generateToken(user.id) });
            return;
        }
        if (user.verificationCode !== code) {
            res.status(400).json({ message: 'Invalid verification code' });
            return;
        }
        await prisma.user.update({
            where: { email },
            data: { isVerified: true, verificationCode: '' },
        });
        res.json({
            message: 'Email verified successfully',
            token: generateToken(user.id),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ========================
// LOGIN
// ========================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔑 Login attempt:', email); // ✅ Ajoute cette ligne
        const user = await prisma.user.findUnique({ where: { email } });
        console.log('👤 User found:', !!user, '| isVerified:', user?.isVerified);
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        if (!user.isVerified) {
            res.status(401).json({ message: 'Please verify your email first' });
            return;
        }
        if (await bcrypt.compare(password, user.password)) {
            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    createdAt: user.createdAt,
                },
                token: generateToken(user.id),
            });
        }
        else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ========================
// GET PROFILE
// ========================
const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (user) {
            res.json({
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    isVerified: user.isVerified,
                    createdAt: user.createdAt,
                },
            });
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ========================
// CONFIG MULTER (AVATAR)
// ========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    },
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only .jpg, .png, .webp and .gif files are allowed'));
    }
};
export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});
// ========================
// UPDATE PROFILE
// ========================
const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const userId = req.user.id;
        if (username) {
            const existingUsername = await prisma.user.findFirst({
                where: { username, NOT: { id: userId } },
            });
            if (existingUsername) {
                res.status(400).json({ message: 'Username already taken' });
                return;
            }
        }
        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: { email, NOT: { id: userId } },
            });
            if (existingEmail) {
                res.status(400).json({ message: 'Email already in use' });
                return;
            }
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(username && { username }),
                ...(email && { email }),
            },
        });
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                createdAt: updatedUser.createdAt,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ========================
// UPDATE PASSWORD
// ========================
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: 'Current password and new password are required' });
            return;
        }
        if (newPassword.length < 8) {
            res.status(400).json({ message: 'New password must be at least 8 characters' });
            return;
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Current password is incorrect' });
            return;
        }
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ========================
// UPLOAD AVATAR
// ========================
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const userId = req.user.id;
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (currentUser?.avatar) {
            const oldAvatarPath = path.join(process.cwd(), currentUser.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
        });
        res.json({
            message: 'Avatar uploaded successfully',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                createdAt: updatedUser.createdAt,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ========================
// DELETE ACCOUNT
// ========================
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        // Supprimer l'avatar si existe
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.avatar) {
            const avatarPath = path.join(process.cwd(), user.avatar);
            if (fs.existsSync(avatarPath)) {
                fs.unlinkSync(avatarPath);
            }
        }
        // Supprimer l'utilisateur (cascade : rooms, participants)
        await prisma.user.delete({ where: { id: userId } });
        res.json({ message: 'Account deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
export { register, verifyEmail, login, getProfile, googleCallback, updateProfile, updatePassword, uploadAvatar, deleteAccount, };
//# sourceMappingURL=authController.js.map