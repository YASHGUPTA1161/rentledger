import Link from "next/link";
import { GoogleSignInButton } from "./components/GoogleSignInButton";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "RentLedger",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://www.rentledger.online",
  description:
    "Free rent management tool for landlords. Track rent payments, bills, electricity, and tenants in one dashboard.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    reviewCount: "1",
  },
};

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 font-sans text-slate-200">
      {/* JSON-LD structured data — read by Google, invisible to users */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Background ambient glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl">
        {/* Main Header */}
        <div className="mb-6 space-y-4">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-4 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-blue-300 backdrop-blur-sm">
            <span>The easiest way to manage your rentals 🏠</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              RentLedger
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto font-medium leading-relaxed">
            Track rent payments, electricity bills, and tenants — all in one
            place. Free rent ledger for landlords.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link href="/signup" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-zinc-900 font-bold hover:bg-zinc-200 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] active:scale-95">
              Get Started
            </button>
          </Link>

          <Link href="/login" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-zinc-900/50 text-white font-semibold border border-white/10 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm active:scale-95">
              Log In
            </button>
          </Link>
        </div>

        {/* Separator & Google Auth */}
        <div className="mt-20 w-full max-w-sm flex flex-col items-center">
          <div className="flex items-center w-full gap-4 mb-6">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">
              Or continue with
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>
          <div className="w-full flex justify-center">
            <GoogleSignInButton />
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="absolute bottom-6 text-sm text-zinc-500">
        © {new Date().getFullYear()} RentLedger. All rights reserved.
      </footer>
    </div>
  );
}
