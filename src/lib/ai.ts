/* ------------------------------------------------------------------ */
/*  Locora — AI engine (mock Gemini layer)                            */
/*                                                                    */
/*  Every function here mimics a Gemini API call: it is async, has   */
/*  a realistic latency, and returns rich, structured output. To go  */
/*  to production, replace the bodies with real Gemini calls that    */
/*  use the same interfaces — no UI code needs to change.            */
/* ------------------------------------------------------------------ */

import { AREAS, areaLocation, areaName, distanceBetweenAreas, distanceKm, placeOf } from "./geo";
import { inr, pickBySeed } from "./format";
import type {
  BuyRequest,
  Condition,
  PriceCheckLabel,
  Product,
  ProductCategory,
  RequestMatch,
  Service,
  ServiceCategory,
  User,
} from "./types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ============================ NL search =========================== */

export interface SearchChip {
  type: "category" | "price" | "area" | "condition" | "keyword";
  label: string;
}

export interface SearchParse {
  kind: "product" | "service";
  category?: ProductCategory | ServiceCategory;
  keywords: string[];
  priceMax?: number;
  condition?: Condition;
  area?: string;
  summary: string;
  chips: SearchChip[];
  voice: string; // friendly one-liner from the "AI"
}

const PRODUCT_KEYWORDS: Partial<Record<ProductCategory, string[]>> = {
  mobiles: ["phone", "mobile", "iphone", "samsung", "oneplus", "pixel", "redmi", "realme", "vivo", "oppo", "nothing", "smartphone"],
  electronics: ["laptop", "macbook", "computer", "ipad", "tablet", "camera", "dslr", "headphone", "earbud", "monitor", "tv", "speaker", "console", "ps5", "xbox", "kindle"],
  vehicles: ["bike", "scooter", "activa", "enfield", "royal enfield", "motorcycle", "car", "hatchback", "sedan", "swift", "i20", "pulsar", "duke"],
  furniture: ["sofa", "bed", "table", "chair", "desk", "dining", "cupboard", "almirah", "mattress", "shelf", "bookshelf", "wardrobe"],
  appliances: ["fridge", "refrigerator", "washing machine", "microwave", "oven", "cooler", "fan", "purifier", "geyser", " mixie "],
  fashion: ["shoes", "sneakers", "jacket", "watch", "bag", "dress", "kurta", "saree", "heels", "perfume"],
  sports: ["bicycle", "cycle", "treadmill", "dumbbell", "racket", "racquet", "bat", "cricket", "badminton", "gym"],
  books: ["book", "books", "novel", "upsc", "neet", "jee", "textbook", "guide", "notes"],
  music: ["guitar", "keyboard", "piano", "violin", "tabla", "harmonium", "drums", "flute", "ukelele", "ukulele"],
};

const SERVICE_KEYWORDS: Partial<Record<ServiceCategory, string[]>> = {
  plumber: ["plumber", "plumbing", "tap", "leak", "leaking", "pipe", "drain", "blocked", "sink", "faucet", "flush"],
  electrician: ["electrician", "electrical", "wiring", "switch", "mcb", "inverter", "ups", "short circuit", "socket", "light not"],
  tutor: ["tutor", "tuition", "teacher", "home tutor", "coaching", "class 10", "class 8", "cbse", "icse", "maths tutor", "science tutor"],
  photographer: ["photographer", "photography", "photoshoot", "photo shoot", "wedding photos", "candid", "birthday shoot", "pre wedding"],
  mechanic: ["mechanic", "bike service", "car service", "servicing", "garage", "dent", "puncture", "engine"],
  cleaner: ["cleaning", "cleaner", "deep clean", "maid", "housekeeping", "sanitisation", "sanitization", "broom"],
  "ac-repair": ["ac service", "ac repair", "air conditioner", "cooling problem", "gas refill", "fridge repair", "washing machine repair", "appliance repair", "ac cleaning", "ac gas"],
  interior: ["interior", "designer", "modular kitchen", "renovation", "decor", "false ceiling"],
  "pest-control": ["pest", "cockroach", "termite", "bed bug", "bedbug", "mosquito", "rat", "rodent"],
  cook: ["cook", "tiffin", "chef", "khana", "maharashtrian food", "home food"],
  painter: ["painter", "painting", "paint", "emulsion", "waterproofing", "wall paint"],
  yoga: ["yoga", "meditation", "pilates", "personal trainer", "fitness trainer", "zumba"],
};

