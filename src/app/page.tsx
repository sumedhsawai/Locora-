"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, BadgeCheck, ChevronRight, MapPin, MessageCircle, Megaphone, Search,
  ShieldCheck, Sparkles, Star, TrendingDown,
} from "lucide-react";
import { Logo, LogoMark, AiPill } from "@/components/brand";
import { CountUp, Parallax, Reveal, Tilt } from "@/components/motion";
import Image from "next/image";
import { Badge } from "@/components/ui";

/* ------------------------- typing placeholder ---------------------- */

const HERO_QUERIES = [
  "need a plumber today, sink blocked",
  "used iPhone under ₹40k near Viman Nagar",
  "study table with shelf, budget 5k",
  "deep cleaning before Diwali, 2BHK",
];

function useTypingPlaceholder(examples: string[]) {
  const [text, setText] = React.useState("");
  React.useEffect(() => {
    let i = 0;
    let char = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = examples[i % examples.length]!;
      if (!deleting) {
        char++;
        setText(current.slice(0, char));
        if (char === current.length) {
          deleting = true;
          timer = setTimeout(tick, 2000);
          return;
        }
        timer = setTimeout(tick, 42 + Math.random() * 40);
      } else {
        char -= 2;
        setText(current.slice(0, Math.max(0, char)));
        if (char <= 0) {
          deleting = false;
          i++;
        }
        timer = setTimeout(tick, 22);
      }
    };
    timer = setTimeout(tick, 700);
    return () => clearTimeout(timer);
  }, [examples]);
  return text;
}

/* ------------------------------ hero ------------------------------- */

