"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, CheckCircle2, IndianRupee, MessageCircle, MoreHorizontal,
  Send, Sparkles, Star, UserCheck,
} from "lucide-react";
import { Avatar, Badge, Button, Modal, Skeleton, TypingDots } from "@/components/ui";
import { botReplyFor } from "@/lib/bot";
import { inr, dayLabel, timeLabel } from "@/lib/format";
import { REAL_MODE } from "@/lib/supabase/config";
import { supabase } from "@/lib/supabase/client";
import { uid, useApp, useToast } from "@/lib/store";
import type { Conversation, Message } from "@/lib/types";

/* ------------------------- conversation list ----------------------- */

function ConvItem({
  convo,
  otherName,
  active,
  myId,
  online,
  onClick,
}: {
  convo: Conversation;
  otherName: string;
  active: boolean;
  myId: string;
  online: boolean;
  onClick: () => void;
}) {
  const last = convo.messages[convo.messages.length - 1];
  const unread = convo.unreadFor.includes(myId);
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-l-2 px-4 py-3.5 text-left transition ${
        active ? "border-brand-600 bg-brand-50/50" : "border-transparent hover:bg-stone-50"
      }`}
    >
      <span className="relative shrink-0">
        {convo.subject.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={convo.subject.image} alt="" className="h-11 w-11 rounded-xl object-cover ring-1 ring-stone-200" />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-lg">🛠️</span>
        )}
        {unread && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white ring-2 ring-white">
            1
          </span>
        )}
        {online && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-accent-500" title="Online now" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-[13.5px] ${unread ? "font-extrabold text-ink-900" : "font-bold text-ink-800"}`}>
            {otherName}
          </span>
          <span className="shrink-0 text-[10.5px] font-semibold text-ink-300">{dayLabel(convo.updatedAt)}</span>
        </span>
        <span className={`mt-0.5 block truncate text-[12px] ${unread ? "font-semibold text-ink-600" : "text-ink-400"}`}>
          {last
            ? last.kind === "offer"
              ? `Offer · ${inr(last.offer?.amount ?? 0)}`
              : last.kind === "system"
                ? last.text
                : last.text
            : "Say hello 👋"}
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold text-ink-300">{convo.subject.title}</span>
      </span>
    </button>
  );
}

/* ------------------------------ thread ----------------------------- */

const QUICK_REPLIES_PRODUCT = ["Is this still available?", "What's the best price?", "Can we meet tomorrow evening?", "Where exactly can we meet?"];
const QUICK_REPLIES_SERVICE = ["Are you available this week?", "What would a small job cost?", "How soon can you come?"];

