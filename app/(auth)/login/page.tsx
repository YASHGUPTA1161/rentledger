import LoginForm from "./login-form";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | RentLedger",
};

export default function LoginPage() {
  return (
    <div className="auth-shell">
      {/* LEFT — form panel */}
      <div className="auth-left">
        <div className="auth-form-wrap">
          {/* Heading */}
          <div className="auth-heading">
            <h1 className="auth-title">Welcome Back 👋</h1>
            <p className="auth-subtitle">
              Today is a new day. It&apos;s your day. You shape it.
              <br />
              Sign in to start managing your rentals.
            </p>
          </div>

          <LoginForm />

          {/* Bottom link */}
          <p className="auth-switch">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="auth-switch-link">
              Sign up
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
