import type { Metadata } from "next";
import { SEED_SERVICES } from "@/data/seed";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const service = SEED_SERVICES.find((s) => s.id === params.id);
  return {
    title: service ? `${service.title} · Locora` : "Service · Locora",
    description: service
      ? `${service.title} — trusted ${service.category} service in your area. Get a quote and chat instantly on Locora.`
      : "Discover trusted local services on Locora.",
  };
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
