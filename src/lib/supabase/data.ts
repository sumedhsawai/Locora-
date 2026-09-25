"use client";

/* ------------------------------------------------------------------ */
/*  Locora — Phase B: Supabase persistence layer                       */
/*  Maps app types ⇄ database rows, hydrates AppState from the DB and  */
/*  mirrors store actions into writes. Reads/writes run under the      */
/*  signed-in user's JWT so RLS applies end-to-end.                    */
/* ------------------------------------------------------------------ */

import type {
  AppState, BuyRequest, Conversation, LocoraLocation, Message, Product,
  Review, Service, User,
} from "@/lib/types";
import { PROFILE_COLUMNS, profileToUser, type ProfileRow } from "./auth";
import { areaLocation } from "@/lib/geo";

type Sb = NonNullable<ReturnType<typeof import("./client").supabase>>;

/* ----------------------------- rows ------------------------------ */

type ProductRow = {
  id: string; seller_id: string; title: string; description: string;
  price: number; negotiable: boolean; category: string; condition: string;
  age_years: number | null; images: string[]; area: string;
  city: string | null; state: string | null; country: string | null;
  lat: number | null; lng: number | null;
  created_at: string; views: number; favorites: number; status: string;
  ai_tags: string[]; price_check: unknown; attributes: Record<string, string> | null;
  flagged: { score: number; reasons: string[] } | null;
  is_demo?: boolean | null;
};

type ServiceRow = {
  id: string; provider_id: string; title: string; category: string;
  tagline: string; description: string; starting_price: number; price_unit: string;
  area: string; radius_km: number;
  city: string | null; state: string | null; country: string | null;
  lat: number | null; lng: number | null;
  images: string[]; rating: number; reviews_count: number; jobs_done: number;
  response_mins: number; experience_years: number; availability: string[];
  skills: string[]; verified: boolean; created_at: string;
  is_demo?: boolean | null;
};

type RequestRow = {
  id: string; buyer_id: string; text: string; category: string; area: string;
  city: string | null; state: string | null; country: string | null;
  lat: number | null; lng: number | null;
  budget_max: number | null; need_by: string; status: string;
  created_at: string; watching: boolean; matches: unknown;
  is_demo?: boolean | null;
};

type ReviewRow = {
  id: string; target_id: string; author: string; rating: number; text: string;
  deal_type: string; created_at: string;
};

type ConversationRow = {
  id: string; participants: string[]; subject: Conversation["subject"];
  updated_at: string; unread_for: string[];
};

type MessageRow = {
  id: string; conversation_id: string; sender_id: string; text: string;
  kind: string; offer: Message["offer"]; at: string;
};

/* --------------------------- mappers ------------------------------ */

function locOrNull(l?: LocoraLocation) {
  return l
    ? { city: l.city, state: l.state, country: l.country, lat: l.lat, lng: l.lng }
    : { city: null, state: null, country: null, lat: null, lng: null };
}

function rowLoc(r: { city: string | null; state: string | null; country: string | null; lat: number | null; lng: number | null }): LocoraLocation | undefined {
  return r.city ? { city: r.city, state: r.state ?? "", country: r.country ?? "", lat: r.lat ?? 0, lng: r.lng ?? 0 } : undefined;
}

export function rowToProduct(r: ProductRow): Product {
  return {
    id: r.id,
    sellerId: r.seller_id,
    title: r.title,
    description: r.description,
    price: r.price,
    negotiable: r.negotiable,
    category: r.category as Product["category"],
    condition: r.condition as Product["condition"],
    ageYears: r.age_years ?? undefined,
    images: r.images ?? [],
    area: r.area,
    location: rowLoc(r),
    createdAt: r.created_at,
    views: r.views,
    favorites: r.favorites,
    status: r.status as Product["status"],
    aiTags: r.ai_tags ?? [],
    priceCheck: (r.price_check as Product["priceCheck"]) ?? { label: "fair", deltaPct: 0, comparables: 0 },
    attributes: r.attributes ?? undefined,
    flagged: r.flagged ?? undefined,
    isDemo: r.is_demo ?? false,
  };
}

