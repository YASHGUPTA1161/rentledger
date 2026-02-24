"use client";
import { useState } from "react";

export function WaitlistForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !email) return;

    setSending(true);
    setResult(null);

    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, email }),
    });

    const data = await res.json();
    setSending(false);

    if (res.ok) {
      setResult({
        ok: true,
        text: "🎉 You're on the list! Check your inbox for a confirmation.",
      });
      setFirstName("");
      setEmail("");
    } else if (data.error === "already_registered") {
      setResult({
        ok: false,
        text: "You're already on the waitlist! We'll be in touch.",
      });
    } else {
      setResult({ ok: false, text: "Something went wrong. Please try again." });
    }
  }

  return (
    <form className="waitlist-form" onSubmit={handleSubmit}>
      <div className="waitlist-fields">
        <input
          type="text"
          className="waitlist-input"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="email"
          className="waitlist-input"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {result && (
        <p className={result.ok ? "waitlist-success" : "waitlist-error"}>
          {result.text}
        </p>
      )}

      <button type="submit" className="waitlist-btn" disabled={sending}>
        {sending ? "Joining…" : "Join the Waiting List →"}
      </button>

      <p className="waitlist-note">No spam. We respect your inbox.</p>
    </form>
  );
}
