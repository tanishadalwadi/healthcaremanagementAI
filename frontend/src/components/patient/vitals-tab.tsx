"use client";

/**
 * VitalsTab — Vitals trend view for the patient detail page.
 *
 * Phase 11B.
 *
 * Data: getVitalsForPatient() returns the patient's seeded vitals history
 * merged with any readings posted in this session via postVitals().
 * Everything is real — no fabricated data.
 *
 * Layout:
 *   1. Four reading tiles — current (latest) values for BP, Pulse, Temp, O₂
 *   2. Recharts line chart — Pulse and O₂ on one chart, BP systolic on another
 *      (splitting avoids incompatible y-axis scales on a single chart)
 *   3. Grounded AI insight — cites actual latest reading + real trend direction
 *
 * Chart behavior with sparse data:
 *   1 reading  → single point rendered as a dot (Recharts handles this)
 *   2+ readings → line connects them
 */

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getVitalsForPatient } from "@/lib/api";
import type { VitalsEntry } from "@/types";

// ─── Time label helper ────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ap = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${m}${ap}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${fmtTime(iso)}`;
}

// ─── Parse BP string into systolic integer ────────────────────────────────────

function parseSystolic(bp: string): number {
  return parseInt(bp.split("/")[0], 10) || 0;
}

function parseDiastolic(bp: string): number {
  return parseInt(bp.split("/")[1], 10) || 0;
}

// ─── Trend helpers ────────────────────────────────────────────────────────────

type TrendDir = "up" | "down" | "stable";

function trend(values: number[]): TrendDir {
  if (values.length < 2) return "stable";
  const first = values[0];
  const last  = values[values.length - 1];
  const delta = last - first;
  if (Math.abs(delta) < 2) return "stable";
  return delta > 0 ? "up" : "down";
}

function trendIcon(dir: TrendDir): string {
  return dir === "up" ? "↑" : dir === "down" ? "↓" : "→";
}

// ─── Reading tile ─────────────────────────────────────────────────────────────

