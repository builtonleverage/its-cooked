import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';
import pkg from './package.json' with { type: 'json' };

// BASE_PATH lets the same build target GitHub Pages (/its-cooked/) or Cloudflare/Vercel/Netlify (/).
const base = process.env.BASE_PATH || '/';

export default defineConfig(({ mode }) => {
  // `vite build --mode artifact`: one self-contained HTML file (everything inlined, no service worker)
  // for quick sharing/embedding. See scripts/make-artifact.mjs.
  const artifact = mode === 'artifact';
  return {
    base: artifact ? './' : base,
    define: { __APP_VERSION__: JSON.stringify(pkg.version), __ARTIFACT__: JSON.stringify(artifact) },
    resolve: artifact ? { alias: { 'virtual:pwa-register/react': fileURLToPath(new URL('./src/lib/pwa-stub.ts', import.meta.url)) } } : {},
    build: artifact ? { outDir: 'dist-artifact', assetsInlineLimit: 1e8, copyPublicDir: false } : {},
    plugins: [
      react(),
      artifact
        ? viteSingleFile()
        : VitePWA({
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
    test: { environment: 'node' },
  } as any;
});
