"use client";

import * as React from "react";
import { Check, Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import { Spinner } from "@/components/ui";
import {
  browserLocate, nominatimReverse, nominatimSearch, placeLabel,
} from "@/lib/geo";
import type { LocoraLocation } from "@/lib/types";

/**
 * Worldwide location picker used in the create-listing / create-service flows.
 * Prefills with the user's browsing location; search anywhere or use GPS.
 */
export function LocationPickerField({
  value,
  onChange,
}: {
  value: LocoraLocation | null;
  onChange: (loc: LocoraLocation) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<LocoraLocation[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [openSearch, setOpenSearch] = React.useState(false);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      setResults(await nominatimSearch(q));
      setSearching(false);
    }, 550);
    return () => clearTimeout(t);
  }, [query]);

  const useGps = async () => {
    setLocating(true);
    try {
      const { lat, lng } = await browserLocate();
      const loc = await nominatimReverse(lat, lng);
      if (loc) {
        onChange(loc);
        setOpenSearch(false);
      }
    } finally {
      setLocating(false);
    }
  };

  return (
    <div>
      {value && !openSearch ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-3 ring-1 ring-stone-200">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <MapPin size={17} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-bold text-ink-900">{value.city}</span>
              <span className="block truncate text-[12px] font-medium text-ink-400">
                {[value.state, value.country].filter(Boolean).join(", ")}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 ring-1 ring-brand-100">
              <Check size={12} /> Pinned
            </span>
            <button
              type="button"
              onClick={() => setOpenSearch(true)}
              className="rounded-full px-2.5 py-1 text-[11.5px] font-bold text-ink-500 ring-1 ring-stone-200 transition hover:bg-stone-50 hover:text-ink-800"
            >
              Change
            </button>
          </span>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="relative">
            <span className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 ring-1 ring-stone-200 transition focus-within:ring-2 focus-within:ring-brand-500">
              <Search size={16} className="shrink-0 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city — e.g. Viman Nagar, Pune or Toronto…"
                className="w-full bg-transparent py-3 text-[14.5px] outline-none placeholder:text-ink-300"
              />
              {value && (
                <button
                  type="button"
                  aria-label="Keep current location"
                  onClick={() => { setOpenSearch(false); setQuery(""); }}
                  className="text-ink-300 hover:text-ink-600"
                >
                  <X size={15} />
                </button>
              )}
            </span>
            {(searching || results.length > 0) && (
              <div className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl bg-white shadow-lift ring-1 ring-stone-100">
                {searching && (
                  <p className="flex items-center gap-2 px-3.5 py-3 text-[13px] font-semibold text-ink-400">
                    <Spinner className="h-4 w-4" /> Searching…
                  </p>
                )}
                {!searching && results.map((r, i) => (
                  <button
                    type="button"
                    key={`${r.lat}-${r.lng}-${i}`}
                    onClick={() => { onChange(r); setOpenSearch(false); setQuery(""); }}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-brand-50"
                  >
                    <MapPin size={15} className="shrink-0 text-brand-500" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink-900">{r.city}</span>
                      <span className="block truncate text-[11.5px] font-medium text-ink-400">
                        {[r.state, r.country].filter(Boolean).join(", ")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={useGps}
            disabled={locating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-100 py-2.5 text-[12.5px] font-bold text-ink-600 ring-1 ring-stone-200 transition hover:bg-stone-200 disabled:opacity-60"
          >
            {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
            {locating ? "Locating…" : "Use my current location"}
          </button>
          {value && <p className="text-[11.5px] text-ink-400">Currently: {placeLabel(value)}</p>}
        </div>
      )}
    </div>
  );
}
