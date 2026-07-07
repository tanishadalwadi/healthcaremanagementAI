import type { Doctor } from "@/types";

export interface BackendUserSummary {
  id: string;
  name: string;
  email: string;
  role: "NURSE" | "DOCTOR" | "ADMIN";
  active: boolean;
  departmentId?: string | null;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return (name[0] ?? "?").toUpperCase();
}

export function mapUserToDoctor(user: BackendUserSummary): Doctor {
  const specialty =
    user.name.toLowerCase().includes("cardio")
      ? "Cardiology"
      : user.name.toLowerCase().includes("icu")
        ? "ICU / Critical Care"
        : "General Medicine";

  return {
    id: user.id,
    name: user.name,
    initials: initialsFromName(user.name),
    specialty,
  };
}