export function productToRow(p: Product): Omit<ProductRow, "created_at" | "views" | "favorites"> & Partial<Pick<ProductRow, "created_at" | "views" | "favorites">> {
  const loc = p.location ?? areaLocation(p.area);
  return {
    id: p.id, seller_id: p.sellerId, title: p.title, description: p.description,
    price: p.price, negotiable: p.negotiable, category: p.category, condition: p.condition,
    age_years: p.ageYears ?? null, images: p.images, area: p.area,
    ...locOrNull(loc),
    created_at: p.createdAt, views: p.views, favorites: p.favorites,
    status: p.status, ai_tags: p.aiTags, price_check: p.priceCheck ?? null,
    attributes: p.attributes ?? null, flagged: p.flagged ?? null,
  };
}

export function rowToService(r: ServiceRow): Service {
  return {
    id: r.id, providerId: r.provider_id, title: r.title, category: r.category as Service["category"],
    tagline: r.tagline, description: r.description, startingPrice: r.starting_price,
    priceUnit: r.price_unit as Service["priceUnit"], area: r.area, radiusKm: r.radius_km,
    location: rowLoc(r), images: r.images ?? [], rating: Number(r.rating),
    reviewsCount: r.reviews_count, jobsDone: r.jobs_done, responseMins: r.response_mins,
    experienceYears: r.experience_years, availability: r.availability ?? [],
    skills: r.skills ?? [], verified: r.verified, createdAt: r.created_at,
    isDemo: r.is_demo ?? false,
  };
}

export function serviceToRow(s: Service): Omit<ServiceRow, "created_at" | "rating" | "reviews_count" | "jobs_done"> & Partial<Pick<ServiceRow, "created_at" | "rating" | "reviews_count" | "jobs_done">> {
  const loc = s.location ?? areaLocation(s.area);
  return {
    id: s.id, provider_id: s.providerId, title: s.title, category: s.category,
    tagline: s.tagline, description: s.description, starting_price: s.startingPrice,
    price_unit: s.priceUnit, area: s.area, radius_km: s.radiusKm,
    ...locOrNull(loc),
    images: s.images, response_mins: s.responseMins,
    experience_years: s.experienceYears, availability: s.availability,
    skills: s.skills, verified: s.verified, created_at: s.createdAt,
  };
}

export function rowToRequest(r: RequestRow): BuyRequest {
  return {
    id: r.id, buyerId: r.buyer_id, text: r.text, category: r.category as BuyRequest["category"],
    area: r.area, location: rowLoc(r), budgetMax: r.budget_max ?? undefined,
    needBy: r.need_by as BuyRequest["needBy"], status: r.status as BuyRequest["status"],
    createdAt: r.created_at, watching: r.watching,
    matches: (r.matches as BuyRequest["matches"]) ?? [],
    isDemo: r.is_demo ?? false,
  };
}

export function requestToRow(b: BuyRequest): Omit<RequestRow, "created_at"> & Partial<Pick<RequestRow, "created_at">> {
  const loc = b.location ?? areaLocation(b.area);
  return {
    id: b.id, buyer_id: b.buyerId, text: b.text, category: b.category, area: b.area,
    ...locOrNull(loc),
    budget_max: b.budgetMax ?? null, need_by: b.needBy, status: b.status,
    created_at: b.createdAt, watching: b.watching, matches: b.matches ?? [],
  };
}

function rowToReview(r: ReviewRow, users: User[]): Review {
  const author = users.find((u) => u.id === r.author);
  return {
    id: r.id, targetId: r.target_id, author: author?.name ?? "Locora user",
    authorArea: author?.area, rating: r.rating, text: r.text,
    dealType: r.deal_type as Review["dealType"], createdAt: r.created_at,
  };
}

/* --------------------------- hydration ---------------------------- */

