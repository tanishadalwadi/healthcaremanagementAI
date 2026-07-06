/**
 * VitalsForm — nurse vitals entry panel.
 *
 * Spec:
 *   Container: bg #fff, radius 16, padding 20px 22px
 *   Patient selector: pill tabs if multiple patients, contextual if one
 *   Inputs: 5 fields (BP, Pulse, Temp, RR, O2 Sat) in a 2-col grid
 *   Submit: full-width #7C5FAE button
 *   On submit: calls postVitals(), shows inline confirmation row,
 *              clears form — no toast, no separate screen. The submitted
 *              entry is appended to the patient's event log via postVitals()
 *              so it reflects in WorkflowTimeline without a page reload.
 *
 * Design rules:
 *   All inputs use existing Input primitive styling (bg #F6F1F1, radius 12,
 *   border #E7E0E9). No new hex values.
 */

"use client";

import { useState } from "react";
import { postVitals } from "@/lib/api";
import type { Patient } from "@/types";

interface VitalsFormProps {
  patients: Patient[];
  nurseId: string;
}

interface FormState {
  bp: string;
  pulse: string;
  temp: string;
  respRate: string;
  o2Sat: string;
}

const EMPTY: FormState = { bp: "", pulse: "", temp: "", respRate: "", o2Sat: "" };

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