function detectArea(q: string): string | undefined {
  return AREAS.find((a) => q.includes(a.name.toLowerCase()))?.id;
}

function detectPrice(q: string): number | undefined {
  const rel =
    /(?:under|below|less than|up to|upto|max|within|budget(?: of)?|around|about|upto)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|lakh|lac|l\b|crore|cr)?/i.exec(q) ??
    /(?:₹|rs\.?)\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|lakh|lac|l\b|crore|cr)?/i.exec(q);
  if (!rel) return undefined;
  let n = parseFloat(rel[1]!.replace(/,/g, ""));
  const unit = rel[2]?.toLowerCase();
  if (unit === "k" || unit === "thousand") n *= 1000;
  else if (unit === "lakh" || unit === "lac" || unit === "l") n *= 100000;
  else if (unit === "crore" || unit === "cr") n *= 10000000;
  return n >= 50 ? Math.round(n) : undefined; // ignore tiny numbers (e.g. "class 10")
}

function detectCondition(q: string): Condition | undefined {
  if (/like new|almost new|mint/.test(q)) return "like-new";
  if (/brand new|sealed|unused/.test(q)) return "new";
  if (/used|second[- ]hand|pre[- ]?loved|old/.test(q)) return "good";
  return undefined;
}

export async function parseSearchQuery(query: string): Promise<SearchParse> {
  await wait(700 + Math.random() * 600);
  const q = ` ${query.toLowerCase().trim()} `;

  let kind: "product" | "service" = "product";
  let category: ProductCategory | ServiceCategory | undefined;
  let categoryLabel = "";

  if (/\bservices?\b/.test(q)) {
    kind = "service";
  }

  for (const [cat, words] of Object.entries(SERVICE_KEYWORDS) as [ServiceCategory, string[]][]) {
    if (words.some((w) => q.includes(w))) {
      kind = "service";
      category = cat;
      categoryLabel = cat;
      break;
    }
  }
  if (!category) {
    for (const [cat, words] of Object.entries(PRODUCT_KEYWORDS) as [ProductCategory, string[]][]) {
      if (words.some((w) => q.includes(w))) {
        category = cat;
        categoryLabel = cat;
        break;
      }
    }
  }

  const area = detectArea(q);
  const priceMax = detectPrice(q);
  const condition = detectCondition(q);
  const keywords = (Object.values(PRODUCT_KEYWORDS).flat() as string[]).filter((w) =>
    w.length > 3 ? q.includes(w) : false
  );

  const parts: string[] = [];
  const chips: SearchChip[] = [];
  if (kind === "service") parts.push("local services");
  else {
    parts.push(condition === "new" ? "new items" : condition ? `${condition.replace("-", " ")} items` : "listings");
  }
  if (category) {
    const label =
      kind === "service"
        ? category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")
        : category;
    parts[0] = `${parts[0]} in ${label}`;
    chips.push({ type: "category", label: `${label}` });
  }
  if (priceMax) {
    parts.push(`under ${inr(priceMax)}`);
    chips.push({ type: "price", label: `Under ${inr(priceMax)}` });
  }
  if (area) {
    parts.push(`near ${areaName(area)}`);
    chips.push({ type: "area", label: `📍 ${areaName(area)}` });
  }
  if (condition && condition !== "good") chips.push({ type: "condition", label: condition.replace("-", " ") });
  for (const k of keywords.slice(0, 2)) chips.push({ type: "keyword", label: k.trim() });

  const voices = [
    `Got it — looking for ${parts.join(", ")}. I've also ranked nearby results first. 🌱`,
    `Nice, a clear brief! ${parts.join(", ")} — and I've bumped well-priced listings to the top.`,
    `Understood! Showing ${parts.join(", ")}. Save the ones you like and I'll watch for price drops.`,
  ];

  return {
    kind,
    category,
    keywords,
    priceMax,
    condition,
    area,
    summary: parts.join(" · "),
    chips,
    voice: pickBySeed(voices, query),
  };
}

