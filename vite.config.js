import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

// في وضع التطوير: وجّه /admin/* إلى admin.html (تطبيق منفصل)
const adminDevRewrite = {
  name: 'admin-dev-rewrite',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (/^\/admin(\/|$)/.test(req.url) && !req.url.includes('.')) req.url = '/admin.html';
      next();
    });
  },
};

export default defineConfig({
  root: 'client',
  plugins: [
    react(),
    adminDevRewrite,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Computer DOS Store',
        short_name: 'DOS Store',
        description: 'PC parts, smart builder, streamer setups & AI previews',
        lang: 'ar',
        dir: 'auto',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#06061a',
        theme_color: '#8b5cf6',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/admin/, /^\/uploads/],
        globIgnores: ['**/admin*.html'],
        runtimeCaching: [
          { urlPattern: /\/api\//, handler: 'NetworkOnly' },
          { urlPattern: /\/uploads\//, handler: 'CacheFirst', options: { cacheName: 'uploads', expiration: { maxEntries: 200 } } },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000', '/uploads': 'http://localhost:3000' },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { main: r('./client/index.html'), admin: r('./client/admin.html') },
    },
  },
});