function ReadingTile({
  icon, label, value, unit, accent, tint, trendDir,
}: {
  icon: string;
  label: string;
  value: string;
  unit: string;
  accent: string;
  tint: string;
  trendDir: TrendDir;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "14px 16px",
        border: "1.5px solid #F0ECF4",
        flex: 1,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <div
          style={{
            width: 30, height: 30, borderRadius: 8,
            background: tint,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span className={`ti ${icon}`} style={{ fontSize: 15, color: accent }} aria-hidden="true" />
        </div>
        <span style={{ fontSize: 16, fontWeight: 600, color: accent }}>
          {trendIcon(trendDir)}
        </span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#1D1B2E", lineHeight: 1 }}>
        {value}
        <span style={{ fontSize: 11, fontWeight: 500, color: "#8A8394", marginLeft: 3 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8394", marginTop: 5 }}>
        {label}
      </div>
    </div>
  );
}

// ─── Grounded AI insight ──────────────────────────────────────────────────────

function vitalInsight(entries: VitalsEntry[]): string {
  if (entries.length === 0) return "No vitals recorded yet.";
  const latest  = entries[entries.length - 1];
  const pulses  = entries.map((e) => e.pulse);
  const systs   = entries.map((e) => parseSystolic(e.bp));
  const o2s     = entries.map((e) => e.o2Sat);

  const pulseTrend = trend(pulses);
  const bpTrend    = trend(systs);
  const o2Trend    = trend(o2s);

  const parts: string[] = [];

  // BP note
  const sys = parseSystolic(latest.bp);
  if (sys >= 160)      parts.push(`BP ${latest.bp} mmHg is elevated — trending ${trendIcon(bpTrend)}.`);
  else if (sys <= 100) parts.push(`BP ${latest.bp} mmHg is low — trending ${trendIcon(bpTrend)}.`);
  else                 parts.push(`BP ${latest.bp} mmHg within normal range.`);

  // Pulse note
  if (latest.pulse > 100)     parts.push(`Pulse ${latest.pulse} bpm (tachycardic, ${pulseTrend}).`);
  else if (latest.pulse < 55) parts.push(`Pulse ${latest.pulse} bpm (bradycardic, ${pulseTrend}).`);
  else                         parts.push(`Pulse ${latest.pulse} bpm (${pulseTrend}).`);

  // O₂ note
  if (latest.o2Sat < 94) parts.push(`O₂ saturation ${latest.o2Sat}% — below target; trending ${trendIcon(o2Trend)}.`);
  else                    parts.push(`O₂ sat ${latest.o2Sat}% stable.`);

  // Entry count context
  const ctx = entries.length === 1
    ? "Based on 1 reading."
    : `Based on ${entries.length} readings over this admission.`;

  return parts.join(" ") + " " + ctx;
}

// ─── Custom Recharts tooltip ──────────────────────────────────────────────────

function VitalsTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff", borderRadius: 8, padding: "8px 12px",
        border: "1px solid #E7E0E9", fontSize: 11, fontWeight: 500,
      }}
    >
      <div style={{ color: "#8A8394", marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

// ─── VitalsTab ────────────────────────────────────────────────────────────────

export function VitalsTab({ patientId }: { patientId: string }) {
  const [entries,  setEntries]  = useState<VitalsEntry[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getVitalsForPatient(patientId).then((v) => {
      setEntries(v);
      setLoading(false);
    });
  }, [patientId]);

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
        Loading vitals…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
        No vitals recorded for this patient yet.
      </div>
    );
  }

  const latest = entries[entries.length - 1];

  // Build chart data — label each point with date+time
  const chartData = entries.map((e) => ({
    time:      fmtDate(e.recordedAt),
    Pulse:     e.pulse,
    O2:        e.o2Sat,
    Systolic:  parseSystolic(e.bp),
    Diastolic: parseDiastolic(e.bp),
    Temp:      e.temp,
  }));

  // Trend directions for tiles
  const pulseTrend = trend(entries.map((e) => e.pulse));
  const bpTrend    = trend(entries.map((e) => parseSystolic(e.bp)));
  const tempTrend  = trend(entries.map((e) => e.temp));
  const o2Trend    = trend(entries.map((e) => e.o2Sat));

  // Tick formatter — show fewer ticks when many entries
  const tickInterval = entries.length > 8 ? Math.floor(entries.length / 5) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* ── Current readings row ─────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10 }}>
        <ReadingTile
          icon="ti-activity"
          label="Blood pressure"
          value={latest.bp}
          unit="mmHg"
          accent="#E05252"
          tint="#FDEAEA"
          trendDir={bpTrend}
        />
        <ReadingTile
          icon="ti-heartbeat"
          label="Pulse"
          value={String(latest.pulse)}
          unit="bpm"
          accent="#E08A4F"
          tint="#FBE9DA"
          trendDir={pulseTrend}
        />
        <ReadingTile
          icon="ti-thermometer"
          label="Temperature"
          value={String(latest.temp)}
          unit="°F"
          accent="#4FB5A8"
          tint="#E1F3F0"
          trendDir={tempTrend}
        />
        <ReadingTile
          icon="ti-lungs"
          label="O₂ Saturation"
          value={`${latest.o2Sat}%`}
          unit=""
          accent="#7C5FAE"
          tint="#EFE7F7"
          trendDir={o2Trend}
        />
      </div>

      {/* ── Chart 1: Pulse + O₂ ─────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8394", marginBottom: 10 }}>
          Pulse & O₂ trend
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3EFF4" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: "#8A8394" }}
              interval={tickInterval}
              tickLine={false}
              axisLine={{ stroke: "#E7E0E9" }}
            />
            <YAxis tick={{ fontSize: 9, fill: "#8A8394" }} tickLine={false} axisLine={false} />
            <Tooltip content={<VitalsTooltip />} />
            <Line
              type="monotone" dataKey="Pulse"
              stroke="#E08A4F" strokeWidth={2}
              dot={{ r: entries.length === 1 ? 4 : 2, fill: "#E08A4F" }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone" dataKey="O2"
              stroke="#7C5FAE" strokeWidth={2}
              dot={{ r: entries.length === 1 ? 4 : 2, fill: "#7C5FAE" }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
          {[{ label: "Pulse (bpm)",  color: "#E08A4F" }, { label: "O₂ Sat (%)", color: "#7C5FAE" }].map((l) => (
            <div key={l.label} className="flex items-center" style={{ gap: 5 }}>
              <div style={{ width: 12, height: 2, background: l.color, borderRadius: 1 }} />
              <span style={{ fontSize: 10, fontWeight: 500, color: "#8A8394" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chart 2: BP (systolic / diastolic) ──────────────────────────── */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8394", marginBottom: 10 }}>
          Blood pressure trend
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3EFF4" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: "#8A8394" }}
              interval={tickInterval}
              tickLine={false}
              axisLine={{ stroke: "#E7E0E9" }}
            />
            <YAxis tick={{ fontSize: 9, fill: "#8A8394" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip content={<VitalsTooltip />} />
            <Line
              type="monotone" dataKey="Systolic"
              stroke="#E05252" strokeWidth={2}
              dot={{ r: entries.length === 1 ? 4 : 2, fill: "#E05252" }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone" dataKey="Diastolic"
              stroke="#F08080" strokeWidth={1.5} strokeDasharray="4 3"
              dot={{ r: entries.length === 1 ? 3 : 0, fill: "#F08080" }}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
          {[
            { label: "Systolic",  color: "#E05252", dash: false },
            { label: "Diastolic", color: "#F08080", dash: true  },
          ].map((l) => (
            <div key={l.label} className="flex items-center" style={{ gap: 5 }}>
              <div style={{
                width: 12, height: 2,
                background: l.dash ? "none" : l.color,
                backgroundImage: l.dash ? `repeating-linear-gradient(to right, ${l.color} 0, ${l.color} 4px, transparent 4px, transparent 7px)` : undefined,
                borderRadius: 1,
              }} />
              <span style={{ fontSize: 10, fontWeight: 500, color: "#8A8394" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grounded AI insight ──────────────────────────────────────────── */}
      <div
        style={{
          background: "#EFE7F7", borderRadius: 10, padding: "13px 15px",
          display: "flex", alignItems: "flex-start", gap: 8,
        }}
      >
        <span className="ti ti-sparkles shrink-0" style={{ fontSize: 13, color: "#7C5FAE", marginTop: 1 }} aria-hidden="true" />
        <p style={{ fontSize: 12, fontWeight: 500, color: "#4A4458", margin: 0, lineHeight: 1.55 }}>
          {vitalInsight(entries)}
        </p>
      </div>

      {/* ── Reading count footer ─────────────────────────────────────────── */}
      <div style={{ fontSize: 10, fontWeight: 500, color: "#8A8394", textAlign: "right" }}>
        {entries.length} reading{entries.length !== 1 ? "s" : ""} recorded · last at {fmtTime(latest.recordedAt)}
      </div>
    </div>
  );
}
