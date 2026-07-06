/**
 * DischargeApprovalModal — admin reviews discharge summary PDF + itemized
 * bill before finalizing.
 *
 * Flow:
 *   1. Admin clicks "Review & approve" on a queue row
 *   2. This modal generates the PDF (jsPDF, client-side) and bill from the
 *      patient's real data on mount
 *   3. Admin sees two tabs: "Discharge summary" (PDF iframe) and "Bill"
 *      (itemized table)
 *   4. Clicking "Finalize discharge" calls finalizeDischarge() which:
 *        — sets patient.dischargedAt = now
 *        — frees the bed in ALL_BEDS (reconciles 9-Front inventory)
 *        — appends audit event
 *   5. Success state shown; modal closes via onFinalized callback
 *
 * Shadow constraint: modal-shadow only — 0 24px 60px -12px rgba(29,27,46,0.4)
 * No purple for status; only brand usage.
 * All displayed amounts derived from generateBill() — never synthetic.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { finalizeDischarge, generateBill } from "@/lib/api";
import { generateDischargePdf } from "@/lib/discharge-pdf";
import type { PatientDetail, Bill } from "@/types";

// ─── Currency formatter ───────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ─── Category label ───────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<string, string> = {
  room:       "ti-building-hospital",
  nursing:    "ti-stethoscope",
  doctor:     "ti-user-check",
  lab:        "ti-flask",
  medication: "ti-pill",
  other:      "ti-receipt",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface DischargeApprovalModalProps {
  patient: PatientDetail;
  onClose: () => void;
  onFinalized: () => void;
}

export function DischargeApprovalModal({
  patient,
  onClose,
  onFinalized,
}: DischargeApprovalModalProps) {
  const [tab,          setTab]          = useState<"summary" | "bill">("summary");
  const [pdfUri,       setPdfUri]       = useState<string>("");
  const [bill,         setBill]         = useState<Bill | null>(null);
  const [generating,   setGenerating]   = useState(true);
  const [finalizing,   setFinalizing]   = useState(false);
  const [done,         setDone]         = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Generate PDF + bill on mount
  useEffect(() => {
    const b = generateBill(patient);
    setBill(b);
    const uri = generateDischargePdf(patient, b);
    setPdfUri(uri);
    setGenerating(false);
  }, [patient]);

  // Focus close button when done
  useEffect(() => {
    if (done) closeRef.current?.focus();
  }, [done]);

  // Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleFinalize = async () => {
    setFinalizing(true);
    await finalizeDischarge(patient.id);
    setFinalizing(false);
    setDone(true);
  };

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dap-title"
      style={{
        position: "fixed", inset: 0, zIndex: 80,
        background: "rgba(29,27,46,0.34)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 18,
          width: "min(860px, 100%)", maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px -12px rgba(29,27,46,0.4)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "20px 24px 0",
            borderBottom: "1px solid #F3EFF4",
          }}
        >
          <div className="flex items-start justify-between" style={{ marginBottom: 14 }}>
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#8A8394", margin: 0,
              }}>
                Discharge approval
              </p>
              <h2
                id="dap-title"
                style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 0", letterSpacing: "-0.01em" }}
              >
                {patient.name}
              </h2>
              <p style={{ fontSize: 11, fontWeight: 500, color: "#8A8394", margin: "2px 0 0" }}>
                {patient.room} · {patient.departmentId} · Day {patient.dayOfStay} of stay
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#F6F1F1", border: "none", borderRadius: 8,
                width: 32, height: 32, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", color: "#6B6474",
                flexShrink: 0,
              }}
              aria-label="Close"
            >
              <span className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex" style={{ gap: 0 }}>
            {([
              { id: "summary" as const, label: "Discharge summary" },
              { id: "bill"    as const, label: "Itemized bill" },
            ]).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: "9px 18px",
                  fontSize: 12, fontWeight: 600,
                  border: "none", background: "transparent",
                  cursor: "pointer", fontFamily: "inherit",
                  color: tab === t.id ? "#7C5FAE" : "#6B6474",
                  borderBottom: tab === t.id ? "2px solid #7C5FAE" : "2px solid transparent",
                  transition: "color 0.12s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>

          {/* ── Summary tab — PDF iframe ─────────────────────────────────── */}
          {tab === "summary" && (
            <div style={{ height: "100%", minHeight: 420 }}>
              {generating ? (
                <div
                  className="flex flex-col items-center justify-center"
                  style={{ height: "100%", gap: 12, color: "#8A8394", padding: 40 }}
                >
                  <span className="ti ti-loader-2" style={{ fontSize: 28, animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Generating discharge summary…</span>
                </div>
              ) : (
                <div style={{ height: "100%", minHeight: 500, display: "flex", flexDirection: "column" }}>
                  {/* Download link */}
                  <div style={{
                    padding: "10px 24px",
                    background: "#F8F5FD",
                    borderBottom: "1px solid #EFE7F7",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#7C5FAE" }}>
                      <span className="ti ti-file-text" style={{ marginRight: 6 }} aria-hidden="true" />
                      Discharge Summary — {patient.name}
                    </span>
                    <a
                      href={pdfUri}
                      download={`discharge-${patient.name.replace(/\s+/g, "-").toLowerCase()}.pdf`}
                      style={{
                        fontSize: 11, fontWeight: 600, color: "#7C5FAE",
                        textDecoration: "none", display: "flex", alignItems: "center", gap: 5,
                      }}
                    >
                      <span className="ti ti-download" style={{ fontSize: 14 }} aria-hidden="true" />
                      Download PDF
                    </a>
                  </div>
                  <iframe
                    src={pdfUri}
                    style={{ flex: 1, border: "none", minHeight: 480 }}
                    title="Discharge summary PDF"
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Bill tab — itemized table ──────────────────────────────── */}
          {tab === "bill" && bill && (
            <div style={{ padding: "20px 24px" }}>
              {/* Patient + date info */}
              <div style={{ display: "flex", gap: 24, marginBottom: 18 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8394", margin: "0 0 2px" }}>Patient</p>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{bill.patientName}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8394", margin: "0 0 2px" }}>Generated</p>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{fmtDate(bill.generatedAt)}</p>
                </div>
              </div>

              {/* Line items table */}
              <div style={{ background: "#FAFAFA", borderRadius: 12, overflow: "hidden", border: "1px solid #F3EFF4" }}>
                {/* Column headers */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 60px 90px 90px",
                    padding: "9px 16px",
                    borderBottom: "1px solid #F3EFF4",
                    background: "#F6F1F1",
                  }}
                >
                  {["Description", "Qty", "Unit rate", "Amount"].map((col) => (
                    <span key={col} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8394" }}>
                      {col}
                    </span>
                  ))}
                </div>

                {/* Line item rows */}
                {bill.lineItems.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 60px 90px 90px",
                      padding: "11px 16px",
                      borderTop: i === 0 ? "none" : "1px solid #F3EFF4",
                      alignItems: "center",
                    }}
                  >
                    <div className="flex items-center" style={{ gap: 10 }}>
                      <span
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 26, height: 26, borderRadius: 7,
                          background: "#EFE7F7",
                        }}
                        aria-hidden="true"
                      >
                        <span
                          className={`ti ${CATEGORY_ICON[item.category] ?? "ti-receipt"}`}
                          style={{ fontSize: 13, color: "#7C5FAE" }}
                        />
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{item.description}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#6B6474" }}>{item.quantity}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#6B6474" }}>{fmtCurrency(item.unitRate)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{fmtCurrency(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ marginTop: 14, borderTop: "1px solid #F3EFF4", paddingTop: 14 }}>
                <div className="flex justify-end" style={{ marginBottom: 6 }}>
                  <span style={{ width: 140, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#6B6474" }}>Subtotal</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{fmtCurrency(bill.subtotal)}</span>
                  </span>
                </div>
                {bill.insuranceAdjustment !== 0 && (
                  <div className="flex justify-end" style={{ marginBottom: 6 }}>
                    <span style={{ width: 160, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#4FB5A8" }}>Insurance (−20%)</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#4FB5A8" }}>{fmtCurrency(bill.insuranceAdjustment)}</span>
                    </span>
                  </div>
                )}
                <div className="flex justify-end">
                  <span style={{ width: 160, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Total due</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#7C5FAE" }}>{fmtCurrency(bill.total)}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Done state ─────────────────────────────────────────────── */}
          {done && (
            <div
              className="flex flex-col items-center justify-center"
              style={{ padding: "40px 24px", textAlign: "center" }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: 56, height: 56, borderRadius: 16, background: "#E1F3F0", marginBottom: 16 }}
              >
                <span className="ti ti-circle-check" style={{ fontSize: 30, color: "#2D7A72" }} aria-hidden="true" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Discharge finalized</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", marginBottom: 24 }}>
                {patient.name} has been discharged. Their bed has been released back into inventory.
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => { onFinalized(); onClose(); }}
                style={{
                  background: "#7C5FAE", border: "none", borderRadius: 12,
                  padding: "12px 28px", fontSize: 13, fontWeight: 600,
                  color: "#fff", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Back to dashboard
              </button>
            </div>
          )}
        </div>

        {/* ── Footer actions ───────────────────────────────────────────────── */}
        {!done && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #F3EFF4",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 500, color: "#8A8394" }}>
              Review both tabs before finalizing. This action cannot be undone.
            </span>
            <div className="flex" style={{ gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "#fff", border: "1px solid #C9BBDF",
                  borderRadius: 10, padding: "10px 18px",
                  fontSize: 12, fontWeight: 600, color: "#7C5FAE",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={generating || finalizing}
                style={{
                  background: generating || finalizing ? "#EFEBEF" : "#2D7A72",
                  border: "none", borderRadius: 10, padding: "10px 20px",
                  fontSize: 12, fontWeight: 600,
                  color: generating || finalizing ? "#8A8394" : "#fff",
                  cursor: generating || finalizing ? "default" : "pointer",
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 7,
                  transition: "background 0.15s",
                }}
              >
                {finalizing && (
                  <span className="ti ti-loader-2" style={{ fontSize: 14, animation: "spin 0.7s linear infinite" }} aria-hidden="true" />
                )}
                {finalizing ? "Finalizing…" : "Finalize discharge"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return createPortal(modal, document.body);
}
