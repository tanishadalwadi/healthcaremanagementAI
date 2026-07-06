/**
 * /admin/doctors — Doctor roster detail page
 *
 * All doctors with specialty and current admitted-patient count.
 * Patient count is derived from careTeam assignments on ALL_PATIENTS
 * (non-discharged) via getDoctorsWithCounts() in api.ts.
 *
 * Sorted by patient count descending so the busiest doctors appear first.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDoctorsWithCounts, type DoctorWithCount } from "@/lib/api";

// ─── Specialty accent colors (reuses app palette, no purple for status) ───────

const SPECIALTY_COLOR: Record<string, string> = {
  "Cardiology":          "#E05252",
  "General Medicine":    "#4FB5A8",
  "ICU / Critical Care": "#E08A4F",
  "Orthopedics":         "#7C5FAE",
  "Radiology":           "#2D7A72",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoctorsWithCounts().then((d) => {
      // Sort: busiest first, alpha tiebreak
      const sorted = [...d].sort((a, b) =>
        b.patientCount - a.patientCount || a.name.localeCompare(b.name)
      );
      setDoctors(sorted);
      setLoading(false);
    });
  }, []);

  const totalPatients = doctors.reduce((s, d) => s + d.patientCount, 0);

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
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
            Doctors on staff
          </h1>
        </div>
        {!loading && (
          <p style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", margin: 0, paddingLeft: 44 }}>
            {doctors.length} doctors · {totalPatients} current patient assignments
          </p>
        )}
      </div>

      {loading && (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
          Loading roster…
        </div>
      )}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {doctors.map((doc) => {
            const specialtyColor = SPECIALTY_COLOR[doc.specialty] ?? "#8A8394";

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between"
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "14px 18px",
                  border: "1.5px solid #F0ECF4",
                }}
              >
                {/* Left: avatar + name + specialty */}
                <div className="flex items-center" style={{ gap: 12 }}>
                  {/* Initials avatar */}
                  <div
                    className="flex items-center justify-center shrink-0 font-bold"
                    style={{
                      width: 40, height: 40, borderRadius: 11,
                      background: `${specialtyColor}18`,
                      color: specialtyColor, fontSize: 13,
                    }}
                    aria-hidden="true"
                  >
                    {doc.initials}
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1D1B2E" }}>
                      {doc.name}
                    </div>
                    <div className="flex items-center" style={{ gap: 6, marginTop: 2 }}>
                      <div
                        style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: specialtyColor, flexShrink: 0,
                        }}
                        aria-hidden="true"
                      />
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#8A8394" }}>
                        {doc.specialty}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: patient count */}
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em",
                      color: doc.patientCount > 0 ? "#1D1B2E" : "#C9BBDF",
                      lineHeight: 1,
                    }}
                  >
                    {doc.patientCount}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#8A8394", marginTop: 2 }}>
                    {doc.patientCount === 1 ? "patient" : "patients"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
