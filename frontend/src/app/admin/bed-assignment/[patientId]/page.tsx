/**
 * Bed assignment — /admin/bed-assignment/[patientId]
 *
 * Focused step in the intake flow: admin picks an available bed for a
 * newly admitted patient. Accessible via "Assign bed →" in the
 * CreatePatientModal success state.
 *
 * Inherits /admin/layout.tsx (TopChrome + Sidebar + admin auth guard).
 *
 * Data consistency: getAvailableBeds() and assignBed() both read/write
 * ALL_BEDS in the browser's module instance — same array the admin
 * dashboard reads for its KPI counts via getAllBeds(). No server
 * components involved, so the assignment is immediately reflected
 * everywhere in the same session.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPatientById, getAvailableBeds, assignBed } from "@/lib/api";
import type { PatientDetail, Bed, Department } from "@/types";

// ─── Department filter tabs ───────────────────────────────────────────────────

const ALL_DEPTS: Department[] = [
  "Cardiology",
  "General Medicine",
  "ICU",
  "Orthopedics",
  "Radiology",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEPT_ABBR: Record<Department, string> = {
  "Cardiology":      "Cardio",
  "General Medicine": "Gen Med",
  "ICU":             "ICU",
  "Orthopedics":     "Ortho",
  "Radiology":       "Radiology",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BedAssignmentPage() {
  const params = useParams() as { patientId: string };
  const router = useRouter();

  const [patient,       setPatient]       = useState<PatientDetail | null>(null);
  const [allBeds,       setAllBeds]       = useState<Bed[]>([]);
  const [deptFilter,    setDeptFilter]    = useState<Department | "All">("All");
  const [selectedBedId, setSelectedBedId] = useState<string>("");
  const [assigning,     setAssigning]     = useState(false);
  const [done,          setDone]          = useState(false);
  const [assignedRoom,  setAssignedRoom]  = useState("");

  // Load patient + all available beds
  useEffect(() => {
    if (!params.patientId) return;
    Promise.all([
      getPatientById(params.patientId),
      getAvailableBeds(),
    ]).then(([p, beds]) => {
      if (!p) { router.replace("/admin"); return; }
      setPatient(p);
      setAllBeds(beds);
      // Pre-select the patient's own department in the filter
      setDeptFilter(p.departmentId);
    });
  }, [params.patientId, router]);

  // Filtered bed list
  const visibleBeds = deptFilter === "All"
    ? allBeds
    : allBeds.filter((b) => b.department === deptFilter);

  const selectedBed = allBeds.find((b) => b.id === selectedBedId);

  const handleAssign = useCallback(async () => {
    if (!selectedBedId || !patient) return;
    setAssigning(true);
    await assignBed(patient.id, selectedBedId);
    setAssignedRoom(selectedBed?.roomLabel ?? "");
    setAssigning(false);
    setDone(true);
  }, [selectedBedId, patient, selectedBed]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!patient) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", paddingTop: 32 }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: "32px 28px", textAlign: "center" }}>
          <div
            className="flex items-center justify-center"
            style={{ width: 56, height: 56, borderRadius: 16, background: "#E1F3F0", margin: "0 auto 16px" }}
          >
            <span className="ti ti-building-hospital" style={{ fontSize: 28, color: "#2D7A72" }} aria-hidden="true" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
            Bed assigned
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#8A8394", marginBottom: 24 }}>
            {patient.name} is now in <strong style={{ color: "#1D1B2E" }}>{assignedRoom}</strong>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href={`/patients/${patient.id}`}
              style={{
                display: "block", padding: "11px 0", borderRadius: 12,
                background: "#EFE7F7", fontSize: 13, fontWeight: 600,
                color: "#7C5FAE", textDecoration: "none",
              }}
            >
              View patient record →
            </Link>
            <Link
              href="/admin"
              style={{
                display: "block", padding: "11px 0", borderRadius: 12,
                background: "#7C5FAE", fontSize: 13, fontWeight: 600,
                color: "#fff", textDecoration: "none",
              }}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center" style={{ gap: 14, marginBottom: 22 }}>
        <Link
          href="/admin"
          className="flex items-center justify-center shrink-0"
          style={{
            width: 38, height: 38, borderRadius: 10,
            border: "1.5px solid #E7E0E9", background: "#fff",
            color: "#6B6474", textDecoration: "none",
          }}
          aria-label="Back to dashboard"
        >
          <span className="ti ti-arrow-left" style={{ fontSize: 18 }} aria-hidden="true" />
        </Link>

        <span
          className="flex items-center justify-center shrink-0 font-bold"
          style={{
            width: 42, height: 42, borderRadius: 12,
            background: "#EFE7F7", color: "#7C5FAE", fontSize: 14,
          }}
          aria-hidden="true"
        >
          {patient.initials}
        </span>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
              Assign bed — {patient.name}
            </h1>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", marginTop: 2 }}>
            {patient.departmentId} · {patient.diagnosis}
          </div>
        </div>
      </div>

      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

        {/* ── Left: bed picker ──────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "20px 22px" }}>

          {/* Department filter */}
          <div
            style={{
              display: "flex", gap: 6, marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {(["All", ...ALL_DEPTS] as const).map((d) => {
              const active = deptFilter === d;
              const label  = d === "All" ? "All" : DEPT_ABBR[d];
              return (
                <button
                  key={d} type="button"
                  onClick={() => { setDeptFilter(d as Department | "All"); setSelectedBedId(""); }}
                  style={{
                    fontSize: 11, fontWeight: 600,
                    padding: "5px 12px", borderRadius: 999,
                    border: active ? "1.5px solid #7C5FAE" : "1.5px solid #E7E0E9",
                    background: active ? "#EFE7F7" : "transparent",
                    color: active ? "#7C5FAE" : "#6B6474",
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.12s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Bed grid */}
          {visibleBeds.length === 0 ? (
            <div
              className="flex flex-col items-center"
              style={{ padding: "40px 0", color: "#8A8394", textAlign: "center" }}
            >
              <span className="ti ti-bed" style={{ fontSize: 28, color: "#DDD4EE", marginBottom: 10 }} aria-hidden="true" />
              <div style={{ fontSize: 13, fontWeight: 600, color: "#6B6474" }}>No available beds</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {deptFilter === "All" ? "All beds are currently occupied." : `No available beds in ${deptFilter}.`}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              {visibleBeds.map((bed) => {
                const selected = selectedBedId === bed.id;
                return (
                  <button
                    key={bed.id}
                    type="button"
                    onClick={() => setSelectedBedId(selected ? "" : bed.id)}
                    style={{
                      padding: "14px 12px",
                      borderRadius: 12,
                      border: selected ? "2px solid #7C5FAE" : "1.5px solid #E7E0E9",
                      background: selected ? "#F8F5FD" : "#F6F1F1",
                      cursor: "pointer", fontFamily: "inherit",
                      textAlign: "left", transition: "all 0.12s",
                    }}
                  >
                    {/* Bed icon */}
                    <span
                      className="ti ti-bed"
                      style={{
                        fontSize: 20,
                        color: selected ? "#7C5FAE" : "#C9BBDF",
                        display: "block",
                        marginBottom: 8,
                      }}
                      aria-hidden="true"
                    />
                    {/* Room label */}
                    <div style={{
                      fontSize: 15, fontWeight: 700,
                      color: selected ? "#7C5FAE" : "#1D1B2E",
                      letterSpacing: "-0.01em",
                    }}>
                      {bed.roomLabel}
                    </div>
                    {/* Dept badge */}
                    <div style={{
                      fontSize: 10, fontWeight: 600,
                      color: selected ? "#7C5FAE" : "#8A8394",
                      marginTop: 2,
                    }}>
                      {DEPT_ABBR[bed.department]}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: summary + confirm ──────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Patient info card */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#8A8394", margin: "0 0 10px",
            }}>
              Patient
            </p>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{patient.name}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394", marginTop: 2 }}>
              Age {patient.age} · {patient.sex === "M" ? "Male" : patient.sex === "F" ? "Female" : "Other"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394" }}>
              {patient.departmentId}
            </div>
            <div style={{
              marginTop: 10, padding: "8px 10px",
              background: "#F6F1F1", borderRadius: 8,
              fontSize: 11, fontWeight: 500, color: "#4A4458", lineHeight: 1.4,
            }}>
              {patient.diagnosis}
            </div>
          </div>

          {/* Selected bed summary */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#8A8394", margin: "0 0 10px",
            }}>
              Selected bed
            </p>

            {selectedBed ? (
              <>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#7C5FAE" }}>
                  {selectedBed.roomLabel}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394", marginTop: 2 }}>
                  {selectedBed.department}
                </div>
                <div style={{
                  marginTop: 10, padding: "6px 10px",
                  background: "#E1F3F0", borderRadius: 8,
                  fontSize: 11, fontWeight: 600, color: "#2D7A72",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}>
                  <span className="ti ti-circle-check" style={{ fontSize: 13 }} aria-hidden="true" />
                  Available
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, fontWeight: 500, color: "#C9BBDF" }}>
                Select a bed from the list
              </div>
            )}
          </div>

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedBedId || assigning}
            style={{
              width: "100%",
              background: !selectedBedId || assigning ? "#EFEBEF" : "#7C5FAE",
              border: "none", borderRadius: 12,
              padding: "13px 0",
              fontSize: 13, fontWeight: 600,
              color: !selectedBedId || assigning ? "#8A8394" : "#fff",
              cursor: !selectedBedId || assigning ? "default" : "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.15s",
            }}
          >
            {assigning && (
              <span className="ti ti-loader-2" style={{ fontSize: 15, animation: "spin 0.7s linear infinite" }} aria-hidden="true" />
            )}
            {assigning ? "Assigning…" : selectedBedId ? `Assign ${selectedBed?.roomLabel}` : "Select a bed"}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
