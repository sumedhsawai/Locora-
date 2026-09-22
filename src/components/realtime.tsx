"use client";

import * as React from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useApp, useToast } from "@/lib/store";
import { REAL_MODE } from "@/lib/supabase/config";
import { supabase } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Locora — Phase D: realtime chat                                    */
/*  Subscribes (RLS-scoped) to Supabase Realtime for the signed-in     */
/*  user and folds incoming messages, threads and read-state into     */
/*  the store — so chats update live across devices and users.        */
/* ------------------------------------------------------------------ */

type ConvoRow = {
  id: string;
  participants: string[];
  subject: Conversation["subject"];
  updated_at: string;
  unread_for: string[] | null;
};

type MsgRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  kind: string;
  offer: Message["offer"];
  at: string;
};

function rowToConversation(r: ConvoRow): Conversation {
  return {
    id: r.id,
    participants: r.participants,
    subject: r.subject,
    updatedAt: r.updated_at,
    unreadFor: r.unread_for ?? [],
    messages: [],
  };
}

export function RealtimeBridge() {
  const { state, dispatch } = useApp();
  const { push } = useToast();
  const me = state.sessionUserId;

  // keep latest state reachable from inside event callbacks without
  // resubscribing on every keystroke
  const stateRef = React.useRef(state);
  stateRef.current = state;

  React.useEffect(() => {
    if (!REAL_MODE || !me) return;
    const sb = supabase();
    if (!sb) return;

    const isThreadOpen = (cid: string) => {
      try {
        return new URLSearchParams(window.location.search).get("c") === cid;
      } catch {
        return false;
      }
    };

    const applyIncomingMessage = (row: MsgRow) => {
      const known = stateRef.current.conversations.find((c) => c.id === row.conversation_id);

      const attach = () =>
        dispatch({
          type: "ADD_MESSAGE",
          conversationId: row.conversation_id,
          message: {
            id: row.id,
            senderId: row.sender_id,
            text: row.text,
            at: row.at,
            kind: row.kind as Message["kind"],
            offer: row.offer ?? undefined,
          },
        });

      if (known) {
        attach();
      } else {
        // thread I've never seen (started from another device/user) — fetch it first
        void sb
          .from("conversations")
          .select("*")
          .eq("id", row.conversation_id)
          .maybeSingle()
          .then((res: { data: ConvoRow | null }) => {
            if (!res.data) return;
            dispatch({ type: "ENSURE_CONVERSATION", conversation: rowToConversation(res.data) });
            attach();
          });
      }

      // subtle heads-up when the thread isn't on screen
      if (!isThreadOpen(row.conversation_id)) {
        const sender = stateRef.current.users.find((u) => u.id === row.sender_id);
        const title = row.kind === "offer" ? "You received an offer" : `${sender?.name ?? "New message"} · Locora chat`;
        push({ kind: "info", title, body: row.text.slice(0, 90) });
      }
    };

    // presence: who's online right now (drives the green dots in chat)
    const presence = sb.channel("locora-online", {
      config: { presence: { key: me } },
    });
    presence
      .on("presence", { event: "sync" }, () => {
        dispatch({ type: "SET_ONLINE_USERS", users: Object.keys(presence.presenceState()) });
      })
      .subscribe();

    const channel = sb
      .channel(`locora-chat-${me}`)
      // new messages (RLS: only rows in conversations I participate in)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: RealtimePostgresChangesPayload<MsgRow>) => {
          const row = payload.new as MsgRow;
          if (!row?.id || row.sender_id === me) return; // own writes already applied
          applyIncomingMessage(row);
        }
      )
      // brand-new threads that include me
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload: RealtimePostgresChangesPayload<ConvoRow>) => {
          const row = payload.new as ConvoRow;
          if (!row?.id || !row.participants?.includes(me)) return;
          if (row.participants.filter((p) => p !== me).length === 0) return;
          dispatch({ type: "ENSURE_CONVERSATION", conversation: rowToConversation(row) });
        }
      )
      // thread updates: ordering + read state (also covers being added
      // to an existing thread, which fires UPDATE rather than INSERT)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload: RealtimePostgresChangesPayload<ConvoRow>) => {
          const row = payload.new as ConvoRow;
          if (!row?.id || !row.participants?.includes(me)) return;
          const known = stateRef.current.conversations.find((c) => c.id === row.id);
          if (!known) {
            dispatch({ type: "ENSURE_CONVERSATION", conversation: rowToConversation(row) });
            return;
          }
          dispatch({
            type: "SYNC_CONVERSATION",
            id: row.id,
            updatedAt: row.updated_at,
            unreadFor: row.unread_for ?? [],
          });
        }
      )
      .subscribe((status: string) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // one quiet retry — transient realtime hiccups on mobile networks
          setTimeout(() => void sb.realtime.setAuth(), 1500);
        }
      });

    return () => {
      void sb.removeChannel(channel);
      void sb.removeChannel(presence);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  return null;
}
