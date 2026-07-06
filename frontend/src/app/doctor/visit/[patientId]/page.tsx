/**
 * Visit mode — /doctor/visit/[patientId]
 *
 * Focused single-patient view for the doctor during a ward visit.
 * Inherits the /doctor layout (TopChrome + 1100px wrapper, doctor auth guard).
 *
 * Client component: reads auth for doctor identity, fetches patient on mount,
 * manages treatment plan edits and lab orders entirely in local state +
 * in-memory writes (same pattern as postVitals).
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  getPatientById,
  updateTreatmentItem,
  addTreatmentItem,
  addLabOrder,
  type LabPriority,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PatientDetail, TreatmentPlanItem } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: LabPriority[] = ["Routine", "Urgent", "STAT"];

const PRIORITY_STYLE: Record<LabPriority, { bg: string; color: string }> = {
  Routine: { bg: "#F6F1F1", color: "#6B6474"  },
  Urgent:  { bg: "#FBE9DA", color: "#915730"  },
  STAT:    { bg: "#F8DFDB", color: "#A83F2F"  },
};

function inputStyle(hasError = false): React.CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box" as const,
    background: "#F6F1F1",
    border: `1.5px solid ${hasError ? "#DC2626" : "#E7E0E9"}`,
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "inherit",
    color: "#1D1B2E",
    outline: "none",
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase", color: "#8A8394", margin: "0 0 14px",
    }}>
      {children}
    </p>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 22px" }}>
      {children}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VisitPage() {
  const params   = useParams() as { patientId: string };
  const router   = useRouter();
  const { user } = useAuth();

  const [patient,  setPatient]  = useState<PatientDetail | null>(null);
  const [plan,     setPlan]     = useState<TreatmentPlanItem[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Treatment plan add form
  const [newItemText,  setNewItemText]  = useState("");
  const [addingItem,   setAddingItem]   = useState(false);
  const [itemSaved,    setItemSaved]    = useState(false);

  // Lab order form
  const [labName,      setLabName]      = useState("");
  const [labPriority,  setLabPriority]  = useState<LabPriority>("Routine");
  const [addingLab,    setAddingLab]    = useState(false);
  const [labSaved,     setLabSaved]     = useState(false);
  const [labLog,       setLabLog]       = useState<{ name: string; priority: LabPriority }[]>([]);
  const [labNameError, setLabNameError] = useState(false);

  const doctorName = user?.name ?? "Dr. Osei";

  useEffect(() => {
    if (!params.patientId) return;
    getPatientById(params.patientId).then((p) => {
      if (!p) { router.replace("/doctor"); return; }
      setPatient(p);
      setPlan([...p.treatmentPlan].sort((a, b) => a.order - b.order));
      // Re-derive lab log from in-memory data so it survives re-navigation.
      // occurrence === 999 is the sentinel set by addLabOrder for doctor-ordered labs.
      const doctorOrdered = p.workflowGroups
        .flatMap((g) => g.steps)
        .filter((s) => s.occurrence === 999)
        .map((s) => {
          // note format: "TestName — Priority"
          const parts = (s.note ?? "").split(" — ");
          const name = parts[0] ?? s.name;
          const priority = (parts[1] ?? "Routine") as LabPriority;
          return { name, priority };
        });
      setLabLog(doctorOrdered);
      setLoading(false);
    });
  }, [params.patientId, router]);

  // Toggle treatment item
  const handleToggle = useCallback(async (item: TreatmentPlanItem) => {
    const next = !item.completed;
    // Optimistic update
    setPlan((prev) =>
      prev.map((t) =>
        t.id === item.id
          ? { ...t, completed: next, completedAt: next ? new Date().toISOString() : null }
          : t
      )
    );
    await updateTreatmentItem(patient!.id, item.id, next);
  }, [patient]);

  // Add treatment plan item
  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemText.trim() || !patient) return;
    setAddingItem(true);
    const created = await addTreatmentItem(patient.id, newItemText.trim(), doctorName);
    setPlan((prev) => [...prev, created]);
    setNewItemText("");
    setAddingItem(false);
    setItemSaved(true);
    setTimeout(() => setItemSaved(false), 3000);
  }

  // Add lab order
  async function handleAddLab(e: React.FormEvent) {
    e.preventDefault();
    if (!labName.trim()) { setLabNameError(true); return; }
    if (!patient) return;
    setAddingLab(true);
    await addLabOrder(patient.id, labName.trim(), labPriority, doctorName);
    setLabLog((prev) => [{ name: labName.trim(), priority: labPriority }, ...prev]);
    setLabName("");
    setLabPriority("Routine");
    setAddingLab(false);
    setLabSaved(true);
    setTimeout(() => setLabSaved(false), 3000);
  }

  if (loading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
        Loading patient…
      </div>
    );
  }
  if (!patient) return null;

  const donePlan    = plan.filter((t) => t.completed).length;
  const totalPlan   = plan.length;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center" style={{ gap: 14, marginBottom: 22 }}>
        {/* Back */}
        <Link
          href="/doctor"
          className="flex items-center justify-center shrink-0"
          style={{
            width: 38, height: 38, borderRadius: 10,
            border: "1.5px solid #E7E0E9", background: "#fff",
            color: "#6B6474", textDecoration: "none",
          }}
          aria-label="Back to rounds"
        >
          <span className="ti ti-arrow-left" style={{ fontSize: 18 }} aria-hidden="true" />
        </Link>

        {/* Patient avatar */}
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

        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
              {patient.name}
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
              background: "#EFE7F7", color: "#7C5FAE",
            }}>
              Visit in progress
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", marginTop: 2 }}>
            {patient.room} · {patient.diagnosis} · Day {patient.dayOfStay}
          </div>
        </div>

        {/* View full record link */}
        <Link
          href={`/patients/${patient.id}`}
          style={{ fontSize: 12, fontWeight: 600, color: "#7C5FAE", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Full record →
        </Link>
      </div>

      {/* ── Two-column body ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Left: Treatment plan ──────────────────────────────────────────── */}
        <Panel>
          <SectionLabel>Treatment plan</SectionLabel>

          {/* Progress indicator */}
          <div className="flex items-center" style={{ gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 999, background: "#EFEBEF", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${totalPlan ? (donePlan / totalPlan) * 100 : 0}%`,
                background: "#7C5FAE", borderRadius: 999, transition: "width 0.25s ease",
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#8A8394", whiteSpace: "nowrap" }}>
              {donePlan}/{totalPlan} done
            </span>
          </div>

          {/* Existing items */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
            {plan.map((item, i) => (
              <div
                key={item.id}
                className="flex items-start"
                style={{
                  gap: 10, padding: "10px 0",
                  borderTop: i === 0 ? "none" : "1px solid #F3EFF4",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0, lineHeight: 1, marginTop: 1 }}
                  aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
                >
                  <span
                    className={cn("ti", item.completed ? "ti-circle-check-filled" : "ti-circle")}
                    style={{ fontSize: 20, color: item.completed ? "#7C5FAE" : "#CFC9D6" }}
                    aria-hidden="true"
                  />
                </button>
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: item.completed ? "#8A8394" : "#1D1B2E",
                  textDecoration: item.completed ? "line-through" : "none",
                  lineHeight: 1.4,
                }}>
                  {item.description}
                </span>
              </div>
            ))}
          </div>

          {/* Add item form */}
          <form onSubmit={handleAddItem} style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Add treatment plan item…"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              style={{ ...inputStyle(), flex: 1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#7C5FAE")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#E7E0E9")}
            />
            <button
              type="submit"
              disabled={addingItem || !newItemText.trim()}
              style={{
                background: addingItem || !newItemText.trim() ? "#EFEBEF" : "#7C5FAE",
                border: "none", borderRadius: 10,
                padding: "0 16px", fontSize: 12, fontWeight: 600,
                color: addingItem || !newItemText.trim() ? "#8A8394" : "#fff",
                cursor: addingItem || !newItemText.trim() ? "default" : "pointer",
                fontFamily: "inherit", whiteSpace: "nowrap", transition: "background 0.15s",
              }}
            >
              {addingItem ? "Adding…" : "Add"}
            </button>
          </form>

          {itemSaved && (
            <div className="flex items-center" style={{
              gap: 7, marginTop: 10, padding: "8px 12px",
              background: "#E1F3F0", borderRadius: 9,
              fontSize: 12, fontWeight: 500, color: "#2D7A72",
            }}>
              <span className="ti ti-circle-check" style={{ fontSize: 15 }} aria-hidden="true" />
              Item added — visible in patient record and routed to nurse.
            </div>
          )}
        </Panel>

        {/* ── Right: Lab orders ─────────────────────────────────────────────── */}
        <Panel>
          <SectionLabel>Lab &amp; test orders</SectionLabel>

          {/* Order form */}
          <form onSubmit={handleAddLab} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6B6474", display: "block", marginBottom: 4 }}>
                Test name
              </label>
              <input
                placeholder="e.g. Troponin repeat, CBC, BMP…"
                value={labName}
                onChange={(e) => { setLabName(e.target.value); setLabNameError(false); }}
                style={inputStyle(labNameError)}
                onFocus={(e) => { if (!labNameError) e.currentTarget.style.borderColor = "#7C5FAE"; }}
                onBlur={(e)  => { if (!labNameError) e.currentTarget.style.borderColor = "#E7E0E9"; }}
              />
              {labNameError && (
                <span style={{ fontSize: 10, color: "#DC2626" }}>Test name is required</span>
              )}
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6B6474", display: "block", marginBottom: 6 }}>
                Priority
              </label>
              <div className="flex" style={{ gap: 8 }}>
                {PRIORITY_OPTIONS.map((p) => {
                  const selected = labPriority === p;
                  const style = PRIORITY_STYLE[p];
                  return (
                    <button
                      key={p} type="button"
                      onClick={() => setLabPriority(p)}
                      style={{
                        flex: 1, padding: "8px 0",
                        borderRadius: 10, fontFamily: "inherit",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "all 0.12s",
                        border: selected ? `2px solid ${style.color}` : "1.5px solid #E7E0E9",
                        background: selected ? style.bg : "transparent",
                        color: selected ? style.color : "#8A8394",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={addingLab}
              style={{
                width: "100%", background: addingLab ? "#A987CC" : "#7C5FAE",
                border: "none", borderRadius: 10, padding: "11px 0",
                fontSize: 13, fontWeight: 600, color: "#fff",
                fontFamily: "inherit", cursor: addingLab ? "default" : "pointer",
                transition: "background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}
            >
              {addingLab && (
                <span className="ti ti-loader-2" style={{ fontSize: 15, animation: "spin 0.7s linear infinite" }} aria-hidden="true" />
              )}
              {addingLab ? "Ordering…" : "Place order"}
            </button>
          </form>

          {labSaved && (
            <div className="flex items-center" style={{
              gap: 7, marginTop: 12, padding: "8px 12px",
              background: "#E1F3F0", borderRadius: 9,
              fontSize: 12, fontWeight: 500, color: "#2D7A72",
            }}>
              <span className="ti ti-circle-check" style={{ fontSize: 15 }} aria-hidden="true" />
              Order placed — visible in patient timeline and routed to nurse.
            </div>
          )}

          {/* Log of orders placed this visit */}
          {labLog.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#8A8394", margin: "0 0 8px",
              }}>
                Ordered this visit
              </p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {labLog.map((entry, i) => {
                  const s = PRIORITY_STYLE[entry.priority];
                  return (
                    <div
                      key={i}
                      className="flex items-center"
                      style={{
                        gap: 10, padding: "8px 0",
                        borderTop: i === 0 ? "none" : "1px solid #F3EFF4",
                      }}
                    >
                      <span className="ti ti-flask shrink-0" style={{ fontSize: 16, color: "#C9BBDF" }} aria-hidden="true" />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{entry.name}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px",
                        borderRadius: 999, background: s.bg, color: s.color,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                      }}>
                        {entry.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Panel>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
