/**
 * Dashboard layout shell — Phase 4
 *
 * Structure:
 *   <TopChrome />  — sticky, full-bleed, z-40
 *   <div max-width=1360 padded>
 *     <grid 212px + 1fr, gap 22px>
 *       <Sidebar />   ← col 1, sticky top:88
 *       <main>        ← col 2
 *         {children}
 *       </main>
 *     </grid>
 *   </div>
 */

/**
 * /dashboard layout — now a thin authenticated shell.
 *
 * /dashboard itself redirects to the role's home (see page.tsx).
 * /dashboard/notifications is the only real child route here —
 * linked from both nurse and admin sidebars.
 *
 * AuthGuard with no requiredRole: any authenticated user can access
 * /dashboard/notifications; unauthenticated users go to /login.
 */

import { TopChrome } from "@/components/layout/top-chrome";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <TopChrome />
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "212px 1fr",
            gap: 22,
            alignItems: "start",
          }}
        >
          <Sidebar />
          <main>{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
