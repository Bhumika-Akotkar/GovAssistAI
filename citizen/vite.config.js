import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // .env.local is not on process.env, so it has to be loaded explicitly.
  const env = loadEnv(mode, rootDir, '');
  const serverUrl = env.VITE_SERVER_URL || 'http://localhost:8083';

/**
 * The catalog is bundled into the JS by import.meta.glob in lib/catalog.js, so
 * it already works offline. This additionally emits the raw JSON under
 * /data/schemes/ so each file is individually precacheable and inspectable —
 * which is what makes a stale guide obvious in a deploy rather than invisible.
 */
function copySchemeCatalog() {
  return {
    name: 'copy-scheme-catalog',
    apply: 'build',
    closeBundle() {
      const src = path.join(rootDir, 'src', 'data', 'schemes');
      const dest = path.join(rootDir, 'dist', 'data', 'schemes');
      mkdirSync(dest, { recursive: true });
      for (const name of readdirSync(src)) {
        if (name.endsWith('.json')) {
          copyFileSync(path.join(src, name), path.join(dest, name));
        }
      }
    },
  };
}

  return {
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    define: {
      __SERVER_URL__: JSON.stringify(serverUrl),
    },
    build: {
      // The scheme catalog is emitted as real files as well as being bundled,
      // so the service worker can precache each one and the refresh path can
      // fetch them individually. Never inline them.
      assetsInlineLimit: 0,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: serverUrl, changeOrigin: true },
        '/ws': { target: serverUrl.replace(/^http/, 'ws'), ws: true },
      },
    },
    plugins: [
    react(),
      copySchemeCatalog(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons.svg'],
        manifest: {
          name: 'Sahayak Seva',
          short_name: 'Sahayak',
          description: 'Government services, in your language',
          theme_color: '#1B3A2C',
          background_color: '#FAF7F1',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          lang: 'en-IN',
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // The app shell plus the scheme catalog. Offline must work from first
          // paint, so the catalog is precached rather than fetched on demand.
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
          globIgnores: ['**/node_modules/**', 'sw.js', 'workbox-*.js', 'registerSW.js'],
          navigateFallback: 'index.html',
          // The API must never be served index.html: a cached SPA shell
          // masquerading as a sync response would look like a successful write.
          navigateFallbackDenylist: [/^\/api\//, /^\/ws/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ url }) => url.pathname === '/api/services/catalog',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'scheme-catalog',
                expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Enhancement only. The Background Sync API is unreliable on Android
            // WebView and desktop Firefox, so the app-layer flush in
            // offline/syncRegistry.js is the guaranteed path — never the only one.
            // NetworkOnly + backgroundSync queues the failed POST and replays it
            // when the browser decides connectivity is back.
            {
              urlPattern: ({ url, request }) =>
                request.method === 'POST' && url.pathname === '/api/sync',
              method: 'POST',
              handler: 'NetworkOnly',
              options: {
                backgroundSync: {
                  name: 'sahayak-sync-queue',
                  options: { maxRetentionTime: 24 * 60 },
                },
              },
            },
          ],
        },
        devOptions: {
          // The SW is not generated in dev; the manifest link is therefore not
          // injected either, which avoids the browser parsing the SPA fallback
          // as a manifest.
          enabled: false,
        },
      }),
    ],
  };
});
