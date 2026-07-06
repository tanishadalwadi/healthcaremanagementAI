/**
 * /admin/beds — Bed inventory detail page
 *
 * All beds grouped by department. Available beds shown first within each
 * group, then occupied. Occupied beds include patient name + status dot.
 *
 * Data source: getBedInventory() — reads ALL_BEDS joined with ALL_PATIENTS.
 * Same in-memory data as the KPI card, so the count always matches.
 *
 * Client component — useEffect fetch pattern consistent with other admin pages.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBedInventory, type BedWithPatient } from "@/lib/api";
import type { Department } from "@/types";

// ─── Department order (consistent with rest of app) ───────────────────────────

const DEPT_ORDER: Department[] = [
  "Cardiology",
  "General Medicine",
  "ICU",
  "Orthopedics",
  "Radiology",
];

const DEPT_ACCENT: Record<Department, { color: string; tint: string }> = {
  "Cardiology":       { color: "#E05252", tint: "#FDEAEA" },
  "General Medicine": { color: "#4FB5A8", tint: "#E1F3F0" },
  "ICU":              { color: "#E08A4F", tint: "#FBE9DA" },
  "Orthopedics":      { color: "#7C5FAE", tint: "#EFE7F7" },
  "Radiology":        { color: "#2D7A72", tint: "#E1F3F0" },
};

const STATUS_DOT: Record<string, string> = {
  ontrack:  "#4FB5A8",
  delayed:  "#E08A4F",
  blocked:  "#E05252",
  critical: "#B91C1C",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BedsPage() {
  const [beds,    setBeds]    = useState<BedWithPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBedInventory().then((b) => { setBeds(b); setLoading(false); });
  }, []);

  // Group by department
  const byDept = DEPT_ORDER.reduce<Record<string, BedWithPatient[]>>((acc, dept) => {
    acc[dept] = beds
      .filter((b) => b.department === dept)
      // available first, then occupied
      .sort((a, b) => (a.status === "available" ? -1 : 1));
    return acc;
  }, {});

  const totalBeds      = beds.length;
  const availableBeds  = beds.filter((b) => b.status === "available").length;
  const occupiedBeds   = beds.filter((b) => b.status === "occupied").length;

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between" style={{ marginBottom: 20 }}>
        <div>
          <div className="flex items-center" style={{ gap: 10, marginBottom: 4 }}>
            <Link
              href="/admin"
              className="flex items-center justify-center shrink-0"
              style={{
                width: 34, height: 34, borderRadius: 9,
                border: "1.5px solid #E7E0E9", background: "#fff",
                color: "#6B6474", textDecoration: "none",
              }}
              aria-label="Back to dashboard"
            >
              <span className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden="true" />
            </Link>
            <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
              Bed inventory
            </h1>
          </div>
          {!loading && (
            <p style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", margin: 0, paddingLeft: 44 }}>
              {availableBeds} available · {occupiedBeds} occupied · {totalBeds} total
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
          Loading bed inventory…
        </div>
      )}

      {/* ── Department sections ───────────────────────────────────────────── */}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {DEPT_ORDER.map((dept) => {
            const deptBeds = byDept[dept] ?? [];
            if (deptBeds.length === 0) return null;
            const avail = deptBeds.filter((b) => b.status === "available").length;
            const { color, tint } = DEPT_ACCENT[dept];

            return (
              <div key={dept}>
                {/* Dept header */}
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: 8 }}
                >
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <div
                      style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: color, flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1B2E" }}>
                      {dept}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#8A8394" }}>
                    {avail} / {deptBeds.length} available
                  </span>
                </div>

                {/* Bed grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: 10,
                  }}
                >
                  {deptBeds.map((bed) => {
                    const isAvailable = bed.status === "available";
                    return (
                      <div
                        key={bed.id}
                        style={{
                          background: isAvailable ? "#fff" : "#EFEBEF",
                          borderRadius: 10,
                          padding: "12px 14px",
                          border: "1.5px solid #F0ECF4",
                        }}
                      >
                        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1D1B2E" }}>
                            {bed.roomLabel}
                          </span>
                          {/* Status chip */}
                          <span
                            style={{
                              fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                              textTransform: "uppercase",
                              padding: "2px 6px", borderRadius: 4,
                              background: isAvailable ? "#E1F3F0" : "#E0DCE4",
                              color: isAvailable ? "#2D7A72" : "#6B6474",
                            }}
                          >
                            {isAvailable ? "Available" : "Occupied"}
                          </span>
                        </div>

                        {/* Patient info (occupied beds only) */}
                        {!isAvailable && bed.patientName && (
                          <div className="flex items-center" style={{ gap: 5 }}>
                            {bed.patientStatus && (
                              <div
                                style={{
                                  width: 6, height: 6, borderRadius: "50%",
                                  background: STATUS_DOT[bed.patientStatus] ?? "#8A8394",
                                  flexShrink: 0,
                                }}
                                aria-hidden="true"
                              />
                            )}
                            <span style={{ fontSize: 11, fontWeight: 500, color: "#6B6474" }}>
                              {bed.patientName}
                            </span>
                          </div>
                        )}

                        {isAvailable && (
                          <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394" }}>
                            Ready to assign
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
