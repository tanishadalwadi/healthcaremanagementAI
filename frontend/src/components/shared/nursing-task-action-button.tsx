"use client";

/**
 * NursingTaskActionButton — shared Start / Complete button for nursing tasks.
 *
 * Used in two places:
 *   1. NursingTaskList  (nurse dashboard /nurse)
 *   2. TasksTab nurse view (patient detail /patients/[id])
 *
 * Renders nothing for done tasks.
 * The parent owns local task state and the saving-Set — this component is
 * purely presentational, receiving a pre-computed `isSaving` flag and an
 * `onClick` callback that fires the optimistic update + API call.
 */

import type { NursingTaskStatus } from "@/types";

interface NursingTaskActionButtonProps {
  status: NursingTaskStatus;
  isSaving: boolean;
  onClick: () => void;
}

const CONFIG = {
  pending: {
    bg: "#E1F3F0", bgHover: "#C6EAE4",
    border: "#A8DACD", color: "#2D7A72",
    label: "Start", savingLabel: "Starting…",
  },
  active: {
    bg: "#EFE7F7", bgHover: "#E0D4F5",
    border: "#D4C8E8", color: "#7C5FAE",
    label: "Complete", savingLabel: "Saving…",
  },
} as const;

export function NursingTaskActionButton({
  status,
  isSaving,
  onClick,
}: NursingTaskActionButtonProps) {
  if (status === "done") return null;
  const cfg = CONFIG[status];

  return (
    <button
      onClick={onClick}
      disabled={isSaving}
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 12px",
        borderRadius: 6,
        border: `1.5px solid ${cfg.border}`,
        background: cfg.bg,
        color: cfg.color,
        cursor: isSaving ? "default" : "pointer",
        transition: "background 0.15s",
        lineHeight: 1.4,
      }}
      onMouseEnter={(e) => {
        if (!isSaving)
          (e.currentTarget as HTMLButtonElement).style.background = cfg.bgHover;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = cfg.bg;
      }}
    >
      {isSaving ? cfg.savingLabel : cfg.label}
    </button>
  );
}
