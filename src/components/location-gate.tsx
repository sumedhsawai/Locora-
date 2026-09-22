"use client";

import * as React from "react";
import { Crosshair, Loader2, MapPin, Search, Sparkles, X } from "lucide-react";
import { LogoMark } from "@/components/brand";
import { Spinner } from "@/components/ui";
import { useApp, useToast } from "@/lib/store";
import { REAL_MODE } from "@/lib/supabase/config";
import { supabase } from "@/lib/supabase/client";
import {
  PUNE, browserLocate, nominatimReverse, nominatimSearch, placeLabel,
} from "@/lib/geo";
import type { LocoraLocation } from "@/lib/types";

/**
 * Worldwide location onboarding. Shown over the app until the user picks
 * where they are (GPS or search). Re-openable any time via SET_LOCATION null
 * (the navbar city chip does this).
 */
export function LocationGate() {
  const { state, dispatch, hydrated } = useApp();
  const { push } = useToast();

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<LocoraLocation[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [locating, setLocating] = React.useState(false);

  const open = hydrated && !state.browseLocation;
  const auto = state.autoLocate;

  // opted-in users: start GPS detection the moment the gate appears
  const autoTried = React.useRef(false);
  React.useEffect(() => {
    if (!open || !auto || autoTried.current || locating) return;
    autoTried.current = true;
    void useGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, auto]);

  // opted-in users with a saved location: silently re-check once per browser
  // session and follow them if they've moved to a different city
  React.useEffect(() => {
    if (!hydrated || !state.browseLocation || !auto) return;
    if (sessionStorage.getItem("locora:autoloc") === "1") return;
    sessionStorage.setItem("locora:autoloc", "1");
    let dead = false;
    void (async () => {
      try {
        const { lat, lng } = await browserLocate();
        const loc = await nominatimReverse(lat, lng);
        if (dead || !loc) return;
        if (loc.city !== state.browseLocation?.city) {
          dispatch({ type: "SET_LOCATION", location: loc });
          push({ kind: "success", title: `📍 Location updated to ${placeLabel(loc)}` });
        }
      } catch {
        /* silent — keep the last known location */
      }
    })();
    return () => {
      dead = true;
    };
  }, [hydrated, state.browseLocation, auto, dispatch, push]);

  const choose = React.useCallback(
    async (loc: LocoraLocation) => {
      dispatch({ type: "SET_LOCATION", location: loc });
      push({ kind: "success", title: `Welcome to Locora ${placeLabel(loc)}! 🌍` });
      // persist to the real profile when signed in with Supabase
      if (REAL_MODE) {
        const sb = supabase();
        const me = state.sessionUserId;
        if (sb && me) {
          void sb
            .from("profiles")
            .update({ city: loc.city, state: loc.state, country: loc.country, lat: loc.lat, lng: loc.lng })
            .eq("id", me)
            .then(undefined, () => undefined);
        }
      }
    },
    [dispatch, push, state.sessionUserId]
  );

  const useGps = async () => {
    setLocating(true);
    try {
      const { lat, lng } = await browserLocate();
      const loc = await nominatimReverse(lat, lng);
      if (loc) await choose(loc);
      else throw new Error("could not name this place");
    } catch (e) {
      push({
        kind: "error",
        title: "Couldn't pin your location",
        body: e instanceof Error && /denied|permission/i.test(e.message)
          ? "Location permission was blocked — search for your city below instead."
          : "No worries — search for your city below instead.",
      });
    } finally {
      setLocating(false);
    }
  };

  // debounced worldwide search
  React.useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const found = await nominatimSearch(q);
      setResults(found);
      setSearching(false);
    }, 550);
    return () => clearTimeout(t);
  }, [query, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-950/95 px-4 py-8 backdrop-blur-sm">
      {/* animated aurora backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="aurora-blob absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand-500/30 blur-[110px]" />
        <div className="aurora-blob aurora-blob-2 absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-teal-400/20 blur-[100px]" />
        <div className="aurora-blob aurora-blob-3 absolute left-1/3 -top-24 h-72 w-72 rounded-full bg-accent-400/15 blur-[90px]" />
      </div>

      <div className="reveal-up relative w-full max-w-lg rounded-3xl bg-white/95 p-7 shadow-2xl ring-1 ring-white/40 sm:p-9">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={54} className="drop-shadow-lg" />
          <h2 className="mt-4 text-[24px] font-extrabold tracking-tight text-ink-900 sm:text-[27px]">
            Where are you?
          </h2>
          <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-ink-500">
            Locora works <span className="font-bold text-ink-800">anywhere in the world</span>. Pick
            your city and we&apos;ll show you listings, services and people right around you.
          </p>
        </div>

        <button
          onClick={useGps}
          disabled={locating}
          className="group mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-[14.5px] font-bold text-white shadow-soft transition hover:shadow-lift disabled:opacity-70"
        >
          {locating ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={18} className="transition-transform group-hover:rotate-90" />}
          {locating ? "Finding you…" : "Use my current location"}
        </button>

        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 text-[12.5px] font-semibold text-ink-500 select-none">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => dispatch({ type: "SET_AUTO_LOCATE", value: e.target.checked })}
            className="h-4 w-4 accent-brand-600"
          />
          Detect my location automatically from now on
        </label>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-stone-200" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400">or search</span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <div className="relative">
          <span className="flex items-center gap-2.5 rounded-2xl bg-stone-50 px-4 ring-1 ring-stone-200 transition focus-within:ring-2 focus-within:ring-brand-500">
            <Search size={17} className="shrink-0 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="City, state or country — e.g. Pune, Berlin, Austin…"
              className="w-full bg-transparent py-3.5 text-[14.5px] outline-none placeholder:text-ink-300"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="text-ink-300 hover:text-ink-600">
                <X size={15} />
              </button>
            )}
          </span>

          {(searching || results.length > 0) && (
            <div className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-stone-100">
              {searching && (
                <p className="flex items-center gap-2 px-4 py-3.5 text-[13px] font-semibold text-ink-400">
                  <Spinner className="h-4 w-4" /> Searching the world…
                </p>
              )}
              {!searching &&
                results.map((r, i) => (
                  <button
                    key={`${r.lat}-${r.lng}-${i}`}
                    onClick={() => choose(r)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-brand-50"
                  >
                    <MapPin size={16} className="shrink-0 text-brand-500" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-bold text-ink-900">{r.city}</span>
                      <span className="block truncate text-[12px] font-medium text-ink-400">
                        {[r.state, r.country].filter(Boolean).join(", ")}
                      </span>
                    </span>
                  </button>
                ))}
              {!searching && results.length === 0 && query.trim().length >= 3 && (
                <p className="px-4 py-3.5 text-[13px] font-medium text-ink-400">
                  No match — try a bigger city nearby or check the spelling.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11.5px] font-bold uppercase tracking-wide text-ink-400">Try:</span>
          <button
            onClick={() => choose(PUNE)}
            className="rounded-full bg-brand-50 px-3.5 py-1.5 text-[12px] font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
          >
            Pune, India
          </button>
          <button
            onClick={() => { setQuery("Mumbai"); }}
            className="rounded-full bg-stone-100 px-3.5 py-1.5 text-[12px] font-bold text-ink-600 ring-1 ring-stone-200 transition hover:bg-stone-200"
          >
            Mumbai
          </button>
          <button
            onClick={() => { setQuery("London"); }}
            className="rounded-full bg-stone-100 px-3.5 py-1.5 text-[12px] font-bold text-ink-600 ring-1 ring-stone-200 transition hover:bg-stone-200"
          >
            London
          </button>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11.5px] font-medium text-ink-400">
          <Sparkles size={12} className="text-brand-500" />
          New here? Locora may be just getting started in your city — you could be one of the first.
        </p>
      </div>
    </div>
  );
}
