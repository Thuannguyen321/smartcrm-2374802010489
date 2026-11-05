import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: Vite (5173) chuyen tiep /api sang backend (3000) -> khong vuong CORS khi phat trien.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': process.env.VITE_PROXY_TARGET || 'http://localhost:3000' },
  },
});
