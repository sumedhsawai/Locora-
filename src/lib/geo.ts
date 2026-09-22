/* ------------------------------------------------------------------ */
/*  Locora — geography (worldwide)                                     */
/*  MVP city: Pune. Each area carries approximate lat/lng used for    */
/*  distance ranking (I'm-Looking-For matching, "near me" sorting).   */
/*  Swap for Mapbox geocoding + PostGIS in production.                */
/* ------------------------------------------------------------------ */

export const CITY = "Pune";
export const CITY_CENTER = { lat: 18.5204, lng: 73.8567 };

export interface Area {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const AREAS: Area[] = [
  { id: "kp", name: "Koregaon Park", lat: 18.5362, lng: 73.8939 },
  { id: "viman", name: "Viman Nagar", lat: 18.5679, lng: 73.9143 },
  { id: "baner", name: "Baner", lat: 18.5642, lng: 73.7769 },
  { id: "hinjewadi", name: "Hinjewadi", lat: 18.5913, lng: 73.7389 },
  { id: "kothrud", name: "Kothrud", lat: 18.5074, lng: 73.8077 },
  { id: "wakad", name: "Wakad", lat: 18.5993, lng: 73.7626 },
  { id: "aundh", name: "Aundh", lat: 18.5635, lng: 73.8075 },
  { id: "hadapsar", name: "Hadapsar", lat: 18.5001, lng: 73.9264 },
  { id: "kharadi", name: "Kharadi", lat: 18.551, lng: 73.9415 },
  { id: "magarpatta", name: "Magarpatta City", lat: 18.515, lng: 73.929 },
  { id: "shivanagar", name: "Shivaji Nagar", lat: 18.5308, lng: 73.8475 },
  { id: "fcroad", name: "FC Road", lat: 18.522, lng: 73.841 },
  { id: "erandwane", name: "Erandwane", lat: 18.511, lng: 73.833 },
  { id: "pashan", name: "Pashan", lat: 18.559, lng: 73.788 },
  { id: "bavdhan", name: "Bavdhan", lat: 18.51, lng: 73.766 },
  { id: "kalyani", name: "Kalyani Nagar", lat: 18.548, lng: 73.892 },
  { id: "swargate", name: "Swargate", lat: 18.501, lng: 73.86 },
  { id: "sadashiv", name: "Sadashiv Peth", lat: 18.512, lng: 73.852 },
  { id: "balewadi", name: "Balewadi", lat: 18.5827, lng: 73.7636 },
];

export function areaById(id: string): Area | undefined {
  return AREAS.find((a) => a.id === id);
}

export function areaName(id: string): string {
  return areaById(id)?.name ?? id;
}

/** Great-circle distance in km. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export function distanceBetweenAreas(areaA: string, areaB: string): number {
  const a = areaById(areaA);
  const b = areaById(areaB);
  if (!a || !b) return 0;
  return distanceKm(a, b);
}


/* ======================= worldwide location layer ======================= */
/* New listings/users carry a full LocoraLocation (city/state/country +    */
/* lat/lng via OpenStreetMap). Legacy demo rows only have a Pune area id,  */
/* for which placeOf() derives a Pune location automatically.             */

import type { LocoraLocation } from "./types";

export const PUNE: LocoraLocation = {
  lat: 18.5204, lng: 73.8567, city: "Pune", state: "Maharashtra", country: "India",
};

export function areaLocation(areaId: string): LocoraLocation {
  const a = areaById(areaId);
  return {
    lat: a?.lat ?? CITY_CENTER.lat,
    lng: a?.lng ?? CITY_CENTER.lng,
    city: CITY, state: "Maharashtra", country: "India",
  };
}

/** Resolve the place of any user/listing/service/request (worldwide-aware). */
export function placeOf(x: { location?: LocoraLocation; area: string }): LocoraLocation {
  return x.location ?? areaLocation(x.area);
}

export function sameCity(a: LocoraLocation, b: LocoraLocation): boolean {
  return (
    a.city.trim().toLowerCase() === b.city.trim().toLowerCase() &&
    a.country.trim().toLowerCase() === b.country.trim().toLowerCase()
  );
}

export function isPune(loc: LocoraLocation): boolean {
  return sameCity(loc, PUNE);
}

/** "Pune, India" / "Toronto, Canada" — includes state for US-style ambiguity. */
export function placeLabel(loc: LocoraLocation): string {
  const city = loc.city || "Somewhere";
  const country = loc.country || "";
  return country ? `${city}, ${country}` : city;
}

/** Distance between two users/listings anywhere in the world (km). */
export function distanceBetween(
  a: { location?: LocoraLocation; area: string },
  b: { location?: LocoraLocation; area: string }
): number {
  return distanceKm(placeOf(a), placeOf(b));
}

/* ---- geocoding (OpenStreetMap Nominatim — free, no API key) ---- */

interface NominatimRow {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
}

function rowToLocation(r: NominatimRow): LocoraLocation {
  const a = r.address ?? {};
  const city =
    a.city || a.town || a.village || a.municipality || a.county ||
    a.state_district || a.city_district || r.display_name.split(",")[0] || "Somewhere";
  return {
    lat: parseFloat(r.lat) || 0,
    lng: parseFloat(r.lon) || 0,
    city,
    state: a.state ?? "",
    country: a.country ?? "",
  };
}

/** Search places worldwide ("Bandra Mumbai", "Austin TX", "Berlin"). */
export async function nominatimSearch(q: string): Promise<LocoraLocation[]> {
  const query = q.trim();
  if (query.length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as NominatimRow[];
    return rows.map(rowToLocation);
  } catch {
    return [];
  }
}

/** Reverse-geocode GPS coordinates to a city. */
export async function nominatimReverse(lat: number, lng: number): Promise<LocoraLocation | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const row = (await res.json()) as NominatimRow;
    if (!row || row.lat === undefined) return null;
    return rowToLocation(row);
  } catch {
    return null;
  }
}

/** Browser GPS, wrapped in a promise with a sane timeout. */
export function browserLocate(timeoutMs = 12000): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location not supported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || "Could not get your location")),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60 * 1000 }
    );
  });
}
