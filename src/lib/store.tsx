"use client";

/* ------------------------------------------------------------------ */
/*  Locora — client state store                                       */
/*  In the production MVP this is Supabase (Postgres + Realtime).     */
/*  For this build the same data lives client-side (localStorage)     */
/*  behind a reducer so every screen works offline & demo-safe.       */
/* ------------------------------------------------------------------ */

import * as React from "react";
import { SEED_VERSION, seedState } from "@/data/seed";
import { REAL_MODE } from "@/lib/supabase/config";
import { supabase } from "@/lib/supabase/client";
import { mirrorAction } from "@/lib/supabase/data";
import type {
  AppNotification,
  AppState,
  BuyRequest,
  Conversation,
  Message,
  Product,
  Report,
  RequestMatch,
  Review,
  Service,
  User,
} from "./types";

const STORAGE_KEY = "locora:state:v" + SEED_VERSION;

let uidCounter = 0;
export function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${uidCounter.toString(36)}`;
}

/* ------------------------------ actions --------------------------- */

type Action =
  | { type: "LOGIN"; userId: string }
  | { type: "LOGOUT" }
  | { type: "SIGNUP"; user: User }
  | { type: "UPSERT_USER"; user: User }
  | { type: "SET_BROWSE_AREA"; area: string }
  | { type: "SET_LOCATION"; location: import("./types").LocoraLocation | null }
  | { type: "SET_AUTO_LOCATE"; value: boolean }
  | { type: "TOGGLE_FAVORITE"; productId: string }
  | { type: "ADD_PRODUCT"; product: Product }
  | { type: "ADD_SERVICE"; service: Service }
  | { type: "UPDATE_PRODUCT"; id: string; patch: Partial<Product> }
  | { type: "REMOVE_PRODUCT"; id: string }
  | { type: "ENSURE_CONVERSATION"; conversation: Conversation }
  | { type: "ADD_MESSAGE"; conversationId: string; message: Message }
  | { type: "MARK_READ"; conversationId: string; userId: string }
  | { type: "ADD_REQUEST"; request: BuyRequest }
  | { type: "SET_REQUEST_MATCHES"; requestId: string; matches: RequestMatch[] }
  | { type: "UPDATE_REQUEST"; id: string; patch: Partial<BuyRequest> }
  | { type: "DELETE_REQUEST"; id: string }
  | { type: "REMOVE_SERVICE"; id: string }
  | { type: "UPDATE_SERVICE"; id: string; patch: Partial<Service> }
  | { type: "ADD_REVIEW"; review: Review }
  | { type: "ADD_REPORT"; report: Report }
  | { type: "SET_REPORT_STATUS"; id: string; status: Report["status"] }
  | { type: "TOGGLE_BAN"; userId: string }
  | { type: "ADD_NOTIFICATION"; notification: AppNotification }
  | { type: "HYDRATE_DATA"; data: Partial<AppState> }
  | { type: "SYNC_CONVERSATION"; id: string; updatedAt: string; unreadFor: string[] }
  | { type: "SET_ONLINE_USERS"; users: string[] }
  | { type: "MARK_NOTIF_READ"; id?: string }
  | { type: "RESET" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOGIN":
      return { ...state, sessionUserId: action.userId };
    case "LOGOUT":
      return { ...state, sessionUserId: null };
    case "SIGNUP":
      return { ...state, users: [...state.users, action.user], sessionUserId: action.user.id };
    case "UPSERT_USER":
      return {
        ...state,
        users: state.users.some((u) => u.id === action.user.id)
          ? state.users.map((u) => (u.id === action.user.id ? { ...u, ...action.user } : u))
          : [...state.users, action.user],
      };
    case "SET_BROWSE_AREA":
      return { ...state, browseArea: action.area };
    case "SET_LOCATION":
      return { ...state, browseLocation: action.location };
    case "SET_AUTO_LOCATE":
      return { ...state, autoLocate: action.value };
    case "TOGGLE_FAVORITE":
      return {
        ...state,
        favorites: state.favorites.includes(action.productId)
          ? state.favorites.filter((id) => id !== action.productId)
          : [...state.favorites, action.productId],
      };
    case "ADD_PRODUCT":
      return { ...state, products: [action.product, ...state.products] };
    case "ADD_SERVICE":
      return { ...state, services: [action.service, ...state.services] };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };
    case "REMOVE_PRODUCT":
      return { ...state, products: state.products.filter((p) => p.id !== action.id) };
    case "ENSURE_CONVERSATION":
      return state.conversations.some((c) => c.id === action.conversation.id)
        ? state
        : {
            ...state,
            conversations: [action.conversation, ...state.conversations],
          };
    case "ADD_MESSAGE":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId
            ? c.messages.some((m) => m.id === action.message.id)
              ? c // already known (realtime echo) — keep state idempotent
              : {
                  ...c,
                  messages: [...c.messages, action.message],
                  updatedAt: action.message.at,
                  unreadFor:
                    action.message.senderId === state.sessionUserId
                      ? c.unreadFor
                      : [...new Set([...c.unreadFor, ...c.participants.filter((p) => p !== action.message.senderId)])],
                }
            : c
        ),
      };
    case "SYNC_CONVERSATION":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, updatedAt: action.updatedAt, unreadFor: action.unreadFor } : c
        ),
      };
    case "SET_ONLINE_USERS":
      return { ...state, onlineUsers: action.users };
    case "MARK_READ":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId
            ? { ...c, unreadFor: c.unreadFor.filter((u) => u !== action.userId) }
            : c
        ),
      };
    case "ADD_REQUEST":
      return { ...state, requests: [action.request, ...state.requests] };
    case "SET_REQUEST_MATCHES":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.requestId ? { ...r, matches: action.matches } : r
        ),
      };
    case "UPDATE_REQUEST":
      return {
        ...state,
        requests: state.requests.map((r) => (r.id === action.id ? { ...r, ...action.patch } : r)),
      };
    case "DELETE_REQUEST":
      return { ...state, requests: state.requests.filter((r) => r.id !== action.id) };
    case "REMOVE_SERVICE":
      return { ...state, services: state.services.filter((s) => s.id !== action.id) };
    case "UPDATE_SERVICE":
      return {
        ...state,
        services: state.services.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      };
    case "ADD_REVIEW":
      return { ...state, reviews: [action.review, ...state.reviews] };
    case "ADD_REPORT":
      return { ...state, reports: [action.report, ...state.reports] };
    case "SET_REPORT_STATUS":
      return {
        ...state,
        reports: state.reports.map((r) => (r.id === action.id ? { ...r, status: action.status } : r)),
      };
    case "TOGGLE_BAN":
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.userId ? { ...u, banned: !u.banned } : u)),
      };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [action.notification, ...state.notifications] };
    case "MARK_NOTIF_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          !action.id || n.id === action.id ? { ...n, read: true } : n
        ),
      };
    case "HYDRATE_DATA":
      return { ...state, ...action.data };
    case "RESET":
      return seedState();
    default:
      return state;
  }
}

/* ---------------------------- persistence ------------------------- */

function loadState(): AppState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== SEED_VERSION) return seedState();
    parsed.browseLocation = parsed.browseLocation ?? null; // migrate old saves
    parsed.autoLocate = parsed.autoLocate ?? false;
    parsed.onlineUsers = []; // presence is ephemeral — never restore stale data
    return parsed;
  } catch {
    return seedState();
  }
}

/* ------------------------------ context --------------------------- */

export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  hydrated: boolean;
  currentUser: User | null;
  /** Opens (or creates) a chat thread; returns the conversation id. */
  startConversation: (withUserId: string, subject: Conversation["subject"]) => string;
  notify: (n: Omit<AppNotification, "id" | "at" | "read">) => void;
}

const AppContext = React.createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, baseDispatch] = React.useReducer(reducer, undefined, loadState);
  const [hydrated, setHydrated] = React.useState(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = React.useRef(state);
  stateRef.current = state;

  // Phase B: every action applies optimistically to client state, and in
  // real mode is also written through to Supabase under the user's JWT.
  const dispatch = React.useCallback((action: Action) => {
    baseDispatch(action);
    if (REAL_MODE && action.type !== "HYDRATE_DATA" && action.type !== "RESET") {
      const sb = supabase();
      if (sb && stateRef.current.sessionUserId) {
        try {
          mirrorAction(sb, action, stateRef.current);
        } catch (e) {
          console.warn("[locora] mirror failed:", e);
        }
      }
    }
  }, []);

  React.useEffect(() => setHydrated(true), []);

  React.useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* storage full — ignore in demo */
      }
    }, 250);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state]);

  const currentUser = React.useMemo(
    () => state.users.find((u) => u.id === state.sessionUserId) ?? null,
    [state.users, state.sessionUserId]
  );

  const startConversation = React.useCallback(
    (withUserId: string, subject: Conversation["subject"]) => {
      const me = state.sessionUserId;
      if (!me) return "";
      // reuse an existing thread for the same listing/service/request
      const existing = state.conversations.find(
        (c) => c.participants.includes(me) && c.participants.includes(withUserId) && c.subject.id === subject.id
      );
      if (existing) return existing.id;
      const id = `c:${[me, withUserId].sort().join(":")}:${subject.id}`;
      dispatch({
        type: "ENSURE_CONVERSATION",
        conversation: {
          id,
          participants: [me, withUserId],
          subject,
          messages: [],
          updatedAt: new Date().toISOString(),
          unreadFor: [],
        },
      });
      return id;
    },
    [state.sessionUserId, state.conversations]
  );

  const notify = React.useCallback((n: Omit<AppNotification, "id" | "at" | "read">) => {
    // uuid ids in real mode — the notifications table needs them to persist
    const id = REAL_MODE && typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : uid("n");
    dispatch({ type: "ADD_NOTIFICATION", notification: { ...n, id, at: new Date().toISOString(), read: false } });
  }, []);

  const value = React.useMemo<AppContextValue>(
    () => ({ state, dispatch, hydrated, currentUser, startConversation, notify }),
    [state, hydrated, currentUser, startConversation, notify]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

/* ------------------------------- toasts --------------------------- */

export interface Toast {
  id: string;
  title: string;
  body?: string;
  kind?: "success" | "info" | "error";
}

const ToastContext = React.createContext<{ toasts: Toast[]; push: (t: Omit<Toast, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((t: Omit<Toast, "id">) => {
    const id = uid("t");
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);

  const value = React.useMemo(() => ({ toasts, push }), [toasts, push]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
