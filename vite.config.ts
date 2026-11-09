import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH lets the same build target GitHub Pages (/its-cooked/) or Vercel/Netlify (/).
const base = process.env.BASE_PATH || '/';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
      },
      manifest: {
        id: base,
        name: "It's Cooked",
        short_name: "It's Cooked",
        description: 'Your recipes, cook mode, timers and offline kitchen companion.',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFF8F1',
        theme_color: '#E8572A',
        categories: ['food', 'lifestyle', 'utilities'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Timers', url: `${base}#/timers` },
          { name: 'New recipe', url: `${base}#/new` },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'node',
  },
} as any);