export const SEARCH_EXAMPLES = [
  "need a plumber today, kitchen sink blocked",
  "used iPhone under ₹40k near Viman Nagar",
  "study table with shelf, budget 5k",
  "wedding photographer around 60k budget",
  "like-new MacBook for video editing",
  "deep cleaning before Diwali, 2BHK",
  "home tutor for class 10 CBSE maths, evenings",
];

/* ======================= AI listing generator ===================== */

export interface ListingDraft {
  title: string;
  description: string;
  tags: string[];
  priceRange: { min: number; max: number };
  confidence: number;
  note: string;
}

const PRICE_BENCHMARKS: { match: string[]; min: number; max: number; name: string }[] = [
  { match: ["iphone 13"], min: 34000, max: 42000, name: "iPhone 13" },
  { match: ["iphone 12"], min: 26000, max: 33000, name: "iPhone 12" },
  { match: ["iphone 15"], min: 56000, max: 68000, name: "iPhone 15" },
  { match: ["iphone"], min: 25000, max: 70000, name: "iPhone" },
  { match: ["galaxy s22", "s22"], min: 27000, max: 34000, name: "Galaxy S22" },
  { match: ["galaxy", "samsung"], min: 12000, max: 45000, name: "Samsung phone" },
  { match: ["macbook air m1", "macbook air"], min: 47000, max: 58000, name: "MacBook Air M1" },
  { match: ["macbook"], min: 45000, max: 95000, name: "MacBook" },
  { match: ["laptop", "notebook"], min: 22000, max: 45000, name: "laptop" },
  { match: ["ipad"], min: 15000, max: 26000, name: "iPad" },
  { match: ["camera", "dslr"], min: 18000, max: 40000, name: "camera" },
  { match: ["headphone", "headphones", "earbud"], min: 1500, max: 12000, name: "headphones" },
  { match: ["sofa"], min: 14000, max: 32000, name: "sofa set" },
  { match: ["bed"], min: 10000, max: 24000, name: "bed" },
  { match: ["dining"], min: 8000, max: 20000, name: "dining set" },
  { match: ["table", "desk"], min: 3000, max: 9000, name: "table" },
  { match: ["ac", "air conditioner"], min: 14000, max: 26000, name: "AC" },
  { match: ["fridge", "refrigerator"], min: 8000, max: 17000, name: "refrigerator" },
  { match: ["washing machine"], min: 7000, max: 16000, name: "washing machine" },
  { match: ["cycle", "bicycle", "btwin"], min: 4000, max: 12000, name: "bicycle" },
  { match: ["guitar"], min: 4500, max: 13000, name: "guitar" },
  { match: ["watch"], min: 1200, max: 6000, name: "watch" },
  { match: ["shoes", "sneakers"], min: 1200, max: 4500, name: "sneakers" },
];

