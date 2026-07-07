"use client";

/**
 * MorningRoundsClient — interactive doctor landing.
 *
 * Spec:
 *   Single white card: bg #fff, border-radius 18px
 *   Height: calc(100vh - 140px), min-height 560px
 *   Three flex zones: header | scrollable list | footer
 *
 * Header:
 *   Title 20px/600/-0.01em + subtitle 12px/500/#8A8394
 *   History toggle button: #EFE7F7 bg, #7C5FAE text, 9px 14px padding, radius 10px
 *   Progress bar (today only): 8px, radius 999, track #EFEBEF, fill #7C5FAE
 *
 * List (today):
 *   Rows: review icon (20px, ti-circle-check-filled purple / ti-circle gray)
 *         avatar 34×34 radius 10 · name+diag · status
 *   Row padding: 12px 8px, gap 13px, divider #F3EFF4
 *   Name color: #1D1B2E (unreviewd) → #8A8394 (reviewed)
 *
 * List (history):
 *   Grouped: "This week" / "Earlier"
 *   Row: ti-user-check icon avatar (gray #EFEBEF) · name+diag · discharge date
 *
 * Footer:
 *   Chips: 11px/600, bg #F6F1F1, border #ECE6EE, radius 999px
 *   Input bar: bg #F6F1F1, border #E7E0E9, radius 14px, sparkles icon + input + mic + send
 */

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { askPulse } from "@/lib/api";
import { DoctorAiPanel } from "@/components/doctor/doctor-ai-panel";
import { ShiftHandoffPanel } from "@/components/shared/shift-handoff-panel";
import type { Patient, PatientStatus } from "@/types";

// ─── Status helpers ───────────────────────────────────────────────────────────

const DOT_COLOR: Record<PatientStatus, string> = {
  ontrack:  "#4FB5A8",
  delayed:  "#E08A4F",
  blocked:  "#8A8394",
  critical: "#DC2626",
};

const BADGE_CFG: Partial<Record<PatientStatus, { bg: string; text: string; label: string }>> = {
  blocked:  { bg: "#EFEBEF", text: "#4A4458", label: "Blocked"  },
  critical: { bg: "#F8DFDB", text: "#A83F2F", label: "Critical" },
};

// ─── History grouping ─────────────────────────────────────────────────────────

