import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'localhost',
      'uncheck-sternness-scope.ngrok-free.dev',
      '.ngrok-free.dev', // Tous les sous-domaines ngrok
    ],
  },
})