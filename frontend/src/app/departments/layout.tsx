import { SidebarShell } from "@/components/layout/sidebar-shell";

export default function DepartmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarShell>{children}</SidebarShell>;
}
