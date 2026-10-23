import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // El contenido JSON va en el bundle principal
  build: { chunkSizeWarningLimit: 1500 },
})
