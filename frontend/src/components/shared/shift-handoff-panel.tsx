"use client";

import { useState } from "react";
import { getShiftHandoff, type ShiftHandoff } from "@/lib/api";

interface ShiftHandoffPanelProps {
  scope: "doctor" | "nurse";
}

export function ShiftHandoffPanel({ scope }: ShiftHandoffPanelProps) {
  const [handoff, setHandoff] = useState<ShiftHandoff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getShiftHandoff(scope);
      setHandoff(data);
    } catch {
      setError("Could not generate handoff. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const label = scope === "doctor" ? "Physician" : "Nursing";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div className="flex items-center" style={{ gap: 6 }}>
          <span
            className="ti ti-clipboard-text"
            style={{ fontSize: 14, color: "#7C5FAE" }}
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
            AI Shift Handoff
          </span>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading}
          style={{
            background: loading ? "#EFEBEF" : "#7C5FAE",
            border: "none",
            borderRadius: 8,
            padding: "7px 12px",
            fontSize: 11,
            fontWeight: 600,
            color: loading ? "#8A8394" : "#fff",
            cursor: loading ? "default" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {loading ? "Generating…" : `Generate ${label} handoff`}
        </button>
      </div>

      {!handoff && !error && !loading && (
        <p style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", margin: 0, lineHeight: 1.5 }}>
          Create a concise handoff summary for the incoming {scope} covering all
          assigned patients and watch-items.
        </p>
      )}

      {error && (
        <p style={{ fontSize: 12, fontWeight: 500, color: "#A83F2F", margin: 0 }}>
          {error}
        </p>
      )}

      {handoff && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#4A4458",
              lineHeight: 1.6,
              margin: 0,
              background: "#F8F5FD",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            {handoff.summary}
          </p>

          {handoff.highlights.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#8A8394",
                }}
              >
                Watch list
              </span>
              {handoff.highlights.map((item) => (
                <div
                  key={item.patientId}
                  style={{
                    borderTop: "1px solid #F3EFF4",
                    paddingTop: 8,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1D1B2E" }}>
                    {item.name}{" "}
                    <span style={{ fontWeight: 500, color: "#8A8394" }}>
                      ({item.room})
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#6B6474",
                      lineHeight: 1.5,
                      margin: "4px 0 0",
                    }}
                  >
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
