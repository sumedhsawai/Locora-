"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, Clock, Eye, Flag, FlaskConical, Heart, MapPin, MessageCircle, IndianRupee,
  Pencil, Share2, ShieldAlert, ShieldCheck, Sparkles, Trash2, TrendingDown, TrendingUp, UserCheck,
} from "lucide-react";
import { ListingCard } from "@/components/cards";
import { Avatar, Badge, Button, DemoBadge, Modal, RatingStars, Skeleton } from "@/components/ui";
import { conditionLabel, inr, joinedOn, km as kmFmt, responseLabel, timeAgo } from "@/lib/format";
import { productCategoryLabel } from "@/lib/categories";
import { areaById, areaName, distanceBetweenAreas } from "@/lib/geo";
import { uid, useApp, useToast } from "@/lib/store";
import { REAL_MODE } from "@/lib/supabase/config";
import { supabase } from "@/lib/supabase/client";

const REPORT_REASONS = [
  "Suspicious or scam",
  "Prohibited item",
  "Wrong category / details",
  "Spam or duplicate",
  "Other",
];

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = React.useState(0);
  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 text-5xl">
        📦
      </div>
    );
  }
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-stone-100 shadow-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={title} className="aspect-[4/3] w-full bg-white object-contain" />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + images.length) % images.length)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-soft transition hover:bg-white active:scale-90"
            >
              <ArrowLeft size={17} className="rotate-180" />
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % images.length)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-soft transition hover:bg-white active:scale-90"
            >
              <ArrowLeft size={17} />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink-950/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {images.map((img, i) => (
            <button key={img + i} onClick={() => setActive(i)} aria-label={`Photo ${i + 1}`} className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt=""
                className={`h-16 w-20 rounded-xl object-cover ring-2 transition ${
                  i === active ? "ring-brand-600" : "ring-transparent opacity-70 hover:opacity-100"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, hydrated, currentUser, dispatch, startConversation } = useApp();
  const { push } = useToast();

  const [offerOpen, setOfferOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [offerAmount, setOfferAmount] = React.useState("");
  const [offerNote, setOfferNote] = React.useState("");
  const [reportReason, setReportReason] = React.useState(REPORT_REASONS[0]!);
  const [reportDetails, setReportDetails] = React.useState("");

  const product = state.products.find((p) => p.id === id);
  const seller = state.users.find((u) => u.id === product?.sellerId);
  const isMine = currentUser && product?.sellerId === currentUser.id;
  const favorited = product ? state.favorites.includes(product.id) : false;
  const myArea = currentUser?.area ?? "viman";
  const viewed = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (product && hydrated && viewed.current !== product.id) {
      viewed.current = product.id;
      dispatch({ type: "UPDATE_PRODUCT", id: product.id, patch: { views: product.views + 1 } });
      // persist the view count server-side (owners can't be bumped by passers-by
      // via plain UPDATE — a tiny RPC does it safely for everyone)
      if (REAL_MODE && currentUser && product.sellerId !== currentUser.id) {
        const sb = supabase();
        void sb?.rpc("increment_product_views", { pid: product.id });
      }
    }
  }, [product, hydrated, dispatch, currentUser]);

  if (!hydrated || !product) {
    if (hydrated && !product) {
      return (
        <div className="py-16">
          <div className="mx-auto max-w-md text-center">
            <p className="text-5xl">🔍</p>
            <h1 className="mt-4 text-xl font-extrabold text-ink-900">This listing doesn&apos;t exist</h1>
            <p className="mt-1.5 text-[14px] text-ink-500">It may have been removed or sold.</p>
            <Link href="/home" className="mt-6 inline-block">
              <Button variant="secondary">← Back to home</Button>
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const area = areaById(product.area);
  const distance = distanceBetweenAreas(myArea, product.area);
  const sellerReviews = state.reviews.filter((r) => r.targetId === product.sellerId);
  const similar = state.products
    .filter((p) => p.category === product.category && p.id !== product.id && p.status === "active" && !p.flagged)
    .sort((a, b) => distanceBetweenAreas(myArea, a.area) - distanceBetweenAreas(myArea, b.area))
    .slice(0, 4);

  const openChat = () => {
    if (!currentUser || !seller) return;
    if (seller.id === currentUser.id) {
      push({ kind: "info", title: "This is your own listing 😄" });
      return;
    }
    const cid = startConversation(seller.id, {
      type: "product",
      id: product.id,
      title: product.title,
      image: product.images[0],
      price: product.price,
    });
    router.push(`/chat?c=${encodeURIComponent(cid)}`);
  };

  const sendOffer = () => {
    if (!currentUser || !seller) return;
    const amount = parseInt(offerAmount.replace(/[^\d]/g, ""), 10);
    if (!amount || amount < 100) {
      push({ kind: "error", title: "Enter a valid offer amount" });
      return;
    }
    const cid = startConversation(seller.id, {
      type: "product",
      id: product.id,
      title: product.title,
      image: product.images[0],
      price: product.price,
    });
    dispatch({
      type: "ADD_MESSAGE",
      conversationId: cid,
      message: {
        id: uid("m"),
        senderId: currentUser.id,
        text: "Offer sent",
        at: new Date().toISOString(),
        kind: "offer",
        offer: { amount, note: offerNote.trim() || undefined },
      },
    });
    setOfferOpen(false);
    setOfferAmount("");
    setOfferNote("");
    push({ kind: "success", title: "Offer sent 🎉", body: `${seller.name.split(" ")[0]} will get back to you in chat` });
    router.push(`/chat?c=${encodeURIComponent(cid)}`);
  };

  const submitReport = () => {
    dispatch({
      type: "ADD_REPORT",
      report: {
        id: uid("rp"),
        targetType: "product",
        targetId: product.id,
        targetLabel: `${product.title} — ${inr(product.price)}`,
        reason: reportReason,
        details: reportDetails.trim() || "No extra details provided.",
        by: currentUser?.name ?? "Anonymous",
        createdAt: new Date().toISOString(),
        status: "open",
      },
    });
    setReportOpen(false);
    setReportDetails("");
    push({ kind: "success", title: "Report submitted", body: "Locora AI & our team will review it shortly" });
  };

  const share = async () => {
    const url = `${window.location.origin}/product/${product.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        push({ kind: "success", title: "Link copied to clipboard" });
      }
    } catch {
      /* dismissed */
    }
  };

  const pc = product.priceCheck;
  // demo listings: the "seller" is a sample account — contact CTAs are faded off
  const demoListing = !!product.isDemo || !!seller?.isDemo;
  const demoCtaToast = () =>
    push({
      kind: "info",
      title: "Demo listing",
      body: "This seller is a sample account and can't reply. Try the chat on a real listing!",
    });

  return (
    <div className="space-y-8">
      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-400">
        <Link href="/home" className="transition hover:text-ink-700">Home</Link>
        <span>/</span>
        <Link href="/home" className="transition hover:text-ink-700">{productCategoryLabel(product.category)}</Link>
        <span>/</span>
        <span className="truncate text-ink-600">{product.title}</span>
      </div>

      {product.flagged && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-200">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <ShieldAlert size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-extrabold text-rose-700">Locora AI flagged this listing — proceed with extreme caution</p>
            <ul className="mt-1.5 space-y-1">
              {product.flagged.reasons.map((r) => (
                <li key={r} className="text-[12.5px] font-medium leading-snug text-rose-600">• {r}</li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] font-semibold text-rose-500">
              Never pay in advance. Meet in person, inspect the item, then pay.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        {/* ---------------- left column ---------------- */}
        <div className="min-w-0 space-y-6">
          <Gallery images={product.images} title={product.title} />

          {product.isDemo && (
            <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-amber-400 bg-amber-50 px-4 py-3">
              <FlaskConical size={16} className="shrink-0 text-amber-600" />
              <p className="text-[12.5px] font-bold leading-snug text-amber-800">
                Demo listing — sample data included to show how Locora works. This item
                isn&apos;t a real offer for sale.
              </p>
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{conditionLabel(product.condition)}</Badge>
              {product.isDemo && <DemoBadge />}
              {product.negotiable && <Badge tone="stone">Negotiable</Badge>}
              {product.aiTags.slice(0, 3).map((t) => (
                <Badge key={t} tone="sky">{t}</Badge>
              ))}
            </div>
            <h1 className="mt-3 text-balance text-[24px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[27px]">
              {product.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-ink-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-brand-600" />
                {areaName(product.area)}
                {!isMine && <span className="font-bold text-brand-600">· {kmFmt(distance)} away</span>}
              </span>
              <span className="flex items-center gap-1.5"><Clock size={13} /> {timeAgo(product.createdAt)}</span>
              <span className="flex items-center gap-1.5"><Eye size={14} /> {product.views} views</span>
              <span className="flex items-center gap-1"><Heart size={13} /> {product.favorites} saves</span>
            </div>
          </div>

          {/* price + AI check */}
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[30px] font-extrabold tracking-tight text-ink-900">{inr(product.price)}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-ink-400">
                  {product.negotiable ? "Price slightly negotiable" : "Price fixed"}
                </p>
              </div>
              <Button
                variant="softBrand"
                className={demoListing ? "opacity-55" : ""}
                onClick={() => (demoListing ? demoCtaToast() : setOfferOpen(true))}
              >
                <IndianRupee size={15} /> Make an offer
              </Button>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-accent-50/70 p-3.5 ring-1 ring-accent-100">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-accent-600" />
              <div className="min-w-0 text-[12.5px] leading-relaxed">
                <p className="font-extrabold text-accent-800">
                  AI price check:{" "}
                  {pc.label === "great" ? (
                    <span className="inline-flex items-center gap-1">
                      <TrendingDown size={13} /> great deal — {Math.abs(pc.deltaPct)}% below local market
                    </span>
                  ) : pc.label === "high" ? (
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp size={13} /> priced {pc.deltaPct}% above local market
                    </span>
                  ) : (
                    "fairly priced"
                  )}
                </p>
                <p className="mt-0.5 font-medium text-accent-700/80">
                  Compared with {pc.comparables} similar listings within 15 km over the last 90 days.
                </p>
              </div>
            </div>
          </div>

          {/* details */}
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
            <h2 className="text-[15px] font-extrabold text-ink-900">Details</h2>
            {product.attributes && (
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                {Object.entries(product.attributes).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-300">{k}</dt>
                    <dd className="mt-0.5 text-[13.5px] font-semibold text-ink-800">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-ink-700">{product.description}</p>
            <div className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-3 text-[12px] font-semibold text-ink-400">
              <MapPin size={12} /> Meet around {areaName(product.area)} — pick a public spot like a cafe or society gate
            </div>
          </div>

          {/* safety */}
          <div className="flex items-start gap-3 rounded-2xl bg-brand-50/50 p-4 ring-1 ring-brand-100">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-soft ring-1 ring-brand-100">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-[13.5px] font-extrabold text-ink-900">Meet first. Pay after. Always.</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500">
                Locora never asks for online payments. Inspect the item in person, keep the chat on the app, and
                report anything fishy — our AI reviews every report.
              </p>
            </div>
          </div>
        </div>

        {/* ---------------- right column ---------------- */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* actions card */}
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
            {product.status === "sold" ? (
              <div className="rounded-xl bg-stone-100 py-3.5 text-center text-[14px] font-extrabold uppercase tracking-wide text-ink-400">
                Sold
              </div>
            ) : isMine ? (
              <div className="space-y-2.5">
                <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink-400">
                  <UserCheck size={14} /> You are the seller
                </p>
                <Link href={`/create/listing?edit=${product.id}`} className="block">
                  <Button variant="secondary" className="w-full">
                    <Pencil size={15} /> Edit listing
                  </Button>
                </Link>
                <Button
                  className="w-full"
                  variant={product.status === "active" ? "secondary" : "primary"}
                  onClick={() => {
                    dispatch({
                      type: "UPDATE_PRODUCT",
                      id: product.id,
                      patch: { status: product.status === "active" ? "sold" : "active" },
                    });
                    push({ kind: "success", title: product.status === "active" ? "Marked as sold 🎉" : "Listing reactivated" });
                  }}
                >
                  {product.status === "active" ? "Mark as sold" : "Reactivate listing"}
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => {
                    dispatch({ type: "REMOVE_PRODUCT", id: product.id });
                    push({ kind: "success", title: "Listing deleted" });
                    router.push("/profile");
                  }}
                >
                  <Trash2 size={15} /> Delete listing
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <Button
                  size="lg"
                  className={`w-full ${demoListing ? "opacity-55" : ""}`}
                  onClick={() => (demoListing ? demoCtaToast() : openChat())}
                >
                  <MessageCircle size={17} /> Chat with seller
                </Button>
                {demoListing && (
                  <p className="text-center text-[11px] font-semibold text-ink-400">
                    Chat is switched off on demo listings
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="secondary" onClick={() => dispatch({ type: "TOGGLE_FAVORITE", productId: product.id })} className={favorited ? "!text-rose-600 !ring-rose-200" : ""}>
                    <Heart size={15} fill={favorited ? "currentColor" : "none"} /> {favorited ? "Saved" : "Save"}
                  </Button>
                  <Button variant="secondary" onClick={share}>
                    <Share2 size={15} /> Share
                  </Button>
                  <Button variant="secondary" onClick={() => setReportOpen(true)}>
                    <Flag size={15} /> Report
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* seller card */}
          {seller && (
            <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
              <div className="flex items-center gap-3.5">
                <Avatar user={seller} size="xl" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink-900">
                    <span className="truncate">{seller.name}</span>
                    {seller.verified && <BadgeCheck size={16} className="shrink-0 text-brand-600" />}
                    {seller.isDemo && <DemoBadge label="Demo account" />}
                  </p>
                  {seller.rating ? (
                    <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-500">
                      <RatingStars value={seller.rating} size={12} showValue={false} />
                      {seller.rating.toFixed(1)} · {seller.reviewsCount} reviews
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[12.5px] font-semibold text-ink-400">New on Locora</p>
                  )}
                  <p className="mt-0.5 text-[12px] font-medium text-ink-400">
                    {areaName(seller.area)} · joined {joinedOn(seller.joinedAt)}
                  </p>
                  {seller.username && (
                    <Link href={`/u/${seller.username}`} className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-brand-600 transition hover:text-brand-700">
                      @{seller.username} · view profile →
                    </Link>
                  )}
                </div>
              </div>
              {seller.bio && <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-ink-500">{seller.bio}</p>}
              <div className="mt-3.5 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-stone-50 px-3 py-2.5">
                  <p className="text-[13px] font-extrabold text-ink-900">{responseLabel(seller.responseMins ?? 30)}</p>
                  <p className="text-[10.5px] font-semibold text-ink-400">avg. response</p>
                </div>
                <div className="rounded-xl bg-stone-50 px-3 py-2.5">
                  <p className="text-[13px] font-extrabold text-ink-900">
                    {state.products.filter((p) => p.sellerId === seller.id && p.status === "active").length}
                  </p>
                  <p className="text-[10.5px] font-semibold text-ink-400">live listings</p>
                </div>
              </div>
            </div>
          )}

          {/* seller reviews */}
          {sellerReviews.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
              <h3 className="text-[14px] font-extrabold text-ink-900">
                What neighbours say about {seller?.name.split(" ")[0]}
              </h3>
              <div className="mt-3.5 space-y-4">
                {sellerReviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="border-b border-stone-100 pb-3.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[12.5px] font-bold text-ink-800">{r.author} <span className="font-medium text-ink-300">· {r.authorArea ?? "Pune"}</span></p>
                      <RatingStars value={r.rating} size={11} showValue={false} />
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-600">“{r.text}”</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* similar */}
      {similar.length > 0 && (
        <section>
          <h2 className="mb-4 text-[17px] font-extrabold tracking-tight text-ink-900 sm:text-xl">Similar near you</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {similar.map((p) => (
              <ListingCard
                key={p.id}
                product={p}
                seller={state.users.find((u) => u.id === p.sellerId)}
                distance={distanceBetweenAreas(myArea, p.area)}
                favorited={state.favorites.includes(p.id)}
                onToggleFavorite={() => dispatch({ type: "TOGGLE_FAVORITE", productId: p.id })}
              />
            ))}
          </div>
        </section>
      )}

      {/* offer modal */}
      <Modal open={offerOpen} onClose={() => setOfferOpen(false)}>
        <h2 className="text-[17px] font-extrabold text-ink-900">Make an offer</h2>
        <p className="mt-1 text-[13px] text-ink-500">
          Your offer opens a chat with {seller?.name.split(" ")[0]} — no commitment until you meet.
        </p>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-[13px] font-bold text-ink-700">Your offer (listed at {inr(product.price)})</span>
          <span className="flex items-center gap-2 rounded-xl bg-stone-50 px-3.5 ring-1 ring-stone-200 focus-within:ring-2 focus-within:ring-brand-500">
            <span className="text-[15px] font-extrabold text-ink-400">₹</span>
            <input
              inputMode="numeric"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value.replace(/[^\d]/g, "").replace(/\B(?=(\d{2})+(?!\d))$/, ""))}
              placeholder={String(Math.round((product.price * 0.95) / 100) * 100)}
              className="w-full bg-transparent py-3 text-[15px] font-bold outline-none"
            />
          </span>
        </label>
        <label className="mt-3.5 block">
          <span className="mb-1.5 block text-[13px] font-bold text-ink-700">Note (optional)</span>
          <input
            value={offerNote}
            onChange={(e) => setOfferNote(e.target.value)}
            placeholder="e.g. Can pick up today evening"
            className="w-full rounded-xl bg-stone-50 px-3.5 py-3 text-[14px] outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-brand-500"
          />
        </label>
        <div className="mt-5 flex gap-2.5">
          <Button variant="secondary" className="flex-1" onClick={() => setOfferOpen(false)}>Cancel</Button>
          <Button className="flex-1" onClick={sendOffer}>Send offer</Button>
        </div>
      </Modal>

      {/* report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)}>
        <h2 className="text-[17px] font-extrabold text-ink-900">Report this listing</h2>
        <p className="mt-1 text-[13px] text-ink-500">Reports go to Locora AI and the moderation team — usually reviewed within hours.</p>
        <div className="mt-4 space-y-2">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReportReason(r)}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-semibold ring-1 transition ${
                reportReason === r ? "bg-brand-50 text-brand-800 ring-brand-300" : "bg-white text-ink-600 ring-stone-200 hover:ring-stone-300"
              }`}
            >
              {r}
              {reportReason === r && <BadgeCheck size={15} className="text-brand-600" />}
            </button>
          ))}
        </div>
        <textarea
          value={reportDetails}
          onChange={(e) => setReportDetails(e.target.value)}
          placeholder="Anything else we should know? (optional)"
          rows={2}
          className="mt-3 w-full resize-none rounded-xl bg-stone-50 px-3.5 py-3 text-[13.5px] outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-brand-500"
        />
        <div className="mt-5 flex gap-2.5">
          <Button variant="secondary" className="flex-1" onClick={() => setReportOpen(false)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={submitReport}>Submit report</Button>
        </div>
      </Modal>
    </div>
  );
}
