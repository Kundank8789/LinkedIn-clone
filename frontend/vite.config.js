import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 5173,
    strictPort: true,
    // This is important for client-side routing
    open: true,
    proxy: {},
    cors: true
  },
  // This is important for client-side routing
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