function Thread({ convo, onBack }: { convo: Conversation; onBack: () => void }) {
  const router = useRouter();
  const { state, currentUser, dispatch } = useApp();
  const { push } = useToast();

  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [offerOpen, setOfferOpen] = React.useState(false);
  const [offerAmount, setOfferAmount] = React.useState("");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewText, setReviewText] = React.useState("");

  const me = currentUser!;
  const other = state.users.find((u) => u.id === convo.participants.find((p) => p !== me.id));
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const mounted = React.useRef(true);
  const isProduct = convo.subject.type === "product";
  const otherOnline = state.onlineUsers.includes(other?.id ?? "");

  // last message I sent, and whether the other person has read the thread
  const myLastMsg = [...convo.messages].reverse().find((m) => m.senderId === me.id && m.kind !== "system");
  const lastIsMine = !!myLastMsg && convo.messages[convo.messages.length - 1]?.id === myLastMsg.id;
  const seen = lastIsMine && !convo.unreadFor.includes(other?.id ?? "");

  // Phase D live signals: typing broadcast on this thread (real mode only)
  const typingChannel = React.useRef<ReturnType<ReturnType<typeof supabase>["channel"]> | null>(null);
  const typingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = React.useRef(0);

  React.useEffect(() => {
    if (!REAL_MODE) return;
    const sb = supabase();
    if (!sb || !other) return;
    const ch = sb.channel(`locora-conv-${convo.id}`, { config: { broadcast: { self: false }, presence: { key: me.id } } });
    typingChannel.current = ch;
    ch.on("broadcast", { event: "typing" }, (msg: { payload?: { userId?: string } }) => {
      if (msg?.payload?.userId !== other.id) return;
      setTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 3200);
    });
    ch.subscribe();
    return () => {
      typingChannel.current = null;
      if (typingTimer.current) clearTimeout(typingTimer.current);
      void sb.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convo.id, other?.id]);

  const emitTyping = () => {
    if (!REAL_MODE) return;
    const t = Date.now();
    if (t - lastTypingSent.current < 1300) return;
    lastTypingSent.current = t;
    void typingChannel.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: me.id, at: t },
    });
  };

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (convo.unreadFor.includes(me.id)) {
      dispatch({ type: "MARK_READ", conversationId: convo.id, userId: me.id });
    }
  }, [convo.id, convo.messages.length, convo.unreadFor, me.id, dispatch]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [convo.messages.length, typing]);

  if (!other) return null;

  const pushMessage = (msg: Message) => dispatch({ type: "ADD_MESSAGE", conversationId: convo.id, message: msg });

  // real mode: DB uuid keys so messages persist; mock mode keeps demo ids
  const mid = () =>
    REAL_MODE && typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : uid("m");

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    pushMessage({ id: mid(), senderId: me.id, text: t, at: new Date().toISOString(), kind: "text" });
    setDraft("");

    // simulated reply — demo mode only; in real mode the other person
    // receives this live and replies for real (Phase D realtime)
    if (REAL_MODE) return;
    const replies = botReplyFor(t, { me: other, subject: convo.subject });
    setTyping(true);
    setTimeout(() => {
      if (!mounted.current) return;
      setTyping(false);
      pushMessage({ id: mid(), senderId: other.id, text: replies[0]!, at: new Date().toISOString(), kind: "text" });
      if (replies[1]) {
        setTyping(true);
        setTimeout(() => {
          if (!mounted.current) return;
          setTyping(false);
          pushMessage({ id: mid(), senderId: other.id, text: replies[1], at: new Date().toISOString(), kind: "text" });
        }, 1000 + Math.random() * 900);
      }
    }, 1000 + Math.random() * 1500);
  };

  const sendOffer = () => {
    const amount = parseInt(offerAmount.replace(/[^\d]/g, ""), 10);
    if (!amount || amount < 100) {
      push({ kind: "error", title: "Enter a valid amount" });
      return;
    }
    pushMessage({
      id: mid(),
      senderId: me.id,
      text: "Offer sent",
      at: new Date().toISOString(),
      kind: "offer",
      offer: { amount },
    });
    setOfferOpen(false);
    setOfferAmount("");
    if (REAL_MODE) return; // the seller will answer for real
    setTimeout(() => {
      if (!mounted.current) return;
      const counter = Math.round((amount * 1.03) / 100) * 100;
      setTyping(true);
      setTimeout(() => {
        if (!mounted.current) return;
        setTyping(false);
        pushMessage({
          id: mid(),
          senderId: other.id,
          text: `Thanks for the offer! ${inr(amount)} is a bit tight for me — I could close at ${inr(counter)} if you can pick up this week. Deal?`,
          at: new Date().toISOString(),
          kind: "text",
        });
      }, 1100);
    }, 600);
  };

  const acceptOffer = (m: Message) => {
    pushMessage({
      id: mid(),
      senderId: me.id,
      text: `✅ ${me.name.split(" ")[0]} accepted the offer of ${inr(m.offer?.amount ?? 0)} — deal!`,
      at: new Date().toISOString(),
      kind: "system",
    });
    push({ kind: "success", title: "Offer accepted 🎉", body: "Fix a public meetup spot in chat" });
  };

  const markDealDone = () => {
    setMenuOpen(false);
    pushMessage({
      id: mid(),
      senderId: me.id,
      text: `${me.name.split(" ")[0]} marked this deal as complete 🎉`,
      at: new Date().toISOString(),
      kind: "system",
    });
    setReviewOpen(true);
  };

  const submitReview = () => {
    dispatch({
      type: "ADD_REVIEW",
      review: {
        id: uid("r"),
        targetId: other.id,
        author: me.name,
        authorArea: undefined,
        rating: reviewRating,
        text: reviewText.trim() || (reviewRating >= 4 ? "Smooth, friendly deal — exactly as described." : "Deal completed."),
        dealType: convo.subject.type === "service" ? "service" : "product",
        createdAt: new Date().toISOString(),
      },
    });
    setReviewOpen(false);
    setReviewText("");
    setReviewRating(5);
    push({ kind: "success", title: "Review posted ⭐", body: `Thanks for helping ${other.name.split(" ")[0]}'s neighbours` });
  };

  const subjectHref =
    convo.subject.type === "product" ? `/product/${convo.subject.id}` : `/service/${convo.subject.id}`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-stone-200/70 bg-white px-4 py-3 sm:px-5">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-stone-100 lg:hidden" aria-label="Back to chats">
          <ArrowLeft size={18} />
        </button>
        <span className="relative shrink-0">
          <Avatar user={other} size="md" ring={false} />
          {otherOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-accent-500" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[14.5px] font-extrabold text-ink-900">
            {other.name}
            {other.verified && <BadgeCheck size={14} className="shrink-0 text-brand-600" />}
          </p>
          <p className="flex items-center gap-1.5 text-[11.5px] font-semibold">
            {otherOnline ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-500" />
                <span className="text-accent-600">online now</span>
              </>
            ) : (
              <span className="text-ink-400">typically replies in ~{other.responseMins ?? 15} min</span>
            )}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-stone-100"
            aria-label="Conversation options"
          >
            <MoreHorizontal size={19} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-30 w-52 animate-pop rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-stone-200/70">
              <button
                onClick={markDealDone}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink-700 transition hover:bg-stone-50"
              >
                <CheckCircle2 size={15} className="text-brand-600" /> Mark deal as done
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push(subjectHref);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink-700 transition hover:bg-stone-50"
              >
                <Sparkles size={15} className="text-brand-600" /> View listing
              </button>
            </div>
          )}
        </div>
      </div>

      {/* subject strip */}
      <Link href={subjectHref} className="flex items-center gap-3 border-b border-stone-200/70 bg-stone-50/80 px-4 py-2.5 transition hover:bg-stone-100 sm:px-5">
        {convo.subject.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={convo.subject.image} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-stone-200" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-200">🛠️</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-bold text-ink-800">{convo.subject.title}</p>
          {convo.subject.price && <p className="text-[11.5px] font-extrabold text-brand-700">{inr(convo.subject.price)}</p>}
        </div>
        <span className="text-[11px] font-bold text-ink-400">view ↗</span>
      </Link>

      {/* messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-stone-50 px-4 py-5 thin-scrollbar sm:px-5">
        {convo.messages.length === 0 && (
          <div className="mx-auto mt-8 max-w-xs rounded-2xl bg-white p-5 text-center shadow-card">
            <MessageCircle size={22} className="mx-auto text-brand-600" />
            <p className="mt-2 text-[13.5px] font-extrabold text-ink-900">Start the conversation</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-400">
              Keep chats on Locora until you trust the person — never share OTPs or send advance payments.
            </p>
          </div>
        )}
        {convo.messages.map((m) => {
          if (m.kind === "system") {
            return (
              <div key={m.id} className="flex justify-center">
                <span className="rounded-full bg-stone-200/70 px-3.5 py-1.5 text-[11.5px] font-semibold text-ink-500">{m.text}</span>
              </div>
            );
          }
          const mine = m.senderId === me.id;
          if (m.kind === "offer") {
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[280px] rounded-2xl p-4 shadow-card ring-1 ${
                    mine ? "bg-brand-600/95 ring-brand-600" : "bg-white ring-stone-200/70"
                  }`}
                >
                  <p className={`flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide ${mine ? "text-brand-100" : "text-ink-400"}`}>
                    <IndianRupee size={11} /> {mine ? "You offered" : "Offer for you"}
                  </p>
                  <p className={`mt-1 text-[22px] font-extrabold tracking-tight ${mine ? "text-white" : "text-ink-900"}`}>
                    {inr(m.offer?.amount ?? 0)}
                  </p>
                  {m.offer?.note && <p className={`mt-1 text-[12px] ${mine ? "text-brand-50/80" : "text-ink-500"}`}>{m.offer.note}</p>}
                  {mine && seen && m.id === myLastMsg?.id && (
                    <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-semibold text-accent-300">
                      <CheckCircle2 size={11} /> Seen
                    </p>
                  )}
                  {!mine && (
                    <Button size="sm" className="mt-3 w-full" onClick={() => acceptOffer(m)}>
                      Accept offer
                    </Button>
                  )}
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-card sm:max-w-[65%] ${mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-white text-ink-800 ring-1 ring-stone-200/70"}`}>
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed">{m.text}</p>
                <p className={`mt-1 flex items-center justify-end gap-1 text-right text-[10px] font-semibold ${mine ? "text-brand-100/70" : "text-ink-300"}`}>
                  {timeLabel(m.at)}
                  {mine && seen && m.id === myLastMsg?.id && (
                    <span className="inline-flex items-center gap-0.5 text-accent-300">
                      <CheckCircle2 size={11} /> Seen
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-card ring-1 ring-stone-200/70">
              <Avatar user={other} size="xs" ring={false} />
              <TypingDots className="text-ink-400" />
            </div>
          </div>
        )}
      </div>

      {/* quick replies */}
      <div className="flex gap-2 overflow-x-auto border-t border-stone-200/70 bg-white px-4 py-2 no-scrollbar sm:px-5">
        {(isProduct ? QUICK_REPLIES_PRODUCT : QUICK_REPLIES_SERVICE).map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="shrink-0 whitespace-nowrap rounded-full bg-stone-100 px-3 py-1.5 text-[11.5px] font-bold text-ink-600 transition hover:bg-brand-50 hover:text-brand-700"
          >
            {q}
          </button>
        ))}
      </div>

      {/* composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="flex items-center gap-2 border-t border-stone-200/70 bg-white px-4 py-3 sm:px-5"
      >
        {isProduct && (
          <button
            type="button"
            onClick={() => setOfferOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600 ring-1 ring-accent-200 transition hover:bg-accent-100 active:scale-90"
            aria-label="Make an offer"
            title="Make an offer"
          >
            <IndianRupee size={18} />
          </button>
        )}
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            emitTyping();
          }}
          placeholder={`Message ${other.name.split(" ")[0]}…`}
          className="min-w-0 flex-1 rounded-full bg-stone-100 px-5 py-3 text-[14px] outline-none ring-1 ring-stone-200 transition focus:bg-white focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-soft transition hover:bg-brand-700 active:scale-90 disabled:opacity-40"
        >
          <Send size={17} />
        </button>
      </form>

      {/* offer modal */}
      <Modal open={offerOpen} onClose={() => setOfferOpen(false)}>
        <h2 className="text-[17px] font-extrabold text-ink-900">Make an offer</h2>
        <p className="mt-1 text-[13px] text-ink-500">
          On {convo.subject.title}
          {convo.subject.price ? ` · listed at ${inr(convo.subject.price)}` : ""}.
        </p>
        <label className="mt-5 flex items-center gap-2 rounded-xl bg-stone-50 px-3.5 ring-1 ring-stone-200 focus-within:ring-2 focus-within:ring-brand-500">
          <span className="text-[15px] font-extrabold text-ink-400">₹</span>
          <input
            inputMode="numeric"
            autoFocus
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value.replace(/[^\d]/g, ""))}
            placeholder={String(Math.round(((convo.subject.price ?? 5000) * 0.95) / 100) * 100)}
            className="w-full bg-transparent py-3 text-[16px] font-bold outline-none"
          />
        </label>
        <div className="mt-5 flex gap-2.5">
          <Button variant="secondary" className="flex-1" onClick={() => setOfferOpen(false)}>Cancel</Button>
          <Button className="flex-1" onClick={sendOffer}>Send offer</Button>
        </div>
      </Modal>

      {/* review modal */}
      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)}>
        <h2 className="text-[17px] font-extrabold text-ink-900">How was the deal?</h2>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-500">
          <UserCheck size={14} className="text-brand-600" /> Your review helps {other.name.split(" ")[0]}&apos;s neighbours decide
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setReviewRating(s)}
              aria-label={`${s} star${s > 1 ? "s" : ""}`}
              className="transition hover:scale-110"
            >
              <Star size={30} className={s <= reviewRating ? "text-accent-400" : "text-stone-200"} fill="currentColor" strokeWidth={0} />
            </button>
          ))}
        </div>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={3}
          placeholder="How did it go? (optional)"
          className="mt-4 w-full resize-none rounded-xl bg-stone-50 px-3.5 py-3 text-[13.5px] outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-brand-500"
        />
        <div className="mt-5 flex gap-2.5">
          <Button variant="secondary" className="flex-1" onClick={() => setReviewOpen(false)}>Skip</Button>
          <Button className="flex-1" onClick={submitReview}>Post review</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------ page ------------------------------- */

