import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home \u00b7 Locora",
  description: "Fresh listings and trusted services in your Pune neighbourhood.",
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
