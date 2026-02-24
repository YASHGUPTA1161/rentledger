"use client";
import { useState } from "react";

// ── 4 pre-built categories ────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "query", label: "❓ General Query" },
  { id: "feature", label: "💡 Feature Request" },
  { id: "bug", label: "🐛 Bug Report" },
  { id: "other", label: "📬 Other" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export function ContactForm() {
  const [category, setCategory] = useState<CategoryId>("query");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !message) return;

    setSending(true);
    setResult(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, category, message }),
    });

    setSending(false);

    if (res.ok) {
      setResult({
        ok: true,
        text: "✅ Message sent! I'll get back to you soon.",
      });
      setName("");
      setEmail("");
      setMessage("");
      setCategory("query");
    } else {
      setResult({
        ok: false,
        text: "❌ Something went wrong. Try emailing directly.",
      });
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      {/* Category */}
      <div className="contact-field">
        <label className="contact-label">Category</label>
        <div className="contact-category-row">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`contact-cat-btn ${category === c.id ? "contact-cat-btn--active" : ""}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="contact-field">
        <label className="contact-label" htmlFor="c-name">
          Your Name
        </label>
        <input
          id="c-name"
          type="text"
          className="contact-input"
          placeholder="Rahul Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Email */}
      <div className="contact-field">
        <label className="contact-label" htmlFor="c-email">
          Your Email
        </label>
        <input
          id="c-email"
          type="email"
          className="contact-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {/* Message */}
      <div className="contact-field">
        <label className="contact-label" htmlFor="c-message">
          Message
        </label>
        <textarea
          id="c-message"
          className="contact-textarea"
          placeholder="Describe your query, bug, or idea in detail…"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      {/* Result */}
      {result && (
        <p className={result.ok ? "contact-success" : "contact-error"}>
          {result.text}
        </p>
      )}

      <button type="submit" className="contact-submit" disabled={sending}>
        {sending ? "Sending…" : "Send Message →"}
      </button>
    </form>
  );
}
