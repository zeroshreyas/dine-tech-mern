import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
css: {
       postcss: {
         plugins: [
           require('autoprefixer'),
         ],
       },
     },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5000/api')
  },
  server: {
    
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 100
    },
    host: true,
    strictPort: false
  }
})
