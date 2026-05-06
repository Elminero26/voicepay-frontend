import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Polyfill para sockjs-client: reemplaza 'global' (Node.js) por 'globalThis' (browser)
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/ws': {
        target: 'http://localhost:9000',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
