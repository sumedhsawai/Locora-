/* ------------------------------------------------------------------ */
/*  Locora — shared domain types                                      */
/*  Mirrors the Supabase schema described in the MVP document so the  */
/*  mock data layer can later be swapped for a real Supabase client.  */
/* ------------------------------------------------------------------ */

export type Role = "buyer" | "seller" | "provider" | "admin";

/** A real-world place (worldwide). `area` fields remain for the Pune demo data. */
export interface LocoraLocation {
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: string;
}

export type ProductCategory =
  | "mobiles"
  | "electronics"
  | "vehicles"
  | "furniture"
  | "appliances"
  | "fashion"
  | "sports"
  | "books"
  | "music"
  | "kitchen"
  | "kids"
  | "pets"
  | "gaming"
  | "decor"
  | "other";

export type ServiceCategory =
  | "plumber"
  | "electrician"
  | "tutor"
  | "photographer"
  | "mechanic"
  | "cleaner"
  | "ac-repair"
  | "interior"
  | "pest-control"
  | "cook"
  | "painter"
  | "yoga"
  | "carpenter"
  | "tailor"
  | "beauty"
  | "movers"
  | "driver"
  | "event"
  | "other";

export type Condition = "new" | "like-new" | "good" | "fair";
export type PriceCheckLabel = "great" | "fair" | "high";

export interface User {
  id: string;
  name: string;
  role: Role;
  area: string; // short place label (legacy Pune demo: area id from geo.ts)
  location?: LocoraLocation;
  email: string;
  phone: string;
  joinedAt: string; // ISO
  avatarFrom: string; // gradient start
  avatarTo: string; // gradient end
  verified?: boolean;
  bio?: string;
  rating?: number; // as a seller/provider
  reviewsCount?: number;
  responseMins?: number; // avg response time
  banned?: boolean;
  isDemo?: boolean; // sample account shown for illustration only
  username?: string; // unique public handle, e.g. "sumedh"
}

export interface PriceCheck {
  label: PriceCheckLabel;
  deltaPct: number; // % vs. comparable local listings (negative = cheaper)
  comparables: number;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  category: ProductCategory;
  condition: Condition;
  ageYears?: number;
  images: string[];
  area: string;
  location?: LocoraLocation;
  createdAt: string; // ISO
  views: number;
  favorites: number;
  status: "active" | "sold";
  aiTags: string[];
  priceCheck: PriceCheck;
  attributes?: Record<string, string>;
  flagged?: { score: number; reasons: string[] }; // AI scam detection
  isDemo?: boolean; // sample listing shown for illustration only
}

export interface Service {
  id: string;
  providerId: string;
  title: string;
  category: ServiceCategory;
  tagline: string;
  description: string;
  startingPrice: number;
  priceUnit: "visit" | "hour" | "session" | "event" | "day" | "month" | "sqft";
  area: string;
  radiusKm: number;
  location?: LocoraLocation;
  images: string[];
  rating: number;
  reviewsCount: number;
  jobsDone: number;
  responseMins: number;
  experienceYears: number;
  availability: string[];
  skills: string[];
  verified: boolean;
  createdAt: string;
  isDemo?: boolean; // sample service shown for illustration only
}

export interface Review {
  id: string;
  targetId: string; // reviewed user id
  author: string;
  authorArea?: string;
  rating: number;
  text: string;
  dealType: "product" | "service";
  createdAt: string;
}

export type MessageKind = "text" | "offer" | "system";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  at: string; // ISO
  kind: MessageKind;
  offer?: { amount: number; note?: string };
}

export interface Conversation {
  id: string;
  participants: string[]; // [userA, userB]
  subject: {
    type: "product" | "service" | "request";
    id: string;
    title: string;
    image?: string;
    price?: number;
  };
  messages: Message[];
  updatedAt: string;
  unreadFor: string[]; // user ids with unread messages
}

export type NeedBy = "today" | "tomorrow" | "this-week" | "weekend" | "flexible";

export interface RequestMatch {
  userId: string;
  serviceId?: string;
  productId?: string;
  score: number; // 0–100
  distanceKm: number;
  reason: string;
}

export interface BuyRequest {
  id: string;
  buyerId: string;
  text: string;
  category: ServiceCategory | ProductCategory | "general";
  area: string;
  budgetMax?: number;
  location?: LocoraLocation;
  needBy: NeedBy;
  status: "open" | "fulfilled";
  createdAt: string;
  watching: boolean; // AI keeps watching new listings
  matches: RequestMatch[];
  isDemo?: boolean; // sample request shown for illustration only
}

export interface Report {
  id: string;
  targetType: "product" | "service" | "user" | "chat";
  targetId: string;
  targetLabel: string;
  reason: string;
  details: string;
  by: string;
  createdAt: string;
  status: "open" | "reviewing" | "resolved";
}

export interface AppNotification {
  id: string;
  kind: "match" | "message" | "price" | "system" | "review";
  title: string;
  body: string;
  at: string;
  read: boolean;
  href?: string;
}

export interface AppState {
  version: number;
  sessionUserId: string | null;
  browseArea: string; // Pune neighbourhood id or "all" (Pune demo data only)
  browseLocation: LocoraLocation | null; // worldwide browsing location
  autoLocate: boolean; // re-detect the user's location automatically on launch
  users: User[];
  products: Product[];
  services: Service[];
  reviews: Review[];
  conversations: Conversation[];
  requests: BuyRequest[];
  reports: Report[];
  notifications: AppNotification[];
  favorites: string[]; // product ids
  onlineUsers: string[]; // user ids currently online (realtime presence)
}
