/**
 * RosterSection — patients grouped by department.
 *
 * Spec:
 *   Header: 15px/600 title, muted count label
 *   Dept groups: gap:18px between groups
 *   Dept label row: 10px/600/uppercase/letter-spacing:0.14em, muted;
 *                   count in #B7B0BD; flex-1 divider line (height:1px, #ECE6EE)
 *   Patient cards grid: repeat(3,1fr), gap:12px
 *
 *   Patient card:
 *     bg:#FFFFFF, border:1px solid #EEE8EF
 *     border-left: 3px solid (status color — transparent for ontrack/delayed)
 *     border-radius:14px, padding:13px 15px
 *     Avatar: 36×36, radius:11, bg:#EFE7F7, text:#7C5FAE, 12px/700
 *     Name: 13px/600, truncate; room·day: 10px/400 muted
 *     Status: badge (20px height, radius:5) for blocked/critical;
 *             dot (9×9px circle) for ontrack/delayed
 *
 * Server component.
 */

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Patient, PatientStatus, Department } from "@/types";

// ─── Status config ────────────────────────────────────────────────────────────

const LEFT_BORDER: Record<PatientStatus, string> = {
  ontrack:  "transparent",
  delayed:  "transparent",
  blocked:  "#4A4458",
  critical: "#DC2626",
};

const DOT_COLOR: Record<PatientStatus, string> = {
  ontrack:  "#4FB5A8",
  delayed:  "#E08A4F",
  blocked:  "#8A8394",
  critical: "#DC2626",
};

const BADGE: Partial<Record<PatientStatus, { bg: string; text: string; label: string }>> = {
  blocked:  { bg: "#EFEBEF", text: "#4A4458", label: "Blocked"  },
  critical: { bg: "#F8DFDB", text: "#A83F2F", label: "Critical" },
};

// ─── Patient mini-card ────────────────────────────────────────────────────────

function PatientMiniCard({ patient }: { patient: Patient }) {
  const badge = BADGE[patient.status];
  const borderLeft = LEFT_BORDER[patient.status];
  const dotColor = DOT_COLOR[patient.status];

  return (
    <Link
      href={`/patients/${patient.id}`}
      className="flex items-center"
      style={{
        gap: 11,
        background: "#FFFFFF",
        border: "1px solid #EEE8EF",
        borderLeft: `3px solid ${borderLeft}`,
        borderRadius: 14,
        padding: "13px 15px",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.12s",
      }}
    >
      {/* Avatar */}
      <span
        className="flex items-center justify-center shrink-0 font-bold"
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          background: "#EFE7F7",
          color: "#7C5FAE",
          fontSize: 12,
        }}
        aria-hidden="true"
      >
        {patient.initials}
      </span>

      {/* Name + room / day */}
      <span className="flex-1 min-w-0 block">
        <span
          className="block truncate"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          {patient.name}
        </span>
        <span
          className="block"
          style={{ fontSize: 10, fontWeight: 400, color: "#8A8394", marginTop: 1 }}
        >
          {patient.room} · Day {patient.dayOfStay}
        </span>
      </span>

      {/* Status indicator */}
      {badge ? (
        <span
          className="shrink-0"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 20,
            padding: "0 8px",
            borderRadius: 5,
            background: badge.bg,
            color: badge.text,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {badge.label}
        </span>
      ) : (
        <span
          className="shrink-0 rounded-full"
          style={{ width: 9, height: 9, background: dotColor, display: "inline-block" }}
          aria-label={patient.status === "ontrack" ? "On track" : "Delayed"}
        />
      )}
    </Link>
  );
}

// ─── RosterSection ────────────────────────────────────────────────────────────

export interface DeptGroup {
  dept: Department;
  patients: Patient[];
}

interface RosterSectionProps {
  groups: DeptGroup[];
  totalPatients: number;
}

export function RosterSection({ groups, totalPatients }: RosterSectionProps) {
  const deptCount = groups.length;

  return (
    <section aria-labelledby="roster-heading">
      {/* Section header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 14 }}
      >
        <h2
          id="roster-heading"
          style={{ fontSize: 15, fontWeight: 600, margin: 0 }}
        >
          Roster by department
        </h2>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#8A8394" }}>
          {totalPatients} patient{totalPatients !== 1 ? "s" : ""} · {deptCount} department{deptCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Department groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {groups.map(({ dept, patients }) => (
          <div key={dept}>
            {/* Dept label + divider */}
            <div
              className="flex items-center"
              style={{ gap: 8, marginBottom: 10 }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#8A8394",
                  whiteSpace: "nowrap",
                }}
              >
                {dept}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#B7B0BD" }}>
                {patients.length}
              </span>
              {/* Divider */}
              <span
                className="flex-1"
                style={{ height: 1, background: "#ECE6EE" }}
                aria-hidden="true"
              />
            </div>

            {/* 3-column patient card grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {patients.map((p) => (
                <PatientMiniCard key={p.id} patient={p} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
