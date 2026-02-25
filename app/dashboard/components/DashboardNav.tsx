"use client";
import Link from "next/link";
import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NotificationPopup } from "./NotificationPopup";
import { CURRENCIES } from "@/lib/currencies";
import { updateCurrency } from "../profile/profile-actions";
import toast from "react-hot-toast";

interface Props {
  userName: string;
  role: string;
  unreadCount: number;
  tenants: { id: string; fullName: string }[];
  currency?: string;
}

export function DashboardNav({
  userName,
  role,
  unreadCount,
  tenants,
  currency = "INR",
}: Props) {
  const [open, setOpen] = useState(false); // avatar dropdown
  const [flagOpen, setFlagOpen] = useState(false); // currency dropdown
  const [currSelected, setCurrSelected] = useState(currency);
  const [popupOpen, setPopupOpen] = useState(false); // notification popup
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const flagRef = useRef<HTMLDivElement>(null);

  const activeCurrency =
    CURRENCIES.find((c) => c.code === currSelected) ?? CURRENCIES[0];

  // Close currency dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (flagRef.current && !flagRef.current.contains(e.target as Node)) {
        setFlagOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const home =
    role === "landlord" ? "/dashboard/landlord" : "/dashboard/tenant";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleCurrencySelect(code: string) {
    if (code === currSelected || isPending) return;
    setCurrSelected(code);
    setFlagOpen(false);
    startTransition(async () => {
      const result = await updateCurrency(code);
      if (result.success) {
        toast.success("Currency updated!");
      } else {
        setCurrSelected(currency); // rollback
        toast.error(result.error ?? "Failed to update");
      }
    });
  }

  return (
    <>
      <nav className="dashboard-nav">
        <Link href={home} className="nav-logo">
          🏠 RentLedger
        </Link>
        <div className="nav-right">
          {/* Bell */}
          <button
            className="nav-bell"
            onClick={() => setPopupOpen(true)}
            title={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
          >
            🔔{" "}
            {unreadCount > 0 && (
              <span className="nav-badge">{unreadCount}</span>
            )}
          </button>

          <Link href="/dashboard/docs" className="nav-contact-link">
            Docs
          </Link>
          <Link href="/contact" className="nav-contact-link">
            Contact
          </Link>
          <Link href="/pricing" className="nav-contact-link">
            Pricing
          </Link>

          {/* Avatar + dropdown */}
          <div className="nav-avatar-wrap">
            <button className="nav-avatar-btn" onClick={() => setOpen(!open)}>
              {userName.charAt(0).toUpperCase()}
            </button>

            {open && (
              <div className="nav-dropdown">
                <p className="nav-user-name">{userName}</p>
                <p className="nav-user-role">{role}</p>

                {/* ── Currency flag button ── */}
                {role === "landlord" && (
                  <div className="nav-currency-wrap" ref={flagRef}>
                    <button
                      className="nav-flag-btn"
                      onClick={() => setFlagOpen((v) => !v)}
                      disabled={isPending}
                      title="Change currency"
                    >
                      <span>{activeCurrency.flag}</span>
                      <span className="nav-flag-code">
                        {activeCurrency.code}
                      </span>
                      <span className="nav-flag-chevron">
                        {flagOpen ? "▴" : "▾"}
                      </span>
                    </button>

                    {flagOpen && (
                      <ul className="nav-flag-list">
                        {CURRENCIES.map((c) => (
                          <li key={c.code}>
                            <button
                              className={`nav-flag-option${c.code === currSelected ? " nav-flag-option--active" : ""}`}
                              onClick={() => handleCurrencySelect(c.code)}
                            >
                              <span>{c.flag}</span>
                              <span>{c.code}</span>
                              <span className="nav-flag-opt-name">
                                {c.label}
                              </span>
                              {c.code === currSelected && (
                                <span className="nav-flag-check">✓</span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <hr className="nav-divider" />
                <button onClick={logout} className="nav-drop-item nav-logout">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {popupOpen && role === "landlord" && (
        <NotificationPopup
          tenants={tenants}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </>
  );
}
