"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationPopup } from "./NotificationPopup";

interface Props {
  userName: string;
  role: string;
  unreadCount: number;
  tenants: { id: string; fullName: string }[];
}

export function DashboardNav({ userName, role, unreadCount, tenants }: Props) {
  const [open, setOpen] = useState(false); // avatar dropdown
  const [popupOpen, setPopupOpen] = useState(false); // notification popup
  const router = useRouter();

  const home =
    role === "landlord" ? "/dashboard/landlord" : "/dashboard/tenant";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      <nav className="dashboard-nav">
        <Link href={home} className="nav-logo">
          🏠 RentLedger
        </Link>
        <div className="nav-right">
          {/* Bell — opens notification popup */}
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

          {/* Contact — same-app navigation */}
          <Link href="/contact" className="nav-contact-link">
            Contact
          </Link>

          {/* Pricing / Waitlist */}
          <Link href="/pricing" className="nav-contact-link">
            Pricing
          </Link>
          <div className="nav-avatar-wrap">
            <button className="nav-avatar-btn" onClick={() => setOpen(!open)}>
              {userName.charAt(0).toUpperCase()}
            </button>
            {open && (
              <div className="nav-dropdown">
                <p className="nav-user-name">{userName}</p>
                <p className="nav-user-role">{role}</p>
                <hr className="nav-divider" />
                <Link href="/dashboard/profile" className="nav-drop-item">
                  Profile
                </Link>
                <button onClick={logout} className="nav-drop-item nav-logout">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Notification popup — renders as overlay when bell is clicked */}
      {popupOpen && role === "landlord" && (
        <NotificationPopup
          tenants={tenants}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </>
  );
}
