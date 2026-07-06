import { redirect } from "next/navigation";

/**
 * Root → /login.
 * Auth logic in /login will redirect already-logged-in users to their
 * role home (/nurse, /doctor, /admin).
 */
export default function RootPage() {
  redirect("/login");
}
