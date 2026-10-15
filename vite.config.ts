import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // On your PC, `npm run dev` doesn't run Netlify Functions, so pretend to be one:
    // /api/patch-notes is forwarded straight to the Blizzard forum thread.
    proxy: {
      '/api/patch-notes': {
        target: 'https://us.forums.blizzard.com',
        changeOrigin: true,
        rewrite: () => '/en/wow/t/2360696.json',
      },
    },
  },
})