function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const placeholder = useTypingPlaceholder(HERO_QUERIES);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/login` : `/login`);
      }}
      className="group flex w-full max-w-xl items-center gap-2 rounded-2xl bg-white/[.07] p-2 ring-1 ring-white/15 backdrop-blur-md transition-all duration-300 focus-within:bg-white/[.1] focus-within:ring-brand-400/40"
    >
      <Search size={18} className="ml-2.5 shrink-0 text-brand-300/80" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder || "What are you looking for?"}
        className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-white placeholder:text-white/40 focus:outline-none"
        aria-label="Search Locora"
      />
      <button
        type="submit"
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand-500 px-4 text-sm font-bold text-ink-950 shadow-glow transition hover:bg-brand-400 active:scale-95"
      >
        <Sparkles size={15} /> Search
      </button>
    </form>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[272px] sm:w-[292px]">
      {/* floating chips */}
      <div className="absolute -left-24 top-24 z-10 hidden animate-float rounded-2xl bg-white p-3 shadow-lift sm:block" style={{ animationDelay: "0.6s" }}>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-50 text-accent-600 ring-1 ring-accent-200">
            <TrendingDown size={15} />
          </span>
          <div>
            <p className="text-[11px] font-extrabold text-ink-900">AI price check</p>
            <p className="text-[10px] font-semibold text-brand-600">Great deal · 8% below market</p>
          </div>
        </div>
      </div>
      <div className="absolute -right-20 top-72 z-10 hidden animate-float rounded-2xl bg-white p-3 shadow-lift sm:block">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-200">
            <Megaphone size={15} />
          </span>
          <div>
            <p className="text-[11px] font-extrabold text-ink-900">I&apos;m Looking For</p>
            <p className="text-[10px] font-semibold text-ink-500">3 plumbers matched · 1.5 km</p>
          </div>
        </div>
      </div>
      <div className="absolute -left-16 bottom-24 z-10 hidden animate-float rounded-2xl bg-white p-3 shadow-lift md:block" style={{ animationDelay: "1.2s" }}>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-200">
            <MessageCircle size={15} />
          </span>
          <div>
            <p className="text-[11px] font-extrabold text-ink-900">Sneha replied</p>
            <p className="text-[10px] font-semibold text-ink-500">&ldquo;₹37,500 with a new case 🙌&rdquo;</p>
          </div>
        </div>
      </div>

      {/* frame */}
      <div className="relative rounded-[2.6rem] bg-ink-950 p-[9px] shadow-glow ring-1 ring-white/10">
        <div className="overflow-hidden rounded-[2.05rem] bg-stone-50">
          {/* status bar */}
          <div className="flex items-center justify-between bg-white px-5 pb-1.5 pt-3">
            <span className="text-[10px] font-bold text-ink-900">9:41</span>
            <span className="h-4 w-16 rounded-full bg-ink-950" />
            <span className="flex items-center gap-1 text-ink-900">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              <span className="text-[9px] font-bold">Pune</span>
            </span>
          </div>
          {/* app header */}
          <div className="bg-white px-4 pb-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-ink-500">Good evening 👋</p>
                <p className="text-[13px] font-extrabold text-ink-900">Aarav, Viman Nagar</p>
              </div>
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-ink-600">
                <BadgeCheck size={14} className="text-brand-600" />
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2">
              <Sparkles size={12} className="text-brand-600" />
              <span className="truncate text-[10px] font-medium text-ink-600">
                Try: &ldquo;used iPhone under ₹40k near me&rdquo;
              </span>
            </div>
            <div className="mt-2.5 flex gap-1.5 overflow-hidden">
              {["📱 Mobiles", "🛋️ Furniture", "🚰 Plumbers"].map((c) => (
                <span key={c} className="whitespace-nowrap rounded-full bg-stone-100 px-2 py-1 text-[9px] font-bold text-ink-700">
                  {c}
                </span>
              ))}
            </div>
          </div>
          {/* cards */}
          <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 pt-3">
            {[
              { img: "/images/listings/iphone13-a.jpg", price: "₹37,500", title: "iPhone 13 · 128GB", meta: "Kothrud · 6 km", deal: true },
              { img: "/images/listings/sofa-a.jpg", price: "₹23,500", title: "L-Shaped 6-Seat Sofa", meta: "Baner · 13 km", deal: false },
              { img: "/images/services/plumber-a.jpg", price: "₹199", title: "Rohan · Plumbing", meta: "4.9★ · 86 reviews", deal: false },
              { img: "/images/listings/galaxy-a.jpg", price: "₹31,000", title: "Galaxy S22 5G", meta: "Hinjewadi · 16 km", deal: false },
            ].map((c) => (
              <div key={c.title} className="overflow-hidden rounded-xl bg-white shadow-card">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt={c.title} className="aspect-[4/3] w-full object-cover" />
                  {c.deal && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-accent-400/95 px-1.5 py-0.5 text-[8px] font-extrabold text-ink-950">
                      ✦ Great deal
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-extrabold text-ink-900">{c.price}</p>
                  <p className="truncate text-[9px] font-semibold text-ink-700">{c.title}</p>
                  <p className="mt-0.5 truncate text-[8px] font-medium text-ink-400">{c.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- landing page -------------------------- */

const FEATURES = [
  {
    icon: Search,
    title: "Search like you talk",
    body: "Skip the filters. Just say “used iPhone under 40k near Viman Nagar” and Locora AI understands the category, budget and location — then ranks the best matches first.",
    accent: "bg-brand-50 text-brand-600 ring-brand-100",
  },
  {
    icon: Sparkles,
    title: "AI listing writer",
    body: "Type three words about what you're selling. Get a polished title, a trustworthy description, smart tags and a fair price range — written in seconds.",
    accent: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  {
    icon: Megaphone,
    title: "“I'm Looking For” board",
    body: "Can't find it? Post what you need. Locora AI matches nearby sellers and service providers, ranks them by distance and rating, and notifies you automatically.",
    accent: "bg-accent-50 text-accent-600 ring-accent-100",
  },
  {
    icon: MessageCircle,
    title: "Real-time chat",
    body: "Negotiate, share photos and fix a meetup over chat. No phone numbers exchanged until you're ready — every conversation stays on Locora.",
    accent: "bg-sky-50 text-sky-600 ring-sky-100",
  },
  {
    icon: BadgeCheck,
    title: "Verified locals",
    body: "KYC-verified sellers and service providers, real reviews from neighbours, and response-time badges so you know who'll reply fast.",
    accent: "bg-brand-50 text-brand-600 ring-brand-100",
  },
  {
    icon: ShieldCheck,
    title: "AI scam shield",
    body: "Every listing passes through scam detection that flags too-good-to-be-true prices, advance-payment tricks and off-platform bait before you ever see them.",
    accent: "bg-rose-50 text-rose-600 ring-rose-100",
  },
];

const STATS: { value: React.ReactNode; label: string }[] = [
  { value: <CountUp to={18400} suffix="+" />, label: "live listings" },
  { value: <CountUp to={6300} suffix="+" />, label: "verified locals" },
  { value: <CountUp to={11} suffix=" min" />, label: "avg. first reply" },
  { value: <CountUp to={190} suffix="+" />, label: "countries ready" },
];

const WORLD_CITIES = [
  "Pune", "Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Chennai",
  "London", "Manchester", "Berlin", "Munich", "Paris", "Amsterdam",
  "New York", "San Francisco", "Austin", "Chicago", "Toronto", "Vancouver",
  "Sydney", "Melbourne", "Singapore", "Dubai", "Tokyo", "São Paulo",
];

const TESTIMONIALS = [
  {
    quote:
      "Sold my sofa in two days. The AI wrote a better description than I would have, and the price suggestion was spot on — three buyers said it was 'fairly priced' in chat.",
    name: "Omkar Bhosale",
    detail: "Sold furniture · Baner",
    from: "#6366F1", to: "#4338CA",
  },
  {
    quote:
      "Posted 'need a plumber today' at 9 AM. Locora matched Rohan 1.5 km away, we chatted, and the leak was fixed by lunch. This is how local should work.",
    name: "Ishita Rao",
    detail: "Found a plumber · Kalyani Nagar",
    from: "#EC4899", to: "#BE185D",
  },
  {
    quote:
      "As a tutor, half my new students now come from Locora. The verified badge and parent reviews do my marketing for me.",
    name: "Priya Desai",
    detail: "Service provider · Baner",
    from: "#0390E0", to: "#014093",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* ------------------------------ nav ------------------------------ */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo dark />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/70 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#worldwide" className="transition hover:text-white">Worldwide</a>
            <a href="#how" className="transition hover:text-white">How it works</a>
            <a href="#looking-for" className="transition hover:text-white">I&apos;m Looking For</a>
            <a href="#safety" className="transition hover:text-white">Safety</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-ink-950 shadow-glow transition hover:bg-brand-400 active:scale-95"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ----------------------------- hero ----------------------------- */}
      <section className="relative overflow-hidden bg-ink-950 pb-20 pt-32 sm:pb-28 sm:pt-36">
        <div className="bg-grid-dark absolute inset-0" aria-hidden />
        <div className="aurora-blob absolute -left-40 top-10 h-96 w-96 rounded-full bg-brand-500/25 blur-[130px]" aria-hidden />
        <div className="aurora-blob aurora-blob-2 absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-accent-500/15 blur-[120px]" aria-hidden />
        <div className="aurora-blob aurora-blob-3 absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-600/20 blur-[110px]" aria-hidden />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-8">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/[.06] px-3.5 py-1.5 text-[12.5px] font-semibold text-brand-200 ring-1 ring-white/10">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
              </span>
              Now live worldwide · every city, every country
            </div>
            <h1 className="mt-5 text-balance text-[40px] font-extrabold leading-[1.06] tracking-tight text-white sm:text-6xl">
              Your neighbourhood,{" "}
              <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-accent-300 bg-clip-text text-transparent">
                powered by AI.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-[16.5px] leading-relaxed text-white/65">
              Locora is the hyperlocal marketplace for your city — anywhere on Earth. Set your
              location and instantly see listings, services and people around you. Chat, meet
              safely and close the deal in person — with AI that writes your listings,
              understands your searches and finds the right people for you.
            </p>
            <div className="mt-8">
              <HeroSearch />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-2.5">
                  {[
                    ["#6366F1", "#4338CA", "SP"],
                    ["#EC4899", "#BE185D", "IR"],
                    ["#F59E0B", "#D97706", "RK"],
                    ["#0390E0", "#014093", "PD"],
                  ].map(([f, t, i]) => (
                    <span
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-extrabold text-white ring-2 ring-ink-950"
                      style={{ background: `linear-gradient(135deg, ${f}, ${t})` }}
                    >
                      {i}
                    </span>
                  ))}
                </div>
                <div className="text-[12.5px] leading-tight text-white/60">
                  <span className="font-bold text-white">12,400+ neighbours</span> joined
                  <br />
                  <span className="inline-flex items-center gap-1">
                    <Star size={11} className="text-accent-400" fill="currentColor" /> 4.9 rated by the neighbourhood
                  </span>
                </div>
              </div>
              <div className="hidden h-9 w-px bg-white/15 sm:block" />
              <p className="text-[12.5px] font-medium leading-snug text-white/50">
                No online payments. No delivery.
                <br />
                Just neighbours, meeting safely.
              </p>
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: ".15s" }}>
            <Parallax strength={14} className="pointer-events-none absolute -left-16 -top-14 z-0 hidden w-64 sm:block">
              <div className="float-y-slow">
                <Image
                  src="/images/hero-3d.png"
                  alt="A 3D neighbourhood with a Locora map pin"
                  width={520}
                  height={284}
                  priority
                  className="w-full rounded-3xl opacity-90 shadow-glow ring-1 ring-white/10"
                />
              </div>
            </Parallax>
            <div className="relative z-10">
              <PhoneMockup />
            </div>
            <div className="float-y-fast pointer-events-none absolute -right-5 -top-8 z-20 hidden rounded-2xl bg-white/95 px-4 py-3 shadow-lift ring-1 ring-white/40 backdrop-blur sm:block">
              <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-700">
                <LogoMark size={16} /> Live in 190+ countries
              </p>
              <p className="mt-1 text-[11.5px] font-semibold text-ink-500">Pune → Paris → Peru 🌍</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- stats ------------------------------ */}
      <section className="relative z-10 mx-auto -mt-1 max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-stone-200/70 shadow-soft ring-1 ring-stone-200/60 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.label} className="bg-white px-6 py-6 text-center sm:py-7" style={{ animationDelay: `${i * 0.06}s` }}>
              <p className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-[28px]">{s.value}</p>
              <p className="mt-0.5 text-[12.5px] font-semibold text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------- features ---------------------------- */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="brand">Built-in intelligence</Badge>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            Everything a marketplace does. Only smarter.
          </h2>
          <p className="mt-3 text-pretty text-[15.5px] leading-relaxed text-ink-500">
            Six AI systems quietly working behind every listing, search and chat — so buyers find
            things faster and sellers close deals sooner.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 70}>
              <Tilt max={7} className="h-full">
                <div className="group h-full rounded-3xl bg-white p-6 shadow-card ring-1 ring-stone-100/80 transition-shadow duration-300 hover:shadow-lift">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${f.accent}`}>
                    <f.icon size={20} />
                  </span>
                  <h3 className="mt-4 text-[16px] font-extrabold tracking-tight text-ink-900">{f.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">{f.body}</p>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------- worldwide ----------------------------- */}
      <section id="worldwide" className="relative overflow-hidden border-y border-stone-200/70 bg-gradient-to-b from-white to-stone-50 py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="aurora-blob absolute right-10 top-16 h-72 w-72 rounded-full bg-brand-200/40 blur-[100px]" />
          <div className="aurora-blob aurora-blob-2 absolute -left-16 bottom-10 h-64 w-64 rounded-full bg-accent-200/40 blur-[90px]" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <div className="drop-in tilt-scene">
              <Tilt max={9}>
                <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-lift ring-1 ring-stone-100">
                  <Image
                    src="/images/globe-3d.png"
                    alt="Locora globe — a worldwide marketplace"
                    width={1408}
                    height={768}
                    className="h-auto w-full"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink-950/80 to-transparent px-5 pb-4 pt-10">
                    <p className="text-[13px] font-extrabold tracking-tight text-white">
                      One app. Every city. 🌍
                    </p>
                    <p className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/20 backdrop-blur">
                      auto-detected
                    </p>
                  </div>
                </div>
              </Tilt>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <Badge tone="brand">Worldwide from day one</Badge>
            <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
              Your city isn&apos;t on the list?{" "}
              <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
                It doesn&apos;t need one.
              </span>
            </h2>
            <p className="mt-4 text-pretty text-[15.5px] leading-relaxed text-ink-500">
              When you join, Locora asks where you are — GPS or a quick search — and builds your
              feed around your exact city, state and country. New in town? If there&apos;s nothing
              listed yet, you&apos;ll see it plainly and get the chance to be the very first.
            </p>
            <ul className="mt-6 space-y-3.5">
              {[
                ["📍", "Exact-location onboarding", "GPS or city search — your feed is scoped to where you actually are."],
                ["🏙️", "City-first feeds", "Listings, services and requests from your city, with an “everywhere” toggle when you want the whole world."],
                ["🌱", "First-mover superpowers", "New cities show a friendly “Locora is just getting started” state — post first and own your area."],
              ].map(([emoji, title, body]) => (
                <li key={title} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-[16px] ring-1 ring-brand-100">{emoji}</span>
                  <span>
                    <span className="block text-[14px] font-extrabold text-ink-900">{title}</span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-500">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* city marquee */}
        <div className="relative mt-16 overflow-hidden" aria-hidden>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-stone-50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-stone-50 to-transparent" />
          <div className="marquee-track flex w-max items-center gap-3">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center gap-3">
                {WORLD_CITIES.map((c) => (
                  <span
                    key={`${dup}-${c}`}
                    className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-ink-600 shadow-card ring-1 ring-stone-100"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    {c}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------- how it works ------------------------- */}
      <section id="how" className="border-y border-stone-200/70 bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <Badge tone="amber">How it works</Badge>
            <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
              From “anyone selling this?” to deal done — in three steps.
            </h2>
            <ol className="mt-8 space-y-7">
              {[
                {
                  n: "01",
                  t: "Sign up free, pick your area",
                  d: "Viman Nagar, Baner, Kothrud… Locora tunes your entire feed to a 5 km radius around you.",
                },
                {
                  n: "02",
                  t: "Search, post or ask",
                  d: "Buy and sell pre-loved items, hire verified services, or post an “I'm Looking For” request and let AI do the hunting.",
                },
                {
                  n: "03",
                  t: "Chat, meet, done",
                  d: "Negotiate over real-time chat, meet at a public spot nearby, inspect the item or the work — and close the deal face to face.",
                },
              ].map((s) => (
                <li key={s.n} className="flex gap-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-950 text-[13px] font-extrabold text-brand-300">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-[16px] font-extrabold tracking-tight text-ink-900">{s.t}</h3>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              href="/login?mode=signup"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-ink-950 px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-ink-800 hover:shadow-lift active:scale-[.98]"
            >
              Create your free account <ArrowRight size={16} />
            </Link>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-brand-100/70 via-transparent to-accent-100/60 blur-2xl" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-neighbourhood.jpg"
              alt="Illustration of a vibrant Pune neighbourhood street with shops and people"
              className="relative w-full rounded-[2rem] shadow-lift ring-1 ring-stone-200/60"
            />
            <div className="absolute -bottom-5 left-5 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-lift ring-1 ring-stone-100">
              <MapPin size={15} className="text-brand-600" />
              <span className="text-[12px] font-bold text-ink-800">Hyperlocal by default</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------ I'm looking for ------------------------ */}
      <section id="looking-for" className="relative overflow-hidden bg-ink-950 py-20 sm:py-24">
        <div className="bg-grid-dark absolute inset-0 opacity-60" aria-hidden />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-brand-600/25 blur-[120px]" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-400/10 px-3.5 py-1.5 text-[12.5px] font-bold text-accent-300 ring-1 ring-accent-400/20">
              <Megaphone size={13} /> The feature OLX never built
            </span>
            <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Stop searching. Let the neighbourhood come to you.
            </h2>
            <p className="mt-3 text-pretty text-[15.5px] leading-relaxed text-white/60">
              Post what you need — an item, a plumber, a photographer. Locora AI instantly matches
              nearby sellers and providers, ranks them by distance and rating, and notifies the best
              ones for you.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
            {/* request card */}
            <div className="rounded-3xl bg-white p-5 shadow-lift">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                    style={{ background: "linear-gradient(135deg,#EC4899,#BE185D)" }}
                  >
                    IR
                  </span>
                  <div>
                    <p className="text-[13.5px] font-extrabold text-ink-900">Ishita Rao</p>
                    <p className="text-[11.5px] font-semibold text-ink-400">Kalyani Nagar · 7 min ago</p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-50 px-2 py-1 text-[10.5px] font-extrabold text-rose-600 ring-1 ring-rose-200">
                  Need it today
                </span>
              </div>
              <p className="mt-3.5 text-[15px] font-semibold leading-snug text-ink-800">
                “Need a plumber today — kitchen sink is completely blocked 🚨”
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-ink-600">🚰 Plumber</span>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-ink-600">Budget ₹600</span>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-ink-600">📍 Kalyani Nagar</span>
              </div>
            </div>

            {/* arrow */}
            <div className="hidden text-center md:block">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Sparkles size={20} className="text-brand-300" />
              </div>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-brand-300/90">
                AI matching
              </p>
            </div>

            {/* matches */}
            <div className="space-y-3">
              {[
                { name: "Rohan Sharma", sub: "4.9★ (86) · replies in ~6 min · 1.5 km", score: 96, from: "#F59E0B", to: "#D97706", init: "RS" },
                { name: "Ganesh Salunkhe", sub: "4.7★ (45) · ₹149 visit · 6.3 km", score: 88, from: "#06B6D4", to: "#0E7490", init: "GS" },
              ].map((m) => (
                <div key={m.name} className="rounded-2xl bg-white/[.06] p-4 ring-1 ring-white/10 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                      style={{ background: `linear-gradient(135deg,${m.from},${m.to})` }}
                    >
                      {m.init}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-white">
                        {m.name}
                        <BadgeCheck size={13} className="text-brand-300" />
                      </p>
                      <p className="truncate text-[11.5px] font-medium text-white/50">{m.sub}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-brand-400/15 px-2 py-1 text-[12px] font-extrabold text-brand-300">
                      {m.score}%
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-300" style={{ width: `${m.score}%` }} />
                  </div>
                </div>
              ))}
              <p className="pl-1 text-[11.5px] font-medium text-white/40">
                ✦ Both providers notified instantly. Rohan replied in 4 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------- testimonials ------------------------- */}
      <section id="safety" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="brand">Trusted by neighbours</Badge>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            Real people. Real deals. Real close by.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-3xl bg-white p-6 shadow-card ring-1 ring-stone-100/80">
              <div className="flex gap-0.5 text-accent-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <blockquote className="mt-3.5 flex-1 text-[14px] leading-relaxed text-ink-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-stone-100 pt-4">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                  style={{ background: `linear-gradient(135deg,${t.from},${t.to})` }}
                >
                  {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <div>
                  <p className="text-[13.5px] font-extrabold text-ink-900">{t.name}</p>
                  <p className="text-[11.5px] font-semibold text-ink-400">{t.detail}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* safety strip */}
        <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl bg-brand-50/60 p-6 ring-1 ring-brand-100 sm:flex-row sm:gap-5 sm:p-7">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft ring-1 ring-brand-100">
            <ShieldCheck size={22} />
          </span>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-[15.5px] font-extrabold text-ink-900">Meet first, pay after. Always.</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
              Locora has no online payments by design. Meet at a public place, inspect the item or
              the work, and pay in person. Our AI scam shield and report system keep the fraudsters out.
            </p>
          </div>
          <Link href="/login" className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-700 shadow-soft ring-1 ring-brand-100 transition hover:bg-brand-100">
            Read safety tips
          </Link>
        </div>
      </section>

      {/* ------------------------------ CTA ------------------------------ */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-14 text-center shadow-glow sm:px-12 sm:py-16">
          <div className="bg-grid-dark absolute inset-0 opacity-40" aria-hidden />
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl" aria-hidden />
          <div className="relative">
            <LogoMark size={52} className="mx-auto" />
            <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to buy smarter and sell faster?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-[15px] leading-relaxed text-brand-50/85">
              Join 12,400+ neighbours on Locora. Free forever for buyers and sellers — no commission,
              no hidden fees.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[15px] font-extrabold text-brand-700 shadow-lift transition hover:bg-brand-50 active:scale-[.98]"
              >
                Get started free <ArrowRight size={17} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-[15px] font-bold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- footer ---------------------------- */}
      <footer className="border-t border-stone-200/70 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-ink-500">
                The AI-powered hyperlocal marketplace — for every city on Earth. Buy, sell, discover services
                complete deals — in person, safely.
              </p>
              <p className="mt-5 text-[12px] font-semibold text-ink-400">
                Made with 🌱 for the whole planet · © 2026 Locora Technologies ·{" "}
                <a href="/privacy" className="underline decoration-white/30 underline-offset-2 hover:text-white">Privacy</a>
                {" · "}
                <a href="/terms" className="underline decoration-white/30 underline-offset-2 hover:text-white">Terms</a>
              </p>
            </div>
            {[
              { h: "Explore", links: ["Buy & sell", "Local services", "I'm Looking For", "Areas we cover"] },
              { h: "Company", links: ["About us", "For business", "Careers", "Press kit"] },
              { h: "Support", links: ["Help centre", "Safety tips", "Report a problem", "Terms & privacy"] },
            ].map((col) => (
              <div key={col.h}>
                <h4 className="text-[13px] font-extrabold uppercase tracking-wider text-ink-900">{col.h}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <Link href="/login" className="group inline-flex items-center gap-1 text-[13.5px] font-medium text-ink-500 transition hover:text-brand-700">
                        {l}
                        <ChevronRight size={13} className="opacity-0 transition group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
