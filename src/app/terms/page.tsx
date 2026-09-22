import Link from "next/link";
import { Logo } from "@/components/brand";

export const metadata = {
  title: "Terms of Service · Locora",
  description: "The rules for using Locora — a hyperlocal marketplace for buyers, sellers and service pros.",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Agreement",
    body: [
      "By creating a Locora account or using the app you agree to these Terms. Locora is a venue that connects people in a city who want to buy, sell or hire — Locora itself is not a party to any deal between users.",
    ],
  },
  {
    title: "2. Eligibility",
    body: [
      "You must be at least 18 years old and legally able to enter contracts. One account per person, with accurate details.",
    ],
  },
  {
    title: "3. Your content",
    body: [
      "You own the listings, photos and messages you post. You give Locora permission to store and display them for running the marketplace (e.g. showing your listing to buyers in your city). You confirm your photos are yours to post and your listings are legal and accurately described.",
      "Prohibited: stolen goods, weapons, drugs, adult content, counterfeits, live animals, hazardous materials, or anything illegal in India. Prohibited listings are removed and repeat offenders lose their accounts.",
    ],
  },
  {
    title: "4. Deals, payments and safety",
    body: [
      "Locora does not process payments and holds no money — deals and payment methods are strictly between users. We strongly recommend cash-or-UPI on delivery, meeting in public places during the day, and inspecting goods before paying.",
      "Never share OTPs, bank credentials or advance payments with anyone. Locora staff will never ask for your password or money. Report suspicious users in-app — every report is reviewed.",
    ],
  },
  {
    title: "5. Conduct",
    body: [
      "No harassment, hate speech, spam, fake listings, scraping, or attempts to hack or overload the service. Accounts that put other users or the platform at risk are suspended or banned. Automated access to the service (bots) is not permitted without written permission.",
    ],
  },
  {
    title: "6. AI features",
    body: [
      "Locora includes convenience features such as smart matching, price comparison labels and content flags. These are automated aids, not guarantees — always use your own judgement on price, quality and safety.",
    ],
  },
  {
    title: "7. Availability and liability",
    body: [
      "We work hard to keep Locora running but cannot promise uninterrupted service. To the maximum extent permitted by law, Locora is not liable for indirect losses, or for the quality, safety, legality or delivery of items and services transacted between users — the deal is between you and the other user.",
    ],
  },
  {
    title: "8. Termination",
    body: [
      "You may delete your account at any time (Profile → Your data → Delete account). We may suspend accounts that violate these Terms or the law.",
    ],
  },
  {
    title: "9. Governing law",
    body: [
      "These Terms are governed by the laws of India, with exclusive jurisdiction of the courts of Pune, Maharashtra. Last updated: September 2026.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200/70 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link
            href="/"
            className="rounded-xl px-3.5 py-2 text-sm font-semibold text-ink-600 transition hover:bg-stone-100 hover:text-ink-900"
          >
            ← Back to Locora
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-[11.5px] font-extrabold uppercase tracking-widest text-brand-600">Legal</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink-900">Terms of Service</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-500">
          Plain-language summary: be honest, be safe, meet in public, and pay only on delivery.
          Locora connects people — the deal itself is between you and the other person.
        </p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-[16.5px] font-extrabold tracking-tight text-ink-900">{s.title}</h2>
              {s.body.map((para, i) => (
                <p key={i} className="mt-2 text-[14px] leading-relaxed text-ink-600">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
          <p className="text-[13.5px] font-semibold leading-relaxed text-brand-900">
            See also our <Link href="/privacy" className="underline">Privacy Policy</Link>. For
            anything else, contact <span className="font-extrabold">support@locora.app</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
