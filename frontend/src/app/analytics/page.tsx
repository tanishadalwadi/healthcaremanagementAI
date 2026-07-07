"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getAnalyticsSummary, type AnalyticsSummary } from "@/lib/api";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const options =
      user.role === "nurse" && user.nurseId
        ? { nurseId: user.nurseId }
        : user.role === "doctor" && user.doctorId
          ? { doctorId: user.doctorId }
          : undefined;

    getAnalyticsSummary(options)
      .then(setSummary)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <PageState message="Loading analytics…" />;
  }

  if (!summary) {
    return <PageState message="No analytics data available." />;
  }

  const scopeLabel =
    user?.role === "nurse"
      ? "Your assigned patients"
      : user?.role === "doctor"
        ? "Your patients"
        : "Hospital-wide";

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Analytics</h1>
        <p style={{ fontSize: 12, color: "#8A8394", marginTop: 4, marginBottom: 0 }}>
          {scopeLabel} · live from backend
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard label="Total" value={summary.totalPatients} />
        <StatCard label="On track" value={summary.activePatients} accent="#4FB5A8" />
        <StatCard label="Waiting" value={summary.waitingPatients} accent="#E08A4F" />
        <StatCard label="Urgent" value={summary.urgentCount} accent="#DC2626" />
        <StatCard label="Discharged" value={summary.dischargedPatients} accent="#8A8394" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <BreakdownCard title="By department" items={summary.byDepartment} />
        <BreakdownCard title="By care status" items={summary.byPriority} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "#7C5FAE",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        padding: "16px 18px",
        border: "1px solid #F0EBF2",
      }}
    >
      <div style={{ fontSize: 11, color: "#8A8394", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent }}>{value}</div>
    </div>
  );
}

function BreakdownCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ name?: string; label?: string; count: number }>;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        padding: "18px 20px",
        border: "1px solid #F0EBF2",
      }}
    >
      <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>{title}</h2>
      {items.length === 0 ? (
        <p style={{ fontSize: 12, color: "#8A8394", margin: 0 }}>No data</p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col" style={{ gap: 10 }}>
          {items.map((item) => {
            const label = item.name ?? item.label ?? "—";
            const width = `${Math.round((item.count / max) * 100)}%`;
            return (
              <li key={label}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 12, color: "#8A8394" }}>{item.count}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 99,
                    background: "#F3EFF4",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width,
                      height: "100%",
                      background: "#7C5FAE",
                      borderRadius: 99,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PageState({ message }: { message: string }) {
  return (
    <div style={{ padding: "48px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
      {message}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        marginBottom: 16,
        padding: "12px 14px",
        borderRadius: 12,
        background: "#F8DFDB",
        color: "#DC2626",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}
