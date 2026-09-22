import Link from "next/link";
import { Logo } from "@/components/brand";

export const metadata = {
  title: "Privacy Policy · Locora",
  description: "How Locora collects, uses and protects your personal data (DPDP Act, 2023).",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Who we are",
    body: [
      "Locora (“we”, “us”) is a hyperlocal marketplace that connects buyers, sellers and service providers within a city. This policy explains what personal data we collect, why we collect it, and the rights you have over it. It is published in line with India's Digital Personal Data Protection Act, 2023 (“DPDP Act”).",
    ],
  },
  {
    title: "2. What data we collect",
    body: [
      "Account data: your name, email address, phone number (if you add one), and profile details you choose to provide (bio, profile role, neighbourhood).",
      "Listing and activity data: products or services you post, buy requests, favourites, reviews, reports, and view counts.",
      "Messages: chats you send through Locora, including offers, so both parties have a reliable record.",
      "Approximate location: if you opt in, we use your device location (GPS) once to detect your city, state and country — or you can simply type it. We store only the resolved city-level place, never your live GPS trail, and never track you in the background.",
      "Technical data: standard server logs and security tokens required to keep your session signed in.",
    ],
  },
  {
    title: "3. Why we process it",
    body: [
      "To show you listings, services and requests near your city; to let you chat and make offers; to keep the marketplace safe (scam flags, reports, moderation); and to maintain your account. We do not sell your data, and we do not use it for third-party advertising.",
    ],
  },
  {
    title: "4. Who we share it with",
    body: [
      "Your public listing details and first name are visible to other Locora users — that is the point of a marketplace. Your email and phone number are never shown publicly; sharing contact details in chat is always your choice.",
      "We use infrastructure providers (Supabase — database, authentication, file storage and realtime messaging, hosted on secure cloud servers) strictly to operate Locora. We do not share your personal data with anyone else unless required by law or to protect our users from fraud or harm.",
    ],
  },
  {
    title: "5. Security",
    body: [
      "Passwords are hashed (never stored in readable form), all data access runs through row-level security so you can only ever read or write your own records, and uploads are restricted to your own storage folder. Traffic is encrypted in transit (HTTPS). No system is perfectly secure — if a breach ever affects you, we will notify you promptly.",
    ],
  },
  {
    title: "6. Your rights (data principal rights)",
    body: [
      "Access & portability: you can download everything we hold about you — Profile → Your data → Download my data — as a machine-readable file.",
      "Correction: you can edit your profile details any time in the app.",
      "Erasure: you can permanently delete your account and all associated data — Profile → Your data → Delete account. This removes your profile, listings, services, requests, reviews, messages and chats from our systems.",
      "Grievance redressal: contact our Grievance Officer at privacy@locora.app — we respond within 7 working days.",
      "Consent withdrawal: you may withdraw consent for location auto-detection any time in your profile settings; you can also delete your account to withdraw consent entirely.",
    ],
  },
  {
    title: "7. Children",
    body: [
      "Locora is not intended for anyone under 18. We do not knowingly collect data from children; if we learn we have, we delete it promptly.",
    ],
  },
  {
    title: "8. Data retention",
    body: [
      "We keep your data only while your account is active, plus a short window for security logs. Deleting your account erases your personal data across our systems.",
    ],
  },
  {
    title: "9. Changes to this policy",
    body: [
      "If we change this policy materially, we will notify you in the app before it takes effect. Last updated: September 2026.",
    ],
  },
];

export default function PrivacyPage() {
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
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink-900">Privacy Policy</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-500">
          Plain-language summary: we collect only what a neighbourhood marketplace needs — your
          account, your listings, your chats and (optionally) your city. We never sell it. You can
          download or delete everything, any time, yourself.
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
            Questions or concerns? Write to our Grievance Officer at{" "}
            <span className="font-extrabold">privacy@locora.app</span>. See also our{" "}
            <Link href="/terms" className="underline">Terms of Service</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