function groupByPeriod(discharged: Patient[]) {
  const weekAgo = Date.now() - 7 * 24 * 3_600_000;
  const thisWeek = discharged.filter(
    (p) => new Date(p.dischargedAt!).getTime() > weekAgo
  );
  const earlier = discharged.filter(
    (p) => new Date(p.dischargedAt!).getTime() <= weekAgo
  );
  const groups: { label: string; items: Patient[] }[] = [];
  if (thisWeek.length) groups.push({ label: "This week", items: thisWeek });
  if (earlier.length)  groups.push({ label: "Earlier",   items: earlier  });
  return groups;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

// ─── Ask Pulse chips ─────────────────────────────────────────────────────────

const CHIPS = [
  "Show critical patients",
  "Who's blocked on discharge?",
  "Discharge-ready today",
];

// ─── Component ────────────────────────────────────────────────────────────────

export interface MorningRoundsClientProps {
  patients:        Patient[];  // admitted — scoped to this doctor
  history:         Patient[];  // discharged — scoped to this doctor
  doctorName:      string;
  doctorSubtitle:  string;     // e.g. "Attending · Cardiology"
}

export function MorningRoundsClient({
  patients,
  history,
  doctorName,
  doctorSubtitle,
}: MorningRoundsClientProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [reviewed, setReviewed]       = useState<Set<string>>(new Set());
  const [query, setQuery]             = useState("");
  const [askAnswer, setAskAnswer]     = useState<string | null>(null);
  const [askLoading, setAskLoading]   = useState(false);

  const handleAsk = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || askLoading) return;
    setAskLoading(true);
    setAskAnswer(null);
    try {
      const answer = await askPulse(trimmed, "doctor");
      setAskAnswer(answer);
      setQuery("");
    } catch {
      setAskAnswer("Could not reach Pulse right now. Please try again.");
    } finally {
      setAskLoading(false);
    }
  }, [askLoading]);

  const historyGroups = useMemo(() => groupByPeriod(history), [history]);
  const reviewedCount = reviewed.size;
  const progressPct   = patients.length
    ? Math.round((reviewedCount / patients.length) * 100)
    : 0;

  function toggleReviewed(id: string) {
    setReviewed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 20,
        alignItems: "start",
        height: "calc(100vh - 140px)",
        minHeight: 560,
      }}
    >
    {/* ── Left column — main rounds card ─────────────────────────────────── */}
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{ padding: "22px 24px 18px", borderBottom: "1px solid #F3EFF4" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              Morning rounds
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#8A8394",
                marginTop: 2,
              }}
            >
              {doctorName} · {doctorSubtitle}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory((h) => !h)}
            className="flex items-center"
            style={{
              gap: 7,
              fontSize: 12,
              fontWeight: 600,
              color: "#7C5FAE",
              background: "#EFE7F7",
              border: "none",
              padding: "9px 14px",
              borderRadius: 10,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span
              className={cn("ti", showHistory ? "ti-arrow-left" : "ti-history")}
              style={{ fontSize: 16, lineHeight: 1 }}
              aria-hidden="true"
            />
            {showHistory ? "Back to today" : "History"}
          </button>
        </div>

        {/* Progress bar — today only */}
        {!showHistory && (
          <div style={{ marginTop: 16 }}>
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: 7 }}
            >
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {reviewedCount} of {patients.length} patients reviewed
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#8A8394" }}>
                {patients.length - reviewedCount} remaining
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "#EFEBEF",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "#7C5FAE",
                  borderRadius: 999,
                  transition: "width 0.25s ease",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Scrollable list ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {!showHistory ? (
          // Today's patient list
          <div style={{ display: "flex", flexDirection: "column" }}>
            {patients.map((p) => {
              const isReviewed = reviewed.has(p.id);
              const badge = BADGE_CFG[p.status];

              return (
                <div
                  key={p.id}
                  className="flex items-center"
                  style={{
                    gap: 13,
                    padding: "12px 8px",
                    borderBottom: "1px solid #F3EFF4",
                  }}
                >
                  {/* Review toggle */}
                  <button
                    type="button"
                    onClick={() => toggleReviewed(p.id)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      flexShrink: 0,
                      lineHeight: 1,
                    }}
                    aria-label={
                      isReviewed ? "Mark as unreviewed" : "Mark as reviewed"
                    }
                  >
                    <span
                      className={cn(
                        "ti",
                        isReviewed
                          ? "ti-circle-check-filled"
                          : "ti-circle"
                      )}
                      style={{
                        fontSize: 20,
                        color: isReviewed ? "#7C5FAE" : "#CFC9D6",
                      }}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Avatar */}
                  <span
                    className="flex items-center justify-center font-bold shrink-0"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "#EFE7F7",
                      color: "#7C5FAE",
                      fontSize: 12,
                    }}
                    aria-hidden="true"
                  >
                    {p.initials}
                  </span>

                  {/* Name + info — link to detail */}
                  <Link
                    href={`/patients/${p.id}`}
                    className="flex-1 min-w-0 block"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <span
                      className="block"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isReviewed ? "#8A8394" : "#1D1B2E",
                      }}
                    >
                      {p.name}
                    </span>
                    <span
                      className="block truncate"
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#8A8394",
                        marginTop: 1,
                      }}
                    >
                      {p.room} · {p.diagnosis}
                    </span>
                  </Link>

                  {/* Status: badge (blocked/critical) or dot */}
                  {badge ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        height: 20,
                        padding: "0 9px",
                        borderRadius: 5,
                        background: badge.bg,
                        color: badge.text,
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {badge.label}
                    </span>
                  ) : (
                    <span
                      className="shrink-0 rounded-full"
                      style={{
                        width: 9,
                        height: 9,
                        background: DOT_COLOR[p.status] ?? "#CFC9D6",
                        display: "inline-block",
                      }}
                      aria-label={p.status}
                    />
                  )}

                  {/* Start visit */}
                  <Link
                    href={`/doctor/visit/${p.id}`}
                    className="flex items-center shrink-0"
                    style={{
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#7C5FAE",
                      background: "#EFE7F7",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: 8,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span className="ti ti-stethoscope" style={{ fontSize: 13 }} aria-hidden="true" />
                    Visit
                  </Link>
                </div>
              );
            })}

            {patients.length === 0 && (
              <div
                className="flex flex-col items-center justify-center text-center"
                style={{ padding: "48px 24px", color: "#8A8394" }}
              >
                <span
                  className="ti ti-bed"
                  style={{ fontSize: 24, color: "#C9BBDF", marginBottom: 10 }}
                  aria-hidden="true"
                />
                <div style={{ fontSize: 13, fontWeight: 600, color: "#6B6474" }}>
                  No patients today
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, marginTop: 4 }}>
                  New admissions will appear here as they&apos;re registered.
                </div>
              </div>
            )}
          </div>
        ) : (
          // History view — grouped by period
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              padding: "12px 0",
            }}
          >
            {historyGroups.map((group) => (
              <div key={group.label}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#8A8394",
                    marginBottom: 8,
                    padding: "0 8px",
                  }}
                >
                  {group.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {group.items.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center"
                      style={{
                        gap: 13,
                        padding: "11px 8px",
                        borderBottom: "1px solid #F3EFF4",
                      }}
                    >
                      {/* Generic discharged icon avatar */}
                      <span
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: "#EFEBEF",
                          color: "#8A8394",
                        }}
                      >
                        <span
                          className="ti ti-user-check"
                          style={{ fontSize: 17 }}
                          aria-hidden="true"
                        />
                      </span>

                      {/* Name + diagnosis */}
                      <span className="flex-1 min-w-0 block">
                        <span
                          className="block"
                          style={{ fontSize: 13, fontWeight: 600 }}
                        >
                          {p.name}
                        </span>
                        <span
                          className="block truncate"
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "#8A8394",
                            marginTop: 1,
                          }}
                        >
                          {p.diagnosis}
                        </span>
                      </span>

                      {/* Discharge date */}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#8A8394",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.dischargedAt ? fmtDate(p.dischargedAt) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {historyGroups.length === 0 && (
              <div
                className="flex flex-col items-center justify-center text-center"
                style={{ padding: "48px 24px", color: "#8A8394" }}
              >
                <span
                  className="ti ti-bed"
                  style={{ fontSize: 24, color: "#C9BBDF", marginBottom: 10 }}
                  aria-hidden="true"
                />
                <div style={{ fontSize: 13, fontWeight: 600, color: "#6B6474" }}>
                  No discharge history
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, marginTop: 4 }}>
                  Discharged patients will appear here.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Ask Pulse footer ─────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid #F3EFF4",
          padding: "14px 16px 16px",
          background: "#fff",
        }}
      >
        {/* Quick-action chips */}
        <div
          style={{ display: "flex", gap: 8, marginBottom: 11, flexWrap: "wrap" }}
        >
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => void handleAsk(chip)}
              disabled={askLoading}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#6B6474",
                background: "#F6F1F1",
                border: "1px solid #ECE6EE",
                padding: "7px 12px",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {askAnswer && (
          <div
            style={{
              marginBottom: 11,
              background: "#F8F5FD",
              border: "1px solid #EFE7F7",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12,
              fontWeight: 500,
              color: "#4A4458",
              lineHeight: 1.55,
              whiteSpace: "pre-line",
            }}
          >
            <span
              className="ti ti-sparkles"
              style={{ fontSize: 13, color: "#7C5FAE", marginRight: 6 }}
              aria-hidden="true"
            />
            {askAnswer}
          </div>
        )}

        {askLoading && (
          <div
            style={{
              marginBottom: 11,
              fontSize: 12,
              fontWeight: 500,
              color: "#8A8394",
            }}
          >
            Pulse is thinking…
          </div>
        )}

        {/* Input bar */}
        <div
          className="flex items-center"
          style={{
            gap: 10,
            background: "#F6F1F1",
            border: "1px solid #E7E0E9",
            borderRadius: 14,
            padding: "10px 12px 10px 14px",
          }}
        >
          <span
            className="ti ti-sparkles shrink-0"
            style={{ fontSize: 18, color: "#7C5FAE" }}
            aria-hidden="true"
          />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleAsk(query);
              }
            }}
            placeholder="Ask about any patient…"
            disabled={askLoading}
            aria-label="Ask Pulse"
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 500,
              width: "100%",
            }}
          />

          <button
            type="button"
            aria-label="Voice input"
            style={{
              background: "transparent",
              border: "none",
              width: 34,
              height: 34,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#8A8394",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <span
              className="ti ti-microphone"
              style={{ fontSize: 19 }}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() => void handleAsk(query)}
            disabled={!query.trim() || askLoading}
            aria-label="Send"
            style={{
              background: query.trim() && !askLoading ? "#7C5FAE" : "#C9BBDF",
              border: "none",
              width: 34,
              height: 34,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <span
              className="ti ti-arrow-up"
              style={{ fontSize: 19 }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
    {/* ── Right column — "What's happening now" panel ────────────────────── */}
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!showHistory && patients.length > 0 && (
        <DoctorAiPanel patients={patients} />
      )}
      {!showHistory && (
        <ShiftHandoffPanel scope="doctor" />
      )}
      {showHistory && (
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "16px 18px",
            fontSize: 12,
            fontWeight: 500,
            color: "#8A8394",
          }}
        >
          <span
            className="ti ti-history"
            style={{ fontSize: 16, color: "#C9BBDF", display: "block", marginBottom: 8 }}
            aria-hidden="true"
          />
          Viewing discharge history. Switch to today&apos;s rounds to see live patient alerts.
        </div>
      )}
    </div>
    </div>
  );
}
