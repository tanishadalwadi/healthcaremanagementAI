"use client";

import { useEffect, useState } from "react";
import {
  getPredictiveBottlenecks,
  type PredictiveBottlenecks,
} from "@/lib/api";

const RISK_COLOR = {
  high: "#DC2626",
  medium: "#E08A4F",
  low: "#4FB5A8",
} as const;

const RISK_BG = {
  high: "#F8DFDB",
  medium: "#FBE9DA",
  low: "#E1F3F0",
} as const;

export function PredictiveBottlenecksPanel() {
  const [data, setData] = useState<PredictiveBottlenecks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getPredictiveBottlenecks()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("Forecast unavailable.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "18px 20px",
        marginBottom: 22,
      }}
    >
      <div className="flex items-center" style={{ gap: 6, marginBottom: 12 }}>
        <span
          className="ti ti-chart-line"
          style={{ fontSize: 15, color: "#7C5FAE" }}
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
          Predictive Bottlenecks
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#9B7CCC",
            background: "rgba(124,95,174,0.1)",
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          Tomorrow
        </span>
      </div>

      {loading && (
        <p style={{ fontSize: 12, color: "#8A8394", margin: 0 }}>
          Forecasting tomorrow&apos;s delays…
        </p>
      )}

      {error && (
        <p style={{ fontSize: 12, color: "#A83F2F", margin: 0 }}>{error}</p>
      )}

      {data && (
        <>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#4A4458",
              lineHeight: 1.6,
              margin: "0 0 14px",
            }}
          >
            {data.forecast}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            {data.predictions.map((prediction) => (
              <div
                key={prediction.id}
                style={{
                  border: "1px solid #F0ECF4",
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: 6 }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#6B6474" }}>
                    {prediction.department}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: RISK_COLOR[prediction.risk],
                      background: RISK_BG[prediction.risk],
                      borderRadius: 4,
                      padding: "2px 6px",
                    }}
                  >
                    {prediction.risk}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#1D1B2E",
                    marginBottom: 4,
                  }}
                >
                  {prediction.title}
                </div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#6B6474",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {prediction.description}
                </p>
                {prediction.affectedPatients.length > 0 && (
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: "#8A8394",
                      margin: "8px 0 0",
                      lineHeight: 1.4,
                    }}
                  >
                    {prediction.affectedPatients.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
