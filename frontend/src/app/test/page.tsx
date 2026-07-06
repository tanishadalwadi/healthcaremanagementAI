/**
 * /test — temporary component gallery with real mock data.
 * Remove before production. Shows:
 *   1. Compact PatientCard   (delayed patient — status dot visible)
 *   2. Compact PatientCard   (blocked patient — left-border + badge)
 *   3. Expandable PatientCard (blocked patient — workflow chips)
 *   4. Full WorkflowTimeline (blocked patient — real DischargeReadinessChecklist)
 */

import { getPatients, getPatientById } from "@/lib/api";
import { PatientCardCompact, PatientCardExpandable } from "@/components/patient/patient-card";
import { WorkflowTimeline } from "@/components/patient/workflow-timeline";
import { AISummaryCard } from "@/components/patient/ai-summary-card";

export default async function TestPage() {
  // Fetch the full patient list so we can find specific cases
  const all = await getPatients();

  const delayed = all.find((p) => p.status === "delayed");
  const blocked = all.find((p) => p.status === "blocked");

  // Full detail for the blocked patient (workflow groups + discharge conditions)
  const blockedDetail = blocked
    ? await getPatientById(blocked.id)
    : null;

  // Second blocked patient for the expandable card (different case if possible)
  const secondBlocked = all.filter((p) => p.status === "blocked")[1];
  const secondBlockedDetail = secondBlocked
    ? await getPatientById(secondBlocked.id)
    : null;

  return (
    <div
      className="min-h-screen py-12 px-8"
      style={{ backgroundColor: "#F6F1F1" }}
    >
      <div className="max-w-2xl mx-auto space-y-10">

        {/* Page header */}
        <div>
          <p className="text-caption text-text-muted mb-1">Component gallery</p>
          <h1
            className="font-sans font-semibold text-text-primary"
            style={{ fontSize: 20 }}
          >
            /test
          </h1>
          <p className="text-meta text-text-muted mt-1">
            Real mock data via lib/api.ts — remove before production
          </p>
        </div>

        {/* ── Section 1: Compact PatientCards ───────────────────────────── */}
        <section className="space-y-3">
          <p className="text-caption text-text-muted">
            PatientCard (compact) — delayed + blocked
          </p>

          {delayed && (
            <PatientCardCompact patient={delayed} />
          )}
          {blocked && (
            <PatientCardCompact patient={blocked} />
          )}

          {/* On-track for contrast */}
          {all.find((p) => p.status === "ontrack") && (
            <PatientCardCompact
              patient={all.find((p) => p.status === "ontrack")!}
            />
          )}
          {all.find((p) => p.status === "critical") && (
            <PatientCardCompact
              patient={all.find((p) => p.status === "critical")!}
            />
          )}
        </section>

        {/* ── Section 2: Expandable PatientCard ──────────────────────────── */}
        {secondBlockedDetail && (
          <section className="space-y-3">
            <p className="text-caption text-text-muted">
              PatientCard (expandable) — tap chips to expand workflow steps
            </p>
            <PatientCardExpandable
              patient={secondBlockedDetail}
              workflowGroups={secondBlockedDetail.workflowGroups}
            />
          </section>
        )}

        {/* ── Section 3: AISummaryCard ───────────────────────────────────── */}
        {blockedDetail && (
          <section className="space-y-3">
            <p className="text-caption text-text-muted">AISummaryCard</p>
            <AISummaryCard summary={blockedDetail.aiSummary} />
          </section>
        )}

        {/* ── Section 4: Full WorkflowTimeline + DischargeChecklist ──────── */}
        {blockedDetail && (
          <section className="space-y-3">
            <p className="text-caption text-text-muted">
              WorkflowTimeline — {blockedDetail.name} ({blockedDetail.departmentId})
              <br />
              <span className="normal-case font-sans font-normal text-text-muted" style={{ fontSize: 10 }}>
                Blocked on:{" "}
                {blockedDetail.dischargeConditions
                  .filter((c) => c.status === "incomplete")
                  .map((c) => c.condition)
                  .join(", ")}
              </span>
            </p>

            <div
              className="bg-surface rounded-panel p-6"
              style={{ border: "1px solid #EEE8EF" }}
            >
              <WorkflowTimeline
                workflowGroups={blockedDetail.workflowGroups}
                dischargeConditions={blockedDetail.dischargeConditions}
                patientStatus={blockedDetail.status}
              />
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
