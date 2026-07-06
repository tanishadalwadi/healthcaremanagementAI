/**
 * /dashboard — role-based redirect.
 *
 * This route has no content of its own. It exists only so that
 * /dashboard/notifications (shared notification page used by both
 * nurse and admin sidebars) has a layout shell to inherit from.
 *
 * Any visit to /dashboard itself is immediately redirected to the
 * correct role home. Unauthenticated users are caught by the
 * AuthGuard in layout.tsx before reaching this page.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function DashboardIndexPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (user.role === "admin") router.replace("/admin");
    else if (user.role === "doctor") router.replace("/doctor");
    else router.replace("/nurse");
  }, [user, router]);

  // Render nothing — the redirect fires on mount
  return null;
}
