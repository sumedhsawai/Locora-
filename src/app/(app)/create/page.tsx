"use client";

import Link from "next/link";
import { ArrowRight, Megaphone, Package, Sparkles, Wrench } from "lucide-react";
import { Badge } from "@/components/ui";

const CHOICES = [
  {
    href: "/create/listing",
    icon: Package,
    title: "Sell an item",
    body: "Pre-loved phones, furniture, bikes… AI writes your ad and suggests the right price in seconds.",
    image: "/images/listings/sofa-a.jpg",
    cta: "Start listing",
    soon: false,
  },
  {
    href: "/create-service",
    icon: Wrench,
    title: "Offer a service",
    body: "Plumber, tutor, photographer — build a profile neighbours trust, with AI writing your intro.",
    image: "/images/services/plumber-a.jpg",
    cta: "Create service profile",
    soon: false,
  },
  {
    href: "/requests",
    icon: Megaphone,
    title: "I'm Looking For",
    body: "Post what you need. Locora AI matches nearby sellers and providers and notifies them instantly.",
    image: "/images/listings/desk-a.jpg",
    cta: "Post a request",
    soon: false,
  },
];

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="animate-fade-up text-center">
        <Badge tone="brand"><Sparkles size={11} /> AI-assisted posting</Badge>
        <h1 className="mt-3 text-[26px] font-extrabold tracking-tight text-ink-900 sm:text-[30px]">
          What would you like to post?
        </h1>
        <p className="mt-2 text-[14.5px] text-ink-500">
          Free forever · no commission · your ad reaches buyers within a few kilometres
        </p>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-3">
        {CHOICES.map((c, i) => (
          <Link
            key={c.title}
            href={c.href}
            className="group animate-fade-up overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-stone-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="relative h-28 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/45 to-transparent" />
              <span className="absolute bottom-2.5 left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-brand-700 shadow-soft backdrop-blur">
                <c.icon size={17} />
              </span>
              {c.soon && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-accent-400/95 px-2 py-0.5 text-[10px] font-extrabold text-ink-950">
                  Next update
                </span>
              )}
            </div>
            <div className="p-4">
              <h2 className="flex items-center gap-1 text-[15.5px] font-extrabold text-ink-900">
                {c.title}
                <ArrowRight size={15} className="text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">{c.body}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl bg-brand-50/50 p-4 ring-1 ring-brand-100">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-600" />
        <p className="text-[12.5px] leading-relaxed text-ink-600">
          <span className="font-extrabold text-ink-800">Pro tip:</span> every listing passes through Locora&apos;s AI
          scam shield before going live — clear photos and an honest description get approved instantly and rank higher
          in search.
        </p>
      </div>
    </div>
  );
}
