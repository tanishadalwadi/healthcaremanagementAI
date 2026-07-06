"use client";

/**
 * TopChrome — sticky app header.
 *
 * Spec:
 *   position: sticky; top:0; z-index:40
 *   background: rgba(246,241,241,0.86) + backdrop-filter:blur(8px)
 *   border-bottom: 1px solid #E5DEE6
 *   padding: 12px 28px; max-width 1360px centered
 *
 * Phase 7A change: role toggle REMOVED — role is determined by login.
 * Replaced with: user name chip (left of logout) + Logout button.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function TopChrome() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "rgba(246,241,241,0.86)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderColor: "#E5DEE6",
      }}
    >
      <div
        className="flex items-center"
        style={{ maxWidth: 1360, margin: "0 auto", padding: "12px 28px", gap: 16 }}
      >
        {/* Logo */}
        <Link
          href={user?.role === "admin" ? "/admin" : user?.role === "doctor" ? "/doctor" : "/nurse"}
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: 30, height: 30, borderRadius: 9, background: "#7C5FAE" }}
          >
            <span
              className="ti ti-activity-heartbeat"
              style={{ fontSize: 19, color: "#fff" }}
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col" style={{ lineHeight: 1.05 }}>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Pulse
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#8A8394",
              }}
            >
              Health system
            </span>
          </div>
        </Link>

        <div className="flex-1" />

        {/* User identity + logout */}
        {user && (
          <div className="flex items-center" style={{ gap: 10 }}>
            {/* Name + role badge */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1D1B2E" }}>
                {user.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#7C5FAE",
                }}
              >
                {user.role}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: "#E5DEE6" }} />

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center"
              style={{
                gap: 6,
                padding: "7px 12px",
                borderRadius: 9,
                border: "1px solid #E7E0E9",
                background: "transparent",
                color: "#6B6474",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "border-color 0.12s, color 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#C9BBDF";
                e.currentTarget.style.color = "#1D1B2E";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E7E0E9";
                e.currentTarget.style.color = "#6B6474";
              }}
            >
              <span className="ti ti-logout" style={{ fontSize: 14 }} aria-hidden="true" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
