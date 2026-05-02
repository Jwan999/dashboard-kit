import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { dashboardKitMiddleware } from './src/generator/hostMiddleware.js'

export default defineConfig({
  plugins: [vue(), tailwindcss(), dashboardKitMiddleware()],
  server: {
    port: 5173,
    strictPort: false,
    host: '127.0.0.1',
  },
})
