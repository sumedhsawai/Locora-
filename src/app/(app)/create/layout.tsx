import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post \u00b7 Locora",
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
