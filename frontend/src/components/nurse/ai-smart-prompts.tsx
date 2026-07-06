/**
 * AiSmartPrompts — nurse-scoped AI suggestion panel.
 *
 * Shows 2-4 short, grounded suggestions derived from this nurse's actual
 * assigned-patient data. Each prompt cites a real patient name and data point.
 *
 * Visual pattern mirrors AISummaryCard: sparkle eyebrow + purple-tint container.
 * Rendered as a list of suggestion rows rather than a single block.
 *
 * Spec:
 *   Container: bg #EFE7F7, radius 14, padding 16px 18px
 *   Eyebrow: sparkle icon (#7C5FAE) + "AI Smart Prompts" caption
 *   Row: border-top 1px #DDD4EE; icon chip 28×28 radius 8; text 12px/500/#4A4458
 *   No new hex values — uses existing purple family only
 */

import type { Patient, NursingTask } from "@/types";

interface Prompt {
  id: string;
  icon: string;
  text: string;
}

/**
 * Derives 2-4 grounded prompts from real patient + task data.
 * Every prompt names a specific patient and cites a specific data point.
 */
function derivePrompts(patients: Patient[], tasks: NursingTask[]): Prompt[] {
  const prompts: Prompt[] = [];

  for (const p of patients) {
    if (prompts.length >= 4) break;

    if (p.status === "delayed") {
      prompts.push({
        id: `delayed-${p.id}`,
        icon: "ti-clock-exclamation",
        text: `${p.name} (${p.room}) is delayed — consider a status update to the care team: ${p.aiSummary}`,
      });
    }

    if (p.status === "blocked") {
      prompts.push({
        id: `blocked-${p.id}`,
        icon: "ti-circle-x",
        text: `${p.name} (${p.room}) is discharge-blocked — ${p.aiSummary}`,
      });
    }
  }

  // Fill remaining slots with task-derived prompts
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  for (const task of pendingTasks) {
    if (prompts.length >= 4) break;
    const patient = patients.find((p) => p.id === task.patientId);
    if (!patient) continue;
    // Avoid duplicating a patient already mentioned
    if (prompts.some((pr) => pr.id.includes(patient.id))) continue;
    prompts.push({
      id: `task-${task.id}`,
      icon: "ti-checkbox",
      text: `${patient.name} (${patient.room}) — "${task.title}" is pending. ${task.dueContext}.`,
    });
  }

  // Fallback: general prompt derived from the most recent patient
  if (prompts.length === 0 && patients.length > 0) {
    const p = patients[0];
    prompts.push({
      id: `summary-${p.id}`,
      icon: "ti-user-check",
      text: `${p.name} (${p.room}) — ${p.aiSummary}`,
    });
  }

  return prompts.slice(0, 4);
}

interface AiSmartPromptsProps {
  patients: Patient[];
  tasks: NursingTask[];
}

export function AiSmartPrompts({ patients, tasks }: AiSmartPromptsProps) {
  const prompts = derivePrompts(patients, tasks);

  return (
    <div
      style={{
        background: "#EFE7F7",
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      {/* Eyebrow */}
      <div className="flex items-center" style={{ gap: 6, marginBottom: 12 }}>
        <span
          className="ti ti-sparkles"
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
          AI Smart Prompts
        </span>
      </div>

      {/* Prompt rows */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {prompts.map((prompt, i) => (
          <div
            key={prompt.id}
            className="flex items-start"
            style={{
              gap: 10,
              padding: "10px 0",
              borderTop: i === 0 ? "none" : "1px solid #DDD4EE",
            }}
          >
            {/* Icon chip */}
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(124,95,174,0.12)",
              }}
              aria-hidden="true"
            >
              <span
                className={`ti ${prompt.icon}`}
                style={{ fontSize: 14, color: "#7C5FAE" }}
              />
            </span>

            {/* Text */}
            <p
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#4A4458",
                lineHeight: 1.5,
                margin: 0,
                paddingTop: 4,
              }}
            >
              {prompt.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
