"use client";

import { useCallback, useEffect, useState } from "react";
import { getWorkflowReplay, type WorkflowReplay } from "@/lib/api";
import { shortDate, timeOfDay } from "@/lib/format";

const PHASE_LABEL: Record<string, string> = {
  intake: "Intake & diagnosis",
  inpatient: "Inpatient care",
  discharge: "Discharge",
};

const STATUS_COLOR: Record<string, string> = {
  completed: "#4FB5A8",
  in_progress: "#E08A4F",
  blocked: "#DC2626",
  pending: "#8A8394",
};

interface WorkflowReplayPlayerProps {
  patientId: string;
}

export function WorkflowReplayPlayer({ patientId }: WorkflowReplayPlayerProps) {
  const [replay, setReplay] = useState<WorkflowReplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void getWorkflowReplay(patientId)
      .then((data) => {
        if (!cancelled) setReplay(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load workflow replay.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  useEffect(() => {
    if (!playing || !replay?.steps.length) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((index) => {
        if (index >= replay.steps.length - 1) {
          setPlaying(false);
          return index;
        }
        return index + 1;
      });
    }, 2800);

    return () => window.clearInterval(timer);
  }, [playing, replay]);

  const handlePlay = useCallback(() => {
    if (!replay?.steps.length) return;
    if (currentIndex >= replay.steps.length - 1) {
      setCurrentIndex(0);
    }
    setPlaying(true);
  }, [currentIndex, replay]);

  if (loading) {
    return (
      <div style={{ fontSize: 12, color: "#8A8394", padding: "12px 0" }}>
        Generating AI workflow replay…
      </div>
    );
  }

  if (error || !replay) {
    return (
      <div style={{ fontSize: 12, color: "#A83F2F", padding: "12px 0" }}>
        {error ?? "Replay unavailable."}
      </div>
    );
  }

  const currentStep = replay.steps[currentIndex];

  return (
    <div
      style={{
        background: "#EFE7F7",
        borderRadius: 14,
        padding: "16px 18px",
        marginBottom: 18,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div className="flex items-center" style={{ gap: 6 }}>
          <span
            className="ti ti-player-play"
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
            AI Workflow Replay
          </span>
        </div>
        <div className="flex items-center" style={{ gap: 6 }}>
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            style={controlBtnStyle}
            aria-label="Previous step"
          >
            <span className="ti ti-chevron-left" style={{ fontSize: 14 }} />
          </button>
          <button
            type="button"
            onClick={() => (playing ? setPlaying(false) : handlePlay())}
            style={{ ...controlBtnStyle, background: "#7C5FAE", color: "#fff" }}
            aria-label={playing ? "Pause replay" : "Play replay"}
          >
            <span className={`ti ${playing ? "ti-player-pause" : "ti-player-play"}`} style={{ fontSize: 14 }} />
          </button>
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((i) =>
                Math.min(replay.steps.length - 1, i + 1),
              )
            }
            disabled={currentIndex >= replay.steps.length - 1}
            style={controlBtnStyle}
            aria-label="Next step"
          >
            <span className="ti ti-chevron-right" style={{ fontSize: 14 }} />
          </button>
        </div>
      </div>

      <p
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#4A4458",
          lineHeight: 1.55,
          margin: "0 0 14px",
        }}
      >
        {replay.overview}
      </p>

      {currentStep && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 12,
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#7C5FAE" }}>
              Step {currentIndex + 1} of {replay.steps.length}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#8A8394" }}>
              {PHASE_LABEL[currentStep.phase] ?? currentStep.phase}
            </span>
          </div>
          <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: STATUS_COLOR[currentStep.status] ?? "#8A8394",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1B2E" }}>
              {currentStep.title}
            </span>
          </div>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#8A8394", margin: "0 0 8px" }}>
            {shortDate(currentStep.occurredAt)} · {timeOfDay(currentStep.occurredAt)}
          </p>
          <p style={{ fontSize: 12, fontWeight: 500, color: "#4A4458", lineHeight: 1.55, margin: 0 }}>
            {currentStep.narration}
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 4 }}>
        {replay.steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => {
              setCurrentIndex(index);
              setPlaying(false);
            }}
            aria-label={`Go to step ${index + 1}: ${step.title}`}
            style={{
              flex: 1,
              height: 4,
              border: "none",
              borderRadius: 999,
              cursor: "pointer",
              background:
                index <= currentIndex ? "#7C5FAE" : "rgba(124,95,174,0.2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const controlBtnStyle: React.CSSProperties = {
  background: "rgba(124,95,174,0.12)",
  border: "none",
  borderRadius: 8,
  width: 30,
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#7C5FAE",
  cursor: "pointer",
};
