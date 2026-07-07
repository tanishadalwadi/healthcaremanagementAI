/**
 * AdminAskPulse — hospital-wide AI read-only panel for Admin.
 *
 * Pattern mirrors DoctorAiPanel and AiSmartPrompts: sparkle eyebrow, purple-
 * tint container, icon chips, grounded responses that cite specific real data.
 *
 * Scope: all patients (admitted + discharged), all departments, discharge
 * queue, billing. No write capability — read-only as explicitly scoped.
 *
 * Layout: fixed bottom-right panel (same pattern as the doctor's AI panel).
 * Collapsed: a floating pill button.
 * Expanded: chat container with suggested prompt chips + scrollable
 *   conversation. Each response is generated from live props — no generic
 *   filler, every claim names a specific patient, room, or data point.
 *
 * Constraints:
 *   — No shadows except the modal-shadow on the expanded card
 *   — No purple for status; only brand usage
 *   — AI responses must cite real data from the patient array passed as props
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getAdminKPIs, getAiSummary, getPatientById } from "@/lib/api";
import type { Patient } from "@/types";

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "Which patients are most critical right now?",
  "How many beds are available across all departments?",
  "Who is pending discharge approval?",
  "What are the current blocking issues?",
  "Which departments have delayed patients?",
];

// ─── Response generation — grounded from backend AI + KPIs ───────────────────

async function fetchPatientSummaries(patients: Patient[]): Promise<string> {
  const summaries = await Promise.all(
    patients.slice(0, 5).map(async (patient) => {
      try {
        return await getAiSummary(patient.id);
      } catch {
        return `${patient.name} (${patient.room}, ${patient.departmentId}) — ${patient.aiSummary}`;
      }
    }),
  );
  return summaries.join("\n\n");
}

async function buildAdminResponse(
  query: string,
  allPatients: Patient[],
  waitingPatients: Patient[],
): Promise<string> {
  const q = query.toLowerCase();
  const admitted = allPatients.filter((p) => !p.dischargedAt);
  const dced = allPatients.filter((p) => p.dischargedAt);

  if (q.includes("critical")) {
    const criticals = admitted.filter((p) => p.status === "critical");
    if (criticals.length === 0) {
      return `No patients are currently in critical status. There are ${admitted.length} admitted patients across all departments.`;
    }
    return fetchPatientSummaries(criticals);
  }

  if (q.includes("bed") || q.includes("room") || q.includes("available")) {
    const kpis = await getAdminKPIs();
    const breakdown = Object.entries(kpis.bedsByDept)
      .map(([dept, count]) => `${dept}: ${count} available`)
      .join(", ");
    return (
      `${kpis.availableBeds} beds available hospital-wide (${breakdown}). ` +
      `${admitted.length} patients admitted, ${dced.length} discharged this period. ` +
      `${kpis.availableAmbulances} ambulances available, ${kpis.dispatchedAmbulances} dispatched.`
    );
  }

  if (q.includes("discharge") || q.includes("pending") || q.includes("queue") || q.includes("approval")) {
    if (waitingPatients.length === 0) {
      return "No patients are currently pending discharge approval. The discharge queue is empty.";
    }
    const details = await Promise.all(
      waitingPatients.slice(0, 5).map((patient) => getPatientById(patient.id)),
    );
    const summaries = await Promise.all(
      details
        .filter((patient): patient is NonNullable<typeof patient> => patient !== null)
        .map(async (patient) => {
          const complete = patient.dischargeConditions.filter(
            (condition) => condition.status === "complete",
          ).length;
          const total = patient.dischargeConditions.length;
          let summary = patient.aiSummary;
          try {
            summary = await getAiSummary(patient.id);
          } catch {
            // keep cached summary
          }
          return `${patient.name} (${patient.room}) — ${complete}/${total} conditions complete.\n${summary}`;
        }),
    );
    return (
      `${waitingPatients.length} patient${waitingPatients.length !== 1 ? "s" : ""} pending discharge approval:\n\n` +
      summaries.join("\n\n")
    );
  }

  if (q.includes("block") || q.includes("issue") || q.includes("problem") || q.includes("delay")) {
    const flagged = admitted.filter(
      (p) => p.status === "blocked" || p.status === "delayed",
    );
    if (flagged.length === 0) {
      return `No blocked or delayed patients right now. All ${admitted.length} admitted patients are on track.`;
    }
    return fetchPatientSummaries(flagged);
  }

  if (q.includes("department") || q.includes("dept") || q.includes("unit")) {
    const deptMap: Record<string, { total: number; critical: number; blocked: number; delayed: number }> = {};
    admitted.forEach((p) => {
      if (!deptMap[p.departmentId]) {
        deptMap[p.departmentId] = { total: 0, critical: 0, blocked: 0, delayed: 0 };
      }
      deptMap[p.departmentId].total++;
      if (p.status === "critical") deptMap[p.departmentId].critical++;
      if (p.status === "blocked") deptMap[p.departmentId].blocked++;
      if (p.status === "delayed") deptMap[p.departmentId].delayed++;
    });
    return Object.entries(deptMap)
      .map(([dept, stats]) => {
        const flags: string[] = [];
        if (stats.critical > 0) flags.push(`${stats.critical} critical`);
        if (stats.blocked > 0) flags.push(`${stats.blocked} blocked`);
        if (stats.delayed > 0) flags.push(`${stats.delayed} delayed`);
        return `${dept}: ${stats.total} patients${flags.length ? ` (${flags.join(", ")})` : " — all on track"}`;
      })
      .join("\n");
  }

  const kpis = await getAdminKPIs();
  const critical = admitted.filter((p) => p.status === "critical").length;
  const blocked = admitted.filter((p) => p.status === "blocked").length;
  const delayed = admitted.filter((p) => p.status === "delayed").length;
  const ontrack = admitted.filter((p) => p.status === "ontrack").length;

  return (
    `Hospital summary: ${admitted.length} admitted, ${dced.length} discharged.\n\n` +
    `Status breakdown: ${ontrack} on track, ${delayed} delayed, ${blocked} blocked, ${critical} critical.\n\n` +
    `Capacity: ${kpis.availableBeds} beds available, ${kpis.availableAmbulances} ambulances available.\n\n` +
    `Discharge queue: ${kpis.dischargeQueueCount} patient${kpis.dischargeQueueCount !== 1 ? "s" : ""} pending admin approval.`
  );
}

// ─── Message type ─────────────────────────────────────────────────────────────

interface Message {
  id:      string;
  role:    "user" | "ai";
  text:    string;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AdminAskPulseProps {
  allPatients:     Patient[];
  waitingPatients: Patient[];
}

export function AdminAskPulse({ allPatients, waitingPatients }: AdminAskPulseProps) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, thinking]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { id: String(Date.now()), role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    try {
      const response = await buildAdminResponse(text, allPatients, waitingPatients);
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        role: "ai",
        text: response,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setThinking(false);
    }
  }, [allPatients, waitingPatients, thinking]);

  return (
    <>
      {/* ── Collapsed pill ──────────────────────────────────────────────── */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            position: "fixed", bottom: 28, right: 28, zIndex: 50,
            display: "flex", alignItems: "center", gap: 8,
            background: "#7C5FAE", border: "none", borderRadius: 999,
            padding: "12px 20px", fontSize: 13, fontWeight: 600,
            color: "#fff", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <span className="ti ti-sparkles" style={{ fontSize: 16 }} aria-hidden="true" />
          Ask Pulse
        </button>
      )}

      {/* ── Expanded panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "fixed", bottom: 28, right: 28, zIndex: 50,
            width: 380, maxHeight: 560,
            background: "#fff", borderRadius: 18,
            display: "flex", flexDirection: "column",
            boxShadow: "0 24px 60px -12px rgba(29,27,46,0.4)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#EFE7F7", padding: "14px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div className="flex items-center" style={{ gap: 7 }}>
              <span className="ti ti-sparkles" style={{ fontSize: 15, color: "#7C5FAE" }} aria-hidden="true" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#7C5FAE" }}>Ask Pulse</span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#9B7CCC",
                background: "rgba(124,95,174,0.12)", borderRadius: 4,
                padding: "2px 6px",
              }}>
                Hospital-wide
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(124,95,174,0.12)", border: "none",
                borderRadius: 7, width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#7C5FAE",
              }}
              aria-label="Close Ask Pulse"
            >
              <span className="ti ti-x" style={{ fontSize: 14 }} aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{ flex: 1, overflow: "auto", padding: "14px 18px", minHeight: 0 }}
          >
            {messages.length === 0 && (
              <>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", margin: "0 0 14px", lineHeight: 1.5 }}>
                  Ask me anything about patients, departments, discharges, or bed availability — I&apos;ll pull from live data.
                </p>
                {/* Suggested prompts */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void send(prompt)}
                      disabled={thinking}
                      style={{
                        textAlign: "left", background: "#F8F5FD",
                        border: "1px solid #EFE7F7", borderRadius: 8,
                        padding: "8px 12px", fontSize: 11, fontWeight: 500,
                        color: "#4A4458", cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.role === "ai" && (
                  <span
                    className="ti ti-sparkles shrink-0"
                    style={{ fontSize: 13, color: "#7C5FAE", marginRight: 7, marginTop: 2 }}
                    aria-hidden="true"
                  />
                )}
                <div
                  style={{
                    maxWidth: "82%",
                    background: msg.role === "user" ? "#7C5FAE" : "#F8F5FD",
                    color:      msg.role === "user" ? "#fff"     : "#1D1B2E",
                    borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    padding: "9px 13px",
                    fontSize: 12, fontWeight: 500, lineHeight: 1.55,
                    whiteSpace: "pre-line",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex items-center" style={{ gap: 7, color: "#8A8394", fontSize: 12 }}>
                <span className="ti ti-loader-2" style={{ fontSize: 14 }} aria-hidden="true" />
                Pulling live summaries…
              </div>
            )}
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid #F3EFF4",
              display: "flex", gap: 8, alignItems: "flex-end",
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask about patients, beds, discharges…"
              rows={2}
              disabled={thinking}
              style={{
                flex: 1, border: "1.5px solid #E7E0E9", borderRadius: 10,
                padding: "8px 12px", fontSize: 12, fontFamily: "inherit",
                resize: "none", outline: "none", color: "#1D1B2E",
              }}
            />
            <button
              type="button"
              onClick={() => void send(input)}
              disabled={!input.trim() || thinking}
              style={{
                background: input.trim() ? "#7C5FAE" : "#EFEBEF",
                border: "none", borderRadius: 10, width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() ? "pointer" : "default",
                color: input.trim() ? "#fff" : "#8A8394",
                flexShrink: 0,
                transition: "background 0.12s",
              }}
              aria-label="Send"
            >
              <span className="ti ti-send" style={{ fontSize: 15 }} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
