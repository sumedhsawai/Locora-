"use client";

/* ------------------------------------------------------------------ */
/*  Locora — feed cards                                               */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import {
  BadgeCheck, Clock, Heart, MapPin, Megaphone, Sparkles, TrendingDown,
} from "lucide-react";
import { Avatar, Badge, DemoBadge, RatingStars } from "@/components/ui";
import { conditionLabel, inr, km as kmFmt, priceUnitLabel, responseLabel, timeAgo } from "@/lib/format";
import { areaName } from "@/lib/geo";
import { SERVICE_CATEGORIES, PRODUCT_CATEGORIES } from "@/lib/categories";

const catEmoji = (c: string) =>
  SERVICE_CATEGORIES.find((x) => x.id === c)?.emoji ?? PRODUCT_CATEGORIES.find((x) => x.id === c)?.emoji ?? "🔍";
import type { BuyRequest, Product, Service, User } from "@/lib/types";

/* --------------------------- ListingCard -------------------------- */

export function PriceCheckChip({ product }: { product: Product }) {
  if (product.flagged) {
    return (
      <Badge tone="amber" className="shrink-0">
        <Sparkles size={10} /> AI flagged
      </Badge>
    );
  }
  const { label, deltaPct } = product.priceCheck;
  if (label === "great")
    return (
      <Badge tone="amber" className="shrink-0" title={`${Math.abs(deltaPct)}% below comparable listings`}>
        <TrendingDown size={10} /> {Math.abs(deltaPct)}% below market
      </Badge>
    );
  if (label === "high")
    return (
      <Badge tone="rose" className="shrink-0" title={`${deltaPct}% above comparable listings`}>
        {deltaPct}% above market
      </Badge>
    );
  return null;
}

