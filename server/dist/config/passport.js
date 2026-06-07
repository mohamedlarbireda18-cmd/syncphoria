import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './db';
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Vérifier si l'utilisateur existe déjà
        let user = await prisma.user.findUnique({
            where: { email: profile.emails[0].value },
        });
        if (!user) {
            // Créer un nouvel utilisateur
            user = await prisma.user.create({
                data: {
                    username: profile.displayName.replace(/\s/g, '').toLowerCase() + Math.random().toString(36).slice(-4),
                    email: profile.emails[0].value,
                    password: '', // Pas de mot de passe pour Google OAuth
                    avatar: profile.photos?.[0]?.value || '',
                    isVerified: true, // Auto-vérifié via Google
                },
            });
        }
        else if (!user.isVerified) {
            // Vérifier l'email si pas encore fait
            await prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true },
            });
        }
        done(null, user);
    }
    catch (error) {
        done(error);
    }
}));
export default passport;
//# sourceMappingURL=passport.js.map