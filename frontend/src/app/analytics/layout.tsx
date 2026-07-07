import { SidebarShell } from "@/components/layout/sidebar-shell";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarShell>{children}</SidebarShell>;
}
