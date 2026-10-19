import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

// The addon's version, read from its .toc file, so the website always shows the one it offers.
const toc = readFileSync(new URL('./addon/Warcall/Warcall.toc', import.meta.url), 'utf8')
const addonVersion = /^## Version:\s*(.+)$/m.exec(toc)?.[1].trim() ?? '?'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { __ADDON_VERSION__: JSON.stringify(addonVersion) },
  server: {
    // On your PC, `npm run dev` doesn't run Netlify Functions, so pretend to be one:
    // /api/patch-notes is forwarded straight to the Blizzard forum thread.
    proxy: {
      '/api/patch-notes': {
        target: 'https://us.forums.blizzard.com',
        changeOrigin: true,
        rewrite: () => '/en/wow/t/2360696.json',
      },
      // Item icons: on your PC, ask Wowhead directly; the page turns the answer into a picture URL.
      '/api/item-icon': {
        target: 'https://nether.wowhead.com',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/item-icon/', '/classic/tooltip/item/'),
      },
    },
  },
})
