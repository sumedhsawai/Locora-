/* ------------------------------------------------------------------ */
/*  Locora — display formatters                                       */
/* ------------------------------------------------------------------ */

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** ₹38,500 / ₹1,35,000 (Indian digit grouping) */
export function inr(amount: number): string {
  return inrFormatter.format(amount);
}

/** "38.5k" style compact for stat chips */
export function inrCompact(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 2)}L`;
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}k`;
  return inr(amount);
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo${months > 1 ? "s" : ""} ago`;
  return `${Math.floor(months / 12)} yr ago`;
}

export function joinedOn(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return timeLabel(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function km(distance: number): string {
  return `${distance % 1 === 0 ? distance.toFixed(0) : distance.toFixed(1)} km`;
}

export function responseLabel(mins: number): string {
  if (mins <= 60) return `~${mins} min`;
  return `~${Math.round(mins / 60)} hr`;
}

export function conditionLabel(c: string): string {
  switch (c) {
    case "new":
      return "Brand new";
    case "like-new":
      return "Like new";
    case "good":
      return "Good";
    case "fair":
      return "Fair";
    default:
      return c;
  }
}

export function priceUnitLabel(unit: string): string {
  switch (unit) {
    case "visit":
      return "/visit";
    case "hour":
      return "/hr";
    case "session":
      return "/session";
    case "event":
      return "/event";
    case "day":
      return "/day";
    case "month":
      return "/month";
    case "sqft":
      return "/sq.ft";
    default:
      return "";
  }
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Deterministic pick from a list — keeps mock "AI" output stable per input. */
export function pickBySeed<T>(items: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return items[h % items.length]!;
}
