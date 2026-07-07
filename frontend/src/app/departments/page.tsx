"use client";

import { useEffect, useState } from "react";
import { getDepartmentsWithStats, type DepartmentWithStats } from "@/lib/api";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDepartmentsWithStats()
      .then(setDepartments)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load departments");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageState message="Loading departments…" />;
  }

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Departments</h1>
        <p style={{ fontSize: 12, color: "#8A8394", marginTop: 4, marginBottom: 0 }}>
          {departments.length} departments · live from backend
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {departments.map((department) => (
          <div
            key={department.id}
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              padding: "16px 18px",
              border: "1px solid #F0EBF2",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {department.displayName}
            </div>
            <div style={{ fontSize: 11, color: "#8A8394", marginBottom: 12 }}>
              {department.name}
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12, color: "#6B6474" }}>Active patients</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#7C5FAE" }}>
                {department.activePatients}
              </span>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "#8A8394" }}>
              Status: {department.status.toLowerCase()}
            </div>
          </div>
        ))}
      </div>
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
