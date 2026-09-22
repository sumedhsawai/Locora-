import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Locora — Your neighbourhood, powered by AI",
  description:
    "Locora is Pune's AI-powered hyperlocal marketplace. Buy and sell pre-loved items, discover trusted local services, chat in real time and complete deals in person — with AI that writes your listings, understands your searches and matches you with the right people nearby.",
  applicationName: "Locora",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Locora", statusBarStyle: "default" },
  icons: { apple: "/icons/icon-180.png" },
};

export const viewport: Viewport = {
  themeColor: "#0390E0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
