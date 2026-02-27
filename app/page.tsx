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
    <div className="landing-root">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <main className="landing-hero">
        <span className="landing-badge">
          The easiest way to manage your rentals 🏠
        </span>

        <h1 className="landing-title">
          Welcome to <span className="landing-title-accent">RentLedger</span>
        </h1>

        <p className="landing-sub">
          Track rent payments, electricity bills, and tenants — all in one
          place. Free rent ledger for landlords and tenants.
        </p>

        {/* Auth buttons */}
        <div className="landing-actions">
          <Link href="/signup" className="landing-btn-primary">
            Get Started
          </Link>
          <Link href="/login" className="landing-btn-secondary">
            Log In
          </Link>
        </div>

        {/* Divider + Google */}
        <div className="landing-divider-wrap">
          <div className="landing-divider-line" />
          <span className="landing-divider-text">or continue with</span>
          <div className="landing-divider-line" />
        </div>

        <div className="landing-google-wrap">
          <GoogleSignInButton />
        </div>

        {/* Feature cards */}
        <div className="landing-features">
          <div className="landing-feature-card">
            <span className="landing-feature-icon">💰</span>
            <h3 className="landing-feature-title">Rent & Bills</h3>
            <p className="landing-feature-desc">
              Track rent, electricity, and carry-forward balances automatically
              each month.
            </p>
          </div>
          <div className="landing-feature-card">
            <span className="landing-feature-icon">👥</span>
            <h3 className="landing-feature-title">Tenant Management</h3>
            <p className="landing-feature-desc">
              Invite tenants, manage leases, and communicate via bulk
              notifications.
            </p>
          </div>
          <div className="landing-feature-card">
            <span className="landing-feature-icon">📄</span>
            <h3 className="landing-feature-title">Documents</h3>
            <p className="landing-feature-desc">
              Upload, store, and share rent receipts and lease files securely.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} RentLedger</span>
        <span className="landing-footer-dot">·</span>
        <Link href="/privacy" className="landing-footer-link">
          Privacy Policy
        </Link>
        <span className="landing-footer-dot">·</span>
        <Link href="/terms" className="landing-footer-link">
          Terms
        </Link>
        <span className="landing-footer-dot">·</span>
        <Link href="/contact" className="landing-footer-link">
          Contact
        </Link>
      </footer>
    </div>
  );
}
