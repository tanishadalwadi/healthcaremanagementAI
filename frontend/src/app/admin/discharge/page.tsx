/**
 * /admin/discharge — Discharge request queue
 *
 * Shows all patients where the attending doctor has marked them ready for
 * discharge (dischargeRequested = true, dischargedAt = null).
 *
 * Each row:
 *   • Patient info chip (name, room, dept, day of stay)
 *   • DischargeReadinessChecklist — reused directly from Phase 3
 *   • "Review & approve" button — DISABLED unless all 5 conditions complete
 *
 * Clicking "Review & approve" opens DischargeApprovalModal which generates
 * the PDF + bill and presents "Finalize discharge" — the action that actually
 * frees the bed and marks the patient discharged.
 *
 * Client component — reads getDischargeQueue() which reads ALL_PATIENTS
 * (same browser-session in-memory data). refreshKey increments after
 * finalizeDischarge() so the queue re-fetches and the row disappears.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getDischargeQueue, updateDischargeCondition } from "@/lib/api";
import { DischargeReadinessChecklist } from "@/components/patient/discharge-checklist";
import { DischargeApprovalModal } from "@/components/admin/discharge-approval-modal";
import type { PatientDetail } from "@/types";

// ─── localStorage key — must match admin/page.tsx ────────────────────────────
const DISCHARGE_SEEN_KEY = "pulse_discharge_seen_count_morgan";

// ─── Date helper ──────────────────────────────────────────────────────────────

function fmtRelative(iso: string): string {
  const ms  = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 60)  return `${min}m ago`;
  const hr  = Math.floor(min / 60);
  if (hr  < 24)  return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DischargeQueuePage() {
  const [queue,      setQueue]      = useState<PatientDetail[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [reviewing,  setReviewing]  = useState<PatientDetail | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    getDischargeQueue().then((q) => {
      setQueue(q);
      setLoading(false);
      // Mark current count as "seen" so the badge on /admin clears
      try {
        localStorage.setItem(DISCHARGE_SEEN_KEY, String(q.length));
      } catch {
        // localStorage unavailable — safe to ignore
      }
    });
  }, [refreshKey]);

  const handleConditionToggle = useCallback(
    async (patientId: string, conditionId: string, complete: boolean) => {
      await updateDischargeCondition(conditionId, complete);
      setQueue((prev) =>
        prev.map((patient) =>
          patient.id !== patientId
            ? patient
            : {
                ...patient,
                dischargeConditions: patient.dischargeConditions.map((condition) =>
                  condition.id === conditionId
                    ? {
                        ...condition,
                        status: complete ? "complete" : "incomplete",
                        elapsedDisplay: complete ? null : condition.elapsedDisplay,
                      }
                    : condition,
                ),
              },
        ),
      );
    },
    [],
  );

  const handleFinalized = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <>
      <div>
        {/* ── Header ──────────────────────────────────────────────────────── */}
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
                Discharge queue
              </h1>
            </div>
            <p style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", margin: 0, paddingLeft: 44 }}>
              {loading ? "Loading…" : `${queue.length} patient${queue.length !== 1 ? "s" : ""} awaiting discharge approval`}
            </p>
          </div>
        </div>

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
            Loading discharge queue…
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!loading && queue.length === 0 && (
          <div
            className="flex flex-col items-center"
            style={{ padding: "80px 0", textAlign: "center" }}
          >
            <div
              className="flex items-center justify-center"
              style={{ width: 56, height: 56, borderRadius: 16, background: "#E1F3F0", marginBottom: 16 }}
            >
              <span className="ti ti-circle-check" style={{ fontSize: 28, color: "#2D7A72" }} aria-hidden="true" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1D1B2E", marginBottom: 6 }}>
              No pending discharge requests
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#8A8394" }}>
              When a doctor marks a patient ready for discharge, they&apos;ll appear here.
            </div>
          </div>
        )}

        {/* ── Queue rows ────────────────────────────────────────────────────── */}
        {!loading && queue.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {queue.map((patient) => {
              const allComplete    = patient.dischargeConditions.every((c) => c.status === "complete");
              const completeCount  = patient.dischargeConditions.filter((c) => c.status === "complete").length;
              const totalCount     = patient.dischargeConditions.length;

              return (
                <div
                  key={patient.id}
                  style={{ background: "#fff", borderRadius: 16, padding: "20px 22px" }}
                >
                  {/* ── Patient header ──────────────────────────────────── */}
                  <div
                    className="flex items-start justify-between"
                    style={{ marginBottom: 16 }}
                  >
                    <div className="flex items-center" style={{ gap: 12 }}>
                      {/* Avatar */}
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

                      <div>
                        <div className="flex items-center" style={{ gap: 10 }}>
                          <Link
                            href={`/patients/${patient.id}`}
                            style={{ fontSize: 14, fontWeight: 700, color: "#1D1B2E", textDecoration: "none" }}
                          >
                            {patient.name}
                          </Link>
                          {/* "Discharge requested" badge */}
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "3px 8px", borderRadius: 5,
                            background: "#FBE9DA", fontSize: 10, fontWeight: 700, color: "#9A6435",
                          }}>
                            <span className="ti ti-clock-check" style={{ fontSize: 12 }} aria-hidden="true" />
                            Ready for discharge
                          </span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394", marginTop: 2 }}>
                          {patient.room} · {patient.departmentId} · Day {patient.dayOfStay}
                          {patient.dischargeRequestedAt && (
                            <> · requested {fmtRelative(patient.dischargeRequestedAt)}</>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Approve button */}
                    <button
                      type="button"
                      onClick={() => setReviewing(patient)}
                      disabled={!allComplete}
                      title={!allComplete ? `${totalCount - completeCount} condition${totalCount - completeCount !== 1 ? "s" : ""} still outstanding` : "Review and approve discharge"}
                      style={{
                        background: allComplete ? "#2D7A72" : "#EFEBEF",
                        border: "none", borderRadius: 10,
                        padding: "10px 18px",
                        fontSize: 12, fontWeight: 600,
                        color: allComplete ? "#fff" : "#8A8394",
                        cursor: allComplete ? "pointer" : "not-allowed",
                        fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 7,
                        flexShrink: 0,
                        transition: "background 0.15s",
                      }}
                    >
                      <span className="ti ti-file-check" style={{ fontSize: 15 }} aria-hidden="true" />
                      {allComplete ? "Review & approve" : `${completeCount} / ${totalCount} complete`}
                    </button>
                  </div>

                  {/* ── Discharge checklist ──────────────────────────── */}
                  <div
                    style={{
                      background: "#F8F5FD",
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    <DischargeReadinessChecklist
                      conditions={patient.dischargeConditions}
                      patientStatus={patient.status}
                      editable
                      onToggle={(condition, complete) =>
                        handleConditionToggle(patient.id, condition.id, complete)
                      }
                    />
                  </div>

                  {/* ── AI summary ────────────────────────────────────── */}
                  {patient.aiSummary && (
                    <div
                      className="flex items-start"
                      style={{ gap: 8, marginTop: 12 }}
                    >
                      <span
                        className="ti ti-sparkles shrink-0"
                        style={{ fontSize: 13, color: "#7C5FAE", marginTop: 1 }}
                        aria-hidden="true"
                      />
                      <p style={{ fontSize: 11, fontWeight: 500, color: "#6B6474", margin: 0, lineHeight: 1.5 }}>
                        {patient.aiSummary}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Discharge approval modal ──────────────────────────────────────── */}
      {reviewing && (
        <DischargeApprovalModal
          patient={reviewing}
          onClose={() => setReviewing(null)}
          onFinalized={handleFinalized}
        />
      )}
    </>
  );
}
