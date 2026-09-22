"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, IndianRupee, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { PhotoPicker, PhotoStrip, usePhotoLibrary, usePhotoUpload } from "@/components/photo-picker";
import { Badge, Button, Skeleton, TypingDots } from "@/components/ui";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { REAL_MODE } from "@/lib/supabase/config";
import { AREAS, areaLocation, areaName, isPune } from "@/lib/geo";
import { LocationPickerField } from "@/components/location-picker";
import type { LocoraLocation } from "@/lib/types";
import { inr } from "@/lib/format";
import { generateServiceProfile } from "@/lib/ai";
import { uid, useApp, useToast } from "@/lib/store";
import type { Service, ServiceCategory } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const UNITS: { id: Service["priceUnit"]; label: string }[] = [
  { id: "visit", label: "per visit" },
  { id: "hour", label: "per hour" },
  { id: "session", label: "per session" },
  { id: "event", label: "per event" },
  { id: "day", label: "per day" },
  { id: "month", label: "per month" },
  { id: "sqft", label: "per sq.ft" },
];

export default function CreateServicePage() {
  const router = useRouter();
  const { state, hydrated, currentUser, dispatch, notify } = useApp();
  const { push } = useToast();

  const [trade, setTrade] = React.useState<ServiceCategory | "">("");
  const [years, setYears] = React.useState(5);
  const [area, setArea] = React.useState("viman");
  const [location, setLocation] = React.useState<LocoraLocation | null>(null);
  const [radius, setRadius] = React.useState(8);
  const [title, setTitle] = React.useState("");
  const [tagline, setTagline] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [skills, setSkills] = React.useState<string[]>([]);
  const [startingPrice, setStartingPrice] = React.useState("");
  const [priceUnit, setPriceUnit] = React.useState<Service["priceUnit"]>("visit");
  const [days, setDays] = React.useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  const [hours, setHours] = React.useState("9:00 AM – 7:00 PM");
  const [images, setImages] = React.useState<string[]>([]);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiApplied, setAiApplied] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  const library = usePhotoLibrary(state.products, state.services);
  const uploader = usePhotoUpload(REAL_MODE ? currentUser?.id : undefined);
  const onUploadFiles = (files: File[]) => void uploader.upload(files, images, setImages);

  React.useEffect(() => {
    if (currentUser?.area) setArea(currentUser.area);
  }, [currentUser?.area]);

  React.useEffect(() => {
    if (state.browseLocation) setLocation(state.browseLocation);
  }, [state.browseLocation]);

  const runAi = async () => {
    if (!trade) {
      push({ kind: "error", title: "Pick your trade first" });
      return;
    }
    setAiBusy(true);
    setAiApplied(false);
    const p = await generateServiceProfile(trade, years, areaName(area));
    setTagline(p.tagline);
    setBio(p.bio);
    setSkills(p.skills);
    if (!startingPrice) setStartingPrice(String(p.startingPrice));
    if (!title) {
      const label = SERVICE_CATEGORIES.find((c) => c.id === trade)?.label ?? trade;
      setTitle(`${currentUser?.name ?? "My"} — ${label.replace(/s$/, "")}`);
    }
    setAiBusy(false);
    setAiApplied(true);
    push({ kind: "success", title: "AI profile ready ✨", body: "Edit anything before publishing" });
  };

  const publish = () => {
    if (!currentUser) return;
    const errs: string[] = [];
    if (!trade) errs.push("Pick your trade");
    if (title.trim().length < 4) errs.push("Add a title for your profile");
    if (bio.trim().length < 30) errs.push("Your bio needs at least 30 characters");
    if (!parseInt(startingPrice, 10)) errs.push("Set a starting price");
    if (errs.length) {
      push({ kind: "error", title: errs[0]! });
      return;
    }
    setPublishing(true);
    setTimeout(() => {
      const id = REAL_MODE && typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : uid("s");
      const daysLabel =
        days.length === 7 ? "Mon – Sun" : days.length ? `${days[0]} – ${days[days.length - 1]}` : "On request";
      const service: Service = {
        id,
        providerId: currentUser.id,
        title: title.trim(),
        category: trade as ServiceCategory,
        tagline: tagline.trim() || "Reliable work, honest pricing.",
        description: bio.trim(),
        startingPrice: parseInt(startingPrice, 10),
        priceUnit,
        area: location && !isPune(location) ? location.city : area,
        location: location ?? areaLocation(area),
        radiusKm: radius,
        images,
        rating: 0,
        reviewsCount: 0,
        jobsDone: 0,
        responseMins: 15,
        experienceYears: years,
        availability: [daysLabel, hours || "On request"],
        skills: skills.length ? skills : ["General jobs"],
        verified: false,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_SERVICE", service });
      notify({
        kind: "system",
        title: "Your service profile is live 🎉",
        body: `Neighbours near ${areaName(area)} can now find and hire you`,
        href: `/service/${id}`,
      });
      push({ kind: "success", title: "Service published 🎉", body: "You'll appear in searches near your area" });
      router.push(`/service/${id}`);
    }, 400);
  };

  if (!hydrated || !currentUser) return <Skeleton className="mx-auto mt-10 h-96 max-w-2xl rounded-3xl" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-fade-up">
        <Link href="/create" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-400 transition hover:text-ink-700">
          <ArrowLeft size={14} /> Posting options
        </Link>
        <h1 className="mt-3 text-[26px] font-extrabold tracking-tight text-ink-900">Create your service profile</h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Tell us your trade — AI writes a profile neighbours trust.
        </p>
      </div>

      {/* trade */}
      <section className="animate-fade-up rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6" style={{ animationDelay: ".05s" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-950 text-[12px] font-extrabold text-brand-300">1</span>
          <h2 className="text-[15.5px] font-extrabold text-ink-900">What do you do?</h2>
        </div>
        <div className="mt-3.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {SERVICE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setTrade(c.id)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3.5 text-[12px] font-bold ring-1 transition ${
                trade === c.id
                  ? "bg-brand-50 text-brand-800 ring-brand-300"
                  : "bg-stone-50 text-ink-600 ring-stone-200 hover:ring-stone-300"
              }`}
            >
              <span className="text-2xl">{c.emoji}</span>
              {c.label.replace(" & Appliance Repair", " Repair").replace("Cooks & Tiffins", "Cooks")}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-extrabold uppercase tracking-wide text-ink-400">Experience</span>
            <select
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full appearance-none rounded-xl bg-stone-50 px-3 py-2.5 text-[13.5px] font-semibold outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-brand-500"
            >
              {[1, 2, 3, 5, 8, 10, 15, 20].map((y) => (
                <option key={y} value={y}>{y}+ years</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-extrabold uppercase tracking-wide text-ink-400">Based in</span>
            {location && !isPune(location) ? (
              <div className="rounded-xl bg-stone-50 p-1 ring-1 ring-stone-200">
                <LocationPickerField
                  value={location}
                  onChange={(loc) => {
                    setLocation(loc);
                    setArea(loc.city);
                  }}
                />
              </div>
            ) : (
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full appearance-none rounded-xl bg-stone-50 px-3 py-2.5 text-[13.5px] font-semibold outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-brand-500"
              >
                {AREAS.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}
          </label>
        </div>
        <label className="mt-4 block">
          <span className="mb-1.5 flex items-center justify-between text-[11.5px] font-extrabold uppercase tracking-wide text-ink-400">
            <span>How far will you travel?</span>
            <span className="text-brand-700">{radius} km around {areaName(area)}</span>
          </span>
          <input
            type="range"
            min={2}
            max={25}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </label>
      </section>

      {/* AI profile */}
      <section className="animate-fade-up rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6" style={{ animationDelay: ".1s" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-950 text-[12px] font-extrabold text-brand-300">2</span>
          <h2 className="text-[15.5px] font-extrabold text-ink-900">Your profile</h2>
          {aiApplied && <Badge tone="brand"><Sparkles size={10} /> AI drafted</Badge>}
        </div>
        <div className="mt-3.5">
          <Button onClick={runAi} loading={aiBusy} disabled={!trade}>
            {!aiBusy && <Wand2 size={16} />} {aiApplied ? "Regenerate with AI" : "Write my profile with AI"}
          </Button>
        </div>
        {aiBusy && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-50/70 px-4 py-3.5 ring-1 ring-brand-100">
            <Sparkles size={15} className="animate-pulse text-brand-600" />
            <p className="text-[13px] font-semibold text-brand-800">
              Locora AI is crafting your profile <TypingDots className="text-brand-500" />
            </p>
          </div>
        )}
        {aiApplied && !aiBusy && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-brand-50/70 px-4 py-3 ring-1 ring-brand-100">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-600" />
            <p className="text-[12.5px] font-semibold leading-snug text-brand-800">
              AI applied a tagline, bio and skill set tuned to your trade and area. Edit freely below.
            </p>
          </div>
        )}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Profile title — e.g. Priya Desai — Maths Tutor"
          className="mt-4 w-full rounded-xl bg-stone-50 px-3.5 py-3 text-[14.5px] font-semibold outline-none ring-1 ring-stone-200 placeholder:font-normal placeholder:text-ink-300 focus:ring-2 focus:ring-brand-500"
        />
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Tagline — one line neighbours see first"
          className="mt-3 w-full rounded-xl bg-stone-50 px-3.5 py-3 text-[14px] font-semibold italic outline-none ring-1 ring-stone-200 placeholder:font-normal placeholder:text-ink-300 focus:ring-2 focus:ring-brand-500"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={6}
          placeholder="About your work — experience, how you price, why neighbours should hire you…"
          className="mt-3 w-full resize-none rounded-xl bg-stone-50 px-3.5 py-3 text-[13.5px] leading-relaxed outline-none ring-1 ring-stone-200 placeholder:text-ink-300 focus:ring-2 focus:ring-brand-500"
        />
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink-300">Skills</span>
            {skills.map((s) => (
              <Badge key={s} tone="sky">{s}</Badge>
            ))}
          </div>
        )}
      </section>

      {/* pricing & availability */}
      <section className="animate-fade-up rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6" style={{ animationDelay: ".15s" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-950 text-[12px] font-extrabold text-brand-300">3</span>
          <h2 className="text-[15.5px] font-extrabold text-ink-900">Pricing & availability</h2>
        </div>
        <div className="mt-3.5 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-xl bg-stone-50 px-3.5 py-3 ring-1 ring-stone-200 focus-within:ring-2 focus-within:ring-brand-500">
            <span className="text-[13px] font-bold text-ink-400">from ₹</span>
            <input
              inputMode="numeric"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="499"
              className="w-24 bg-transparent text-[16px] font-extrabold outline-none"
            />
          </label>
          <select
            value={priceUnit}
            onChange={(e) => setPriceUnit(e.target.value as Service["priceUnit"])}
            className="appearance-none rounded-xl bg-stone-50 px-3 py-3 text-[13.5px] font-semibold outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-brand-500"
          >
            {UNITS.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 mb-1.5 text-[11.5px] font-extrabold uppercase tracking-wide text-ink-400">Available days</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))}
              className={`rounded-full px-3.5 py-2 text-[12.5px] font-bold ring-1 transition ${
                days.includes(d) ? "bg-brand-50 text-brand-700 ring-brand-300" : "bg-stone-50 text-ink-400 ring-stone-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <input
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="e.g. 9:00 AM – 7:00 PM"
          className="mt-3.5 w-full rounded-xl bg-stone-50 px-3.5 py-3 text-[14px] outline-none ring-1 ring-stone-200 placeholder:text-ink-300 focus:ring-2 focus:ring-brand-500"
        />
      </section>

      {/* portfolio */}
      <section className="animate-fade-up rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6" style={{ animationDelay: ".2s" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-950 text-[12px] font-extrabold text-brand-300">4</span>
          <h2 className="text-[15.5px] font-extrabold text-ink-900">Work photos</h2>
          <Badge tone="stone">optional</Badge>
        </div>
        <div className="mt-3.5">
          <PhotoStrip
            images={images}
            onUploadFiles={REAL_MODE ? onUploadFiles : undefined}
            uploading={uploader.busy}
            onAdd={() => setPickerOpen(true)}
            onRemove={(img) => setImages((prev) => prev.filter((x) => x !== img))}
            placeholder="🛠️"
          />
        </div>
        <PhotoPicker
          onUploadFiles={REAL_MODE ? onUploadFiles : undefined}
          uploading={uploader.busy}
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          library={library}
          selected={images}
          onChange={setImages}
          max={4}
          title="Pick your work photos"
        />
      {uploader.editorNode}
      </section>

      <div className="animate-fade-up flex flex-col items-center gap-3 pb-4" style={{ animationDelay: ".25s" }}>
        <Button size="lg" className="w-full sm:w-auto sm:px-14" onClick={publish} loading={publishing}>
          <ShieldCheck size={17} /> Publish service profile
        </Button>
        <p className="text-[12px] font-semibold text-ink-400">
          Tip: profiles with work photos get 3× more quote requests
        </p>
      </div>
    </div>
  );
}