/** Load the signed-in user's world from the database into AppState. */
export async function hydrateAll(sb: Sb, sessionUserId: string): Promise<Partial<AppState> | null> {
  const [proRes, prodRes, svcRes, reqRes, revRes, favRes, conRes, meRes, adminRes, notifRes] = await Promise.all([
    sb.from("profiles").select(PROFILE_COLUMNS).order("joined_at", { ascending: true }),
    sb.from("products").select("*").order("created_at", { ascending: false }),
    sb.from("services").select("*").order("created_at", { ascending: false }),
    sb.from("buy_requests").select("*").order("created_at", { ascending: false }),
    sb.from("reviews").select("*").order("created_at", { ascending: false }),
    sb.from("favorites").select("product_id").eq("user_id", sessionUserId),
    sb.from("conversations").select("*").order("updated_at", { ascending: false }),
    // email/phone are column-protected (not in the public REST grant) — fetch
    // contacts through RPCs: own row for everyone, all rows for admins.
    sb.rpc("my_private_profile"),
    sb.rpc("admin_profiles"),
    sb.from("notifications").select("*").eq("user_id", sessionUserId).order("at", { ascending: false }).limit(30),
  ]);

  type ContactRow = { id: string; email: string | null; phone: string | null };
  const contacts = new Map<string, ContactRow>();
  for (const r of ((adminRes.data ?? []) as ContactRow[])) contacts.set(r.id, r);
  for (const r of ((meRes.data ?? []) as ContactRow[])) contacts.set(r.id, r);

  const users = ((proRes.data ?? []) as ProfileRow[]).filter((p) => !p.banned).map((p) => {
    const u = profileToUser(p, contacts.get(p.id)?.email ?? undefined);
    const phone = contacts.get(p.id)?.phone;
    if (phone) u.phone = phone;
    return u;
  });
  const conversations = ((conRes.data ?? []) as ConversationRow[]).map((c) => ({
    id: c.id, participants: c.participants, subject: c.subject,
    updatedAt: c.updated_at, unreadFor: c.unread_for ?? [],
    messages: [] as Message[],
  }));

  // messages for those conversations (best effort — Phase D makes them realtime)
  const msgsByConversation = new Map<string, Message[]>();
  if (conversations.length) {
    const { data: msgRows } = await sb
      .from("messages")
      .select("*")
      .in("conversation_id", conversations.map((c) => c.id))
      .order("at", { ascending: true });
    for (const raw of (msgRows ?? []) as MessageRow[]) {
      const list = msgsByConversation.get(raw.conversation_id) ?? [];
      list.push({
        id: raw.id, senderId: raw.sender_id, text: raw.text, at: raw.at,
        kind: raw.kind as Message["kind"], offer: raw.offer ?? undefined,
      });
      msgsByConversation.set(raw.conversation_id, list);
    }
  }
  const hydratedConversations: Conversation[] = conversations.map((c) => ({
    ...c,
    messages: msgsByConversation.get(c.id) ?? [],
  }));

  return {
    users,
    products: ((prodRes.data ?? []) as ProductRow[]).map(rowToProduct),
    services: ((svcRes.data ?? []) as ServiceRow[]).map(rowToService),
    requests: ((reqRes.data ?? []) as RequestRow[]).map(rowToRequest),
    reviews: ((revRes.data ?? []) as ReviewRow[]).map((r) => rowToReview(r, users)),
    favorites: ((favRes.data ?? []) as { product_id: string }[]).map((f) => f.product_id),
    conversations: hydratedConversations,
    notifications: ((notifRes.data ?? []) as {
      id: string; kind: string; title: string; body: string | null;
      at: string; read: boolean; href: string | null;
    }[]).map((n) => ({
      id: n.id,
      kind: (["match", "message", "price", "system", "review"].includes(n.kind) ? n.kind : "system") as
        "match" | "message" | "price" | "system" | "review",
      title: n.title, body: n.body ?? "", at: n.at, read: n.read, href: n.href ?? undefined,
    })),
  };
}

/* ---------------------------- mirroring ---------------------------- */

type AnyAction = { type: string; [k: string]: unknown };

/**
 * Best-effort write-through of store actions into Supabase. Fire-and-forget:
 * the optimistic client state already applied; failures log to console so a
 * single blocked write never breaks the UX.
 */
