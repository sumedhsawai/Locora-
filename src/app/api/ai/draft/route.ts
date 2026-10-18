import { NextResponse } from "next/server";

/**
 * Locora AI draft endpoint — the only place the Gemini key is ever used.
 * The browser never sees it; clients call this route and gracefully fall
 * back to the local heuristic engine when AI is unavailable
 * (no key / quota exhausted / Google down / input rejected).
 */

export const runtime = "nodejs";

/* Flash-Lite first: on the 2026 free tier it allows ~500 requests/day
 * (full Flash is only ~20/day for new keys). Full Flash stays as a
 * last-resort fallback — quality is similar for short listing drafts. */
const MODELS = ["gemini-flash-lite-latest", "gemini-3.5-flash-lite", "gemini-flash-latest"];
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/* -------- tiny per-IP rate limiter (protects the free-tier quota) -------- */
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  if (hits.size > 500) hits.clear(); // keep the map bounded
  hits.set(ip, recent);
  return recent.length > 8; // 8 drafts per minute per IP is plenty for humans
}

/* ------------------------------ prompts ------------------------------ */

const LISTING_SYSTEM = `You are the listing assistant for Locora, a hyperlocal marketplace in India where neighbours buy, sell and hire locally. Buyers and sellers chat on the platform, meet in person at a public place and pay in cash. All prices are in Indian Rupees.

Write a polished marketplace listing from the seller's own words.

Rules:
- Use ONLY facts the seller provided. Never invent condition, accessories, age, flaws or history. If a detail is unknown, leave it out.
- Title: under 60 characters, Title Case, keep brand / model / capacity details. No emojis, no "for sale", no phone numbers or contact details.
- Description: two short paragraphs, under 120 words total. Concrete, honest, warm. End by inviting buyers to chat and meet at a public spot nearby. No emojis, no contact details.
- tags: 2 to 4 short descriptive labels.
- Price: if you are confident about the typical SECOND-HAND price in India for this exact kind of item (factoring in the stated age and condition), set matched=true with a realistic min/max range in INR. If you are not sure, set matched=false and priceMin=priceMax=0. Never guess.
- note: when matched, "Typical price range for a used <item>." — otherwise an empty string.`;

const SERVICE_SYSTEM = `You are the profile assistant for Locora, a hyperlocal marketplace in India where neighbours hire local service providers (plumbers, tutors, photographers...). Clients and providers chat on the platform and meet locally. All prices are in Indian Rupees.

Write the provider's profile from their trade, experience and area.

Rules:
- tagline: under 60 characters, concrete and specific to the trade. No emojis, no quotes.
- bio: two short paragraphs in first person, under 110 words. Honest and grounded — mention clear quotes before work, showing up on time, serving their area. NEVER invent credentials, certifications, awards or client counts.
- skills: 3 to 5 short labels relevant to the trade.
- startingPrice: typical starting price in INR for this trade in India. 0 if unsure.
- No emojis or contact details anywhere.`;

/* ---------------------------- response schemas ---------------------------- */

const LISTING_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    description: { type: "STRING" },
    tags: { type: "ARRAY", items: { type: "STRING" } },
    priceMin: { type: "NUMBER" },
    priceMax: { type: "NUMBER" },
    matched: { type: "BOOLEAN" },
    note: { type: "STRING" },
  },
  required: ["title", "description", "tags", "priceMin", "priceMax", "matched", "note"],
} as const;

const SERVICE_SCHEMA = {
  type: "OBJECT",
  properties: {
    tagline: { type: "STRING" },
    bio: { type: "STRING" },
    skills: { type: "ARRAY", items: { type: "STRING" } },
    startingPrice: { type: "NUMBER" },
  },
  required: ["tagline", "bio", "skills", "startingPrice"],
} as const;

/* ------------------------------ Gemini call ------------------------------ */

async function callGemini(
  key: string,
  system: string,
  user: string,
  schema: object,
): Promise<Record<string, unknown> | null> {
  for (const model of MODELS) {
    try {
      const res = await fetch(ENDPOINT(model), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) continue; // try the fallback model
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      /* try the next model */
    }
  }
  return null;
}

/* ------------------------------- the route ------------------------------- */

export async function POST(req: Request) {
  /* Accept the key under any of the common names people use, and trim
   * stray whitespace from pasted values — the #1 cause of silent failures. */
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GEMINI_APIKEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";
  if (!key.trim())
    return NextResponse.json(
      {
        error: "ai-not-configured",
        hint: "Add the Gemini key as an environment variable (e.g. GEMINI_API_KEY) in Vercel, tick the Production environment, then redeploy.",
      },
      { status: 503 },
    );
  const apiKey = key.trim();

  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (rateLimited(ip)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });

  let body: { kind?: unknown; raw?: unknown; ageYears?: unknown; trade?: unknown; years?: unknown; area?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  /* -------- service profile drafts -------- */
  if (body.kind === "service") {
    const trade = String(body.trade ?? "").trim().slice(0, 40);
    const years = Math.min(60, Math.max(0, Math.round(Number(body.years) || 0)));
    const area = String(body.area ?? "").trim().slice(0, 60);
    if (!trade) return NextResponse.json({ error: "bad-input" }, { status: 400 });

    const out = await callGemini(
      apiKey,
      SERVICE_SYSTEM,
      `Trade: ${trade}\nYears of experience: ${years}\nArea they serve: ${area || "their neighbourhood"}`,
      SERVICE_SCHEMA,
    );
    if (!out) return NextResponse.json({ error: "ai-unavailable" }, { status: 502 });

    const price = Math.max(0, Math.round(Number(out.startingPrice) || 0));
    return NextResponse.json({
      tagline: String(out.tagline ?? "").trim().slice(0, 80),
      bio: String(out.bio ?? "").trim().slice(0, 1200),
      skills: (Array.isArray(out.skills) ? out.skills : [])
        .slice(0, 6)
        .map((s) => String(s).slice(0, 40)),
      startingPrice: price,
    });
  }

  /* -------- listing drafts (default) -------- */
  const raw = String(body.raw ?? "").trim().slice(0, 600);
  const ageYears = Math.min(50, Math.max(0, Math.round(Number(body.ageYears) || 0)));
  if (raw.length < 3) return NextResponse.json({ error: "bad-input" }, { status: 400 });

  const out = await callGemini(
    apiKey,
    LISTING_SYSTEM,
    `Seller says: "${raw}"\nOwned for: ${ageYears} ${ageYears === 1 ? "year" : "years"}.`,
    LISTING_SCHEMA,
  );
  if (!out) return NextResponse.json({ error: "ai-unavailable" }, { status: 502 });

  const min = Math.max(0, Math.round(Number(out.priceMin) || 0));
  const max = Math.max(min, Math.round(Number(out.priceMax) || 0));
  return NextResponse.json({
    title: String(out.title ?? "").trim().slice(0, 70),
    description: String(out.description ?? "").trim().slice(0, 1500),
    tags: (Array.isArray(out.tags) ? out.tags : []).slice(0, 4).map((s) => String(s).slice(0, 24)),
    priceRange: { min, max },
    matched: !!out.matched && max > 0,
    note: String(out.note ?? "").trim().slice(0, 120),
  });
}
