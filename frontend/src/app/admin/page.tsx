/**
 * Admin dashboard — /admin  (Phase 9C redesign, Phase 10 interactive KPIs)
 *
 * Layout:
 *   1. Header — greeting + "New patient" button
 *   2. KPI row — Available Beds · Ambulances · Doctors · Discharge Queue
 *      All 4 cards are clickable (Phase 10B adds detail pages for the first 3).
 *      Discharge card shows a "+N new" badge when the queue has grown since
 *      the admin last visited /admin/discharge (tracked in localStorage).
 *   3. Two-column — sortable patient table (left) + admissions calendar (right)
 *   4. Attention feed — compact, below
 *
 * The standalone "N patients marked ready for discharge" orange banner that
 * existed in Phase 9 has been removed — that signal now lives on the card.
 *
 * Client component — all reads go through api.ts against shared in-memory data.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAdminKPIs,
  getAttentionFeed,
  getPatients,
  getAllPatients,
  getDischargeQueue,
  type AdminKPIs,
} from "@/lib/api";
import { KpiCard }            from "@/components/dashboard/kpi-card";
import { AttentionFeed }      from "@/components/dashboard/attention-feed";
import { AdminPatientTable }  from "@/components/admin/admin-patient-table";
import { AdminCalendar }      from "@/components/admin/admin-calendar";
import { CreatePatientModal } from "@/components/admin/create-patient-modal";
import { AdminAskPulse }     from "@/components/admin/admin-ask-pulse";
import type { Patient, PatientDetail } from "@/types";

// ─── localStorage key for "new since last viewed" discharge badge ─────────────
const DISCHARGE_SEEN_KEY = "pulse_discharge_seen_count_morgan";

// ─── KPI definitions ──────────────────────────────────────────────────────────

// ─── Chart datum ──────────────────────────────────────────────────────────────

type ChartDatum = { label: string; value: number };

/** Only the numeric scalar keys in AdminKPIs — excludes the breakdown Record fields. */
type NumericKpiKey = {
  [K in keyof AdminKPIs]: AdminKPIs[K] extends number ? K : never;
}[keyof AdminKPIs];

type KpiDef = {
  key: NumericKpiKey;
  label: string;
  icon: string;
  accent: string;
  tint: string;
  href: string;
  getChartData: (kpis: AdminKPIs, dischargeQueue: PatientDetail[]) => ChartDatum[];
};

const DEPT_ORDER = [
  "Cardiology", "General Medicine", "ICU", "Orthopedics", "Radiology",
] as const;

const KPI_DEFS: KpiDef[] = [
  {
    key: "availableBeds", label: "Available beds", icon: "ti-bed",
    accent: "#4FB5A8", tint: "#E1F3F0", href: "/admin/beds",
    getChartData: (kpis) =>
      DEPT_ORDER.map((d) => ({ label: d, value: kpis.bedsByDept[d] ?? 0 })),
  },
  {
    key: "availableAmbulances", label: "Available ambulances", icon: "ti-ambulance",
    accent: "#E08A4F", tint: "#FBE9DA", href: "/admin/ambulances",
    getChartData: (kpis) => [
      { label: "Available",  value: kpis.availableAmbulances  },
      { label: "Dispatched", value: kpis.dispatchedAmbulances },
    ],
  },
  {
    key: "availableDoctors", label: "Doctors on staff", icon: "ti-stethoscope",
    accent: "#7C5FAE", tint: "#EFE7F7", href: "/admin/doctors",
    getChartData: (kpis) => {
      // ALL_DOCTORS uses "ICU / Critical Care" as the specialty name;
      // map it to the canonical dept name "ICU" for the chart slot.
      const specialtyKey = (dept: string) =>
        dept === "ICU" ? "ICU / Critical Care" : dept;
      return DEPT_ORDER.map((d) => ({
        label: d,
        value: kpis.doctorsBySpecialty[specialtyKey(d)] ?? 0,
      }));
    },
  },
  {
    key: "dischargeQueueCount", label: "Discharge queue", icon: "ti-door-exit",
    accent: "#2D7A72", tint: "#E1F3F0", href: "/admin/discharge",
    getChartData: (_kpis, dischargeQueue) => {
      const byDept = dischargeQueue.reduce<Record<string, number>>((acc, p) => {
        acc[p.departmentId] = (acc[p.departmentId] ?? 0) + 1;
        return acc;
      }, {});
      return DEPT_ORDER
        .map((d) => ({ label: d, value: byDept[d] ?? 0 }))
        .filter((d) => d.value > 0); // only show depts with queue entries
    },
  },
];