export function VitalsForm({ patients, nurseId }: VitalsFormProps) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id ?? "");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null); // patient name after submit
  const [errors, setErrors] = useState<Partial<FormState>>({});

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setSubmitted(null);
  }

  function validate(): boolean {
    const errs: Partial<FormState> = {};
    if (!form.bp.match(/^\d{2,3}\/\d{2,3}$/)) errs.bp = "Format: 120/80";
    if (!form.pulse || isNaN(Number(form.pulse)) || Number(form.pulse) < 20 || Number(form.pulse) > 300)
      errs.pulse = "20–300";
    if (!form.temp || isNaN(Number(form.temp)) || Number(form.temp) < 90 || Number(form.temp) > 115)
      errs.temp = "90–115°F";
    if (!form.respRate || isNaN(Number(form.respRate)) || Number(form.respRate) < 4 || Number(form.respRate) > 60)
      errs.respRate = "4–60";
    if (!form.o2Sat || isNaN(Number(form.o2Sat)) || Number(form.o2Sat) < 50 || Number(form.o2Sat) > 100)
      errs.o2Sat = "50–100";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const patient = patients.find((p) => p.id === selectedPatientId);

    await postVitals({
      patientId: selectedPatientId,
      nurseId,
      bp: form.bp,
      pulse: Number(form.pulse),
      temp: Number(form.temp),
      respRate: Number(form.respRate),
      o2Sat: Number(form.o2Sat),
      recordedAt: new Date().toISOString(),
    });

    setSubmitting(false);
    setSubmitted(patient?.name ?? "patient");
    setForm(EMPTY);
  }

  if (patients.length === 0) return null;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 22px" }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#8A8394",
            margin: "0 0 10px",
          }}
        >
          Vitals entry
        </p>

        {/* Patient selector pills */}
        {patients.length > 1 && (
          <div className="flex" style={{ gap: 6, flexWrap: "wrap" }}>
            {patients.map((p) => {
              const active = p.id === selectedPatientId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedPatientId(p.id); setSubmitted(null); }}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "5px 10px",
                    borderRadius: 999,
                    border: `1.5px solid ${active ? "#7C5FAE" : "#E7E0E9"}`,
                    background: active ? "#EFE7F7" : "transparent",
                    color: active ? "#7C5FAE" : "#6B6474",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.12s",
                  }}
                >
                  {p.name.split(" ")[0]} · {p.room}
                </button>
              );
            })}
          </div>
        )}
        {patients.length === 1 && (
          <p style={{ fontSize: 12, fontWeight: 600, color: "#1D1B2E", margin: 0 }}>
            {patients[0].name} · {patients[0].room}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* 2-col input grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px 12px",
            marginBottom: 14,
          }}
        >
          {/* BP */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6B6474", display: "block", marginBottom: 4 }}>
              Blood pressure
            </label>
            <input
              placeholder="120/80"
              value={form.bp}
              onChange={(e) => set("bp", e.target.value)}
              style={inputStyle(!!errors.bp)}
              onFocus={(e) => { if (!errors.bp) e.currentTarget.style.borderColor = "#7C5FAE"; }}
              onBlur={(e) => { if (!errors.bp) e.currentTarget.style.borderColor = "#E7E0E9"; }}
            />
            {errors.bp && <span style={{ fontSize: 10, color: "#DC2626" }}>{errors.bp}</span>}
          </div>

          {/* Pulse */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6B6474", display: "block", marginBottom: 4 }}>
              Pulse (bpm)
            </label>
            <input
              type="number"
              placeholder="72"
              value={form.pulse}
              onChange={(e) => set("pulse", e.target.value)}
              style={inputStyle(!!errors.pulse)}
              onFocus={(e) => { if (!errors.pulse) e.currentTarget.style.borderColor = "#7C5FAE"; }}
              onBlur={(e) => { if (!errors.pulse) e.currentTarget.style.borderColor = "#E7E0E9"; }}
            />
            {errors.pulse && <span style={{ fontSize: 10, color: "#DC2626" }}>{errors.pulse}</span>}
          </div>

          {/* Temp */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6B6474", display: "block", marginBottom: 4 }}>
              Temperature (°F)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="98.6"
              value={form.temp}
              onChange={(e) => set("temp", e.target.value)}
              style={inputStyle(!!errors.temp)}
              onFocus={(e) => { if (!errors.temp) e.currentTarget.style.borderColor = "#7C5FAE"; }}
              onBlur={(e) => { if (!errors.temp) e.currentTarget.style.borderColor = "#E7E0E9"; }}
            />
            {errors.temp && <span style={{ fontSize: 10, color: "#DC2626" }}>{errors.temp}</span>}
          </div>

          {/* RR */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6B6474", display: "block", marginBottom: 4 }}>
              Resp. rate (breaths/min)
            </label>
            <input
              type="number"
              placeholder="16"
              value={form.respRate}
              onChange={(e) => set("respRate", e.target.value)}
              style={inputStyle(!!errors.respRate)}
              onFocus={(e) => { if (!errors.respRate) e.currentTarget.style.borderColor = "#7C5FAE"; }}
              onBlur={(e) => { if (!errors.respRate) e.currentTarget.style.borderColor = "#E7E0E9"; }}
            />
            {errors.respRate && <span style={{ fontSize: 10, color: "#DC2626" }}>{errors.respRate}</span>}
          </div>

          {/* O2 */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6B6474", display: "block", marginBottom: 4 }}>
              O₂ saturation (%)
            </label>
            <input
              type="number"
              placeholder="98"
              value={form.o2Sat}
              onChange={(e) => set("o2Sat", e.target.value)}
              style={inputStyle(!!errors.o2Sat)}
              onFocus={(e) => { if (!errors.o2Sat) e.currentTarget.style.borderColor = "#7C5FAE"; }}
              onBlur={(e) => { if (!errors.o2Sat) e.currentTarget.style.borderColor = "#E7E0E9"; }}
            />
            {errors.o2Sat && <span style={{ fontSize: 10, color: "#DC2626" }}>{errors.o2Sat}</span>}
          </div>
        </div>

        {/* Confirmation inline — shown after successful submit */}
        {submitted && (
          <div
            className="flex items-center"
            style={{
              gap: 8,
              marginBottom: 10,
              padding: "9px 12px",
              background: "#E1F3F0",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 500,
              color: "#2D7A72",
            }}
          >
            <span className="ti ti-circle-check" style={{ fontSize: 16 }} aria-hidden="true" />
            Vitals logged for {submitted} — visible in their care timeline.
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            background: submitting ? "#A987CC" : "#7C5FAE",
            border: "none",
            borderRadius: 10,
            padding: "11px 0",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            fontFamily: "inherit",
            cursor: submitting ? "default" : "pointer",
            transition: "background 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
          }}
        >
          {submitting && (
            <span
              className="ti ti-loader-2"
              style={{ fontSize: 15, animation: "spin 0.7s linear infinite" }}
              aria-hidden="true"
            />
          )}
          {submitting ? "Logging…" : "Log vitals"}
        </button>
      </form>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
