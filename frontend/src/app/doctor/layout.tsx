/**
 * Doctor layout — single centered column, no sidebar.
 *
 * The doctor experience is a chat-first panel (max-width 760px, centered).
 * TopChrome is already rendered by the root layout.
 */

import { TopChrome } from "@/components/layout/top-chrome";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="doctor">
      <TopChrome />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        {children}
      </div>
    </AuthGuard>
  );
}
