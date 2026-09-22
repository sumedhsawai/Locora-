import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search \u00b7 Locora",
  description: "Ask for anything in plain words \u2014 Locora's AI understands category, budget, area and condition.",
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