// ─── Greeting ─────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [kpis,           setKpis]           = useState<AdminKPIs | null>(null);
  const [feed,           setFeed]           = useState<Awaited<ReturnType<typeof getAttentionFeed>>>([]);
  const [patients,       setPatients]       = useState<Patient[]>([]);
  const [allPatients,    setAllPatients]    = useState<Patient[]>([]);
  const [dischargeQueue, setDischargeQueue] = useState<PatientDetail[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [refreshKey,     setRefreshKey]     = useState(0);
  // Last count the admin acknowledged (from localStorage)
  const [seenCount,      setSeenCount]      = useState(0);

  // Read the "seen" count once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISCHARGE_SEEN_KEY);
      setSeenCount(stored ? parseInt(stored, 10) : 0);
    } catch {
      // localStorage may be unavailable (SSR guard, private browsing, etc.)
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAdminKPIs(),
      getAttentionFeed(),
      getPatients(),
      getAllPatients(),
      getDischargeQueue(),
    ]).then(([k, f, p, all, dq]) => {
      setKpis(k);
      setFeed(f);
      setPatients(p);
      setAllPatients(all);
      setDischargeQueue(dq);
      setLoading(false);
    });
  }, [refreshKey]);

  const handleCreated = useCallback(() => {
    setRefreshKey((n) => n + 1);
  }, []);

  // Compute "+N new" badge for discharge card
  const dischargeCount = kpis?.dischargeQueueCount ?? 0;
  const newCount       = Math.max(0, dischargeCount - seenCount);
  const dischargeBadge = newCount > 0 ? `+${newCount} new` : undefined;

  if (loading && !kpis) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
        Loading dashboard…
      </div>
    );
  }

  return (
    <>
      <div>
        {/* ── 1. Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between" style={{ marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
              {greeting()}, Morgan
            </h1>
            <p style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", marginTop: 2, marginBottom: 0 }}>
              {patients.length} admitted · {kpis?.availableBeds ?? "—"} beds available
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center shrink-0"
            style={{
              gap: 7, background: "#7C5FAE", border: "none",
              borderRadius: 12, padding: "10px 16px",
              fontSize: 13, fontWeight: 600, color: "#fff",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <span className="ti ti-user-plus" style={{ fontSize: 16 }} aria-hidden="true" />
            New patient
          </button>
        </div>

        {/* ── 2. KPI row ────────────────────────────────────────────────────── */}
        {kpis && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
              marginBottom: 22,
            }}
          >
            {KPI_DEFS.map((def) => (
              <KpiCard
                key={def.key}
                label={def.label}
                value={kpis[def.key]}
                icon={def.icon}
                accent={def.accent}
                tint={def.tint}
                href={def.href}
                badge={def.key === "dischargeQueueCount" ? dischargeBadge : undefined}
                chartData={def.getChartData(kpis, dischargeQueue)}
              />
            ))}
          </div>
        )}

        {/* ── 3. Table + Calendar ───────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 280px",
            gap: 18,
            alignItems: "start",
            marginBottom: 22,
          }}
        >
          <AdminPatientTable patients={patients} />
          <AdminCalendar allPatients={allPatients} />
        </div>

        {/* ── 4. Attention feed ─────────────────────────────────────────────── */}
        {feed.length > 0 && <AttentionFeed items={feed} />}
      </div>

      {/* ── Ask Pulse ─────────────────────────────────────────────────────────── */}
      <AdminAskPulse allPatients={allPatients} dischargeQueue={dischargeQueue} />

      {/* ── Create patient modal ──────────────────────────────────────────────── */}
      {showModal && (
        <CreatePatientModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
