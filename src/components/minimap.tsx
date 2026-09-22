"use client";

/* ------------------------------------------------------------------ */
/*  Locora — MiniMap                                                  */
/*  Lightweight slippy-map built from OpenStreetMap tiles — no API    */
/*  key needed. In production this is swapped for Mapbox GL with      */
/*  geocoding + live user location.                                   */
/* ------------------------------------------------------------------ */

import * as React from "react";
import { MapPin } from "lucide-react";

const Z = 13;
const TILE = 256;

function lngToTileX(lng: number) {
  return ((lng + 180) / 360) * 2 ** Z;
}
function latToTileY(lat: number) {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** Z;
}

export function MiniMap({
  lat,
  lng,
  radiusKm,
  label,
  className = "h-60",
}: {
  lat: number;
  lng: number;
  radiusKm?: number;
  label?: string;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 via-brand-50 to-accent-50 ${className}`}>
        <div className="bg-dots absolute inset-0" aria-hidden />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-600 shadow-soft ring-1 ring-brand-100">
            <MapPin size={20} />
          </span>
          {label && <p className="px-6 text-[13px] font-bold text-ink-700">{label}</p>}
        </div>
      </div>
    );
  }

  const xf = lngToTileX(lng);
  const yf = latToTileY(lat);
  const x0 = Math.floor(xf) - 1;
  const y0 = Math.floor(yf) - 1;

  // metres per pixel at this latitude/zoom (Web Mercator)
  const res = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** Z;
  const circlePx = radiusKm ? Math.min(520, Math.round((radiusKm * 2000) / res)) : 0;

  const tiles: React.ReactNode[] = [];
  for (let dx = 0; dx < 3; dx++) {
    for (let dy = 0; dy < 3; dy++) {
      const tx = x0 + dx;
      const ty = y0 + dy;
      if (ty < 0 || ty >= 2 ** Z) continue;
      tiles.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${tx}-${ty}`}
          src={`https://tile.openstreetmap.org/${Z}/${tx}/${ty}.png`}
          alt=""
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className="pointer-events-none absolute h-[256px] w-[256px] select-none"
          style={{ left: dx * TILE, top: dy * TILE }}
        />
      );
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-stone-200/70 ${className}`} aria-label={label ?? "Map"}>
      <div className="absolute left-1/2 top-1/2" style={{ transform: `translate(${-(xf - x0) * TILE}px, ${-(yf - y0) * TILE}px)` }}>
        <div className="relative" style={{ width: TILE * 3, height: TILE * 3 }}>
          {tiles}
          {circlePx > 0 && (
            <span
              className="absolute rounded-full bg-brand-500/15 ring-2 ring-brand-500/45"
              style={{
                width: circlePx,
                height: circlePx,
                left: (xf - x0) * TILE - circlePx / 2,
                top: (yf - y0) * TILE - circlePx / 2,
              }}
            />
          )}
        </div>
      </div>
      {/* pin at exact centre */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-[92%]">
        <span className="animate-pop flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-lift ring-4 ring-white">
          <MapPin size={17} />
        </span>
      </div>
      {label && (
        <span className="absolute bottom-2.5 left-2.5 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink-700 shadow-soft backdrop-blur">
          {label}
        </span>
      )}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-1 right-1.5 z-10 text-[8.5px] font-semibold text-ink-500/80 hover:text-ink-700"
      >
        © OpenStreetMap
      </a>
    </div>
  );
}
