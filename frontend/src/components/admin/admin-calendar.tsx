/**
 * AdminCalendar — admissions/discharges calendar for the Admin dashboard.
 *
 * Displays a standard month grid with colored dots derived from real
 * `admittedAt` / `dischargedAt` timestamps on Patient records. No chart
 * library — pure CSS grid and JS Date math.
 *
 * Dot legend:
 *   ● Teal  (#4FB5A8) — admission on that day
 *   ● Orange (#E08A4F) — discharge on that day
 *
 * Navigation: prev/next month arrows. Defaults to the current month.
 * Today's cell gets a subtle highlight.
 */

"use client";

import { useState, useMemo } from "react";
import type { Patient } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

function isoToLocalDay(iso: string): { y: number; m: number; d: number } {
  const dt = new Date(iso);
  return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
}

interface DayData {
  admissions: number;
  discharges: number;
}

function buildMonthData(
  patients: Patient[],
  year: number,
  month: number   // 0-indexed
): Map<number, DayData> {
  const map = new Map<number, DayData>();
  const ensure = (d: number) => {
    if (!map.has(d)) map.set(d, { admissions: 0, discharges: 0 });
    return map.get(d)!;
  };
  for (const p of patients) {
    const a = isoToLocalDay(p.admittedAt);
    if (a.y === year && a.m === month) {
      ensure(a.d).admissions += 1;
    }
    if (p.dischargedAt) {
      const dis = isoToLocalDay(p.dischargedAt);
      if (dis.y === year && dis.m === month) {
        ensure(dis.d).discharges += 1;
      }
    }
  }
  return map;
}

/** First cell offset: 0=Mon … 6=Sun (ISO week, Mon-first). */
function firstDayOffset(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay(); // 0=Sun … 6=Sat
  return (jsDay + 6) % 7; // convert to Mon=0
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AdminCalendarProps {
  /** All patients — admitted + discharged — so discharge dots appear too. */
  allPatients: Patient[];
}

export function AdminCalendar({ allPatients }: AdminCalendarProps) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const monthData = useMemo(
    () => buildMonthData(allPatients, viewYear, viewMonth),
    [allPatients, viewYear, viewMonth]
  );

  const offset   = firstDayOffset(viewYear, viewMonth);
  const numDays  = daysInMonth(viewYear, viewMonth);
  // Total cells = offset blank cells + numbered day cells, rounded up to full week
  const totalCells = Math.ceil((offset + numDays) / 7) * 7;

  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();
  const isCurrentMonth = viewYear === todayY && viewMonth === todayM;

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  // Summary counts for the displayed month
  let totalAdmissions = 0;
  let totalDischarges = 0;
  for (const v of monthData.values()) {
    totalAdmissions += v.admissions;
    totalDischarges += v.discharges;
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 18px 16px" }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <div>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#8A8394", margin: 0,
          }}>
            Admissions &amp; discharges
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1B2E", margin: "2px 0 0" }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </p>
        </div>
        <div className="flex items-center" style={{ gap: 4 }}>
          <button
            type="button" onClick={prevMonth} aria-label="Previous month"
            style={{
              background: "#F6F1F1", border: "none", borderRadius: 8,
              width: 28, height: 28, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "#6B6474",
            }}
          >
            <span className="ti ti-chevron-left" style={{ fontSize: 14 }} aria-hidden="true" />
          </button>
          <button
            type="button" onClick={nextMonth} aria-label="Next month"
            style={{
              background: "#F6F1F1", border: "none", borderRadius: 8,
              width: 28, height: 28, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "#6B6474",
            }}
          >
            <span className="ti ti-chevron-right" style={{ fontSize: 14 }} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Day-of-week headers ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{
            textAlign: "center", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.06em", color: "#C9BBDF",
            padding: "2px 0",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Day cells ───────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - offset + 1;
          const isValid = dayNum >= 1 && dayNum <= numDays;
          if (!isValid) {
            return <div key={i} style={{ height: 42 }} />;
          }

          const isToday = isCurrentMonth && dayNum === todayD;
          const data    = monthData.get(dayNum);

          return (
            <div
              key={i}
              style={{
                height: 42, borderRadius: 8,
                background: isToday ? "#F8F5FD" : "transparent",
                display: "flex", flexDirection: "column",
                alignItems: "center", padding: "5px 0 4px",
                position: "relative",
              }}
            >
              {/* Day number */}
              <span style={{
                fontSize: 11, fontWeight: isToday ? 700 : 500,
                color: isToday ? "#7C5FAE" : "#4A4458",
                lineHeight: 1,
              }}>
                {dayNum}
              </span>

              {/* Dots row */}
              {data && (
                <div className="flex" style={{ gap: 2, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
                  {data.admissions > 0 && (
                    <span
                      title={`${data.admissions} admission${data.admissions > 1 ? "s" : ""}`}
                      style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "#4FB5A8", flexShrink: 0,
                      }}
                    />
                  )}
                  {data.discharges > 0 && (
                    <span
                      title={`${data.discharges} discharge${data.discharges > 1 ? "s" : ""}`}
                      style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "#E08A4F", flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #F3EFF4", marginTop: 10, paddingTop: 10 }}>
        <div className="flex" style={{ gap: 14, justifyContent: "center" }}>
          {[
            { color: "#4FB5A8", label: "Admissions", count: totalAdmissions },
            { color: "#E08A4F", label: "Discharges", count: totalDischarges },
          ].map(({ color, label, count }) => (
            <div key={label} className="flex items-center" style={{ gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 500, color: "#8A8394" }}>
                {label}
                {count > 0 && (
                  <span style={{ fontWeight: 700, color: "#4A4458", marginLeft: 3 }}>{count}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
