# Can I Afford This?

A mobile web app for iPhone that helps young adults decide whether something they want fits into their month before they buy it. Having the money isn't the same as being able to afford something. The app shows what changes, and the user decides.

Next.js (App Router) · Claude API (`claude-sonnet-5-5`) via one server route · no database (state lives in the browser for the session).

## Run it locally

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local   # optional: without it, the offline engine answers
npm run dev
```

Open http://localhost:3000. On a laptop it shows inside an iPhone frame; on a phone it fills the screen.

Without an API key everything still works: `/api/check` returns 503 and the app quietly answers with its local fallback engine (`lib/fallback.ts`).

## Things you'll want to swap

| What | Where |
| --- | --- |
| AI system prompt (voice and behavior) | `prompts/system.txt`. The JSON format and app rules are added in code (`lib/ai.ts`), so this file only needs tone and behavior. |
| Scene photos | `public/bg/home.jpg`, `free.jpg`, `chat.jpg`, `shelf.jpg` (see `public/bg/README.md`). Missing ones fall back to a warm gradient. |
| Demo screenshots | `public/demo/jacket.jpg`, `lamp.jpg`, `sunglasses.jpg`. If a name or price changes, update `DEMO_FILES` in `lib/demoData.ts`. |
| Fixed month numbers and starting plans | `lib/demoData.ts` |
| Penny, the mascot (expressions) | `public/mascot/*.webp` (which one shows when: `lib/mood.ts`). She's also the center tab-bar button that opens "Can I afford this?". |

## Demo mode

- Turn it on in Settings (the gear on Home), or send a link with `?demo=1`. The flag is saved and removed from the address bar. `?demo=0` turns it off.
- When it's on, a **Demo files** button appears at the top right. It opens a tray with the 3 sample screenshots (tap one to send it into the chat as if uploaded) and **Reset demo** (restores $1,060 and the four plans, and clears the chat, Wishlist and Bought).
- When it's off, neither exists, so the app looks like the real product for recording.

## Deploy to Vercel

**Option A: Vercel CLI (no GitHub needed)**

```bash
npx vercel
```

Answer the prompts (link to a new project, keep the default settings). Then add the key and deploy to production:

```bash
npx vercel env add ANTHROPIC_API_KEY production
```

```bash
npx vercel --prod
```

**Option B: GitHub.** Push this folder to a GitHub repo, then in Vercel choose **Add New → Project → Import**. Add `ANTHROPIC_API_KEY` under **Settings → Environment Variables** before the first deploy, or redeploy after adding it.

Then share `https://<your-project>.vercel.app/?demo=1` with interviewers.

### After deploying

- Set a monthly spend limit in the Claude Console (Settings → Limits). Each message costs about a cent.
- The rate limit is 20 messages per visitor per hour, kept in server memory. It's best-effort: each Vercel instance counts separately and a cold start resets it. Over the limit, the offline engine answers instead.

## Install on an iPhone

Open the link in Safari → **⋯** → **Share** → **View More** → **Add to Home Screen** (leave "Open as Web App" on). It opens full screen with the mascot icon.

## How it's built

```
app/
  layout.tsx            viewport-fit=cover, Apple web-app meta, theme color
  page.tsx              shell; detects scene photos in /public/bg
  manifest.ts           Home Screen manifest
  api/check/route.ts    rate limit → Claude (structured JSON output) → validated result
components/
  AppShell, TabBar, DeviceFrame
  home/ (Donut, SettingsSheet)  free/ (plans, editor sheet)  chat/ (Composer, ResultCard)
  shelf/  demo/ (Demo files tray)  ui/ (Screen, Sheet, Mascot, Icons)
lib/
  store.tsx             session state (sessionStorage); Demo mode (localStorage)
  useSend.ts            one path for typed, spoken, photo, card-button and demo messages
  check.ts              POST /api/check with a 22s timeout; falls back to lib/fallback.ts
  ai.ts                 response schema, app rules for the model, app_state text, output validation
  budget.ts / updates.ts   money math (always computed in code, never by the model) and plan changes
  image.ts              resize to 1200px JPEG + 480px thumbnail on the phone; HEIC fallback
  useVisualViewport.ts  keeps the input bar above the iPhone keyboard
```

### iPhone notes

- **Keyboard:** iOS doesn't shrink `100dvh` when the keyboard opens. While it's up, the app sizes itself to the visual viewport, so the input bar sits directly above the keyboard, and the tab bar hides.
- **Home Screen app:** with `black-translucent`, iOS (still on 26.5) lays out the web app 47pt short and leaves a strip at the bottom unpainted. The `@media (display-mode: standalone)` block in `globals.css` works around it.
- **Mic:** uses Safari's speech recognition when available, and hides the mic if it isn't, or if permission is denied. The keyboard's own dictation key always works.
- **Photos:** the file input has no `capture` attribute, so iOS offers Photo Library, Take Photo and Choose File.
