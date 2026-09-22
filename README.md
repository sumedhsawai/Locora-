# Locora — AI-Powered Hyperlocal Marketplace (MVP)

> **Your neighbourhood, powered by AI.**
> Locora is a hyperlocal marketplace where people buy and sell pre-loved items, discover trusted
> local services, chat in real time and complete deals **offline, in person** — no online payments,
> no delivery. Built per the Locora MVP specification.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![TS](https://img.shields.io/badge/TypeScript-strict-blue) ![TW](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8) ![Status](https://img.shields.io/badge/build-complete-0E9F5E)

---

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
```

**Demo accounts** (any password ≥ 4 chars):

| Account | Role | Why demo it |
|---|---|---|
| `aarav@demo.locora` | Buyer | Has chats, favourites, an open "I'm Looking For" request, notifications |
| `sneha@demo.locora` | Seller | Has live listings to manage |
| `rohan@demo.locora` | Service provider | Plumber profile with reviews & response stats |
| `admin@demo.locora` | Admin | Admin dashboard (phase 3) |

---

## MVP scope → implementation map

| Spec item | Status | Where |
|---|---|---|
| Landing page | ✅ Phase 1 | `src/app/page.tsx` |
| Login / sign up (simulated auth) | ✅ Phase 1 | `src/app/login/page.tsx` |
| Home feed (area/city filtering, categories) | ✅ Phase 1 | `src/app/(app)/home/page.tsx` |
| AI natural-language search | ✅ Phase 1 | `src/app/(app)/search/page.tsx` + `src/lib/ai.ts` |
| Product details (gallery, AI price check, scam panel, offers, reports) | ✅ Phase 2 | `src/app/(app)/product/[id]` |
| Service details (map service area, reviews, quote flow) | ✅ Phase 2 | `src/app/(app)/service/[id]` |
| Create listing (AI generator, price suggestion, scam gate) | ✅ Phase 2 | `src/app/(app)/create/listing` |
| Create service (AI profile generator) | ✅ Phase 2 | `src/app/(app)/create-service` |
| Real-time chat (offers, typing, quick replies, reviews) | ✅ Phase 2 | `src/app/(app)/chat` |
| Profile (listings, services, saved, reviews, requests) | ✅ Phase 3 | `src/app/(app)/profile` |
| "I'm Looking For" board + AI matching | ✅ Phase 3 | `src/app/(app)/requests` |
| Admin dashboard (reports, scam queue, users) | ✅ Phase 3 | `src/app/(app)/admin` |

---

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing (marketing)
│   ├── login/              # Auth (simulated)
│   └── (app)/              # Authenticated shell — navbar, bottom nav, guards
├── components/
│   ├── ui.tsx              # Design-system primitives (Button, Badge, Avatar, Modal…)
│   ├── cards.tsx           # ListingCard / ServiceCard / RequestCard
│   ├── shell.tsx           # App navbar, bottom tab bar, notifications, toasts
│   └── brand.tsx           # Logo & AI pill
├── data/seed.ts            # Rich Pune-localised dataset (users, listings, services,
│                           #   reviews, chats, requests, reports, notifications)
└── lib/
    ├── types.ts            # Domain models — mirror the future Supabase schema
    ├── store.tsx           # App state (reducer + localStorage persistence) & toasts
    ├── ai.ts               # Mock Gemini engine: NL search, listing generator,
    │                       #   price suggestion, scam detection, request matching
    ├── bot.ts              # Contextual reply engine for demo chat personas
    ├── geo.ts              # 19 Pune areas with lat/lng + haversine distance
    ├── categories.ts       # Category metadata
    └── format.ts           # ₹ formatting (en-IN), time-ago, labels
```

### Swapping mocks for production

The codebase is deliberately shaped so the MVP document's production stack drops in without
UI changes:

| Mock (now) | Production (per spec) |
|---|---|
| `src/lib/store.tsx` reducer + localStorage | Supabase (Postgres + Realtime + Storage) |
| `src/data/seed.ts` | Seeded SQL / real user data |
| `src/lib/ai.ts` template engine | Gemini API (same function signatures, async) |
| Area lat/lng in `geo.ts` | Mapbox geocoding + PostGIS distance |
| `bot.ts` reply engine | Supabase Realtime (two real humans chatting) |

Every AI function in `lib/ai.ts` is `async` with realistic latency and a structured return
type — replace the body with a Gemini call and nothing else changes.

### AI systems included (all demo-able now)

1. **Natural-language search** — “used iPhone under 40k near Viman Nagar” → parsed category,
   budget, area, condition → chips you can remove → ranked results; scam-flagged ads hidden
   from results automatically.
2. **AI price check** — every product carries a fairness verdict vs. comparable local listings.
3. **Scam detection** — see the seeded “too good to be true” iPhone listing; it is excluded
   from search results and surfaces in the admin scam queue.
4. **Request matching** — “I'm Looking For” requests are scored against providers by distance,
   rating and response time.
5. **Listing/service generators** — one-tap AI drafts in the create flows.
6. **Request matching loop** — post a request, watch AI match it against nearby listings,
   services and providers within ~2 seconds; unmatched requests go into “AI is watching” mode.

### Design system

- **Typeface:** Plus Jakarta Sans (400–800), self-hosted via `next/font`.
- **Palette:** Locora emerald (`brand`), warm stone neutrals, amber accents for AI/price
  signals, rose for risk. Dark ink-green (`ink-950`) for landing hero & feature panels.
- **Radius/shadows:** `rounded-2xl/3xl`, layered `shadow-soft/lift/card`, emerald `shadow-glow`.
- **Motion:** fade-up entrances, float, shimmer skeletons, heart-pop favourites, typing dots —
  all respecting `prefers-reduced-motion`.
- **Mobile-first:** bottom tab bar with centre "Post" FAB; desktop gets full navbar.

---

## Status

**All phases complete — audited against the MVP specification.** Phase 1: foundation, design
system, seed data, AI engine, landing, auth, home feed, AI search. Phase 2: product/service
detail pages, create flows, real-time chat. Phase 3: "I'm Looking For" request board with AI
matching, full profile, admin dashboard. Phase 4 hardening: every spec feature verified
(all 11 pages, 5 AI systems, 4 user roles, request board with auto-notifications), per-page
browser titles, branded 404, PWA manifest + icons for home-screen install, Dockerfile.

---

## Deploying / previewing

The whole app runs client-side against seeded demo data (no env vars, no API keys), so it
deploys anywhere Next.js runs.

### Local

```bash
npm install
npm run dev          # dev mode → http://localhost:3000
# or production mode:
npm run build && npm start
```

### Vercel (recommended, zero config)

1. Push this folder to a GitHub repo, then **vercel.com → New Project → Import** the repo.
   Framework auto-detects as Next.js — just click **Deploy**.
   (Or from the terminal: `npm i -g vercel && vercel` and follow the prompts.)
2. No environment variables needed for the MVP. When you later wire up Supabase/Gemini/Mapbox,
   add their keys in *Project → Settings → Environment Variables* and swap the mock bodies in
   `src/lib/ai.ts` / `src/lib/store.tsx` (see "Swapping mocks for production" above).

### Docker

A production `Dockerfile` (multi-stage, Node 20 Alpine, standalone output) is included:

```bash
docker build -t locora .
docker run -p 3000:3000 locora     # → http://localhost:3000
```

`npm run build && npm start` also works on any Node 18+ host — nothing in the app is
server-specific.

### Install as an app (PWA)

Locora ships a web manifest, theme colour and touch icons, so **Install app / Add to Home
Screen** works out of the box on Android and iOS — fitting for a mobile-first marketplace.
