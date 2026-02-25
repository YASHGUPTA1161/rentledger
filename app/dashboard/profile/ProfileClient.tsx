"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { CURRENCIES } from "@/lib/currencies";
import { updateCurrency } from "./profile-actions";
import toast from "react-hot-toast";

interface Props {
  name: string;
  phone: string | null;
  currentCurrency: string;
}

export function ProfileClient({ name, phone, currentCurrency }: Props) {
  const [selected, setSelected] = useState(currentCurrency);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const activeCurrency =
    CURRENCIES.find((c) => c.code === selected) ?? CURRENCIES[0];

  function handleSelect(code: string) {
    if (code === selected || isPending) return;
    setSelected(code);
    setOpen(false);

    startTransition(async () => {
      const result = await updateCurrency(code);
      if (result.success) {
        toast.success("Currency updated!");
      } else {
        setSelected(currentCurrency); // rollback
        toast.error(result.error ?? "Failed to update");
      }
    });
  }

  return (
    <div className="profile-wrap">
      {/* Account card */}
      <div className="profile-card">
        <h2 className="profile-section-title">Account</h2>
        <div className="profile-info-row">
          <span className="profile-info-label">Name</span>
          <span className="profile-info-value">{name}</span>
        </div>
        {phone && (
          <div className="profile-info-row">
            <span className="profile-info-label">Phone</span>
            <span className="profile-info-value">{phone}</span>
          </div>
        )}
      </div>

      {/* Currency card */}
      <div className="profile-card">
        <h2 className="profile-section-title">Currency</h2>
        <p className="profile-section-sub">
          Used across all bills and ledger entries.
        </p>

        {/* Dropdown */}
        <div className="curr-drop-wrap" ref={dropRef}>
          <button
            className="curr-drop-trigger"
            onClick={() => setOpen((v) => !v)}
            disabled={isPending}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className="curr-drop-flag">{activeCurrency.flag}</span>
            <span className="curr-drop-label">
              {activeCurrency.code}
              <span className="curr-drop-symbol">
                {" "}
                — {activeCurrency.symbol}
              </span>
            </span>
            <span className="curr-drop-name">{activeCurrency.label}</span>
            <span className="curr-drop-chevron">{open ? "▴" : "▾"}</span>
          </button>

          {open && (
            <ul className="curr-drop-list" role="listbox">
              {CURRENCIES.map((c) => (
                <li key={c.code}>
                  <button
                    role="option"
                    aria-selected={c.code === selected}
                    className={`curr-drop-option${c.code === selected ? " curr-drop-option--active" : ""}`}
                    onClick={() => handleSelect(c.code)}
                  >
                    <span className="curr-drop-flag">{c.flag}</span>
                    <span className="curr-drop-label">
                      {c.code}
                      <span className="curr-drop-symbol"> — {c.symbol}</span>
                    </span>
                    <span className="curr-drop-name">{c.label}</span>
                    {c.code === selected && (
                      <span className="curr-drop-check">✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {isPending && <p className="profile-saving">Saving…</p>}
      </div>
    </div>
  );
}
