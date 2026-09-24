import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile · Locora",
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
