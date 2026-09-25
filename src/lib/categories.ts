/* ------------------------------------------------------------------ */
/*  Locora — categories                                               */
/* ------------------------------------------------------------------ */

import type { ProductCategory, ServiceCategory } from "./types";

export const PRODUCT_CATEGORIES: { id: ProductCategory; label: string; emoji: string }[] = [
  { id: "mobiles", label: "Mobiles", emoji: "📱" },
  { id: "electronics", label: "Electronics", emoji: "💻" },
  { id: "vehicles", label: "Vehicles", emoji: "🛵" },
  { id: "furniture", label: "Furniture", emoji: "🛋️" },
  { id: "appliances", label: "Appliances", emoji: "🧊" },
  { id: "fashion", label: "Fashion", emoji: "👟" },
  { id: "sports", label: "Sports & Fitness", emoji: "🏸" },
  { id: "books", label: "Books", emoji: "📚" },
  { id: "music", label: "Music", emoji: "🎸" },
  { id: "kitchen", label: "Kitchen & Dining", emoji: "🍳" },
  { id: "kids", label: "Kids & Toys", emoji: "🧸" },
  { id: "pets", label: "Pet Supplies", emoji: "🐾" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "decor", label: "Home Decor", emoji: "🕯️" },
  { id: "other", label: "Other", emoji: "📦" },
];

export const SERVICE_CATEGORIES: { id: ServiceCategory; label: string; emoji: string }[] = [
  { id: "plumber", label: "Plumbers", emoji: "🚰" },
  { id: "electrician", label: "Electricians", emoji: "⚡" },
  { id: "tutor", label: "Tutors", emoji: "📖" },
  { id: "photographer", label: "Photographers", emoji: "📸" },
  { id: "mechanic", label: "Mechanics", emoji: "🔧" },
  { id: "cleaner", label: "Cleaning", emoji: "🧹" },
  { id: "ac-repair", label: "AC & Appliance Repair", emoji: "❄️" },
  { id: "interior", label: "Interior Design", emoji: "🏡" },
  { id: "pest-control", label: "Pest Control", emoji: "🐜" },
  { id: "cook", label: "Cooks & Tiffins", emoji: "🍲" },
  { id: "painter", label: "Painters", emoji: "🎨" },
  { id: "yoga", label: "Yoga & Fitness", emoji: "🧘" },
  { id: "carpenter", label: "Carpenters", emoji: "🪚" },
  { id: "tailor", label: "Tailors & Stitching", emoji: "🧵" },
  { id: "beauty", label: "Beauty & Salon", emoji: "💅" },
  { id: "movers", label: "Packers & Movers", emoji: "📦" },
  { id: "driver", label: "Drivers & Rentals", emoji: "🚗" },
  { id: "event", label: "Events & Parties", emoji: "🎉" },
  { id: "other", label: "Other Services", emoji: "🧰" },
];

export function productCategoryLabel(id: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function serviceCategoryLabel(id: string): string {
  return SERVICE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function serviceCategoryEmoji(id: string): string {
  return SERVICE_CATEGORIES.find((c) => c.id === id)?.emoji ?? "🛠️";
}

export function productCategoryEmoji(id: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.id === id)?.emoji ?? "📦";
}
