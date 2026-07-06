/**
 * Shared formatting helpers for patient components.
 * Monospace class is applied by callers via font-mono / data-mono.
 */

/** "2h 14m ago", "45m ago", "3d ago" */
export function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** "09:14", "14:32" — for timeline timestamps (render in Spline Sans Mono) */
export function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "Jul 4" */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** "Jul 4, 09:14" */
export function shortDateTime(iso: string): string {
  return `${shortDate(iso)}, ${timeOfDay(iso)}`;
}

/** "Day 3 of stay" */
export function dayOfStayLabel(n: number): string {
  return `Day ${n}`;
}

/** "2h 14m" elapsed (no "ago") */
export function elapsedSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
