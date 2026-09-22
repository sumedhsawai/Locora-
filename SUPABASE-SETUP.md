# Locora — Supabase Setup Guide

Follow these steps to create the Supabase project and enable Email + Google sign-in.
Everything here is done in your browser — no code needed. **Takes ~15 minutes.**

At the end, you'll paste **two values** back into the chat, and I'll wire the app to
real authentication and a real database.

---

## Step 1 — Create the Supabase project

1. Go to **https://supabase.com** → **Start your project** → sign up
   (sign in with GitHub is fastest).
2. On the dashboard, click **New project**.
3. Fill in:
   | Field | What to enter |
   |---|---|
   | **Name** | `locora` |
   | **Database Password** | A long, unique password — click **Generate**. ⚠️ **Save it somewhere safe** (password manager). You will NOT paste this to me — it's your private admin credential. |
   | **Region** | `Mumbai (ap-south-1)` — closest to your users in India = lowest latency |
   | **Plan** | Free (500 MB database, 50,000 monthly active users, 5 GB bandwidth — plenty to launch) |
4. Click **Create new project** and wait ~2 minutes for provisioning.

> 💡 **Free-tier note:** projects pause after ~7 days of no traffic. Once your site is
> live with real visitors that won't happen; while testing, just open the dashboard
> occasionally, or upgrade later. Unpausing is one click and no data is lost.

---

## Step 2 — Copy your two public keys

1. In your new project, go to **Project Settings** (⚙️ gear icon, bottom-left) → **API**.
2. You'll see three things on that page:

   | What you see | What it's for | Do what? |
   |---|---|---|
   | **Project URL** — `https://xxxxxxx.supabase.co` | Where the app connects | ✅ **Copy — paste to me** |
   | **anon / public** key — `eyJhbGciOi...` (long) | The browser-side key. **Public by design** — security comes from Row Level Security rules, which I'll write | ✅ **Copy — paste to me** |
   | **service_role** key | Full database access — must NEVER be in browser code or GitHub | ❌ **Keep private. Don't paste it anywhere in chat or code** |

That's all I need from you: **Project URL + anon key**.

---

## Step 3 — Turn on Email sign-in (already on by default)

1. Go to **Authentication → Sign In / Up** (in the left sidebar under your project).
2. Under **Email**, confirm **Enable Email Provider** is ON (it is by default).
3. Under **Email → Confirm email**, keep **Enable email confirmations ON**
   (default). Users must click a link in their inbox before their account activates —
   this prevents fake sign-ups. For testing, Supabase shows the confirmation link
   in **Authentication → Users** or in the email logs (Inbucket) on the free tier.
4. (Optional, recommended later) **Authentication → Sign In / Up → Bot & Abuse → CAPTCHA**
   can be enabled with hCaptcha if you ever see abuse.

---

## Step 4 — Turn on Google sign-in

This has two halves: create a **Google OAuth client**, then connect it to Supabase.

### 4a. Create the Google OAuth client

1. Go to **https://console.cloud.google.com** → sign in with your Google account.
2. Top bar → project dropdown → **New project** → name it `locora` → **Create**.
3. In the search bar, type **APIs & Services → OAuth consent screen**:
   - User type: **External** → **Create**
   - App name: `Locora` · your email as user support + developer contact → **Save**
   - Scopes: add **email**, **profile**, **openid** (basic — no sensitive scopes, no
     Google review needed) → Save
   - Test users: you can leave empty
   - Later, when launching: press **Publish app** (anyone with a Google account can
     sign in; staying in "Testing" limits you to 100 test users)
4. Now **APIs & Services → Credentials → + Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins:**
     ```
     https://YOUR-PROJECT-REF.supabase.co
     ```
     (replace `YOUR-PROJECT-REF` with the `xxxxxxx` part of your Supabase URL)
   - **Authorized redirect URIs:**
     ```
     https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
     ```
   - Click **Create** → copy the **Client ID** and **Client Secret**.

### 4b. Connect it to Supabase

1. In Supabase: **Authentication → Sign In / Up → Google** → toggle **Enable**.
2. Paste the **Client ID** and **Client Secret** from 4a → **Save**.

*(The Client ID/Secret live safely inside Supabase — the browser never sees them.)*

---

## Step 5 — Set the redirect URLs

In Supabase: **Authentication → URL Configuration**:

| Field | Value (for now) |
|---|---|
| **Site URL** | `http://localhost:3000` |
| **Redirect URLs** | add `http://localhost:3000/**` |

(When we deploy to Vercel, we'll come back and set the Site URL to your real
`https://your-app.vercel.app` and add `https://your-app.vercel.app/**` — I'll remind you.)

---

## Step 6 — Paste this back to me

Reply in the chat with exactly this:

```
Project URL: https://xxxxxxx.supabase.co
Anon key: eyJhbGciOi......
```

Then I'll immediately start wiring the app:
1. Supabase Auth (sign-up, login, Google button, password reset) replacing the demo login
2. The full database schema + Row Level Security policies
3. Real data for listings, services, chats, requests, notifications

Nothing else is needed — no other keys, no database password, ever.
