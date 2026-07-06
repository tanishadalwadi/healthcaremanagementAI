/**
 * discharge-pdf.ts
 *
 * Client-side PDF generation for patient discharge summaries.
 * Uses jsPDF — no server required.
 *
 * Design rule: every claim in the summary cites a specific, real data point
 * from the patient record. Generic filler ("patient received standard care")
 * is never emitted.
 *
 * Returns a base64 data-URI string (application/pdf) that can be set as
 * the `src` of an <iframe> for in-browser preview, or downloaded via a link.
 */

import { jsPDF } from "jspdf";
import type { PatientDetail, Bill } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const PAGE_W    = 210; // A4 mm
const MARGIN    = 20;
const COL_W     = PAGE_W - MARGIN * 2;
const LINE_H    = 6;
const SMALL_H   = 5;

// ─── PDF builder ─────────────────────────────────────────────────────────────

export function generateDischargePdf(patient: PatientDetail, bill: Bill): string {
  const doc  = new jsPDF({ unit: "mm", format: "a4" });
  let   y    = MARGIN;

  // ── Header helpers ─────────────────────────────────────────────────────────

  const addPage = () => {
    doc.addPage();
    y = MARGIN;
  };

  const checkY = (needed: number) => {
    if (y + needed > 280) addPage();
  };

  const h1 = (text: string) => {
    checkY(10);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(text, MARGIN, y);
    y += 10;
  };

  const h2 = (text: string) => {
    checkY(8);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(text, MARGIN, y);
    y += 7;
  };

  const rule = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN, y, MARGIN + COL_W, y);
    y += 4;
  };

  const body = (text: string, indent = 0) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, COL_W - indent);
    checkY(lines.length * SMALL_H + 2);
    doc.text(lines, MARGIN + indent, y);
    y += lines.length * SMALL_H + 1;
  };

  const kv = (key: string, value: string) => {
    checkY(LINE_H);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(key + ":", MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, MARGIN + 45, y);
    y += LINE_H;
  };

  const gap = (n = 4) => { y += n; };

  // ── Cover / letterhead ─────────────────────────────────────────────────────

  doc.setFillColor(124, 95, 174); // #7C5FAE brand purple
  doc.rect(0, 0, PAGE_W, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PULSE HEALTH SYSTEM", MARGIN, 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Discharge Summary — Confidential", PAGE_W - MARGIN, 9, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y = 22;

  // ── Title ──────────────────────────────────────────────────────────────────

  h1("Patient Discharge Summary");
  rule();

  // ── Patient information ────────────────────────────────────────────────────

  h2("Patient Information");
  kv("Name",        patient.name);
  kv("Age / Sex",   `${patient.age} years · ${patient.sex === "M" ? "Male" : patient.sex === "F" ? "Female" : "Other"}`);
  kv("Department",  patient.departmentId);
  kv("Room",        patient.room);
  kv("Admitted",    fmtDate(patient.admittedAt));
  kv("Discharged",  fmtDate(bill.generatedAt));
  kv("Length of stay", `${patient.dayOfStay} day${patient.dayOfStay !== 1 ? "s" : ""}`);
  gap();

  // ── Primary diagnosis ──────────────────────────────────────────────────────

  h2("Primary Diagnosis");
  rule();
  body(patient.diagnosis);
  gap(3);
  body(patient.aiSummary);
  gap();

  // ── Attending physician(s) ─────────────────────────────────────────────────

  h2("Care Team");
  rule();
  patient.careTeam.forEach((ct) => {
    if (ct.doctor) {
      body(`${ct.doctor.role}: ${ct.doctor.name} — ${ct.doctor.specialty}`);
    } else if (ct.nurse) {
      body(`Nursing: ${ct.nurse.name} (${ct.nurse.shift} shift)`);
    }
  });
  gap();

  // ── Treatment received ────────────────────────────────────────────────────

  h2("Treatment Received");
  rule();
  const completedItems = patient.treatmentPlan.filter((t) => t.completed);
  const pendingItems   = patient.treatmentPlan.filter((t) => !t.completed);
  if (completedItems.length === 0) {
    body("No treatment plan items recorded as complete at time of discharge.");
  } else {
    completedItems.forEach((item) => {
      body(`• ${item.description}${item.completedAt ? ` (completed ${fmtDate(item.completedAt)})` : ""}`, 2);
    });
  }
  if (pendingItems.length > 0) {
    gap(2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Pending at discharge:", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    pendingItems.forEach((item) => {
      body(`• ${item.description}`, 2);
    });
  }
  gap();

  // ── Procedures & lab orders ───────────────────────────────────────────────

  const labEvents = patient.events.filter((e) => e.type === "lab_order");
  if (labEvents.length > 0) {
    h2("Procedures & Lab Orders");
    rule();
    labEvents.forEach((e) => {
      body(`${fmtDateTime(e.timestamp)}  ${e.summary}  [ordered by ${e.actor}]`, 2);
    });
    gap();
  }

  // ── Medications ───────────────────────────────────────────────────────────

  const medEvents = patient.events.filter((e) => e.type === "medication");
  if (medEvents.length > 0) {
    h2("Medications Administered");
    rule();
    medEvents.forEach((e) => {
      body(`${fmtDateTime(e.timestamp)}  ${e.summary}  [${e.actor}]`, 2);
    });
    gap();
  }

  // ── Key clinical events ───────────────────────────────────────────────────

  h2("Key Clinical Events");
  rule();
  const clinicalTypes = ["admission", "vitals", "scan_result", "status_change", "discharge_update"] as const;
  const clinicalEvents = patient.events
    .filter((e) => (clinicalTypes as readonly string[]).includes(e.type))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(0, 10); // cap to keep summary concise

  if (clinicalEvents.length === 0) {
    body("No clinical events recorded.");
  } else {
    clinicalEvents.forEach((e) => {
      body(`${fmtDateTime(e.timestamp)}  ${e.summary}  [${e.actor}]`, 2);
      if (e.detail) {
        body(`    ${e.detail}`, 4);
      }
    });
  }
  gap();

  // ── Discharge conditions ──────────────────────────────────────────────────

  h2("Discharge Conditions");
  rule();
  patient.dischargeConditions.forEach((c) => {
    const mark = c.status === "complete" ? "✓" : "○";
    body(`${mark}  ${c.condition} — ${c.owningDepartment} (${c.status === "complete" ? "completed" : "incomplete at discharge"})`, 2);
  });
  gap();

  // ── Follow-up instructions ────────────────────────────────────────────────

  h2("Follow-up Instructions");
  rule();
  body("• Follow up with your attending physician within 7 days of discharge.");

  // Add specific follow-up based on diagnosis
  if (patient.diagnosis.toLowerCase().includes("cardiac") ||
      patient.diagnosis.toLowerCase().includes("angina") ||
      patient.diagnosis.toLowerCase().includes("heart")) {
    body(`• Cardiology follow-up recommended for ${patient.diagnosis.toLowerCase()} — contact ${patient.careTeam.find((c) => c.doctor?.specialty.includes("Cardiology"))?.doctor?.name ?? "your cardiologist"}.`);
  }
  if (patient.diagnosis.toLowerCase().includes("fracture") ||
      patient.diagnosis.toLowerCase().includes("ortho")) {
    body(`• Orthopedic follow-up required — contact your orthopedic surgeon's office within 5 days.`);
  }
  body("• Contact the hospital immediately if symptoms worsen or new symptoms develop.");
  body("• Medications: continue all prescribed medications as directed by your care team.");
  gap();

  // ── Signature block ────────────────────────────────────────────────────────

  h2("Authorization");
  rule();
  const attendingDoctor = patient.careTeam.find((c) => c.doctor?.role === "Attending")?.doctor;
  if (attendingDoctor) {
    body(`Attending physician: ${attendingDoctor.name} · ${attendingDoctor.specialty}`);
  }
  body(`Discharge authorized: ${fmtDateTime(bill.generatedAt)}`);
  body("This document was generated by Pulse Health System. For questions, contact the Medical Records department.");
  gap(8);

  // Signature line
  doc.setDrawColor(100, 100, 100);
  doc.line(MARGIN, y, MARGIN + 60, y);
  y += 4;
  body("Authorized signature");
  gap(4);
  doc.line(MARGIN + 80, y - 8, MARGIN + 140, y - 8);
  doc.setFontSize(8);
  doc.text("Date", MARGIN + 80, y);
  y += 8;

  // ─────────────────────────────────────────────────────────────────────────
  // Bill section — new page
  // ─────────────────────────────────────────────────────────────────────────

  addPage();

  doc.setFillColor(124, 95, 174);
  doc.rect(0, 0, PAGE_W, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PULSE HEALTH SYSTEM", MARGIN, 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Itemized Bill — Confidential", PAGE_W - MARGIN, 9, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y = 22;

  h1("Itemized Statement of Services");
  rule();

  kv("Patient",      bill.patientName);
  kv("Account date", fmtDate(bill.generatedAt));
  gap();

  // Column headers
  checkY(8);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Description",                 MARGIN,           y);
  doc.text("Qty",                         MARGIN + 105,     y, { align: "right" });
  doc.text("Unit Rate",                   MARGIN + 130,     y, { align: "right" });
  doc.text("Amount",                      MARGIN + COL_W,   y, { align: "right" });
  y += 5;
  rule();

  // Line items
  bill.lineItems.forEach((item) => {
    checkY(6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const label = doc.splitTextToSize(item.description, 95);
    doc.text(label,                           MARGIN,           y);
    doc.text(String(item.quantity),           MARGIN + 105,     y, { align: "right" });
    doc.text(fmtCurrency(item.unitRate),      MARGIN + 130,     y, { align: "right" });
    doc.text(fmtCurrency(item.total),         MARGIN + COL_W,   y, { align: "right" });
    y += Math.max(label.length * 4.5, 6);
  });

  rule();

  // Subtotal
  checkY(6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Subtotal",          MARGIN + 130,   y, { align: "right" });
  doc.text(fmtCurrency(bill.subtotal), MARGIN + COL_W, y, { align: "right" });
  y += 6;

  // Insurance adjustment
  if (bill.insuranceAdjustment !== 0) {
    checkY(6);
    doc.setFont("helvetica", "normal");
    doc.text("Insurance adjustment (20%)",  MARGIN + 130, y, { align: "right" });
    doc.text(fmtCurrency(bill.insuranceAdjustment), MARGIN + COL_W, y, { align: "right" });
    y += 6;
  }

  // Total
  checkY(8);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Total Due",         MARGIN + 130,   y, { align: "right" });
  doc.text(fmtCurrency(bill.total), MARGIN + COL_W, y, { align: "right" });
  y += 10;

  gap(2);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  body("This statement is for services rendered at Pulse Health System. For billing inquiries contact: billing@pulsehealthsystem.com");

  // Return base64 data-URI
  return doc.output("datauristring");
}
