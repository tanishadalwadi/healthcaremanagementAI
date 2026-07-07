import { TopChrome } from "@/components/layout/top-chrome";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";

export function SidebarShell({ children }: { children: React.ReactNode }) {
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
