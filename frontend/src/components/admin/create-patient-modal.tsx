/**
 * CreatePatientModal — two-step intake form for the Admin dashboard.
 *
 * Step 1: Patient details (name, age, sex, department, chief complaint,
 *         medications, allergies, needs admission flag)
 * Step 2: Attending doctor assignment
 * Done:   Success confirmation + "View patient" / "Assign bed" actions
 *
 * Calls createPatient() from api.ts which mutates ALL_PATIENTS in-memory
 * (same pattern as addTreatmentItem / addLabOrder).
 * The "Assign bed" path is a placeholder route wired in 9B.
 *
 * Visual language: modal-shadow (the only permitted shadow), existing
 * design tokens, no new hex values, no new libraries.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDoctors, createPatient, type IntakeFormData } from "@/lib/api";
import type { Doctor, Department } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS: Department[] = [
  "Cardiology",
  "General Medicine",
  "ICU",
  "Orthopedics",
  "Radiology",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 600, color: "#6B6474", display: "block", marginBottom: 5 }}>
      {children}
      {required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg: string | undefined }) {
  if (!msg) return null;
  return <p style={{ fontSize: 10, color: "#DC2626", marginTop: 3 }}>{msg}</p>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase", color: "#8A8394", margin: "0 0 10px",
    }}>
      {children}
    </p>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center" style={{ gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{
            width: i === current ? 20 : 7,
            height: 7,
            borderRadius: 999,
            background: i === current ? "#7C5FAE" : "#DDD4EE",
            transition: "width 0.2s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreatePatientModalProps {
  onClose: () => void;
  onCreated: (patientId: string, needsAdmission: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreatePatientModal({ onClose, onCreated }: CreatePatientModalProps) {
  // ── Form state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState<0 | 1 | "done">(0);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Step 1 fields
  const [name,            setName]            = useState("");
  const [age,             setAge]             = useState("");
  const [sex,             setSex]             = useState<"M" | "F" | "Other">("M");
  const [department,      setDepartment]      = useState<Department>("General Medicine");
  const [chiefComplaint,  setChiefComplaint]  = useState("");
  const [medications,     setMedications]     = useState("");
  const [allergies,       setAllergies]       = useState("");
  const [needsAdmission,  setNeedsAdmission]  = useState(true);

  // Step 2
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [createdId,  setCreatedId]  = useState("");
  const [createdNeedsAdmission, setCreatedNeedsAdmission] = useState(false);

  // ── Load doctors on mount ────────────────────────────────────────────────────
  useEffect(() => {
    getDoctors().then(setDoctors);
  }, []);

  // ── Keyboard close ───────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Step 1 validation ─────────────────────────────────────────────────────────
  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required";
    const ageN = Number(age);
    if (!age || isNaN(ageN) || ageN < 1 || ageN > 120) errs.age = "Enter a valid age (1–120)";
    if (!chiefComplaint.trim()) errs.chiefComplaint = "Chief complaint is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleStep1Next(e: React.FormEvent) {
    e.preventDefault();
    if (validateStep1()) setStep(1);
  }

  // ── Step 2 submission ─────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDoctorId) {
      setErrors({ doctor: "Select an attending doctor" });
      return;
    }
    setErrors({});
    setSubmitting(true);

    const data: IntakeFormData = {
      name:           name.trim(),
      age:            Number(age),
      sex,
      department,
      chiefComplaint: chiefComplaint.trim(),
      medications:    medications.trim() || undefined,
      allergies:      allergies.trim()   || undefined,
      needsAdmission,
      doctorId:       selectedDoctorId,
    };

    const pid = await createPatient(data);
    setCreatedId(pid);
    setCreatedNeedsAdmission(needsAdmission);
    setSubmitting(false);
    setStep("done");
    onCreated(pid, needsAdmission);
  }

  // ── Shared focus/blur handlers ────────────────────────────────────────────────
  const focusBorder  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    { e.currentTarget.style.borderColor = "#7C5FAE"; };
  const blurBorder   = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, hasErr: boolean) =>
    { e.currentTarget.style.borderColor = hasErr ? "#DC2626" : "#E7E0E9"; };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Overlay */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create new patient"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(29,27,46,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        {/* Card — stop propagation so clicking inside doesn't close */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: 20,
            width: "100%",
            maxWidth: 560,
            maxHeight: "calc(100vh - 48px)",
            overflowY: "auto",
            boxShadow: "0 24px 60px -12px rgba(29,27,46,0.4)",
          }}
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between"
            style={{ padding: "20px 24px 0" }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>
                {step === "done" ? "Patient registered" : "Create new patient"}
              </div>
              {step !== "done" && (
                <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394", marginTop: 2 }}>
                  {step === 0 ? "Patient details" : "Doctor assignment"}
                </div>
              )}
            </div>
            <div className="flex items-center" style={{ gap: 14 }}>
              {step !== "done" && <StepDots current={step} total={2} />}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: "#F6F1F1", border: "none", borderRadius: 9,
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#6B6474",
                }}
              >
                <span className="ti ti-x" style={{ fontSize: 17 }} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div style={{ height: 1, background: "#F3EFF4", margin: "16px 0 0" }} />

          {/* ── Step 1: Patient details ──────────────────────────────────────── */}
          {step === 0 && (
            <form onSubmit={handleStep1Next} style={{ padding: "20px 24px 24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Name */}
                <div>
                  <Label required>Full name</Label>
                  <input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                    placeholder="e.g. Jane Doe"
                    style={inputStyle(!!errors.name)}
                    onFocus={focusBorder}
                    onBlur={(e) => blurBorder(e, !!errors.name)}
                  />
                  <FieldError msg={errors.name} />
                </div>

                {/* Age + Sex row */}
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12 }}>
                  <div>
                    <Label required>Age</Label>
                    <input
                      type="number" min={1} max={120}
                      value={age}
                      onChange={(e) => { setAge(e.target.value); setErrors((p) => ({ ...p, age: "" })); }}
                      placeholder="—"
                      style={{ ...inputStyle(!!errors.age), textAlign: "center" }}
                      onFocus={focusBorder}
                      onBlur={(e) => blurBorder(e, !!errors.age)}
                    />
                    <FieldError msg={errors.age} />
                  </div>
                  <div>
                    <Label>Sex</Label>
                    <div className="flex" style={{ gap: 8, paddingTop: 1 }}>
                      {(["M", "F", "Other"] as const).map((s) => (
                        <button
                          key={s} type="button"
                          onClick={() => setSex(s)}
                          style={{
                            flex: 1, padding: "9px 0",
                            borderRadius: 10, fontFamily: "inherit",
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                            border: sex === s ? "2px solid #7C5FAE" : "1.5px solid #E7E0E9",
                            background: sex === s ? "#EFE7F7" : "transparent",
                            color: sex === s ? "#7C5FAE" : "#8A8394",
                            transition: "all 0.12s",
                          }}
                        >
                          {s === "M" ? "Male" : s === "F" ? "Female" : "Other"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <Label>Department</Label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    style={{ ...inputStyle(), cursor: "pointer", appearance: "auto" }}
                    onFocus={focusBorder}
                    onBlur={(e) => blurBorder(e, false)}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Chief complaint */}
                <div>
                  <Label required>Chief complaint</Label>
                  <textarea
                    value={chiefComplaint}
                    onChange={(e) => { setChiefComplaint(e.target.value); setErrors((p) => ({ ...p, chiefComplaint: "" })); }}
                    placeholder="Describe the primary reason for this visit…"
                    rows={3}
                    style={{
                      ...inputStyle(!!errors.chiefComplaint),
                      resize: "vertical", lineHeight: 1.5,
                    }}
                    onFocus={focusBorder}
                    onBlur={(e) => blurBorder(e, !!errors.chiefComplaint)}
                  />
                  <FieldError msg={errors.chiefComplaint} />
                </div>

                {/* Medications + Allergies row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <Label>Current medications</Label>
                    <input
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      placeholder="None known"
                      style={inputStyle()}
                      onFocus={focusBorder}
                      onBlur={(e) => blurBorder(e, false)}
                    />
                  </div>
                  <div>
                    <Label>Allergies</Label>
                    <input
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="None known"
                      style={inputStyle()}
                      onFocus={focusBorder}
                      onBlur={(e) => blurBorder(e, false)}
                    />
                  </div>
                </div>

                {/* Needs admission toggle */}
                <div style={{ borderTop: "1px solid #F3EFF4", paddingTop: 16 }}>
                  <SectionLabel>Admission</SectionLabel>
                  <button
                    type="button"
                    onClick={() => setNeedsAdmission((v) => !v)}
                    className="flex items-center"
                    style={{ gap: 12, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                  >
                    {/* Track */}
                    <span
                      style={{
                        flexShrink: 0, width: 40, height: 22, borderRadius: 999,
                        background: needsAdmission ? "#7C5FAE" : "#DDD4EE",
                        position: "relative", transition: "background 0.2s",
                        display: "inline-block",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute", top: 3,
                          left: needsAdmission ? 21 : 3,
                          width: 16, height: 16, borderRadius: "50%",
                          background: "#fff", transition: "left 0.2s",
                        }}
                      />
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1D1B2E" }}>
                        Needs admission
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394" }}>
                        {needsAdmission
                          ? "Patient will be admitted — bed assignment follows"
                          : "Outpatient — no bed required"}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between" style={{ marginTop: 24 }}>
                <button
                  type="button" onClick={onClose}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, color: "#8A8394", fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "#7C5FAE", border: "none", borderRadius: 10,
                    padding: "10px 22px", fontSize: 13, fontWeight: 600,
                    color: "#fff", cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 7,
                  }}
                >
                  Doctor assignment
                  <span className="ti ti-arrow-right" style={{ fontSize: 15 }} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: Doctor assignment ────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px" }}>
              <SectionLabel>Select attending physician</SectionLabel>
              {errors.doctor && (
                <p style={{ fontSize: 11, color: "#DC2626", marginBottom: 10 }}>{errors.doctor}</p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {doctors.map((doc) => {
                  const selected = selectedDoctorId === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => { setSelectedDoctorId(doc.id); setErrors({}); }}
                      className="flex items-center"
                      style={{
                        gap: 12, padding: "11px 14px", borderRadius: 12,
                        border: selected ? "2px solid #7C5FAE" : "1.5px solid #E7E0E9",
                        background: selected ? "#F8F5FD" : "#F6F1F1",
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                        transition: "all 0.12s",
                      }}
                    >
                      {/* Avatar */}
                      <span
                        className="flex items-center justify-center shrink-0 font-bold"
                        style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: selected ? "#EFE7F7" : "#E8E2EF",
                          color: selected ? "#7C5FAE" : "#8A8394",
                          fontSize: 12,
                        }}
                        aria-hidden="true"
                      >
                        {doc.initials}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: selected ? "#7C5FAE" : "#1D1B2E" }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394" }}>
                          {doc.specialty} · Attending
                        </div>
                      </div>
                      {selected && (
                        <span className="ti ti-circle-check-filled shrink-0"
                          style={{ fontSize: 20, color: "#7C5FAE" }} aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex items-center"
                  style={{
                    gap: 6, background: "none", border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, color: "#8A8394", fontFamily: "inherit",
                  }}
                >
                  <span className="ti ti-arrow-left" style={{ fontSize: 15 }} aria-hidden="true" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting ? "#A987CC" : "#7C5FAE",
                    border: "none", borderRadius: 10,
                    padding: "10px 22px", fontSize: 13, fontWeight: 600,
                    color: "#fff", cursor: submitting ? "default" : "pointer",
                    fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 7,
                  }}
                >
                  {submitting && (
                    <span className="ti ti-loader-2" style={{ fontSize: 15, animation: "spin 0.7s linear infinite" }} aria-hidden="true" />
                  )}
                  {submitting ? "Creating…" : "Create patient"}
                </button>
              </div>
            </form>
          )}

          {/* ── Done ────────────────────────────────────────────────────────── */}
          {step === "done" && (
            <div style={{ padding: "20px 24px 28px", textAlign: "center" }}>
              {/* Success icon */}
              <div
                className="flex items-center justify-center"
                style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: "#E1F3F0", margin: "0 auto 14px",
                }}
              >
                <span className="ti ti-circle-check" style={{ fontSize: 26, color: "#2D7A72" }} aria-hidden="true" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                {name} registered
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", marginBottom: 22 }}>
                Patient record created. {createdNeedsAdmission ? "Assign a bed to complete admission." : "Added as outpatient."}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link
                  href={`/patients/${createdId}`}
                  onClick={onClose}
                  style={{
                    display: "block", padding: "11px 0",
                    borderRadius: 12, background: "#EFE7F7",
                    fontSize: 13, fontWeight: 600, color: "#7C5FAE",
                    textDecoration: "none",
                  }}
                >
                  View patient record →
                </Link>

                {createdNeedsAdmission && (
                  <Link
                    href={`/admin/bed-assignment/${createdId}`}
                    onClick={onClose}
                    style={{
                      display: "block", padding: "11px 0",
                      borderRadius: 12, background: "#7C5FAE",
                      fontSize: 13, fontWeight: 600, color: "#fff",
                      textDecoration: "none",
                    }}
                  >
                    Assign bed →
                  </Link>
                )}

                <button
                  type="button" onClick={onClose}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 500, color: "#8A8394", fontFamily: "inherit",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
