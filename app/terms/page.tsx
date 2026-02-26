import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | RentLedger",
  description:
    "Terms and Conditions for RentLedger — your agreement when using our rent management platform.",
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1 className="legal-title">TERMS AND CONDITIONS</h1>
        <p className="legal-updated">Last Updated: February 26, 2025</p>

        <p className="legal-body">
          These Terms and Conditions (&quot;Agreement&quot; or
          &quot;Terms&quot;) are a legally binding agreement between RentLedger
          (&quot;we,&quot; &quot;our&quot;) and any person (&quot;User,&quot;
          &quot;you,&quot; &quot;your&quot;) who accesses or uses our
          application RentLedger (the &quot;App&quot;). This Agreement, along
          with our{" "}
          <Link href="/privacy" className="legal-link">
            Privacy Policy
          </Link>
          , governs your use of our services.
        </p>

        <p className="legal-body">
          By accessing or using the App, you agree to be bound by these Terms.
          If you are uncertain about any part of this Agreement, please do not
          proceed further. Your use of our App constitutes your acceptance of
          this Agreement.
        </p>

        <h2 className="legal-section">1. Description of Services</h2>
        <p className="legal-body">
          RentLedger allows landlords and tenants to manage rent payments,
          electricity bills, water charges, and related records digitally. The
          App is intended for lawful use as a rent management and tracking tool.
          It does not constitute legal, financial, or accounting advice.
        </p>

        <h2 className="legal-section">2. Account Registration</h2>
        <p className="legal-body">
          You must register for an account to use the App. You agree to provide
          accurate, current, and complete information during registration and to
          update your information as necessary. You are responsible for
          maintaining the confidentiality of your account credentials.
        </p>

        <h2 className="legal-section">3. Acceptable Use</h2>
        <p className="legal-body">
          You agree not to use the App for any unlawful purpose, to upload false
          or misleading data, to attempt to gain unauthorized access to any part
          of the App, or to engage in any activity that disrupts or interferes
          with the App&apos;s operation.
        </p>

        <h2 className="legal-section">4. Data & Privacy</h2>
        <p className="legal-body">
          Your use of the App is also governed by our{" "}
          <Link href="/privacy" className="legal-link">
            Privacy Policy
          </Link>
          , which is incorporated into these Terms by reference. You are
          responsible for the accuracy of all data you enter into the App.
        </p>

        <h2 className="legal-section">5. Intellectual Property</h2>
        <p className="legal-body">
          All content, features, and functionality of the App — including but
          not limited to text, graphics, logos, and software — are the exclusive
          property of RentLedger and are protected by applicable intellectual
          property laws.
        </p>

        <h2 className="legal-section">6. Limitation of Liability</h2>
        <p className="legal-body">
          To the maximum extent permitted by law, RentLedger shall not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages arising from your use of the App. We provide the App on an
          &quot;as is&quot; and &quot;as available&quot; basis without
          warranties of any kind.
        </p>

        <h2 className="legal-section">7. Termination</h2>
        <p className="legal-body">
          We reserve the right to suspend or terminate your account at any time
          if you violate these Terms or engage in conduct we determine to be
          harmful to the App or other users.
        </p>

        <h2 className="legal-section">8. Changes to Terms</h2>
        <p className="legal-body">
          We may modify these Terms at any time. Continued use of the App after
          changes are posted constitutes your acceptance of the revised Terms.
        </p>

        <h2 className="legal-section">9. Contact</h2>
        <p className="legal-body">
          For any questions regarding these Terms, please contact us at{" "}
          <Link href="/contact" className="legal-link">
            rentledger.online/contact
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
