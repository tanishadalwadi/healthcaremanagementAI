"use client";

/**
 * Sidebar — left nav column.
 *
 * Phase 7A: role-aware. Reads useAuth() to switch nav sets.
 *   Nurse nav:  /nurse, /patients, /departments, /analytics, /dashboard/notifications
 *   Admin nav:  /admin, /patients, /departments, /analytics, /dashboard/notifications
 *
 * Spec:
 *   width: 212px, background:#FFFFFF, border-radius:18px, padding:16px
 *   position:sticky; top:88px (clears top chrome)
 *   Active:   color #7C5FAE, background #EFE7F7
 *   Inactive: color #6B6474, background transparent
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  exact?: boolean;
}

const NURSE_NAV: NavItem[] = [
  { icon: "ti-layout-dashboard", label: "Dashboard",    href: "/nurse",                   exact: true },
  { icon: "ti-users",            label: "Patients",      href: "/patients",                exact: false },
  { icon: "ti-building-hospital",label: "Departments",   href: "/departments",             exact: false },
  { icon: "ti-chart-histogram",  label: "Analytics",     href: "/analytics",               exact: false },
  { icon: "ti-bell",             label: "Notifications", href: "/dashboard/notifications", exact: false },
];

const ADMIN_NAV: NavItem[] = [
  { icon: "ti-layout-dashboard", label: "Dashboard",      href: "/admin",                   exact: true },
  { icon: "ti-users",            label: "Patients",        href: "/patients",                exact: false },
  { icon: "ti-door-exit",        label: "Discharges",      href: "/admin/discharge",         exact: false },
  { icon: "ti-building-hospital",label: "Departments",     href: "/departments",             exact: false },
  { icon: "ti-chart-histogram",  label: "Analytics",       href: "/analytics",               exact: false },
  { icon: "ti-bell",             label: "Notifications",   href: "/dashboard/notifications", exact: false },
];

export function Sidebar() {
  const pathname = usePathname() ?? "";
  const { user } = useAuth();

  const navItems = user?.role === "admin" ? ADMIN_NAV : NURSE_NAV;

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const name = user?.name ?? "User";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const subtitle =
    user?.role === "admin"
      ? "Administrator"
      : user?.role === "nurse"
      ? "Charge nurse · Day shift"
      : "User";

  return (
    <aside
      style={{
        width: 212,
        background: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        position: "sticky",
        top: 88,
      }}
    >
      {/* Nav items */}
      <nav>
        <ul
          className="list-none m-0 p-0 flex flex-col"
          style={{ gap: 3 }}
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="flex items-center"
                  style={{
                    gap: 11,
                    padding: "10px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    color: active ? "#7C5FAE" : "#6B6474",
                    background: active ? "#EFE7F7" : "transparent",
                    textDecoration: "none",
                    transition: "background 0.12s, color 0.12s",
                  }}
                >
                  <span
                    className={cn("ti", item.icon)}
                    style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile footer */}
      <div
        className="flex items-center"
        style={{
          borderTop: "1px solid #F3EFF4",
          marginTop: 16,
          paddingTop: 14,
          gap: 10,
        }}
      >
        <span
          className="flex items-center justify-center shrink-0 font-bold font-mono"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "#7C5FAE",
            color: "#fff",
            fontSize: 12,
          }}
          aria-hidden="true"
        >
          {initials}
        </span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 10, fontWeight: 500, color: "#8A8394" }}>{subtitle}</div>
        </div>
      </div>
    </aside>
  );
}