export function ListingCard({
  product,
  seller,
  distance,
  favorited,
  onToggleFavorite,
}: {
  product: Product;
  seller?: User;
  distance?: number;
  favorited: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <article className="h-full overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-stone-100/70 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lift">
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[0]}
            alt={product.title}
            loading="lazy"
            className="aspect-[4/3] w-full bg-stone-50 object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
            <div className="flex flex-col items-start gap-1">
              <Badge tone="dark">{conditionLabel(product.condition)}</Badge>
              {product.isDemo && <DemoBadge />}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite();
              }}
              aria-label={favorited ? "Remove from favourites" : "Save to favourites"}
              className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition active:scale-90 ${
                favorited ? "bg-rose-500 text-white" : "bg-white/85 text-ink-600 hover:text-rose-500"
              }`}
            >
              <Heart size={15} fill={favorited ? "currentColor" : "none"} className={favorited ? "animate-heart-pop" : ""} />
            </button>
          </div>
          {product.status === "sold" && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-950/55 backdrop-blur-[2px]">
              <span className="rounded-full bg-white px-4 py-1.5 text-[12px] font-extrabold uppercase tracking-wide text-ink-900">Sold</span>
            </div>
          )}
        </div>
        <div className="p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <p className="text-[17px] font-extrabold tracking-tight text-ink-900">{inr(product.price)}</p>
            <PriceCheckChip product={product} />
          </div>
          <h3 className="mt-0.5 truncate text-[13.5px] font-semibold text-ink-800">{product.title}</h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11.5px] font-medium text-ink-400">
            <MapPin size={11} className="shrink-0" />
            <span className="min-w-0">
              {areaName(product.area)}
              {distance !== undefined && <span className="font-bold text-brand-600">· {kmFmt(distance)}</span>}
            </span>
            <span className="ml-auto shrink-0">{timeAgo(product.createdAt)}</span>
          </p>
          {seller && (
            <p className="mt-2.5 flex items-center gap-1.5 border-t border-stone-100 pt-2.5 text-[11.5px] font-semibold text-ink-500">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-extrabold text-white"
                style={{ background: `linear-gradient(135deg,${seller.avatarFrom},${seller.avatarTo})` }}
              >
                {seller.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <span className="truncate">{seller.name}</span>
              {seller.verified && <BadgeCheck size={12} className="shrink-0 text-brand-600" />}
              <span className="ml-auto shrink-0 text-ink-300">{product.views} views</span>
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

/* --------------------------- ServiceCard -------------------------- */

export function ServiceCard({ service, provider, distance }: { service: Service; provider?: User; distance?: number }) {
  return (
    <Link href={`/service/${service.id}`} className="group block">
      <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-stone-100/70 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lift">
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50 to-accent-50">
          {service.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={service.images[0]}
              alt={service.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">{catEmoji(service.category)}</div>
          )}
          {service.isDemo && (
            <span className="absolute left-2.5 top-2.5">
              <DemoBadge />
            </span>
          )}
          {service.verified && (
            <span className="absolute right-2.5 top-2.5">
              <Badge tone="dark">
                <BadgeCheck size={10} className="text-brand-300" /> Verified
              </Badge>
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="-mt-10 mb-2 flex items-end justify-between">
            {provider ? (
              <Avatar user={provider} size="lg" />
            ) : (
              <span className="h-12 w-12 rounded-full bg-stone-200" />
            )}
            {service.reviewsCount > 0 ? (
              <RatingStars value={service.rating} />
            ) : (
              <Badge tone="brand" className="mb-1">✦ New</Badge>
            )}
          </div>
          <h3 className="text-[14.5px] font-extrabold tracking-tight text-ink-900">{service.title}</h3>
          <p className="mt-0.5 line-clamp-1 text-[12.5px] font-medium text-ink-500">{service.tagline}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10.5px] font-bold text-ink-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1">
              <MapPin size={10} className="text-brand-600" /> {areaName(service.area)}
              {distance !== undefined && ` · ${kmFmt(distance)}`}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1">
              <Clock size={10} /> {responseLabel(service.responseMins)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1">
              {service.experienceYears}+ yrs exp
            </span>
          </div>
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 border-t border-stone-100 pt-3 text-[13px] font-bold text-ink-900">
            <span>
              from {inr(service.startingPrice)}
              <span className="text-[11px] font-semibold text-ink-400">{priceUnitLabel(service.priceUnit)}</span>
            </span>
            <span className="text-[11px] font-bold text-ink-400">{service.reviewsCount} reviews</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* --------------------------- RequestCard -------------------------- */

export function RequestCard({ request, buyer }: { request: BuyRequest; buyer?: User }) {
  const needByLabel: Record<string, string> = {
    today: "Needed today",
    tomorrow: "Needed tomorrow",
    "this-week": "This week",
    weekend: "This weekend",
    flexible: "Flexible timing",
  };
  const top = request.matches[0];
  return (
    <article className="flex w-[300px] shrink-0 flex-col rounded-2xl bg-white p-4 shadow-card ring-1 ring-stone-100/70 sm:w-[330px]">
      <div className="flex items-center gap-2.5">
        {buyer ? (
          <Avatar user={buyer} size="sm" ring={false} />
        ) : (
          <span className="h-8 w-8 rounded-full bg-stone-200" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-extrabold text-ink-900">{buyer?.name ?? "Someone"}</p>
          <p className="text-[10.5px] font-semibold text-ink-400">
            {areaName(request.area)} · {timeAgo(request.createdAt)}
          </p>
        </div>
        {request.needBy === "today" && (
          <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-600 ring-1 ring-rose-200">
            Today
          </span>
        )}
        {request.isDemo && <DemoBadge className="shrink-0" label="Demo" />}
      </div>
      <p className="mt-3 line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink-800">“{request.text}”</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-bold text-ink-500">
        <span className="rounded-full bg-stone-100 px-2 py-1">{catEmoji(request.category)} {request.category.replace("-", " ")}</span>
        {request.budgetMax && <span className="rounded-full bg-stone-100 px-2 py-1">Budget {inr(request.budgetMax)}</span>}
      </div>
      <div className="mt-auto flex items-center gap-2 rounded-xl bg-accent-50/80 px-3 py-2 ring-1 ring-accent-100" style={{ marginTop: "auto" }}>
        <Sparkles size={13} className="shrink-0 text-accent-600" />
        <p className="text-[11px] font-bold leading-tight text-accent-800">
          {request.matches.length > 0
            ? `${request.matches.length} AI match${request.matches.length > 1 ? "es" : ""} · top score ${top?.score}%`
            : "AI is watching new listings for you"}
        </p>
      </div>
      {needByLabel[request.needBy] && (
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-ink-300">{needByLabel[request.needBy]}</p>
      )}
    </article>
  );
}
