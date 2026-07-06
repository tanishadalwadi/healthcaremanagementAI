/**
 * AuthGuard — client component that redirects unauthenticated users to /login
 * and optionally enforces a specific role.
 *
 * Usage in a layout:
 *   <AuthGuard requiredRole="nurse">{children}</AuthGuard>
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/lib/auth";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // If a specific role is required and user has the wrong role,
    // redirect them to their own dashboard rather than showing a blank page.
    if (requiredRole && user.role !== requiredRole) {
      if (user.role === "nurse") router.replace("/nurse");
      else if (user.role === "doctor") router.replace("/doctor");
      else if (user.role === "admin") router.replace("/admin");
    }
  }, [user, loading, requiredRole, router]);

  // Render nothing while checking session (prevents flash of wrong content)
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6F1F1",
        }}
      >
        <span
          className="ti ti-loader-2"
          style={{
            fontSize: 24,
            color: "#7C5FAE",
            animation: "spin 0.7s linear infinite",
          }}
          aria-label="Loading…"
        />
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole && user.role !== requiredRole) return null;

  return <>{children}</>;
}
