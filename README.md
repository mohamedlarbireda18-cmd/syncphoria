Syncphoria

**Watch Party Platform** – Watch videos together in real time.

[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Frontend](https://img.shields.io/badge/frontend-React%2018-61DAFB)](https://react.dev)
[![Backend](https://img.shields.io/badge/backend-Express%205-000000)](https://expressjs.com)
[![Database](https://img.shields.io/badge/database-PostgreSQL-336791)](https://www.postgresql.org)
[![Deploy](https://img.shields.io/badge/deploy-Vercel%20%2B%20Render-success)](https://vercel.com)

---

Live Demo

[syncphoria.vercel.app](https://syncphoria.vercel.app) 


---

Features

Authentication
- Registration with email verification (EmailJS)
- Login with email/password
- Google OAuth login
- Profile management (avatar, username, password)
- Secure account deletion (double confirmation + countdown)

Rooms
- Create a room (unique 6‑character code)
- Join a room by code
- Real‑time chat (Socket.io + database persistence)
- Live participant list
- Screen sharing (WebRTC – see known issues)

UI/UX
- Premium dark mode design
- Smooth animations
- Fully responsive (mobile / tablet / desktop)

---

Tech Stack

| Layer          | Technologies                                      |
|----------------|---------------------------------------------------|
| **Frontend**   | React 18, TypeScript, Vite, Zustand, React Router |
| **Backend**    | Express 5, TypeScript, Prisma ORM, Socket.io      |
| **Database**   | PostgreSQL (Render)                               |
| **Deployment** | Vercel (frontend), Render (backend + DB)          |
| **Auth**       | JWT, Passport.js (Google OAuth), bcryptjs         |
| **Email**      | EmailJS                                           |
| **Real‑time**  | Socket.io + WebRTC                                |



Project Structure

syncphoria/
├── frontend/ ← React (Vite) – pages, components, hooks, store, services
├── server/ ← Express – routes, controllers, middleware, config
└── .gitignore

Backend

cd server
npm install
# Copy and edit the environment file
cp .env.example .env   # (or create .env manually)
npx prisma migrate dev
npx prisma generate
npm run dev             # http://localhost:5000

Frontend 

cd frontend
npm install
npm run dev             # http://localhost:5173


Contributing

Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request
