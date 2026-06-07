import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, username: true, email: true, avatar: true, createdAt: true },
            });
            if (!user) {
                res.status(401).json({ message: 'User not found' });
                return;
            }
            req.user = user;
            next();
        }
        catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }
    else {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
};
export { protect };
//# sourceMappingURL=authMiddleware.js.map