/**
 * NotificationList — flat list of patient alerts.
 *
 * Spec (from design reference):
 *   Container: bg #fff, radius 14px, padding 22px
 *   Each row: <button> full-width; border-top 1px solid #F3EFF4 (divider);
 *             padding 11px 4px; gap 10px; align-items flex-start; hover bg #FAF7FA
 *   Status dot: 8×8px circle, margin-top 4px — color encodes urgency (not read state)
 *   Text: 12px/500/#4A4458/line-height:1.4 — "{patientName} — {summary}"
 *   Timestamp: 10px/500/#8A8394; white-space nowrap
 *
 * There is NO read/unread visual distinction in the design system.
 * The dot encodes status urgency, not seen state.
 *
 * Server component — rows are Links to patient detail pages.
 */

import Link from "next/link";
import type { Notification, PatientStatus } from "@/types";
import { relativeTime } from "@/lib/format";

// Status → dot color (matches design reference exactly)
const DOT: Record<PatientStatus, string> = {
  critical: "#DC2626",
  blocked:  "#4A4458",
  delayed:  "#E08A4F",
  ontrack:  "#4FB5A8",
};

interface NotificationListProps {
  notifications: Notification[];
}

export function NotificationList({ notifications }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 22,
          textAlign: "center",
          color: "#8A8394",
          fontSize: 13,
        }}
      >
        No notifications
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 22 }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={`/patients/${n.patientId}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "11px 4px",
              borderTop: "1px solid #F3EFF4",
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {/* Status dot */}
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: DOT[n.status],
                marginTop: 4,
                flexShrink: 0,
                display: "inline-block",
              }}
              aria-label={n.status}
            />

            {/* Notification text */}
            <span
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: 500,
                color: "#4A4458",
                lineHeight: 1.4,
              }}
            >
              {n.patientName} — {n.summary}
            </span>

            {/* Relative timestamp */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "#8A8394",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {relativeTime(n.timestamp)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
