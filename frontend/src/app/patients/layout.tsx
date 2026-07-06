/**
 * Patients layout — shared chrome for all /patients/* routes.
 * TopChrome only — no sidebar. PatientDetailView provides its own padding.
 */
import { TopChrome } from "@/components/layout/top-chrome";
import { AuthGuard } from "@/components/auth/auth-guard";

// No requiredRole here — nurse, doctor, and admin can all view patient detail.
export default function PatientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <TopChrome />
      {children}
    </AuthGuard>
  );
}