export function mirrorAction(
  sb: Sb,
  action: AnyAction,
  state: Pick<AppState, "sessionUserId" | "favorites">
): void {
  const me = state.sessionUserId;
  if (!me) return;
  const done = (label: string) => (res: { error: { message: string } | null } | null) => {
    if (res?.error) console.warn(`[locora] ${label} not persisted:`, res.error.message);
  };

  switch (action.type) {
    case "ADD_PRODUCT": {
      const p = action.product as Product;
      if (p.sellerId !== me) return;
      void sb.from("products").insert(productToRow(p)).then(done("product"));
      break;
    }
    case "ADD_SERVICE": {
      const s = action.service as Service;
      if (s.providerId !== me) return;
      void sb.from("services").insert(serviceToRow(s)).then(done("service"));
      break;
    }
    case "ADD_REQUEST": {
      const b = action.request as BuyRequest;
      if (b.buyerId !== me) return;
      void sb.from("buy_requests").insert(requestToRow(b)).then(done("request"));
      break;
    }
    case "UPDATE_PRODUCT": {
      const patch = action.patch as Partial<Product>;
      // views/favorites are maintained server-side (RPC + trigger) — never here
      const row: Record<string, unknown> = {};
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.favorites !== undefined) row.favorites = patch.favorites;
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.price !== undefined) row.price = patch.price;
      if (patch.description !== undefined) row.description = patch.description;
      if (patch.negotiable !== undefined) row.negotiable = patch.negotiable;
      if (patch.category !== undefined) row.category = patch.category;
      if (patch.condition !== undefined) row.condition = patch.condition;
      if (patch.ageYears !== undefined) row.age_years = patch.ageYears;
      if (patch.images !== undefined) row.images = patch.images;
      if (patch.aiTags !== undefined) row.ai_tags = patch.aiTags;
      if (patch.priceCheck !== undefined) row.price_check = patch.priceCheck;
      if (patch.attributes !== undefined) row.attributes = patch.attributes;
      if (patch.area !== undefined || patch.location !== undefined) {
        const loc = patch.location ?? areaLocation(patch.area ?? "viman");
        Object.assign(row, locOrNull(loc));
        if (patch.area !== undefined) row.area = patch.area;
      }
      if (Object.keys(row).length)
        void sb.from("products").update(row).eq("id", action.id as string).then(done("product update"));
      break;
    }
    case "UPDATE_SERVICE": {
      const patch = action.patch as Partial<Service>;
      const row: Record<string, unknown> = {};
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.category !== undefined) row.category = patch.category;
      if (patch.tagline !== undefined) row.tagline = patch.tagline;
      if (patch.description !== undefined) row.description = patch.description;
      if (patch.startingPrice !== undefined) row.starting_price = patch.startingPrice;
      if (patch.priceUnit !== undefined) row.price_unit = patch.priceUnit;
      if (patch.radiusKm !== undefined) row.radius_km = patch.radiusKm;
      if (patch.images !== undefined) row.images = patch.images;
      if (patch.experienceYears !== undefined) row.experience_years = patch.experienceYears;
      if (patch.availability !== undefined) row.availability = patch.availability;
      if (patch.skills !== undefined) row.skills = patch.skills;
      if (patch.area !== undefined || patch.location !== undefined) {
        const loc = patch.location ?? areaLocation(patch.area ?? "viman");
        Object.assign(row, locOrNull(loc));
        if (patch.area !== undefined) row.area = patch.area;
      }
      if (Object.keys(row).length)
        void sb.from("services").update(row).eq("id", action.id as string).then(done("service update"));
      break;
    }
    case "REMOVE_PRODUCT":
      void sb.from("products").delete().eq("id", action.id as string).then(done("product delete"));
      break;
    case "REMOVE_SERVICE":
      void sb.from("services").delete().eq("id", action.id as string).then(done("service delete"));
      break;
    case "UPDATE_REQUEST": {
      const patch = action.patch as Partial<BuyRequest>;
      const row: Record<string, unknown> = {};
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.watching !== undefined) row.watching = patch.watching;
      if (patch.text !== undefined) row.text = patch.text;
      if (Object.keys(row).length)
        void sb.from("buy_requests").update(row).eq("id", action.id as string).then(done("request update"));
      break;
    }
    case "DELETE_REQUEST":
      void sb.from("buy_requests").delete().eq("id", action.id as string).then(done("request delete"));
      break;
    case "TOGGLE_FAVORITE": {
      const pid = action.productId as string;
      if (state.favorites.includes(pid))
        void sb.from("favorites").delete().eq("user_id", me).eq("product_id", pid).then(done("unfavorite"));
      else
        void sb.from("favorites").insert({ user_id: me, product_id: pid }).then(done("favorite"));
      break;
    }
    case "ADD_REVIEW": {
      const r = action.review as Review;
      void sb
        .from("reviews")
        .insert({
          id: r.id, target_id: r.targetId, author: me, rating: r.rating,
          text: r.text, deal_type: r.dealType, created_at: r.createdAt,
        })
        .then(done("review"));
      break;
    }
    case "ADD_REPORT": {
      const rp = action.report as { id: string; subjectType: string; subjectId: string; subjectLabel?: string; reason: string; details?: string };
      void sb
        .from("reports")
        .insert({
          id: rp.id,
          by: me,
          target_type: rp.subjectType,
          target_id: rp.subjectId,
          target_label: rp.subjectLabel ?? "",
          reason: rp.reason,
          details: rp.details ?? "",
          status: "open",
        })
        .then(done("report"));
      break;
    }
    case "SET_REPORT_STATUS": {
      void sb
        .from("reports")
        .update({ status: action.status as string })
        .eq("id", action.id as string)
        .then(done("report status"));
      break;
    }
    case "TOGGLE_BAN": {
      void sb
        .from("profiles")
        .update({ banned: true })
        .eq("id", action.userId as string)
        .then(done("ban"));
      break;
    }
    case "ENSURE_CONVERSATION": {
      const c = action.conversation as Conversation;
      void sb
        .from("conversations")
        .upsert({
          id: c.id, participants: c.participants, subject: c.subject,
          updated_at: c.updatedAt, unread_for: c.unreadFor ?? [],
        })
        .then(done("conversation"));
      break;
    }
    case "ADD_MESSAGE": {
      const m = action.message as Message;
      const cid = action.conversationId as string;
      if (m.senderId !== me) return; // only my own sends persist from this client
      void sb
        .from("messages")
        .insert({
          id: m.id, conversation_id: cid, sender_id: m.senderId,
          text: m.text, kind: m.kind, offer: m.offer ?? null, at: m.at,
        })
        .then(done("message"));
      // bump the thread + flag it unread for everyone except me
      void (async () => {
        try {
          const { data: conv } = await sb
            .from("conversations")
            .select("participants")
            .eq("id", cid)
            .maybeSingle();
          if (!conv) return;
          await sb
            .from("conversations")
            .update({
              updated_at: m.at,
              unread_for: ((conv as { participants: string[] }).participants ?? []).filter(
                (p) => p !== m.senderId
              ),
            })
            .eq("id", cid);
        } catch {
          /* best effort */
        }
      })();
      break;
    }
    case "MARK_READ": {
      void sb
        .from("conversations")
        .update({ unread_for: [] })
        .eq("id", action.conversationId as string)
        .then(done("mark read"));
      break;
    }
    case "ADD_NOTIFICATION": {
      const n = action.notification as {
        id: string; kind: "match" | "message" | "price" | "system" | "review";
        title: string; body: string; at: string; href?: string;
      };
      void sb
        .from("notifications")
        .insert({
          id: n.id, user_id: me, kind: n.kind, title: n.title,
          body: n.body ?? "", at: n.at, read: false, href: n.href ?? null,
        })
        .then(done("notification"));
      break;
    }
    default:
      break;
  }
}

/** Client-side id generation that matches the DB's uuid keys in real mode. */
export function newId(realMode: boolean, prefix: string, uidFn: (p: string) => string): string {
  return realMode && typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : uidFn(prefix);
}
