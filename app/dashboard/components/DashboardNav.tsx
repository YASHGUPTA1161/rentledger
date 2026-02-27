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
      <nav className="navbar-wrapper">
        <div className="nav-pill-outer">
          <div className="nav-pill-inner">
            <div className="nav-right">
              {/* Bell / Alerts */}
              <button
                className="nav-exp-link"
                onClick={() => setPopupOpen(true)}
                title={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
              >
                <span className="nav-exp-icon">
                  <i
                    className="fi fi-br-bell"
                    style={{ fontSize: "22px", lineHeight: 1 }}
                  ></i>
                  {unreadCount > 0 && (
                    <span className="nav-badge">{unreadCount}</span>
                  )}
                </span>
                <span className="nav-exp-title">Alerts</span>
              </button>

              {/* Docs */}
              <Link href="/dashboard/docs" className="nav-exp-link">
                <span className="nav-exp-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </span>
                <span className="nav-exp-title">Docs</span>
              </Link>

              {/* Contact */}
              <Link href="/contact" className="nav-exp-link">
                <span className="nav-exp-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <span className="nav-exp-title">Contact</span>
              </Link>

              {/* Pricing */}
              <Link href="/pricing" className="nav-exp-link">
                <span className="nav-exp-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </span>
                <span className="nav-exp-title">Pricing</span>
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
                    {/* Large avatar */}
                    <div
                      className="nav-drop-avatar"
                      style={getAvatarStyle(userName)}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </div>

                    {/* Text block */}
                    <div className="nav-drop-text">
                      <p className="nav-user-name">{userName}</p>
                      {userEmail && (
                        <p className="nav-user-email">{userEmail}</p>
                      )}
                      <p className="nav-user-role">{role}</p>
                    </div>

                    {/* Currency */}
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
                    <button
                      onClick={logout}
                      className="nav-drop-item nav-logout"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
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
