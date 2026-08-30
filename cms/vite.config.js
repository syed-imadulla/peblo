import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All CMS API calls use /api/* prefix; rewrite strips it before forwarding.
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/assets': 'http://localhost:8000',
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
  }
})

