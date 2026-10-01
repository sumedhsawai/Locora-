# Google OAuth Branding — Setup Guide

## What users see today (the problem)

When someone taps **"Continue with Google"** on Locora, Google's screen says:

> Sign in with Google
> **to continue to `utolptnxtqeyiphhaitx.supabase.co`**

That's the raw Supabase project ID — not your brand. Fixing it is a 5-minute edit in Google Cloud Console (it can't be done from code or Supabase — the name comes from the OAuth consent screen attached to your Google Cloud project).

**App-side status (already correct, no changes needed):**
- ✅ Official 4-colour Google "G" icon on the sign-in button
- ✅ Proper top-level OAuth handoff (`/auth/google` → Google → Supabase → `/auth/callback`)
- ✅ Google provider live in Supabase (3 real users have signed in with it)
- ✅ Scopes requested: `email profile` (non-sensitive → **no verification review needed**)

---

## Step 1 — Open the right Google Cloud project

1. Go to **https://console.cloud.google.com/**
2. Click the project picker (top-left, next to "Google Cloud")
3. Find the project with number **1008028740169** (the number shows under each project's name — hover if needed)
   - Sanity check: inside it, **APIs & Services → Credentials** should list an OAuth 2.0 Client ID ending in `…va090qbasehmenq99o5v521kn30od1uk.apps.googleusercontent.com`

## Step 2 — Edit the OAuth consent screen

**APIs & Services → OAuth consent screen** (or the direct "Edit App" button), then:

| Field | Value to set |
|---|---|
| **App name** | `Locora` |
| **User support email** | your email (e.g. sumedhsawai99@gmail.com) |
| **App logo** | upload **`assets/google-oauth-logo-432.png`** (from this workspace — square 432×432, 135 KB) |
| **Application home page** | `https://locora-hub.vercel.app` |
| **Application privacy policy** | `https://locora-hub.vercel.app/privacy` |
| **Application terms of service** | `https://locora-hub.vercel.app/terms` |

(All three URLs are live pages in your app — verified returning 200.)

- **Authorized domains**: you can add `locora-hub.vercel.app` (optional — only needed for some flows)
- **Scopes page**: leave as-is (`email`, `profile`, `openid` if shown) — non-sensitive
- Save.

## Step 3 — Check publishing status (important!)

Still on the OAuth consent screen, look at **Publishing status**:

- If it says **"Testing"** → click **"PUSH TO PRODUCTION"**. In Testing mode only explicitly-added test users can sign in, and their consent expires every 7 days — you don't want that for a live marketplace.
- If it already says **"In production"** → you're done.
- Google may show a scary "verification" prompt — you can confirm without a review because your scopes are non-sensitive. If it ever demands a verification review for `email profile` alone, something is off — don't submit the form, ping me.

## Step 4 — Wait + verify

- Consent-screen name/logo changes propagate in **minutes to a few hours**.
- When done, ask me to re-run the verification probe — it should then say **"to continue to Locora"** with your logo next to it.

---

## Notes & follow-ups

- **Stale duplicate deploy:** `locora-six.vercel.app` is a second Vercel project deploying the same code WITHOUT the Supabase env vars — it runs in mock mode (demo data, no Google sign-in). Delete it in Vercel (Settings → General → Delete Project). Once your **custom domain** (backlog item) is live, update the three URLs above to the custom domain.
- **Assets in this workspace:**
  - `locora/assets/google-oauth-logo-432.png` — for the consent screen (recommended upload)
  - `locora/assets/google-oauth-logo-512.png` — larger version, same use
- Nothing in this task required code changes, so there's **nothing to commit or deploy**.
