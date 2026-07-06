/**
 * DoctorAiPanel — "What's happening now" AI surface for morning rounds.
 *
 * Visual pattern: identical to AiSmartPrompts (Phase 7C) —
 * sparkle eyebrow, purple-tint bg (#EFE7F7), icon chips, 12px body text.
 * Reuses the same layout so both roles experience a consistent AI surface.
 *
 * Content: 2-4 grounded items derived from the doctor's own scoped patients.
 * Every item names a specific patient, room, and real data point from
 * their aiSummary, status, or workflowGroups. No vague or generic claims.
 *
 * Runs purely client-side from props — no additional fetches needed.
 */

import { useMemo } from "react";
import type { Patient } from "@/types";
import { relativeTime } from "@/lib/format";

interface AiItem {
  id:   string;
  icon: string;
  text: string;
}

function deriveItems(patients: Patient[]): AiItem[] {
  const items: AiItem[] = [];

  for (const p of patients) {
    if (items.length >= 4) break;

    if (p.status === "critical") {
      items.push({
        id:   `crit-${p.id}`,
        icon: "ti-alert-circle",
        text: `${p.name} (${p.room}) is critical — ${p.aiSummary}`,
      });
      continue;
    }

    if (p.status === "blocked") {
      items.push({
        id:   `blocked-${p.id}`,
        icon: "ti-circle-x",
        text: `${p.name} (${p.room}) discharge-blocked — ${p.aiSummary}`,
      });
      continue;
    }

    if (p.status === "delayed") {
      items.push({
        id:   `delayed-${p.id}`,
        icon: "ti-clock-exclamation",
        text: `${p.name} (${p.room}) status delayed — ${p.aiSummary}`,
      });
    }
  }

  // If fewer than 2 items so far, add stable-but-notable items (any patient)
  if (items.length < 2) {
    for (const p of patients) {
      if (items.length >= 2) break;
      if (items.some((i) => i.id.includes(p.id))) continue;
      items.push({
        id:   `summary-${p.id}`,
        icon: "ti-user-check",
        text: `${p.name} (${p.room}) — ${p.aiSummary}`,
      });
    }
  }

  return items.slice(0, 4);
}

interface DoctorAiPanelProps {
  patients: Patient[];
}

export function DoctorAiPanel({ patients }: DoctorAiPanelProps) {
  const items = useMemo(() => deriveItems(patients), [patients]);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: "#EFE7F7",
        borderRadius: 14,
        padding: "14px 18px",
        margin: "12px 16px 4px",
      }}
    >
      {/* Eyebrow */}
      <div className="flex items-center" style={{ gap: 6, marginBottom: 10 }}>
        <span
          className="ti ti-sparkles"
          style={{ fontSize: 13, color: "#7C5FAE" }}
          aria-hidden="true"
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#7C5FAE",
          }}
        >
          What&apos;s happening now
        </span>
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-start"
            style={{
              gap: 10,
              padding: "8px 0",
              borderTop: i === 0 ? "none" : "1px solid #DDD4EE",
            }}
          >
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "rgba(124,95,174,0.12)",
              }}
              aria-hidden="true"
            >
              <span
                className={`ti ${item.icon}`}
                style={{ fontSize: 13, color: "#7C5FAE" }}
              />
            </span>
            <p
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#4A4458",
                lineHeight: 1.5,
                margin: 0,
                paddingTop: 3,
              }}
            >
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
