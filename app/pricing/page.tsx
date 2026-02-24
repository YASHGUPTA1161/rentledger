import { WaitlistForm } from "./WaitlistForm";

export default function PricingPage() {
  return (
    <div className="waitlist-page">
      <div className="waitlist-card">
        {/* Badge */}
        <span className="waitlist-badge">Coming Soon</span>

        {/* Headline */}
        <h1 className="waitlist-title">
          Join the RentLedger Waiting List –<br />
          Get 1 Month Free!
        </h1>

        {/* Subtext */}
        <p className="waitlist-sub">
          Be the first to experience smarter rental management. Sign up today to
          reserve your spot and enjoy your first month completely free when we
          launch.
        </p>

        {/* What you get */}
        <ul className="waitlist-perks">
          <li>⚡ Early access to RentLedger</li>
          <li>📬 Exclusive updates and tips</li>
          <li>🎁 A free month to explore all features</li>
        </ul>

        <WaitlistForm />
      </div>
    </div>
  );
}
