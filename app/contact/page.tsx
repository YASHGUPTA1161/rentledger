import { ContactForm } from "./ContactForm";

export default function ContactPage() {
  return (
    <div className="contact-page">
      <div className="contact-card">
        {/* Header */}
        <div className="contact-header">
          <h1 className="contact-title">Get in Touch</h1>
          <p className="contact-sub">
            Have a question, found a bug, or want to suggest something? I read
            every message personally and usually reply within 24 hours.
          </p>
          <p className="contact-email-note">
            You can also reach me directly at{" "}
            <a
              href="mailto:yashguptayg1161@gmail.com"
              className="contact-email-link"
            >
              yashguptayg1161@gmail.com
            </a>
          </p>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
