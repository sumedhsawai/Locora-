"use client";

/* ------------------------------------------------------------------ */
/*  Public profile — /u/username                                       */
/*  Anyone can browse a seller's or service pro's profile, live        */
/*  listings, services and reviews. Found via search by @username.     */
/* ------------------------------------------------------------------ */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Package, Wrench } from "lucide-react";
import { ListingCard, ServiceCard } from "@/components/cards";
import { Avatar, Badge, Button, DemoBadge, RatingStars, Skeleton } from "@/components/ui";
import { joinedOn, responseLabel } from "@/lib/format";
import { distanceBetweenAreas, placeLabel, placeOf } from "@/lib/geo";
import { useApp } from "@/lib/store";

export default function PublicProfilePage() {
  const raw = useParams<{ username: string }>().username ?? "";
  const router = useRouter();
  const wanted = decodeURIComponent(raw).toLowerCase().replace(/^@/, "");
  const { state, hydrated, currentUser, dispatch } = useApp();

  const user = state.users.find((u) => (u.username ?? "").toLowerCase() === wanted);
  const myArea = currentUser?.area ?? "viman";

  if (!hydrated) {
    return (
      <div className="mx-auto mt-10 max-w-3xl">
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md pt-16 text-center">
        <p className="text-4xl">🔍</p>
        <h1 className="mt-3 text-[20px] font-extrabold tracking-tight text-ink-900">
          No one by @{wanted}
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
          That username doesn&apos;t belong to anyone on Locora yet. Check the spelling and try
          again.
        </p>
        <Button className="mt-6" onClick={() => router.push("/home")}>
          <ArrowLeft size={15} /> Back to home
        </Button>
      </div>
    );
  }

  const products = state.products.filter((p) => p.sellerId === user.id && p.status === "active");
  const services = state.services.filter((s) => s.providerId === user.id);
  const reviews = state.reviews.filter((r) => r.targetId === user.id);
  const isMe = currentUser?.id === user.id;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink-400 transition hover:text-ink-700"
      >
        <ArrowLeft size={13} /> Home
      </Link>

      {/* header */}
      <div className="animate-fade-up overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-stone-100/70">
        <div className="relative h-28 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800">
          <div className="bg-grid-dark absolute inset-0 opacity-50" aria-hidden />
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-10">
            <Avatar user={user} size="2xl" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">{user.name}</h1>
            {user.verified && (
              <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-extrabold text-brand-700 ring-1 ring-brand-200">
                <BadgeCheck size={12} /> Verified
              </span>
            )}
            {user.isDemo && <DemoBadge label="Demo account" />}
            <Badge tone="stone" className="capitalize">
              {user.role === "provider" ? "Service pro" : user.role}
            </Badge>
          </div>
          <p className="mt-1 text-[13px] font-medium text-ink-400">
            @{user.username} · {placeLabel(placeOf(user))} · member since {joinedOn(user.joinedAt)}
          </p>
          {user.bio && (
            <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-ink-600">{user.bio}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] font-semibold text-ink-500">
            {user.rating ? (
              <span className="flex items-center gap-1.5">
                <RatingStars value={user.rating} size={13} showValue={false} />
                {user.rating.toFixed(1)} · {user.reviewsCount} review
                {(user.reviewsCount ?? 1) === 1 ? "" : "s"}
              </span>
            ) : null}
            <span>Replies in {responseLabel(user.responseMins ?? 15)}</span>
          </div>
          {isMe && (
            <p className="mt-3 text-[12.5px] font-semibold text-brand-600">
              This is you —{" "}
              <Link href="/profile" className="underline">
                manage your profile
              </Link>
            </p>
          )}
        </div>
      </div>

      {products.length > 0 && (
        <section className="animate-fade-up">
          <h2 className="mb-3 flex items-center gap-1.5 text-[15px] font-extrabold text-ink-900">
            <Package size={15} className="text-brand-600" /> Live listings ({products.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {products.map((p) => (
              <ListingCard
                key={p.id}
                product={p}
                seller={user}
                distance={distanceBetweenAreas(myArea, p.area)}
                favorited={state.favorites.includes(p.id)}
                onToggleFavorite={() => dispatch({ type: "TOGGLE_FAVORITE", productId: p.id })}
              />
            ))}
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section className="animate-fade-up">
          <h2 className="mb-3 flex items-center gap-1.5 text-[15px] font-extrabold text-ink-900">
            <Wrench size={15} className="text-brand-600" /> Services ({services.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                provider={user}
                distance={distanceBetweenAreas(myArea, s.area)}
              />
            ))}
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="animate-fade-up rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
          <h2 className="text-[15px] font-extrabold text-ink-900">Reviews ({reviews.length})</h2>
          <div className="mt-4 space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-stone-100 pb-3.5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[13px] font-bold text-ink-800">{r.author}</p>
                  <RatingStars value={r.rating} size={12} showValue={false} />
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-600">“{r.text}”</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {products.length === 0 && services.length === 0 && (
        <div className="rounded-3xl bg-white p-8 text-center shadow-card ring-1 ring-stone-100/70">
          <p className="text-3xl">🌱</p>
          <p className="mt-2 text-[14px] font-bold text-ink-800">Nothing live right now</p>
          <p className="mt-1 text-[12.5px] text-ink-400">
            When {user.name.split(" ")[0]} posts a listing or service, it shows up here.
          </p>
        </div>
      )}
    </div>
  );
}

