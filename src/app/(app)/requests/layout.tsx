import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "I'm Looking For \u00b7 Locora",
  description: "Post what you need and let Locora's AI match you with nearby sellers and providers.",
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
