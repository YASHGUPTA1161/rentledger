import SignupForm from "./signup-form";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | RentLedger",
};

export default function SignupPage() {
  return (
    <div className="auth-shell">
      {/* LEFT — form panel */}
      <div className="auth-left">
        <div className="auth-form-wrap">
          {/* Heading */}
          <div className="auth-heading">
            <h1 className="auth-title">Get Started 🏠</h1>
            <p className="auth-subtitle">
              Create your free account and start managing
              <br />
              your rentals in minutes.
            </p>
          </div>

          <SignupForm />

          {/* Bottom link */}
          <p className="auth-switch">
            Already have an account?{" "}
            <Link href="/login" className="auth-switch-link">
              Sign in
            </Link>
          </p>

          <p className="auth-copyright">
            © {new Date().getFullYear()} RentLedger. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT — placeholder black panel */}
      <div className="auth-right" />
    </div>
  );
}
