/**
 * AttentionFeed — "Needs your attention" section.
 *
 * Spec:
 *   Container: bg:#fff, radius:16px, padding:8px 20px 12px
 *   Header: 15px/600 title + muted right label
 *   Rows separated by border-top:1px solid #F3EFF4, padding:14px 6px
 *   Each row: icon chip (36×36, radius:10, bg:#F6F1F1), title+who, status, time, chevron
 *   Status: blocked/critical → badge (height:22px, radius:5px); delayed/ontrack → dot (8×8px)
 *   Badge text: 11px/700; Row title: 13px/600; Who: 11px/500 muted
 *   Time: 11px/500 muted, width:74px right-aligned
 *
 * Server component — no interactivity needed; rows are <Link> to patient detail.
 */

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AttentionItem } from "@/lib/api";
import type { PatientStatus } from "@/types";

// ─── Status indicator ──────────────────────────────────────────────────────────

interface StatusConfig {
  isBadge: boolean;
  badgeBg: string;
  badgeText: string;
  dot: string;
  label: string;
}

const STATUS_CFG: Record<PatientStatus, StatusConfig> = {
  critical: { isBadge: true,  badgeBg: "#F8DFDB", badgeText: "#A83F2F", dot: "#DC2626", label: "Critical" },
  blocked:  { isBadge: true,  badgeBg: "#EFEBEF", badgeText: "#4A4458", dot: "#8A8394", label: "Blocked"  },
  delayed:  { isBadge: false, badgeBg: "#FBE9DA", badgeText: "#9A6435", dot: "#E08A4F", label: "Delayed"  },
  ontrack:  { isBadge: false, badgeBg: "#E1F3F0", badgeText: "#327A70", dot: "#4FB5A8", label: "On track" },
};

function FeedStatusIndicator({ status }: { status: PatientStatus }) {
  const cfg = STATUS_CFG[status];

  if (cfg.isBadge) {
    return (
      <span
        className="shrink-0"
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 22,
          padding: "0 10px",
          borderRadius: 5,
          background: cfg.badgeBg,
          color: cfg.badgeText,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {cfg.label}
      </span>
    );
  }

  return (
    <span
      className="shrink-0 rounded-full"
      style={{ width: 8, height: 8, background: cfg.dot, display: "inline-block" }}
      aria-label={cfg.label}
    />
  );
}

// ─── AttentionFeed ────────────────────────────────────────────────────────────

interface AttentionFeedProps {
  items: AttentionItem[];
}

export function AttentionFeed({ items }: AttentionFeedProps) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "8px 20px 12px",
        marginBottom: 22,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "14px 0 6px" }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>Needs your attention</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#8A8394" }}>
          Prioritised across all patients
        </span>
      </div>

      {/* Rows */}
      {items.length === 0 ? (
        <p
          style={{
            fontSize: 13,
            color: "#8A8394",
            textAlign: "center",
            padding: "16px 0",
            borderTop: "1px solid #F3EFF4",
          }}
        >
          No items need attention right now
        </p>
      ) : (
        <div role="list">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/patients/${item.patientId}`}
              role="listitem"
              className="flex items-center"
              style={{
                gap: 14,
                padding: "14px 6px",
                borderTop: "1px solid #F3EFF4",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {/* Icon chip */}
              <span
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#F6F1F1",
                  color: "#6B6474",
                }}
              >
                <span
                  className={cn("ti", item.icon)}
                  style={{ fontSize: 18, lineHeight: 1 }}
                  aria-hidden="true"
                />
              </span>

              {/* Title + who */}
              <span className="flex-1 min-w-0 block">
                <span
                  className="block truncate"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  {item.title}
                </span>
                <span
                  className="block"
                  style={{ fontSize: 11, fontWeight: 500, color: "#8A8394", marginTop: 2 }}
                >
                  {item.patientName} · {item.room}
                </span>
              </span>

              {/* Status badge or dot */}
              <FeedStatusIndicator status={item.status} />

              {/* Relative time */}
              <span
                className="shrink-0 text-right"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#8A8394",
                  whiteSpace: "nowrap",
                  width: 74,
                }}
              >
                {item.relativeTime}
              </span>

              {/* Chevron */}
              <span
                className="ti ti-chevron-right shrink-0"
                style={{ fontSize: 16, color: "#C9BBDF" }}
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
