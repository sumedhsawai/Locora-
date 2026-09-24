"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BadgeCheck, CalendarCheck, CheckCircle2, Clock, Flag, FlaskConical, IndianRupee, MapPin,
  MessageCircle, Share2, Sparkles, Star, Wrench,
} from "lucide-react";
import { ServiceCard } from "@/components/cards";
import { Avatar, Badge, Button, DemoBadge, Modal, RatingStars, Skeleton } from "@/components/ui";
import { MiniMap } from "@/components/minimap";
import { serviceCategoryEmoji, serviceCategoryLabel } from "@/lib/categories";
import { inr, joinedOn, km as kmFmt, priceUnitLabel, responseLabel, timeAgo } from "@/lib/format";
import { areaById, areaName, distanceBetweenAreas } from "@/lib/geo";
import { uid, useApp, useToast } from "@/lib/store";

const REPORT_REASONS = ["Provider no-show", "Rude or unprofessional", "Pricing dispute", "Fake reviews", "Other"];

export default function ServicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, hydrated, currentUser, dispatch, startConversation } = useApp();
  const { push } = useToast();

  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState(REPORT_REASONS[0]!);
  const [reportDetails, setReportDetails] = React.useState("");

  const service = state.services.find((s) => s.id === id);
  const provider = state.users.find((u) => u.id === service?.providerId);
  const isMine = currentUser && service?.providerId === currentUser.id;
  const myArea = currentUser?.area ?? "viman";

  if (!hydrated || !service) {
    if (hydrated && !service) {
      return (
        <div className="py-16">
          <div className="mx-auto max-w-md text-center">
            <p className="text-5xl">🔍</p>
            <h1 className="mt-4 text-xl font-extrabold text-ink-900">This service doesn&apos;t exist</h1>
            <Link href="/home" className="mt-6 inline-block">
              <Button variant="secondary">← Back to home</Button>
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-8 w-1/2" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const area = areaById(service.area);
  const distance = distanceBetweenAreas(myArea, service.area);
  const reviews = state.reviews.filter((r) => r.targetId === service.providerId);
  const ratingSum = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : service.rating;
  const similar = state.services
    .filter((s) => s.category === service.category && s.id !== service.id)
    .sort((a, b) => distanceBetweenAreas(myArea, a.area) - distanceBetweenAreas(myArea, b.area))
    .slice(0, 4);

  const getQuote = () => {
    if (!currentUser || !provider) return;
    if (provider.id === currentUser.id) {
      push({ kind: "info", title: "This is your own service profile 😄" });
      return;
    }
    const cid = startConversation(provider.id, {
      type: "service",
      id: service.id,
      title: service.title,
      image: service.images[0],
      price: service.startingPrice,
    });
    router.push(`/chat?c=${encodeURIComponent(cid)}`);
  };

  const submitReport = () => {
    dispatch({
      type: "ADD_REPORT",
      report: {
        id: uid("rp"),
        targetType: "service",
        targetId: service.id,
        targetLabel: service.title,
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
    const url = `${window.location.origin}/service/${service.id}`;
    try {
      if (navigator.share) await navigator.share({ title: service.title, url });
      else {
        await navigator.clipboard.writeText(url);
        push({ kind: "success", title: "Link copied to clipboard" });
      }
    } catch { /* dismissed */ }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-400">
        <Link href="/home" className="transition hover:text-ink-700">Home</Link>
        <span>/</span>
        <span className="text-ink-600">{serviceCategoryLabel(service.category)} · {areaName(service.area)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        {/* ---------------- left column ---------------- */}
        <div className="min-w-0 space-y-6">
          {service.isDemo && (
            <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-amber-400 bg-amber-50 px-4 py-3">
              <FlaskConical size={16} className="shrink-0 text-amber-600" />
              <p className="text-[12.5px] font-bold leading-snug text-amber-800">
                Demo service — sample data included to show how Locora works. This
                isn&apos;t a real provider you can book.
              </p>
            </div>
          )}

          {/* hero */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-stone-100/70">
            <div className="relative h-44 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 sm:h-52">
              {service.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={service.images[0]} alt={service.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl opacity-90">{serviceCategoryEmoji(service.category)}</div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950/60 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <Badge tone="dark" className="!bg-white/15 backdrop-blur">
                    {serviceCategoryEmoji(service.category)} {serviceCategoryLabel(service.category)}
                  </Badge>
                  <h1 className="mt-2 text-balance text-[22px] font-extrabold leading-tight tracking-tight text-white sm:text-[26px]">
                    {service.title}
                  </h1>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {service.reviewsCount > 0 || reviews.length > 0 ? (
                  <>
                    <span className="flex items-center gap-2">
                      <RatingStars value={ratingSum} size={16} />
                      <span className="text-[12.5px] font-semibold text-ink-400">({service.reviewsCount} reviews)</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[13px] font-bold text-ink-700">
                      <CheckCircle2 size={14} className="text-brand-600" /> {service.jobsDone.toLocaleString("en-IN")} jobs done
                    </span>
                  </>
                ) : (
                  <Badge tone="brand"><Sparkles size={10} /> New on Locora — be the first to hire</Badge>
                )}
                <span className="flex items-center gap-1.5 text-[13px] font-bold text-ink-700">
                  <Clock size={14} className="text-ink-400" /> replies in {responseLabel(service.responseMins)}
                </span>
              </div>
              <p className="mt-3 text-[15px] font-semibold italic text-ink-600">“{service.tagline}”</p>
            </div>
          </div>

          {/* about */}
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-ink-900">
              <Wrench size={16} className="text-brand-600" /> About this service
            </h2>
            <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-700">{service.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {service.skills.map((s) => (
                <Badge key={s} tone="brand">{s}</Badge>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {service.availability.map((a) => (
                <div key={a} className="flex items-center gap-2.5 rounded-xl bg-stone-50 px-3.5 py-2.5">
                  <CalendarCheck size={15} className="shrink-0 text-brand-600" />
                  <span className="text-[13px] font-bold text-ink-700">{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* service area map */}
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6">
            <h2 className="text-[15px] font-extrabold text-ink-900">Service area</h2>
            <p className="mt-1 text-[13px] text-ink-500">
              Based in {areaName(service.area)} · travels up to {service.radiusKm} km
              {!isMine && distance <= service.radiusKm + 4 ? (
                <span className="font-bold text-brand-600"> — covers your area ({kmFmt(distance)} away)</span>
              ) : !isMine ? (
                <span> — {kmFmt(distance)} from you</span>
              ) : null}
            </p>
            <div className="mt-3.5">
              {area && (
                <MiniMap
                  lat={area.lat}
                  lng={area.lng}
                  radiusKm={service.radiusKm}
                  label={`${serviceCategoryLabel(service.category)} · ${areaName(service.area)}`}
                  className="h-64"
                />
              )}
            </div>
          </div>

          {/* portfolio */}
          {service.images.length > 1 && (
            <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6">
              <h2 className="text-[15px] font-extrabold text-ink-900">Recent work</h2>
              <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {service.images.slice(1).map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img + i}
                    src={img}
                    alt={`${service.title} work photo ${i + 1}`}
                    loading="lazy"
                    className="aspect-[4/3] w-full rounded-xl bg-stone-50 object-contain ring-1 ring-stone-200/70 transition hover:scale-[1.02]"
                  />
                ))}
              </div>
            </div>
          )}

          {/* reviews */}
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold text-ink-900">Neighbour reviews</h2>
              {(reviews.length > 0 || service.reviewsCount > 0) && (
                <span className="flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1.5 ring-1 ring-accent-100">
                  <Star size={14} className="text-accent-500" fill="currentColor" />
                  <span className="text-[13px] font-extrabold text-ink-900">{ratingSum.toFixed(1)}</span>
                  <span className="text-[11.5px] font-semibold text-ink-400">· {reviews.length || service.reviewsCount} reviews</span>
                </span>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="mt-4 text-[13.5px] text-ink-400">No written reviews yet — be the first after your first job 🌱</p>
            ) : (
              <div className="mt-4 space-y-5">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-ink-800">
                        {r.author} <span className="font-medium text-ink-300">· {r.authorArea ?? "Pune"} · {timeAgo(r.createdAt)}</span>
                      </p>
                      <RatingStars value={r.rating} size={12} showValue={false} />
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">“{r.text}”</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---------------- right column ---------------- */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
            <p className="text-[11.5px] font-extrabold uppercase tracking-wider text-ink-400">Starting at</p>
            <p className="mt-1 text-[28px] font-extrabold tracking-tight text-ink-900">
              {inr(service.startingPrice)}
              <span className="text-[14px] font-bold text-ink-400">{priceUnitLabel(service.priceUnit)}</span>
            </p>
            <p className="mt-1 text-[12px] font-medium text-ink-400">Final quote depends on the job — discuss in chat.</p>
            {isMine ? (
              <div className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-center text-[13px] font-bold text-brand-700 ring-1 ring-brand-100">
                This is your service profile ✓
              </div>
            ) : (
              <Button size="lg" className="mt-4 w-full" onClick={getQuote}>
                <MessageCircle size={17} /> Get a quote
              </Button>
            )}
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={share}><Share2 size={15} /> Share</Button>
              {!isMine && <Button variant="secondary" onClick={() => setReportOpen(true)}><Flag size={15} /> Report</Button>}
            </div>
          </div>

          {provider && (
            <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
              <div className="flex items-center gap-3.5">
                <Avatar user={provider} size="xl" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink-900">
                    <span className="truncate">{provider.name}</span>
                    {service.verified && <BadgeCheck size={16} className="shrink-0 text-brand-600" />}
                    {provider.isDemo && <DemoBadge label="Demo account" />}
                  </p>
                  <p className="mt-0.5 text-[12.5px] font-semibold text-ink-500">
                    {service.experienceYears}+ years experience
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-ink-400">
                    {areaName(provider.area)} · joined {joinedOn(provider.joinedAt)}
                  </p>
                  {provider.username && (
                    <Link href={`/u/${provider.username}`} className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-brand-600 transition hover:text-brand-700">
                      @{provider.username} · view profile →
                    </Link>
                  )}
                </div>
              </div>
              {provider.bio && <p className="mt-3 text-[12.5px] leading-relaxed text-ink-500">{provider.bio}</p>}
              {service.verified && (
                <div className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-brand-50/60 p-3 ring-1 ring-brand-100">
                  <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-600" />
                  <p className="text-[12px] font-semibold leading-snug text-brand-800">
                    Locora-verified: ID checked, work history reviewed, and every job tracked with reviews.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-stone-100/70">
            <h3 className="text-[14px] font-extrabold text-ink-900">How Locora bookings work</h3>
            <ol className="mt-3 space-y-3">
              {[
                "Chat & get a clear quote — no advance payments",
                "Agree a time; provider comes to your place",
                "Pay in person after the work is done",
                "Leave a review to help your neighbours",
              ].map((s, i) => (
                <li key={s} className="flex items-start gap-3 text-[12.5px] font-semibold text-ink-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-extrabold text-brand-700 ring-1 ring-brand-100">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      {/* similar */}
      {similar.length > 0 && (
        <section>
          <h2 className="mb-4 text-[17px] font-extrabold tracking-tight text-ink-900 sm:text-xl">
            Other {serviceCategoryLabel(service.category).toLowerCase()} near you
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                provider={state.users.find((u) => u.id === s.providerId)}
                distance={distanceBetweenAreas(myArea, s.area)}
              />
            ))}
          </div>
        </section>
      )}

      {/* report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)}>
        <h2 className="text-[17px] font-extrabold text-ink-900">Report this provider</h2>
        <p className="mt-1 text-[13px] text-ink-500">Reports go to Locora AI and the moderation team.</p>
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
          placeholder="What happened? (optional)"
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
