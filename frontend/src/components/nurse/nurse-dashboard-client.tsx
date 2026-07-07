/**
 * NurseDashboardClient — full nurse dashboard layout.
 *
 * Layout: two columns, 1fr + 360px
 *   Left:  My Patients list + Nursing Task list
 *   Right: Vitals entry form + AI Smart Prompts
 *
 * All data fetched server-side and passed as props — this component
 * handles only interactivity (patient card navigation, vitals submission).
 */

"use client";

import Link from "next/link";
import { PatientCardCompact } from "@/components/patient/patient-card";
import { VitalsForm } from "@/components/nurse/vitals-form";
import { NursingTaskList } from "@/components/nurse/nursing-task-list";
import { AiSmartPrompts } from "@/components/nurse/ai-smart-prompts";
import { ShiftHandoffPanel } from "@/components/shared/shift-handoff-panel";
import type { Patient, NursingTask } from "@/types";

interface NurseDashboardClientProps {
  patients: Patient[];
  tasks: NursingTask[];
  nurseId: string;
  greeting: string;
  nurseName: string;
}

export function NurseDashboardClient({
  patients,
  tasks,
  nurseId,
  greeting,
  nurseName,
}: NurseDashboardClientProps) {
  const activeTasks  = tasks.filter((t) => t.status === "active").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const urgentCount  = patients.filter(
    (p) => p.status === "blocked" || p.status === "critical"
  ).length;

  return (
    <div>
      {/* ── Greeting ───────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
          {greeting}, {nurseName.split(" ")[0]}
        </h1>
        <p style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", marginTop: 3, marginBottom: 0 }}>
          {patients.length} assigned patient{patients.length !== 1 ? "s" : ""}
          {urgentCount > 0 ? ` · ${urgentCount} need${urgentCount === 1 ? "s" : ""} urgent attention` : " · all stable"}
          {activeTasks + pendingTasks > 0
            ? ` · ${activeTasks + pendingTasks} task${activeTasks + pendingTasks !== 1 ? "s" : ""} open`
            : ""}
        </p>
      </div>

      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* My patients */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 22px" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#8A8394",
                  margin: 0,
                }}
              >
                My patients
              </p>
              <Link
                href="/patients"
                style={{ fontSize: 11, fontWeight: 600, color: "#7C5FAE", textDecoration: "none" }}
              >
                View all →
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {patients.map((p) => (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  style={{ display: "block", textDecoration: "none", color: "inherit" }}
                >
                  <PatientCardCompact patient={p} />
                </Link>
              ))}
            </div>
          </div>

          {/* Nursing tasks */}
          <NursingTaskList tasks={tasks} patients={patients} />
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Vitals form */}
          <VitalsForm patients={patients} nurseId={nurseId} />

          {/* AI Smart Prompts */}
          <AiSmartPrompts patients={patients} tasks={tasks} />

          <ShiftHandoffPanel scope="nurse" />
        </div>
      </div>
    </div>
  );
}
