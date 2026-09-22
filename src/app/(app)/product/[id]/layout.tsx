import type { Metadata } from "next";
import { SEED_PRODUCTS } from "@/data/seed";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const product = SEED_PRODUCTS.find((p) => p.id === params.id);
  return {
    title: product ? `${product.title} · Locora` : "Listing · Locora",
    description: product
      ? `${product.title} — ₹${product.price.toLocaleString("en-IN")} in ${product.area}. Chat, negotiate and meet up in person on Locora.`
      : "Buy and sell pre-loved items in your neighbourhood on Locora.",
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
