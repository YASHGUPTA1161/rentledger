"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NotificationPopup } from "./NotificationPopup";
import { CURRENCIES } from "@/lib/currencies";
import { updateCurrency } from "../profile/profile-actions";
import toast from "react-hot-toast";

// Curated gradient palettes — dark-friendly, high contrast
const AVATAR_PALETTES = [
  { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff" },
  { background: "linear-gradient(135deg, #f093fb, #f5576c)", color: "#fff" },
  { background: "linear-gradient(135deg, #4facfe, #00f2fe)", color: "#fff" },
  { background: "linear-gradient(135deg, #43e97b, #38f9d7)", color: "#fff" },
  { background: "linear-gradient(135deg, #fa709a, #fee140)", color: "#fff" },
  { background: "linear-gradient(135deg, #f6d365, #fda085)", color: "#fff" },
  { background: "linear-gradient(135deg, #a18cd1, #fbc2eb)", color: "#fff" },
  { background: "linear-gradient(135deg, #0ba360, #3cba92)", color: "#fff" },
  { background: "linear-gradient(135deg, #1688fe, #0050c7)", color: "#fff" },
  { background: "linear-gradient(135deg, #ff6f5b, #df7e69)", color: "#fff" },
  { background: "linear-gradient(135deg, #27cfb1, #1688fe)", color: "#fff" },
  { background: "linear-gradient(135deg, #f7971e, #ffd200)", color: "#fff" },
];

// Deterministic: same name → same gradient, always
function getAvatarStyle(name: string): { background: string; color: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // force 32-bit integer
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

interface Props {
  userName: string;
  userEmail?: string;
  userImage?: string;
  role: string;
  unreadCount: number;
  tenants: { id: string; fullName: string }[];
  currency?: string;
}

export function DashboardNav({
  userName,
  userEmail,
  userImage,
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
          <Image
            src="/logo/logo-with-bg.svg"
            alt="RentLedger"
            width={140}
            height={36}
            priority
          />
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
            <button
              className="nav-avatar-btn"
              onClick={() => setOpen(!open)}
              style={getAvatarStyle(userName)}
            >
              {userName.charAt(0).toUpperCase()}
            </button>

            {open && (
              <div className="nav-dropdown">
                <p className="nav-user-name">{userName}</p>
                {userEmail && <p className="nav-user-email">{userEmail}</p>}
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
