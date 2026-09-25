"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, IndianRupee, ShieldAlert, ShieldCheck, Sparkles, Wand2,
} from "lucide-react";
import { PhotoPicker, PhotoStrip, usePhotoLibrary, usePhotoUpload } from "@/components/photo-picker";
import { Badge, Button, Skeleton, TypingDots } from "@/components/ui";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { REAL_MODE } from "@/lib/supabase/config";
import { AREAS, areaLocation, areaName, isPune } from "@/lib/geo";
import { LocationPickerField } from "@/components/location-picker";
import type { LocoraLocation } from "@/lib/types";
import { inr } from "@/lib/format";
import {
  generateListingDraft, parseSearchQuery, scamCheck, suggestPrice,
  type ListingDraft, type PriceSuggestion, type ScamCheck,
} from "@/lib/ai";
import { uid, useApp, useToast } from "@/lib/store";
import type { Condition, PriceCheckLabel, Product, ProductCategory } from "@/lib/types";

const CONDITIONS: { id: Condition; label: string; hint: string }[] = [
  { id: "new", label: "Brand new", hint: "Unused, sealed" },
  { id: "like-new", label: "Like new", hint: "Barely used" },
  { id: "good", label: "Good", hint: "Normal wear" },
  { id: "fair", label: "Fair", hint: "Visible wear" },
];

export default function CreateListingPage() {
  return (
    <React.Suspense fallback={<Skeleton className="mx-auto mt-10 h-96 max-w-2xl rounded-3xl" />}>
      <CreateListingInner />
    </React.Suspense>
  );
}

function CreateListingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");
  const { state, hydrated, currentUser, dispatch, notify } = useApp();
  const { push } = useToast();

  const [raw, setRaw] = React.useState("");
  const [category, setCategory] = React.useState<ProductCategory | "">("");
  const [condition, setCondition] = React.useState<Condition>("good");
  const [ageYears, setAgeYears] = React.useState(1);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [price, setPrice] = React.useState("");
  const [negotiable, setNegotiable] = React.useState(true);
  const [area, setArea] = React.useState("viman");
  const [location, setLocation] = React.useState<LocoraLocation | null>(null);
  const [images, setImages] = React.useState<string[]>([]);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [draft, setDraft] = React.useState<ListingDraft | null>(null);
  const [suggestion, setSuggestion] = React.useState<PriceSuggestion | null>(null);
  const [suggestBusy, setSuggestBusy] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [scamBlock, setScamBlock] = React.useState<ScamCheck | null>(null);

  const library = usePhotoLibrary(state.products, state.services);
  const uploader = usePhotoUpload(REAL_MODE ? currentUser?.id : undefined);
  const onUploadFiles = (files: File[]) => void uploader.upload(files, images, setImages);

  React.useEffect(() => {
    if (currentUser?.area) setArea(currentUser.area);
  }, [currentUser?.area]);

  React.useEffect(() => {
    if (state.browseLocation) setLocation(state.browseLocation);
  }, [state.browseLocation]);

  /* -------- edit mode: prefill from the existing listing -------- */
  const editing = editId ? state.products.find((p) => p.id === editId && p.sellerId === currentUser?.id) : undefined;
  const prefilled = React.useRef(false);
  React.useEffect(() => {
    if (!editing || prefilled.current) return;
    prefilled.current = true;
    setCategory(editing.category);
    setCondition(editing.condition);
    setAgeYears(editing.ageYears ?? 1);
    setTitle(editing.title);
    setDescription(editing.description);
    setTags(editing.aiTags);
    setPrice(String(editing.price));
    setNegotiable(editing.negotiable);
    setArea(editing.area);
    if (editing.location) setLocation(editing.location);
    setImages(editing.images);
  }, [editing]);

  /* -------- AI listing generator -------- */
  const runAi = async () => {
    if (raw.trim().length < 6) {
      push({ kind: "error", title: "Tell the AI a little more first", body: "e.g. “selling my 2-year-old iPhone 13, with box and bill”" });
      return;
    }
    setAiBusy(true);
    setDraft(null);
    const [d, parse] = await Promise.all([
      generateListingDraft(raw, ageYears),
      parseSearchQuery(raw),
    ]);
    setDraft(d);
    setTitle(d.title);
    setDescription(d.description);
    setTags(d.tags);
    if (!category && parse.kind === "product" && parse.category) setCategory(parse.category as ProductCategory);
    if (!price) {
      const mid = Math.round((d.priceRange.min + d.priceRange.max) / 2 / 100) * 100;
      setPrice(String(mid));
    }
    setAiBusy(false);
    push({ kind: "success", title: "AI draft ready ✨", body: "Edit anything before publishing" });
  };

  /* -------- price suggestion (debounced) -------- */
  React.useEffect(() => {
    const p = parseInt(price, 10);
    if (!p || p < 100 || !category || !title) {
      setSuggestion(null);
      return;
    }
    setSuggestBusy(true);
    const t = setTimeout(async () => {
      const s = await suggestPrice(
        { title, category, condition, price: p, ageYears },
        state.products
      );
      setSuggestion(s);
      setSuggestBusy(false);
    }, 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price, category, condition, title]);

  /* -------- publish -------- */
  const medianPrice = React.useMemo(() => {
    const ps = state.products.filter((x) => x.category === category && !x.flagged).map((x) => x.price).sort((a, b) => a - b);
    return ps.length ? ps[Math.floor(ps.length / 2)]! : undefined;
  }, [state.products, category]);

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!category) errs.push("Pick a category");
    if (title.trim().length < 6) errs.push("Title needs at least 6 characters");
    if (description.trim().length < 20) errs.push("Description needs at least 20 characters");
    if (!parseInt(price, 10)) errs.push("Set a price");
    return errs;
  };

  const doPublish = () => {
    if (!currentUser) return;
    const p = parseInt(price, 10);
    const id = REAL_MODE && typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : uid("p");
    const shared = {
      title: title.trim(),
      description: description.trim(),
      price: p,
      negotiable,
      category: category as ProductCategory,
      condition,
      ageYears,
      images,
      area: location && !isPune(location) ? location.city : area,
      location: location ?? areaLocation(area),
      aiTags: tags,
      priceCheck: suggestion
        ? { label: suggestion.verdict.label as PriceCheckLabel, deltaPct: suggestion.verdict.deltaPct, comparables: suggestion.comparables.length || 6 }
        : { label: "fair" as PriceCheckLabel, deltaPct: 0, comparables: 6 },
    };

    if (editing) {
      dispatch({ type: "UPDATE_PRODUCT", id: editing.id, patch: shared });
      push({ kind: "success", title: "Listing updated ✓", body: "Your changes are live" });
      router.push(`/product/${editing.id}`);
      return;
    }

    const product: Product = {
      id,
      sellerId: currentUser.id,
      createdAt: new Date().toISOString(),
      views: 1,
      favorites: 0,
      status: "active",
      ...shared,
    };
    dispatch({ type: "ADD_PRODUCT", product });
    notify({
      kind: "system",
      title: "Your ad is live 🎉",
      body: `${product.title} is now visible to buyers near ${location && !isPune(location) ? location.city : areaName(area)}`,
      href: `/product/${id}`,
    });
    push({ kind: "success", title: "Ad published 🎉", body: "AI scam shield cleared it — you're live" });
    router.push(`/product/${id}`);
  };

  const publish = async () => {
    const errs = validate();
    if (errs.length) {
      push({ kind: "error", title: errs[0]! });
      return;
    }
    setPublishing(true);
    const check = await scamCheck({
      title: title.trim(),
      description: description.trim(),
      price: parseInt(price, 10),
      category: category as ProductCategory,
      medianPrice,
    });
    setPublishing(false);
    if (check.level === "high") {
      setScamBlock(check);
      return;
    }
    if (check.level === "medium") {
      push({ kind: "info", title: "AI noted some risk signals", body: "Published — keep the chat on Locora and avoid advance payments" });
    }
    doPublish();
  };

  if (!hydrated || !currentUser) return <Skeleton className="mx-auto mt-10 h-96 max-w-2xl rounded-3xl" />;

  const priceNum = parseInt(price, 10) || 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-fade-up">
        <Link href="/create" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-400 transition hover:text-ink-700">
          <ArrowLeft size={14} /> Posting options
        </Link>
        <h1 className="mt-3 text-[26px] font-extrabold tracking-tight text-ink-900">
          {editing ? "Edit your listing" : "Post your ad"}
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          {editing
            ? "Update anything — photos, price, description. Changes go live instantly."
            : "Describe it in your words — Locora AI turns it into a polished listing."}
        </p>
      </div>

      {/* ---------- step 1: AI ---------- */}
      <section className="animate-fade-up rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6" style={{ animationDelay: ".05s" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-950 text-[12px] font-extrabold text-brand-300">1</span>
          <h2 className="text-[15.5px] font-extrabold text-ink-900">What are you selling?</h2>
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={2}
          placeholder="e.g. selling my 2-year-old iPhone 13, with box and bill, battery 89%"
          className="mt-3.5 w-full resize-none rounded-xl bg-stone-50 px-3.5 py-3 text-[14px] leading-relaxed outline-none ring-1 ring-stone-200 placeholder:text-ink-300 focus:ring-2 focus:ring-brand-500"
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block sm:col-span-1">
            <span className="mb-1 block text-[11.5px] font-extrabold uppercase tracking-wide text-ink-400">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="w-full appearance-none rounded-xl bg-stone-50 px-3 py-2.5 text-[13.5px] font-semibold outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select…</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-1 block text-[11.5px] font-extrabold uppercase tracking-wide text-ink-400">Age</span>
            <select
              value={ageYears}
              onChange={(e) => setAgeYears(Number(e.target.value))}
              className="w-full appearance-none rounded-xl bg-stone-50 px-3 py-2.5 text-[13.5px] font-semibold outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-brand-500"
            >
              {[0, 0.5, 1, 2, 3, 4, 5, 6, 8, 10].map((y) => (
                <option key={y} value={y}>{y === 0 ? "New" : `${y} year${y > 1 ? "s" : ""}`}</option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-1">
            <span className="mb-1 block text-[11.5px] font-extrabold uppercase tracking-wide text-ink-400">Condition</span>
            <div className="flex gap-1.5">
              {CONDITIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCondition(c.id)}
                  title={c.hint}
                  className={`flex-1 rounded-xl px-1 py-2.5 text-[11.5px] font-bold ring-1 transition ${
                    condition === c.id ? "bg-brand-50 text-brand-700 ring-brand-300" : "bg-stone-50 text-ink-500 ring-stone-200 hover:ring-stone-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button onClick={runAi} loading={aiBusy}>
            {!aiBusy && <Wand2 size={16} />} Generate with AI
          </Button>
          {draft && (
            <Button variant="ghost" onClick={runAi} disabled={aiBusy}>
              ↻ Regenerate
            </Button>
          )}
        </div>
        {aiBusy && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-50/70 px-4 py-3.5 ring-1 ring-brand-100">
            <Sparkles size={15} className="animate-pulse text-brand-600" />
            <p className="text-[13px] font-semibold text-brand-800">
              Locora AI is writing your listing <TypingDots className="text-brand-500" />
            </p>
          </div>
        )}
        {draft && !aiBusy && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-brand-50/70 px-4 py-3 ring-1 ring-brand-100">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-600" />
            <p className="text-[12.5px] font-semibold leading-snug text-brand-800">
              AI draft applied — {draft.confidence}% confidence. {draft.note} Edit freely below.
            </p>
          </div>
        )}
      </section>

      {/* ---------- step 2: photos ---------- */}
      <section className="animate-fade-up rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6" style={{ animationDelay: ".1s" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-950 text-[12px] font-extrabold text-brand-300">2</span>
          <h2 className="text-[15.5px] font-extrabold text-ink-900">Photos</h2>
          <Badge tone="stone">optional</Badge>
        </div>
        <p className="mt-2 text-[12.5px] text-ink-400">Ads with photos get 5× more chats. Pick from your library.</p>
        <div className="mt-3.5">
          <PhotoStrip
            images={images}
            onUploadFiles={REAL_MODE ? onUploadFiles : undefined}
            uploading={uploader.busy}
            onAdd={() => setPickerOpen(true)}
            onRemove={(img) => setImages((prev) => prev.filter((x) => x !== img))}
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
          title="Pick photos for your ad"
        />
      {uploader.editorNode}
      </section>

      {/* ---------- step 3: title & description ---------- */}
      <section className="animate-fade-up rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6" style={{ animationDelay: ".15s" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-950 text-[12px] font-extrabold text-brand-300">3</span>
          <h2 className="text-[15.5px] font-extrabold text-ink-900">Title & description</h2>
          {draft && <Badge tone="brand"><Sparkles size={10} /> AI drafted</Badge>}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={64}
          placeholder="e.g. iPhone 13 · 128GB · Midnight"
          className="mt-3.5 w-full rounded-xl bg-stone-50 px-3.5 py-3 text-[14.5px] font-semibold outline-none ring-1 ring-stone-200 placeholder:font-normal placeholder:text-ink-300 focus:ring-2 focus:ring-brand-500"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Honest details help it sell faster — condition, accessories, reason for selling…"
          className="mt-3 w-full resize-none rounded-xl bg-stone-50 px-3.5 py-3 text-[13.5px] leading-relaxed outline-none ring-1 ring-stone-200 placeholder:text-ink-300 focus:ring-2 focus:ring-brand-500"
        />
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink-300">Tags</span>
            {tags.map((t) => (
              <Badge key={t} tone="sky">{t}</Badge>
            ))}
          </div>
        )}
      </section>

      {/* ---------- step 4: price ---------- */}
      <section className="animate-fade-up rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6" style={{ animationDelay: ".2s" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-950 text-[12px] font-extrabold text-brand-300">4</span>
          <h2 className="text-[15.5px] font-extrabold text-ink-900">Price</h2>
        </div>
        <div className="mt-3.5 flex items-center gap-4">
          <label className="flex items-center gap-2 rounded-xl bg-stone-50 px-3.5 py-3 ring-1 ring-stone-200 focus-within:ring-2 focus-within:ring-brand-500">
            <IndianRupee size={16} className="text-ink-400" />
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
              className="w-32 bg-transparent text-[16px] font-extrabold outline-none"
            />
          </label>
          <button
            onClick={() => setNegotiable((n) => !n)}
            className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-bold ring-1 transition ${
              negotiable ? "bg-brand-50 text-brand-700 ring-brand-200" : "bg-stone-50 text-ink-400 ring-stone-200"
            }`}
          >
            <span className={`h-3.5 w-3.5 rounded-full border-[3px] transition ${negotiable ? "border-brand-600 bg-brand-100" : "border-stone-300"}`} />
            Slightly negotiable
          </button>
        </div>

        {suggestBusy && (
          <div className="mt-4 flex items-center gap-2.5 text-[12.5px] font-semibold text-ink-400">
            <Sparkles size={13} className="animate-pulse text-brand-500" /> AI is comparing nearby listings…
          </div>
        )}
        {suggestion && !suggestBusy && (
          <div className="mt-4 rounded-2xl bg-accent-50/60 p-4 ring-1 ring-accent-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-accent-800">
                <Sparkles size={14} /> AI suggests {inr(suggestion.fair)} for this
              </p>
              <Badge tone={suggestion.verdict.label === "great" ? "brand" : suggestion.verdict.label === "high" ? "rose" : "amber"}>
                your price: {suggestion.verdict.label === "great" ? "below market" : suggestion.verdict.label === "high" ? `${suggestion.verdict.deltaPct}% above market` : "in the right zone"}
              </Badge>
            </div>
            {/* range bar */}
            <div className="mt-3.5">
              <div className="relative h-2.5 rounded-full bg-gradient-to-r from-brand-300 via-accent-300 to-rose-300">
                <span
                  className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-ink-900 shadow-lift"
                  style={{
                    left: `${Math.max(2, Math.min(98, ((priceNum - suggestion.low) / Math.max(1, suggestion.high - suggestion.low)) * 100))}%`,
                  }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] font-bold text-ink-400">
                <span>{inr(suggestion.low)}</span>
                <span>{inr(suggestion.high)}</span>
              </div>
            </div>
            {suggestion.comparables.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-accent-200/60 pt-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-accent-700/70">Compared with</p>
                {suggestion.comparables.map((c) => (
                  <p key={c.title} className="flex items-center justify-between text-[12px] font-semibold text-ink-600">
                    <span className="truncate">{c.title}</span>
                    <span className="ml-2 shrink-0 text-ink-800">{inr(c.price)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ---------- step 5: location ---------- */}
      <section className="animate-fade-up rounded-3xl bg-white p-5 shadow-card ring-1 ring-stone-100/70 sm:p-6" style={{ animationDelay: ".25s" }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-950 text-[12px] font-extrabold text-brand-300">5</span>
          <h2 className="text-[15.5px] font-extrabold text-ink-900">Where are you?</h2>
        </div>
        {location && !isPune(location) ? (
          <div className="mt-3.5">
            <LocationPickerField
              value={location}
              onChange={(loc) => {
                setLocation(loc);
                setArea(loc.city);
              }}
            />
          </div>
        ) : (
        <div className="mt-3.5 flex flex-wrap gap-2">
          {AREAS.slice(0, 12).map((a) => (
            <button
              key={a.id}
              onClick={() => setArea(a.id)}
              className={`rounded-full px-3.5 py-2 text-[12.5px] font-bold ring-1 transition ${
                area === a.id ? "bg-ink-950 text-white ring-ink-950" : "bg-stone-50 text-ink-600 ring-stone-200 hover:ring-stone-300"
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
        )}
      </section>

      {/* ---------- publish ---------- */}
      <div className="animate-fade-up flex flex-col items-center gap-3 pb-4" style={{ animationDelay: ".3s" }}>
        <Button size="lg" className="w-full sm:w-auto sm:px-14" onClick={publish} loading={publishing}>
          <ShieldCheck size={17} /> {editing ? "Save changes" : "Publish ad"}
        </Button>
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-400">
          <ShieldCheck size={13} className="text-brand-600" /> AI scam shield runs before your ad goes live
        </p>
      </div>

      {/* ---------- scam block modal ---------- */}
      {scamBlock && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-[3px]" />
          <div className="relative w-full max-w-md animate-pop rounded-3xl bg-white p-6 shadow-lift">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <ShieldAlert size={24} />
            </span>
            <h2 className="mt-4 text-[18px] font-extrabold text-ink-900">Hold on — risk score {scamBlock.score}/100</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
              Locora AI found patterns that look like a scam listing. Buyers will see a big warning — and it may be
              removed by moderators.
            </p>
            <ul className="mt-3.5 space-y-2">
              {scamBlock.flags.map((f) => (
                <li key={f} className="flex items-start gap-2 rounded-xl bg-rose-50/70 px-3 py-2 text-[12.5px] font-semibold text-rose-700">
                  <span className="mt-0.5">•</span> {f}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2.5">
              <Button variant="secondary" className="flex-1" onClick={() => setScamBlock(null)}>
                Edit listing
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => { setScamBlock(null); doPublish(); }}>
                Publish anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