function ChatInner() {
  const params = useSearchParams();
  const { state, hydrated, currentUser } = useApp();
  const [activeId, setActiveId] = React.useState<string | null>(params.get("c"));

  const me = currentUser;

  const convos = React.useMemo(() => {
    if (!me) return [];
    return state.conversations
      .filter((c) => c.participants.includes(me.id))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [state.conversations, me]);

  const active = convos.find((c) => c.id === activeId) ?? null;

  if (!hydrated || !me) return <Skeleton className="mx-auto mt-10 h-[560px] max-w-4xl rounded-3xl" />;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-stone-100/70">
      <div className="flex h-[calc(100vh-13rem)] min-h-[520px]">
        {/* list */}
        <aside
          className={`w-full shrink-0 border-r border-stone-200/70 lg:block lg:w-[340px] ${active ? "hidden" : "block"}`}
        >
          <div className="flex items-center justify-between border-b border-stone-200/70 px-5 py-4">
            <h1 className="text-[17px] font-extrabold tracking-tight text-ink-900">Chats</h1>
            {convos.some((c) => c.unreadFor.includes(me.id)) && <Badge tone="rose">unread</Badge>}
          </div>
          <div className="h-[calc(100%-61px)] overflow-y-auto thin-scrollbar">
            {convos.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <MessageCircle size={24} />
                </span>
                <p className="mt-4 text-[15px] font-extrabold text-ink-900">No chats yet</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-400">
                  Find something nearby and say hello — most sellers reply within minutes.
                </p>
                <Link href="/home" className="mt-5 inline-block">
                  <Button variant="softBrand" size="sm">Browse nearby</Button>
                </Link>
              </div>
            ) : (
              convos.map((c) => {
                const other = state.users.find((u) => u.id === c.participants.find((p) => p !== me.id));
                return (
                  <ConvItem
                    key={c.id}
                    convo={c}
                    otherName={other?.name ?? "Locora user"}
                    active={c.id === activeId}
                    myId={me.id}
                    online={!!other && state.onlineUsers.includes(other.id)}
                    onClick={() => setActiveId(c.id)}
                  />
                );
              })
            )}
          </div>
        </aside>

        {/* thread */}
        <section className={`min-w-0 flex-1 ${active ? "block" : "hidden"} lg:block`}>
          {active ? (
            <Thread convo={active} onBack={() => setActiveId(null)} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <MessageCircle size={28} />
              </span>
              <p className="mt-5 text-[16px] font-extrabold text-ink-900">Your messages</p>
              <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-ink-400">
                Negotiate, make offers and fix meetups — all on Locora. Pick a chat to start.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <React.Suspense fallback={<Skeleton className="mx-auto mt-10 h-[560px] max-w-4xl rounded-3xl" />}>
      <ChatInner />
    </React.Suspense>
  );
}
