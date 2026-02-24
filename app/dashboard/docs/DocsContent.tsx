"use client";
import { useState } from "react";
import type { DocSection } from "./docsData";

interface Props {
  sections: DocSection[];
  role: string;
}

export function DocsContent({ sections, role }: Props) {
  // Track which accordion items are open: key = "sectionId-itemIndex"
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  function toggleItem(key: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function scrollTo(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="docs-page">
      {/* Hero */}
      <div className="docs-hero">
        <h1 className="docs-title">RentLedger Documentation</h1>
        <p className="docs-sub">
          Everything you need to know about using RentLedger —
          {role === "landlord"
            ? " from managing properties to sending bulk notifications."
            : " from viewing bills to raising maintenance requests."}
        </p>
      </div>

      {/* Category cards */}
      <div className="docs-cards">
        {sections.map((s) => (
          <button
            key={s.id}
            className="docs-card"
            onClick={() => scrollTo(s.id)}
          >
            <span className="docs-card-icon">{s.icon}</span>
            <div>
              <p className="docs-card-title">{s.title}</p>
              <p className="docs-card-desc">{s.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Accordion sections */}
      <div className="docs-sections">
        {sections.map((section) => (
          <div key={section.id} id={section.id} className="docs-section">
            {/* Section header */}
            <div className="docs-section-header">
              <span className="docs-section-icon">{section.icon}</span>
              <h2 className="docs-section-title">{section.title}</h2>
            </div>

            {/* Accordion items */}
            <div className="docs-accordion">
              {section.items.map((item, idx) => {
                const key = `${section.id}-${idx}`;
                const isOpen = openItems.has(key);
                return (
                  <div key={key} className="docs-item">
                    <button
                      className="docs-item-trigger"
                      onClick={() => toggleItem(key)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.question}</span>
                      <span
                        className={`docs-chevron ${isOpen ? "docs-chevron--open" : ""}`}
                      >
                        ›
                      </span>
                    </button>
                    {isOpen && (
                      <div className="docs-item-body">
                        {/* Support line breaks in answers (use \n in data) */}
                        {item.answer.split("\n").map((line, i) => (
                          <p key={i} className="docs-item-text">
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="docs-footer">
        <p>Still have questions?</p>
        <a href="/contact" className="docs-footer-link">
          Contact Support →
        </a>
      </div>
    </div>
  );
}
