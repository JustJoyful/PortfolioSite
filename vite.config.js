import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Social tags need an absolute URL; the host is unknown at author time, so it comes from VITE_SITE_URL.
// Unset: relative /og.png and no og:url.
const social = (site) => ({
  name: 'social-meta',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { property: 'og:image', content: `${site}/og.png` }, injectTo: 'head' },
    ...(site ? [{ tag: 'meta', attrs: { property: 'og:url', content: `${site}/` }, injectTo: 'head' }] : []),
  ],
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), social(loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL?.replace(/\/$/, '') ?? '')],
}))
