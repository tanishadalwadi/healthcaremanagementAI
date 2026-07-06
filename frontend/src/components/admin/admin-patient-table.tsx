/**
 * AdminPatientTable — sortable hospital roster for the Admin dashboard.
 *
 * Replaces the department-grouped RosterSection on /admin, giving a single
 * unified view with column-level sort. Reuses existing Patient type and
 * status color tokens — no new hex values.
 *
 * Columns: Patient · Room · Department · Status · Day of stay · Admitted
 * Default sort: by clinical priority (critical → blocked → delayed → ontrack)
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Patient, PatientStatus } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "name" | "room" | "department" | "status" | "dayOfStay" | "admittedAt";
type SortDir = "asc" | "desc";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<PatientStatus, number> = {
  critical: 0, blocked: 1, delayed: 2, ontrack: 3,
};

const STATUS_CFG: Record<PatientStatus, { dot: string; label: string; badge?: string }> = {
  critical: { dot: "#DC2626", label: "Critical", badge: "#F8DFDB" },
  blocked:  { dot: "#8A8394", label: "Blocked",  badge: "#EFEBEF" },
  delayed:  { dot: "#E08A4F", label: "Delayed",  badge: undefined   },
  ontrack:  { dot: "#4FB5A8", label: "On track", badge: undefined   },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Column header ────────────────────────────────────────────────────────────

function ColHeader({
  label, sortKey, active, dir, onSort,
}: {
  label: string; sortKey: SortKey;
  active: boolean; dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        padding: "0 12px 10px",
        textAlign: "left",
        fontSize: 10, fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: active ? "#7C5FAE" : "#8A8394",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        borderBottom: "1px solid #F3EFF4",
      }}
    >
      {label}
      <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3 }}>
        {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </th>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AdminPatientTableProps {
  patients: Patient[];
}

export function AdminPatientTable({ patients }: AdminPatientTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...patients];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":       cmp = a.name.localeCompare(b.name); break;
        case "room":       cmp = a.room.localeCompare(b.room); break;
        case "department": cmp = a.departmentId.localeCompare(b.departmentId); break;
        case "status":     cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]; break;
        case "dayOfStay":  cmp = a.dayOfStay - b.dayOfStay; break;
        case "admittedAt": cmp = new Date(a.admittedAt).getTime() - new Date(b.admittedAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [patients, sortKey, sortDir]);

  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "18px 20px 0" }}
      >
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "#8A8394", margin: 0,
        }}>
          All patients — {patients.length} admitted
        </p>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <ColHeader label="Patient"    sortKey="name"       active={sortKey === "name"}       dir={sortDir} onSort={handleSort} />
              <ColHeader label="Room"       sortKey="room"       active={sortKey === "room"}       dir={sortDir} onSort={handleSort} />
              <ColHeader label="Department" sortKey="department" active={sortKey === "department"} dir={sortDir} onSort={handleSort} />
              <ColHeader label="Status"     sortKey="status"     active={sortKey === "status"}     dir={sortDir} onSort={handleSort} />
              <ColHeader label="Day"        sortKey="dayOfStay"  active={sortKey === "dayOfStay"}  dir={sortDir} onSort={handleSort} />
              <ColHeader label="Admitted"   sortKey="admittedAt" active={sortKey === "admittedAt"} dir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const cfg = STATUS_CFG[p.status];
              return (
                <tr
                  key={p.id}
                  style={{ borderTop: "1px solid #F3EFF4" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  {/* Patient */}
                  <td style={{ padding: "10px 12px" }}>
                    <Link
                      href={`/patients/${p.id}`}
                      className="flex items-center"
                      style={{ gap: 10, textDecoration: "none", color: "inherit" }}
                    >
                      <span
                        className="flex items-center justify-center shrink-0 font-bold"
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: "#EFE7F7", color: "#7C5FAE", fontSize: 11,
                        }}
                        aria-hidden="true"
                      >
                        {p.initials}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1D1B2E", whiteSpace: "nowrap" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 500, color: "#8A8394" }}>
                          {p.age} · {p.sex === "M" ? "M" : p.sex === "F" ? "F" : "O"}
                        </div>
                      </div>
                    </Link>
                  </td>

                  {/* Room */}
                  <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#4A4458", whiteSpace: "nowrap" }}>
                    {p.room}
                  </td>

                  {/* Department */}
                  <td style={{ padding: "10px 12px", fontSize: 11, fontWeight: 500, color: "#6B6474", whiteSpace: "nowrap" }}>
                    {p.departmentId}
                  </td>

                  {/* Status */}
                  <td style={{ padding: "10px 12px" }}>
                    {cfg.badge ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "2px 8px", borderRadius: 5,
                        background: cfg.badge, fontSize: 11, fontWeight: 700,
                        color: p.status === "critical" ? "#A83F2F" : "#4A4458",
                        whiteSpace: "nowrap",
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                        {cfg.label}
                      </span>
                    ) : (
                      <span className="flex items-center" style={{ gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 500, color: "#6B6474" }}>{cfg.label}</span>
                      </span>
                    )}
                  </td>

                  {/* Day of stay */}
                  <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#4A4458", textAlign: "center" }}>
                    {p.dayOfStay}
                  </td>

                  {/* Admitted */}
                  <td style={{ padding: "10px 12px", fontSize: 11, fontWeight: 500, color: "#8A8394", whiteSpace: "nowrap" }}>
                    {fmtDate(p.admittedAt)}
                  </td>
                </tr>
              );
            })}

            {patients.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "40px 20px", textAlign: "center", color: "#8A8394", fontSize: 12 }}>
                  No admitted patients
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
