<p align="center"><img src="public/pwa-192.png" width="96" alt="It's Cooked logo" /></p>

# It's Cooked

A fast, offline-first recipe app with a hands-free **Cook Mode** and **smart kitchen timers**.
It's a Progressive Web App (PWA): install it on iPhone or Android from the browser. No app store, no account, no backend.
Your recipes stay on your device.

## Features

- **Recipe library**: create, edit, view and search recipes (title, ingredients, tags and notes). Each recipe has servings, prep and cook times, step-by-step instructions, tags (e.g. *Diabetic-friendly*, *Low-salt*), favourites and notes. Ingredients are typed one per line, which is the fastest way to enter them on a phone.
- **Cook Mode**: one step per screen in large text (with an extra-large **Aa** toggle). The Wake Lock API keeps the screen on, and it re-acquires the lock after you switch apps. Big Next/Back buttons, swipe left/right, and keyboard / Bluetooth page-turner keys (← → Space PgUp PgDn). Ingredients open in a sheet. It remembers which step you were on.
- **Timers**:
  - Run several named timers at once, attached to recipe steps (e.g. *Tandoor preheat 15 min*, *Bake batch 8 min, check at 4 & 6 min*).
  - Each timer can have check-in alerts. Quick timers of 4 min or longer get a halfway check automatically.
  - Timers store an absolute end time, so they **keep counting through app switches, reloads and restarts**. Missed alerts fire as soon as you come back.
  - When a timer finishes you get a sound (Web Audio chime that repeats until you tap Stop), vibration and a system notification. The home-screen icon badge shows how many timers are running, and a timer pill appears on every screen.
  - **Detect timers** in the editor reads durations from the step text ("bake 6–8 min, check at 4 min").
- **Offline**:
  - The app shell is precached by a Workbox service worker, so the app opens without a network connection.
  - Recipes are stored in IndexedDB. **Download for offline** also saves a recipe's images as blobs in IndexedDB.
  - The **Offline** tab lists downloaded recipes with their sizes. You can remove one or download all, see storage usage, and ask the browser to protect stored data from automatic clean-up.
  - A bar at the top shows when you're offline.
- **Openly-licensed images only**:
  - The image search uses **Wikimedia Commons** and **Openverse** (no API keys needed).
  - Only CC0, Public Domain, CC BY and CC BY-SA results are shown. Non-free, NC and ND images are filtered out.
  - The title, author, licence and source link are saved with each image, shown under it, and listed in an "Image credits" section on each recipe.
- **Seed recipe**: *Onion Tandoori Paratha (Electric Tandoor)*. It comes with a preheat timer (15 min, checked at 10), a 20 min dough rest and an 8 min bake per batch (checked at 4 and 6 min). It includes diabetic-friendly and low-salt notes and a stuffing diagram. Its illustrations are original CC0 SVGs bundled with the app.
- **Other**:
  - Warm, accessible UI with light, dark and system themes.
  - Tap targets of 48 px or more, visible focus rings and ARIA labels, and support for reduced motion.
  - Safe-area aware, so it works with the iPhone 17 Pro Max Dynamic Island and home indicator.
  - JSON backup export and import.

## Tech

React 19 + TypeScript + Vite, `vite-plugin-pwa` (Workbox, `injectManifest` with a custom `src/sw.ts`), `idb` for IndexedDB, Vitest.
It uses a tiny hash router with no dependency, so the app works on any static host. The JS bundle is about 90 kB gzipped.

```
src/
  App.tsx              shell, tab bar, timer dock, update prompt
  sw.ts                service worker (precache, image cache, notification clicks)
  lib/db.ts            IndexedDB: recipes, offline images, backup
  lib/timerLogic.ts    pure timer engine (unit tested)
  lib/timers.ts        timer store, persistence, alerts loop
  lib/alerts.ts        sound / vibration / notifications
  lib/images.ts        Wikimedia Commons + Openverse licence-filtered search
  lib/seed.ts          Onion Tandoori Paratha
  pages/               Library, RecipeView, RecipeEdit, CookMode, Timers, Saved, Settings
public/                logo + PWA icons, seed illustrations
scripts/gen-icons.mjs  regenerate PNG icons from public/favicon.svg
```

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # timer engine + duration parser tests
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build (service worker active)
```

The service worker only runs in the production build (`npm run build && npm run preview`).
To test on a phone on your local network, run `npm run preview -- --host`. Notifications and Wake Lock need **HTTPS**, though, so for full testing deploy to one of the free hosts below.

## Deploy (free)

**GitHub Pages**: the included workflow `.github/workflows/deploy.yml` builds and publishes on every push to `main`.
1. Repo **Settings → Pages → Source: GitHub Actions**.
2. Push to `main`. The app will be at `https://builtonleverage.github.io/its-cooked/`.
The workflow sets `BASE_PATH=/its-cooked/` so assets, the manifest and the service worker scope are correct.

**Vercel**: import the repo at vercel.com/new. `vercel.json` already sets the build command and the `dist` output. No env vars needed.

**Netlify**: "Add new site → Import from Git". `netlify.toml` already sets the build command and the `dist` output.

## Install on your phone

- **iPhone (Safari)**: open the site, tap **Share → Add to Home Screen**. Open It's Cooked from the Home Screen, then allow notifications when you start your first timer. iOS only allows web notifications for installed apps (iOS 16.4+).
- **Android (Chrome)**: tap **Install app** in the prompt or the ⋮ menu.

### Platform notes

- **Timers in the background**:
  - Timers always stay accurate because they store an end time, not a countdown.
  - iOS suspends web apps in the background, so on iPhone a finished timer alerts (sound, vibration, notification) the moment you return to the app.
  - For exact-to-the-second alerts, keep Cook Mode open: it keeps the screen awake.
  - True background alarms need push notifications from a server, which is on the v2 roadmap.
- **Vibration**: the Vibration API isn't supported on iOS. iPhones get sound and notifications.
- **Wake Lock**: supported in Safari 16.4+ and Chrome. If it's unavailable, Cook Mode still works.

## Image licensing policy

The app never embeds copyrighted images.
- Search only returns results whose licence metadata is CC0, Public Domain, CC BY or CC BY-SA. Anything flagged non-free or fair-use, or with NC/ND terms, is discarded.
- The attribution (title, author, licence and licence link, plus the source page) is stored with the image and always displayed.
- The bundled seed illustrations were drawn for this project and are released under CC0.

## Roadmap (v2)

1. **Sync across devices**: optional sign-in with end-to-end-synced recipes (e.g. CRDT/IndexedDB replication over Supabase or Cloudflare D1). Includes shared family cookbooks.
2. **Voice control**: "next", "back", "repeat", "start timer" and "how long left?" in Cook Mode via the Web Speech API, with steps read aloud.
3. **Scaling servings**: parse quantities (fractions and ranges) and rescale ingredients. Add unit conversion (cups ⇄ grams) and adjust timer hints.
4. **Shopping list**: add a recipe's ingredients to a merged, aisle-grouped checklist that works offline and can be shared.
5. **Background push alarms**: Web Push from a tiny serverless function so timers alert even when iOS has suspended the app.
6. **Recipe import**: paste a URL to import schema.org/Recipe data, or scan a photo with OCR.
7. Nutrition estimates (carbs per serving for diabetic planning) and sodium flags.

## License

Code: MIT. Bundled seed illustrations and logo: CC0 1.0.
