import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose a new password · Locora",
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
