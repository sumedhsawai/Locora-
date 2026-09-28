"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppNavbar, BottomNav } from "@/components/shell";
import { LocationGate } from "@/components/location-gate";
import { LogoMark } from "@/components/brand";
import { useApp } from "@/lib/store";

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-50">
      <div className="animate-pop">
        <LogoMark size={58} />
      </div>
      <p className="text-[15px] font-extrabold tracking-tight text-ink-900">Locora</p>
      <p className="text-[12px] font-semibold text-ink-400">Your neighbourhood, powered by AI</p>
    </div>
  );
}

/** Routes guests can browse without an account (sharing links, SEO, curiosity).
 *  Everything else (chat, profile, requests, create, admin) still requires sign-in. */
const PUBLIC_PREFIXES = ["/home", "/search", "/product", "/service", "/u"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { hydrated, currentUser } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const isPublicPath = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  React.useEffect(() => {
    if (hydrated && !currentUser && !isPublicPath) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, currentUser, router, pathname, isPublicPath]);

  if (!hydrated || (!currentUser && !isPublicPath)) return <Splash />;

  return (
    <div className="min-h-screen bg-stone-50">
      <AppNavbar />
      <main className="mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-6 sm:pt-8 lg:pb-16">{children}</main>
      <BottomNav />
      <LocationGate />
    </div>
  );
}