export async function generateListingDraft(raw: string, ageYears: number): Promise<ListingDraft> {
  await wait(1200 + Math.random() * 800);
  const q = raw.toLowerCase();
  const bench =
    PRICE_BENCHMARKS.find((b) => b.match.some((m) => q.includes(m))) ??
    ({ min: 2000, max: 10000, name: "item" } as (typeof PRICE_BENCHMARKS)[number]);

  const cond = detectCondition(q) ?? "good";
  const condFactor = cond === "new" ? 1.25 : cond === "like-new" ? 1.05 : cond === "good" ? 0.9 : 0.75;
  const ageFactor = Math.max(0.55, 1 - (ageYears || 1) * 0.09);
  const min = Math.round((bench.min * condFactor * ageFactor) / 500) * 500;
  const max = Math.round((bench.max * condFactor * ageFactor) / 500) * 500;

  const prettyTitle = raw
    .replace(/\b(selling|for sale|my|used|the|a|an|want to sell)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w.length > 2 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
    .slice(0, 64);

  const tagPool = [
    "Well maintained",
    "Single owner",
    "Non-smoker home",
    "With box",
    "Bill available",
    "Recently serviced",
    "Pet-free home",
    "Urgent sale",
    "Price slightly negotiable",
  ];

  const description = `${prettyTitle || "This item"} is in ${cond === "like-new" ? "like-new" : cond} condition and has been well looked after${ageYears ? ` for the ${ageYears} year${ageYears > 1 ? "s" : ""} I've used it` : ""}. Everything works exactly as it should, and I'm happy to demonstrate it before you pay.\n\nReason for selling: I'm upgrading, and it deserves a new home rather than gathering dust.\n\n${pickBySeed(
    [
      "Preference to buyers who can pick up from my area — we can meet at a public spot nearby.",
      "I can share more photos or a quick video on request. Meet-up at a cafe or metro station works for me.",
      "Slight negotiation possible for a quick, confirmed deal. No low-ball offers please 🙂",
    ],
    raw
  )}`;

  return {
    title: prettyTitle || `${bench.name} for sale`,
    description,
    tags: [...new Set([cond === "like-new" ? "Like new" : "Well maintained", "Verified by AI draft", pickBySeed(tagPool, raw + "x")])].slice(0, 4),
    priceRange: { min, max },
    confidence: 82 + (Math.floor(Math.random() * 12) as number),
    note: `Based on ${18 + Math.floor(Math.random() * 30)} similar listings in Pune over the last 90 days.`,
  };
}

/* ========================= price suggestion ======================= */

export interface PriceSuggestion {
  fair: number;
  low: number;
  high: number;
  comparables: { title: string; price: number; area: string }[];
  verdict: { label: PriceCheckLabel; deltaPct: number };
}

export async function suggestPrice(
  product: { title: string; category: ProductCategory; condition: Condition; price: number; ageYears?: number },
  allProducts: Product[]
): Promise<PriceSuggestion> {
  await wait(900 + Math.random() * 500);
  const similar = allProducts
    .filter((p) => p.category === product.category && p.id !== "p20" && !p.flagged)
    .slice(0, 12);
  const prices = similar.map((p) => p.price);
  const base = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : product.price;
  const condFactor = product.condition === "new" ? 1.3 : product.condition === "like-new" ? 1.05 : product.condition === "good" ? 0.9 : 0.72;
  const ageFactor = Math.max(0.6, 1 - (product.ageYears ?? 1) * 0.08);
  const fair = Math.round((base * condFactor * ageFactor) / 500) * 500;
  const deltaPct = Math.round(((product.price - fair) / fair) * 100);
  return {
    fair,
    low: Math.round((fair * 0.88) / 500) * 500,
    high: Math.round((fair * 1.12) / 500) * 500,
    comparables: similar.slice(0, 3).map((p) => ({ title: p.title, price: p.price, area: p.area })),
    verdict: {
      label: deltaPct <= -6 ? "great" : deltaPct >= 10 ? "high" : "fair",
      deltaPct,
    },
  };
}

/* ========================== scam detection ======================== */

export interface ScamCheck {
  score: number; // 0-100, higher = riskier
  level: "low" | "medium" | "high";
  flags: string[];
  advice: string;
}

const RISKY_WORDS = [
  "paytm", "gpay", "phonepe", "upi", "advance", "booking amount", "deposit first",
  "transfer", "urgent", "today only", "first come", "no time wasters", "whatsapp me",
  "call me", "telegram", "cashapp", "western union",
];

export async function scamCheck(input: {
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  medianPrice?: number;
}): Promise<ScamCheck> {
  await wait(1000 + Math.random() * 700);
  const text = `${input.title} ${input.description}`.toLowerCase();
  const flags: string[] = [];
  let score = 6;

  const hits = RISKY_WORDS.filter((w) => text.includes(w));
  if (hits.length) {
    score += Math.min(38, hits.length * 13);
    flags.push(`Risky payment / contact language detected (${hits.slice(0, 3).join(", ")})`);
  }
  if (input.medianPrice && input.price < input.medianPrice * 0.5) {
    const below = Math.round((1 - input.price / input.medianPrice) * 100);
    score += 42;
    flags.push(`Price is ${below}% below the local market rate for this category`);
  }
  const letters = input.title.replace(/[^a-zA-Z]/g, "");
  const caps = input.title.replace(/[^A-Z]/g, "");
  if (letters.length > 8 && caps.length / letters.length > 0.6) {
    score += 12;
    flags.push("Title is mostly ALL CAPS — common in scam listings");
  }
  if (/\b\d{10}\b/.test(text.replace(/\s/g, ""))) {
    score += 14;
    flags.push("Phone number shared in the listing text");
  }
  if (/urgent|moving abroad|emergency/.test(text)) {
    score += 8;
    flags.push("Urgency framing ('urgent sale', 'moving abroad')");
  }

  const level: ScamCheck["level"] = score >= 60 ? "high" : score >= 32 ? "medium" : "low";
  return {
    score: Math.min(98, Math.round(score)),
    level,
    flags,
    advice:
      level === "high"
        ? "High risk. We recommend not sharing any advance payment. Meet in person, inspect the item, then pay."
        : level === "medium"
          ? "Some risk signals found. Proceed carefully — meet in a public place and avoid advance payments."
          : "No significant risk signals found. Still, always meet in person and inspect before paying.",
  };
}

/* ===================== service profile generator ================== */

export interface ServiceProfileDraft {
  tagline: string;
  bio: string;
  skills: string[];
  startingPrice: number;
}

export async function generateServiceProfile(
  trade: ServiceCategory,
  years: number,
  areaNameStr: string
): Promise<ServiceProfileDraft> {
  await wait(1300 + Math.random() * 700);
  const t: Partial<Record<ServiceCategory, { tagline: string[]; skills: string[]; price: number }>> = {
    plumber: { tagline: ["Leaky taps? Fixed right the first time.", "Honest plumbing, fair prices."], skills: ["Leaks & taps", "Drain unblocking", "Bathroom fittings"], price: 199 },
    electrician: { tagline: ["Safe wiring, sound sleep.", "Switchboards, wiring & inverters — done safe."], skills: ["House wiring", "Switchboard repair", "Inverter & UPS"], price: 149 },
    tutor: { tagline: ["Concepts first, marks follow.", "Small batches, big results."], skills: ["CBSE / ICSE", "Doubt-clearing", "Weekly tests"], price: 400 },
    photographer: { tagline: ["Candid stories, not posed photos.", "Your moments, remembered beautifully."], skills: ["Weddings", "Events", "Same-day preview"], price: 9500 },
    mechanic: { tagline: ["Your bike deserves a mechanic who cares.", "Honest diagnosis, fair repairs."], skills: ["Bike servicing", "Engine diagnostics", "Roadside assistance"], price: 499 },
    cleaner: { tagline: ["Homes that sparkle.", "Deep cleaning, minus the effort."], skills: ["Deep cleaning", "Kitchen degreasing", "Move-in cleaning"], price: 2499 },
    "ac-repair": { tagline: ["Cool air, clean air, honest pricing."], skills: ["AC jet service", "Gas refill", "AMC plans"], price: 349 },
    interior: { tagline: ["Small budgets, beautiful homes."], skills: ["Space planning", "Modular kitchens", "3D renders"], price: 2999 },
    "pest-control": { tagline: ["Gone and staying gone."], skills: ["Cockroach gel", "Termite control", "Bed bugs"], price: 1499 },
    cook: { tagline: ["Ghar ka khana, with love."], skills: ["Maharashtrian thali", "North Indian", "Monthly tiffin"], price: 6500 },
    painter: { tagline: ["Fresh walls, fresh home."], skills: ["Interior emulsion", "Texture walls", "Waterproofing"], price: 18 },
    yoga: { tagline: ["Breathe, stretch, strengthen."], skills: ["Hatha yoga", "Pranayama", "Back-pain relief"], price: 700 },
  };
  const conf = t[trade] ?? { tagline: ["Reliable work, honest pricing."], skills: ["General jobs"], price: 499 };

  const bio = `I'm a ${trade.replace("-", " ")} based in ${areaNameStr} with ${years}+ years of experience. I believe in clear quotes before work begins, showing up on time, and treating every home like my own. Regular clients across ${areaNameStr} and nearby areas — most of my work comes from referrals and repeat customers. Message me on Locora and I'll usually reply within minutes.`;

  return {
    tagline: pickBySeed(conf.tagline, trade + years),
    bio,
    skills: conf.skills,
    startingPrice: conf.price,
  };
}

/* ===================== request board matching ===================== */

export function matchRequest(
  request: Pick<BuyRequest, "text" | "category" | "area" | "budgetMax" | "location">,
  services: Service[],
  products: Product[],
  users: User[]
): { matches: RequestMatch[]; watched: boolean } {
  const matches: RequestMatch[] = [];

  for (const s of services) {
    if (s.category !== request.category) continue;
    const provider = users.find((u) => u.id === s.providerId);
    if (!provider || provider.banned) continue;
    const d = request.location || s.location
      ? distanceKm(placeOf(request), placeOf(s))
      : distanceBetweenAreas(request.area, s.area);
    if (d > s.radiusKm + 6) continue;
    let score = 34 + s.rating * 8;
    score += Math.max(0, 14 - Math.min(d, 14));
    if (s.verified) score += 4;
    if (s.responseMins <= 15) score += 7;
    else if (s.responseMins <= 30) score += 3;
    if (request.budgetMax && s.startingPrice > request.budgetMax) score -= 18;
    matches.push({
      userId: provider.id,
      serviceId: s.id,
      score: Math.min(99, Math.round(score)),
      distanceKm: d,
      reason: `${s.rating}★ (${s.reviewsCount} reviews) · replies in ~${s.responseMins} min · ${d} km away`,
    });
  }

  for (const p of products) {
    if (p.category !== request.category || p.status !== "active" || p.flagged) continue;
    const seller = users.find((u) => u.id === p.sellerId);
    if (!seller || seller.banned) continue;
    const d = request.location || p.location
      ? distanceKm(placeOf(request), placeOf(p))
      : distanceBetweenAreas(request.area, p.area);
    let score = 40 + (seller.rating ?? 4.5) * 7;
    score += Math.max(0, 12 - Math.min(d, 12));
    if (p.priceCheck.label === "great") score += 5;
    if (request.budgetMax && p.price > request.budgetMax) score -= 20;
    matches.push({
      userId: seller.id,
      productId: p.id,
      score: Math.min(99, Math.round(score)),
      distanceKm: d,
      reason: `${inr(p.price)} · ${p.condition.replace("-", " ")} · ${d} km away in ${areaName(p.area)}`,
    });
  }

  matches.sort((a, b) => b.score - a.score);
  return { matches: matches.slice(0, 4), watched: matches.length === 0 };
}
