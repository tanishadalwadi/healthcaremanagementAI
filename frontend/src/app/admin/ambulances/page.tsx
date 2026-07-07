/**
 * /admin/ambulances — Ambulance fleet detail page
 *
 * Flat list of the full fleet with available/dispatched status.
 * Admin can dispatch or return units via PATCH /ambulances/:id/status.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAllAmbulances, updateAmbulanceStatus } from "@/lib/api";
import type { Ambulance } from "@/types";

export default function AmbulancesPage() {
  const [fleet, setFleet] = useState<Ambulance[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadFleet = useCallback(() => {
    return getAllAmbulances().then((units) => {
      setFleet(units);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  async function handleToggle(unit: Ambulance) {
    const nextStatus = unit.status === "available" ? "dispatched" : "available";
    setUpdatingId(unit.id);
    try {
      await updateAmbulanceStatus(unit.id, nextStatus);
      setFleet((prev) =>
        prev.map((item) =>
          item.id === unit.id ? { ...item, status: nextStatus } : item,
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const available = fleet.filter((a) => a.status === "available");
  const dispatched = fleet.filter((a) => a.status === "dispatched");

  function renderUnit(unit: Ambulance, variant: "available" | "dispatched") {
    const isAvailable = variant === "available";
    const busy = updatingId === unit.id;

    return (
      <div
        key={unit.id}
        className="flex items-center justify-between"
        style={{
          background: isAvailable ? "#E1F3F0" : "#fff",
          borderRadius: 10,
          padding: "13px 16px",
          border: isAvailable ? "1.5px solid #4FB5A830" : "1.5px solid #F0ECF4",
        }}
      >
        <div className="flex items-center" style={{ gap: 10 }}>
          <span
            className="ti ti-ambulance"
            style={{ fontSize: 18, color: isAvailable ? "#4FB5A8" : "#E08A4F" }}
            aria-hidden="true"
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1B2E" }}>
            {unit.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleToggle(unit)}
          disabled={busy}
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            padding: "6px 10px",
            borderRadius: 5,
            border: "none",
            background: isAvailable ? "#4FB5A820" : "#FBE9DA",
            color: isAvailable ? "#2D7A72" : "#9A6435",
            cursor: busy ? "default" : "pointer",
            fontFamily: "inherit",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy
            ? "Updating…"
            : isAvailable
              ? "Dispatch"
              : "Mark available"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div className="flex items-center" style={{ gap: 10, marginBottom: 4 }}>
          <Link
            href="/admin"
            className="flex items-center justify-center shrink-0"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: "1.5px solid #E7E0E9",
              background: "#fff",
              color: "#6B6474",
              textDecoration: "none",
            }}
            aria-label="Back to dashboard"
          >
            <span className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden="true" />
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
            Ambulance fleet
          </h1>
        </div>
        {!loading && (
          <p style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", margin: 0, paddingLeft: 44 }}>
            {available.length} available · {dispatched.length} dispatched · {fleet.length} total
          </p>
        )}
      </div>

      {loading && (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
          Loading fleet…
        </div>
      )}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {available.length > 0 && (
            <div>
              <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4FB5A8" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1B2E" }}>Available</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8A8394" }}>({available.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {available.map((unit) => renderUnit(unit, "available"))}
              </div>
            </div>
          )}

          {dispatched.length > 0 && (
            <div>
              <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E08A4F" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1B2E" }}>Dispatched</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8A8394" }}>({dispatched.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dispatched.map((unit) => renderUnit(unit, "dispatched"))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
