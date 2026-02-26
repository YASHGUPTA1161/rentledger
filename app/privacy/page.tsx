import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | RentLedger",
  description:
    "Privacy Policy for RentLedger — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1 className="legal-title">PRIVACY POLICY</h1>
        <p className="legal-updated">Last Updated: February 26, 2025</p>

        <p className="legal-body">
          We respect the privacy of our Users (&quot;User,&quot;
          &quot;your,&quot; or &quot;you&quot;). This Privacy Policy
          (&quot;Policy&quot;) explains how RentLedger handles your information
          when you use our application (&quot;the App&quot;). Please read this
          Policy carefully to understand our practices regarding your
          information and how we treat it.
        </p>

        <p className="legal-body">
          By accessing or using the App, you agree to the terms of this Policy.
          If you do not agree with the terms of this Policy, please do not
          access or use the App.
        </p>

        <h2 className="legal-section">1. Information We Collect</h2>
        <p className="legal-body">
          We collect information you provide directly to us when you register
          for an account, including your name, email address, and any data you
          enter into the App such as tenant details, rent amounts, property
          information, and payment records.
        </p>

        <h2 className="legal-section">2. How We Use Your Information</h2>
        <p className="legal-body">
          We use the information we collect to operate and improve the App, send
          you notifications and receipts, respond to your comments and
          questions, and provide customer support. We do not sell your personal
          information to third parties.
        </p>

        <h2 className="legal-section">3. Data Storage & Security</h2>
        <p className="legal-body">
          Your data is stored securely using industry-standard encryption. We
          use Neon (PostgreSQL) for database storage and follow security best
          practices to protect your information from unauthorized access,
          disclosure, or destruction.
        </p>

        <h2 className="legal-section">4. Third-Party Services</h2>
        <p className="legal-body">
          We use third-party services including Google (for authentication),
          Vercel (hosting), and analytics tools. These third parties have their
          own privacy policies and may collect data as per their respective
          terms.
        </p>

        <h2 className="legal-section">5. Cookies</h2>
        <p className="legal-body">
          We use cookies and similar tracking technologies to maintain your
          session and improve your experience. You may disable cookies in your
          browser settings, though this may affect certain functionality of the
          App.
        </p>

        <h2 className="legal-section">6. Your Rights</h2>
        <p className="legal-body">
          You may request access to, correction of, or deletion of your personal
          data at any time by contacting us. We will respond to your request
          within a reasonable timeframe.
        </p>

        <h2 className="legal-section">7. Changes to This Policy</h2>
        <p className="legal-body">
          We may update this Privacy Policy from time to time. We will notify
          you of any significant changes by posting the new Policy on this page
          with an updated date.
        </p>

        <h2 className="legal-section">8. Contact</h2>
        <p className="legal-body">
          If you have any questions about this Privacy Policy, please contact us
          at{" "}
          <Link href="/contact" className="legal-link">
            rentledger.online/contact
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
