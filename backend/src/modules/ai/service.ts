import { ForbiddenError, NotFoundError } from "../../errors/app-error.js";
import { generateJson, generateText } from "../../lib/gemini.js";
import {
  buildRuleBasedSummary,
  buildStepNarration,
  mapEventPhase,
  serializePatientContext,
} from "./context.js";
import type { AiRepository, PatientContextRecord } from "./repository.js";
import type {
  AiInsightItemDto,
  AiInsightsDto,
  AiScope,
  AiSummaryDto,
  AskPulseDto,
  BottleneckPredictionDto,
  BottleneckRisk,
  HandoffHighlightDto,
  PredictiveBottlenecksDto,
  ShiftHandoffDto,
  WorkflowReplayDto,
  WorkflowReplayStepDto,
} from "./types.js";

const INSIGHT_ICONS = [
  "ti-alert-circle",
  "ti-circle-x",
  "ti-clock-exclamation",
  "ti-user-check",
  "ti-checkbox",
] as const;

function buildSummaryPrompt(patient: PatientContextRecord): string {
  const context = JSON.stringify(serializePatientContext(patient), null, 2);
  return `You are Pulse, a clinical operations AI assistant in a hospital.

Write a concise 2-4 sentence clinical summary for the care team. Cite specific vitals, tasks, workflow status, and discharge conditions from the data only. No markdown, no bullet points.

Patient data:
${context}`;
}

function buildAskPrompt(
  question: string,
  scope: AiScope,
  patients: PatientContextRecord[],
  hospitalStats?: Awaited<ReturnType<AiRepository["getHospitalStats"]>>,
): string {
  const scopeLabel =
    scope === "admin"
      ? "hospital administrator"
      : scope === "doctor"
        ? "attending physician"
        : "charge nurse";

  const payload: Record<string, unknown> = {
    patients: patients.map(serializePatientContext),
  };

  if (hospitalStats) {
    payload.hospital = hospitalStats;
  }

  return `You are Pulse, a read-only hospital AI assistant helping a ${scopeLabel}.

Answer the user's question using ONLY the hospital data below. Cite specific patient names, rooms, vitals, and counts. Be direct and actionable. No markdown. Plain text only. If data is insufficient, say what is missing.

Hospital data:
${JSON.stringify(payload, null, 2)}

Question: ${question}`;
}

function buildInsightsPrompt(
  scope: "doctor" | "nurse",
  patients: PatientContextRecord[],
): string {
  const role =
    scope === "doctor" ? "attending physician morning rounds" : "charge nurse shift";

  const context = JSON.stringify(
    patients.map(serializePatientContext),
    null,
    2,
  );

  return `You are Pulse, a hospital AI for ${role}.

Return JSON only in this exact shape:
{"items":[{"icon":"ti-alert-circle","text":"Patient Name (Room) — specific grounded insight"}]}

Rules:
- 2 to 4 items maximum
- Each item must name a specific patient and room
- icon must be one of: ${INSIGHT_ICONS.join(", ")}
- text is one sentence, under 180 characters
- prioritize critical, blocked, delayed patients and open tasks
- use only the data below

Patient data:
${context}`;
}

function deriveInsightItems(patients: PatientContextRecord[]): AiInsightItemDto[] {
  const items: AiInsightItemDto[] = [];

  for (const patient of patients) {
    if (items.length >= 4) break;
    const ctx = serializePatientContext(patient);
    const status = ctx.status;

    if (status === "critical") {
      items.push({
        id: `crit-${patient.id}`,
        icon: "ti-alert-circle",
        text: `${ctx.name} (${ctx.room ?? "—"}) is critical — ${buildRuleBasedSummary(patient).slice(0, 120)}…`,
      });
      continue;
    }

    if (status === "blocked") {
      items.push({
        id: `blocked-${patient.id}`,
        icon: "ti-circle-x",
        text: `${ctx.name} (${ctx.room ?? "—"}) discharge-blocked — ${buildRuleBasedSummary(patient).slice(0, 120)}…`,
      });
      continue;
    }

    if (status === "delayed") {
      items.push({
        id: `delayed-${patient.id}`,
        icon: "ti-clock-exclamation",
        text: `${ctx.name} (${ctx.room ?? "—"}) status delayed — ${buildRuleBasedSummary(patient).slice(0, 120)}…`,
      });
    }
  }

  if (items.length < 2) {
    for (const patient of patients) {
      if (items.length >= 2) break;
      if (items.some((item) => item.id.includes(patient.id))) continue;
      const ctx = serializePatientContext(patient);
      items.push({
        id: `summary-${patient.id}`,
        icon: "ti-user-check",
        text: `${ctx.name} (${ctx.room ?? "—"}) — ${buildRuleBasedSummary(patient).slice(0, 140)}…`,
      });
    }
  }

  return items.slice(0, 4);
}

function normalizeInsightItems(
  raw: { items?: Array<{ icon?: string; text?: string }> } | null,
  patients: PatientContextRecord[],
): AiInsightItemDto[] {
  const fallback = deriveInsightItems(patients);
  if (!raw?.items?.length) return fallback;

  const items = raw.items
    .filter((item) => item.text?.trim())
    .slice(0, 4)
    .map((item, index) => ({
      id: `ai-${index}`,
      icon:
        item.icon && INSIGHT_ICONS.includes(item.icon as (typeof INSIGHT_ICONS)[number])
          ? item.icon
          : "ti-user-check",
      text: item.text!.trim(),
    }));

  return items.length > 0 ? items : fallback;
}

function assertScopeAccess(
  requestedScope: AiScope,
  userRole: "ADMIN" | "NURSE" | "DOCTOR",
): void {
  const roleScope: Record<typeof userRole, AiScope> = {
    ADMIN: "admin",
    DOCTOR: "doctor",
    NURSE: "nurse",
  };

  if (roleScope[userRole] !== requestedScope) {
    throw new ForbiddenError("You do not have access to this AI scope.");
  }
}

export class AiService {
  constructor(private readonly repository: AiRepository) {}

  async getPatientSummary(patientId: string): Promise<AiSummaryDto> {
    const patient = await this.repository.findPatientContext(patientId);

    if (!patient) {
      throw new NotFoundError(`Patient with id "${patientId}" was not found`);
    }

    const fallback = buildRuleBasedSummary(patient);
    const geminiSummary = await generateText(buildSummaryPrompt(patient));

    return {
      patientId,
      summary: geminiSummary ?? fallback,
      generatedAt: new Date(),
    };
  }

  async askPulse(
    question: string,
    scope: AiScope,
    userId: string,
    userRole: "ADMIN" | "NURSE" | "DOCTOR",
    patientId?: string,
  ): Promise<AskPulseDto> {
    assertScopeAccess(scope, userRole);

    if (patientId) {
      const patient = await this.repository.findPatientContext(patientId);
      if (!patient) {
        throw new NotFoundError(`Patient with id "${patientId}" was not found`);
      }

      const answer =
        (await generateText(buildAskPrompt(question, scope, [patient]))) ??
        buildRuleBasedSummary(patient);

      return { answer, generatedAt: new Date() };
    }

    const [patients, hospitalStats] = await Promise.all([
      this.repository.listPatientContextsForScope(scope, userId),
      scope === "admin" ? this.repository.getHospitalStats() : Promise.resolve(undefined),
    ]);

    const answer =
      (await generateText(
        buildAskPrompt(question, scope, patients, hospitalStats),
      )) ?? this.buildFallbackAnswer(question, patients, hospitalStats);

    return { answer, generatedAt: new Date() };
  }

  async getInsights(
    scope: "doctor" | "nurse",
    userId: string,
    userRole: "ADMIN" | "NURSE" | "DOCTOR",
  ): Promise<AiInsightsDto> {
    assertScopeAccess(scope, userRole);

    const patients = await this.repository.listPatientContextsForScope(
      scope,
      userId,
      20,
    );

    const raw = await generateJson<{ items?: Array<{ icon?: string; text?: string }> }>(
      buildInsightsPrompt(scope, patients),
    );

    return {
      items: normalizeInsightItems(raw, patients),
      generatedAt: new Date(),
    };
  }

  private buildFallbackAnswer(
    question: string,
    patients: PatientContextRecord[],
    hospitalStats?: Awaited<ReturnType<AiRepository["getHospitalStats"]>>,
  ): string {
    const q = question.toLowerCase();

    if (hospitalStats && (q.includes("bed") || q.includes("available"))) {
      const breakdown = Object.entries(hospitalStats.bedsByDepartment)
        .map(([dept, count]) => `${dept}: ${count}`)
        .join(", ");
      return `${hospitalStats.availableBeds} beds available (${breakdown}). ${hospitalStats.admittedCount} patients admitted.`;
    }

    if (q.includes("critical")) {
      const critical = patients.filter((p) => p.priority === "CRITICAL");
      if (critical.length === 0) {
        return "No patients are currently in critical status.";
      }
      return critical
        .slice(0, 5)
        .map((p) => buildRuleBasedSummary(p))
        .join("\n\n");
    }

    if (patients.length === 0) {
      return "No patients found in your current scope.";
    }

    return patients
      .slice(0, 3)
      .map((p) => buildRuleBasedSummary(p))
      .join("\n\n");
  }

  async getWorkflowReplay(patientId: string): Promise<WorkflowReplayDto> {
    const patient = await this.repository.findPatientContext(patientId);

    if (!patient) {
      throw new NotFoundError(`Patient with id "${patientId}" was not found`);
    }

    const patientName = `${patient.firstName} ${patient.lastName}`;
    const baseSteps: WorkflowReplayStepDto[] = patient.workflowEvents.map(
      (event) => ({
        id: event.id,
        phase: mapEventPhase(event.eventType),
        title: event.title,
        status: event.status.toLowerCase(),
        occurredAt: event.occurredAt.toISOString(),
        narration: buildStepNarration(event, patient),
      }),
    );

    const context = {
      patient: serializePatientContext(patient),
      steps: baseSteps.map((step) => ({
        id: step.id,
        phase: step.phase,
        title: step.title,
        status: step.status,
        occurredAt: step.occurredAt,
      })),
    };

    const prompt = `You are Pulse, narrating a patient's hospital journey for staff replay.

Return JSON only:
{"overview":"2-3 sentence journey overview","steps":[{"id":"event-uuid","narration":"one vivid sentence for this step"}]}

Rules:
- One narration per step id, chronological storytelling tone
- Cite specific times, departments, and clinical details from the data
- No markdown

Data:
${JSON.stringify(context, null, 2)}`;

    const raw = await generateJson<{
      overview?: string;
      steps?: Array<{ id: string; narration: string }>;
    }>(prompt);

    const narrationById = new Map(
      raw?.steps?.map((step) => [step.id, step.narration]) ?? [],
    );

    const steps = baseSteps.map((step) => ({
      ...step,
      narration: narrationById.get(step.id) ?? step.narration,
    }));

    const overview =
      raw?.overview ??
      `${patientName} was admitted to ${patient.department.name}${patient.room ? ` in ${patient.room}` : ""}. The journey includes ${steps.length} documented workflow events.`;

    return {
      patientId,
      patientName,
      overview,
      steps,
      generatedAt: new Date(),
    };
  }

  async getShiftHandoff(
    scope: "doctor" | "nurse",
    userId: string,
    userRole: "ADMIN" | "NURSE" | "DOCTOR",
  ): Promise<ShiftHandoffDto> {
    assertScopeAccess(scope, userRole);

    const patients = await this.repository.listPatientContextsForScope(
      scope,
      userId,
      30,
    );

    const payload = patients.map((patient) => ({
      ...serializePatientContext(patient),
      openTasks: patient.tasks
        .filter((task) => task.status !== "COMPLETED")
        .map((task) => ({
          title: task.title,
          status: task.status,
          dueAt: task.dueAt?.toISOString() ?? null,
        })),
    }));

    const roleLabel = scope === "doctor" ? "attending physician" : "charge nurse";
    const prompt = `You are Pulse generating a shift handoff for the incoming ${roleLabel}.

Return JSON only:
{"summary":"3-5 sentence handoff paragraph covering all assigned patients","highlights":[{"patientId":"uuid","name":"Full Name","room":"Rm 204","note":"one critical watch-item"}]}

Rules:
- summary must mention patient counts and top risks
- 2-6 highlights for patients needing attention (critical, blocked, delayed, overdue tasks)
- use only data below
- no markdown

Assigned patients:
${JSON.stringify(payload, null, 2)}`;

    const raw = await generateJson<{
      summary?: string;
      highlights?: HandoffHighlightDto[];
    }>(prompt);

    const fallbackHighlights = deriveHandoffHighlights(patients);
    const summary =
      raw?.summary ??
      buildFallbackHandoffSummary(scope, patients, fallbackHighlights);

    return {
      summary,
      highlights:
        raw?.highlights && raw.highlights.length > 0
          ? raw.highlights
          : fallbackHighlights,
      generatedAt: new Date(),
    };
  }

  async getPredictiveBottlenecks(
    userRole: "ADMIN" | "NURSE" | "DOCTOR",
  ): Promise<PredictiveBottlenecksDto> {
    if (userRole !== "ADMIN") {
      throw new ForbiddenError("Predictive bottlenecks are available to admins only.");
    }

    const [patients, hospitalStats] = await Promise.all([
      this.repository.listPatientContextsForScope("admin", undefined, 60),
      this.repository.getHospitalStats(),
    ]);

    const signals = buildBottleneckSignals(patients, hospitalStats);

    const prompt = `You are Pulse forecasting hospital bottlenecks for tomorrow.

Return JSON only:
{"forecast":"2-3 sentence overview of tomorrow's risk","predictions":[{"id":"p1","department":"Cardiology","risk":"high","title":"short title","description":"specific forecast","affectedPatients":["Patient Name (Rm 204)"]}]}

Rules:
- 3-5 predictions ranked by risk
- risk must be "high", "medium", or "low"
- cite departments, rooms, and workflow patterns from the data
- forecast tomorrow's delays, not today's status only
- no markdown

Hospital signals:
${JSON.stringify(signals, null, 2)}`;

    const raw = await generateJson<{
      forecast?: string;
      predictions?: BottleneckPredictionDto[];
    }>(prompt);

    const fallback = deriveBottleneckPredictions(signals);

    return {
      forecast:
        raw?.forecast ??
        `Tomorrow may see pressure in departments with blocked workflows and ${hospitalStats.waitingDischargeCount} patients already in the discharge queue.`,
      predictions:
        raw?.predictions && raw.predictions.length > 0
          ? normalizePredictions(raw.predictions)
          : fallback,
      generatedAt: new Date(),
    };
  }
}

function deriveHandoffHighlights(
  patients: PatientContextRecord[],
): HandoffHighlightDto[] {
  const highlights: HandoffHighlightDto[] = [];

  for (const patient of patients) {
    if (highlights.length >= 6) break;
    const ctx = serializePatientContext(patient);
    if (
      ctx.status === "critical" ||
      ctx.status === "blocked" ||
      ctx.status === "delayed"
    ) {
      highlights.push({
        patientId: patient.id,
        name: ctx.name,
        room: patient.room ?? "—",
        note: buildRuleBasedSummary(patient).slice(0, 160),
      });
    }
  }

  if (highlights.length === 0 && patients[0]) {
    const p = patients[0];
    highlights.push({
      patientId: p.id,
      name: `${p.firstName} ${p.lastName}`,
      room: p.room ?? "—",
      note: buildRuleBasedSummary(p).slice(0, 160),
    });
  }

  return highlights;
}

function buildFallbackHandoffSummary(
  scope: "doctor" | "nurse",
  patients: PatientContextRecord[],
  highlights: HandoffHighlightDto[],
): string {
  const role = scope === "doctor" ? "physician" : "nursing";
  const critical = patients.filter((p) => p.priority === "CRITICAL").length;
  const blocked = patients.filter((p) => p.status === "WAITING").length;
  return `Incoming ${role} shift: ${patients.length} assigned patients. ${critical} critical, ${blocked} awaiting discharge. Top watch items: ${highlights.map((h) => `${h.name} (${h.room})`).join("; ")}.`;
}

function buildBottleneckSignals(
  patients: PatientContextRecord[],
  hospitalStats: Awaited<ReturnType<AiRepository["getHospitalStats"]>>,
) {
  const byDepartment: Record<
    string,
    {
      patients: number;
      critical: number;
      delayed: number;
      blocked: number;
      blockedSteps: string[];
      openTasks: number;
    }
  > = {};

  for (const patient of patients) {
    const dept = patient.department.name;
    if (!byDepartment[dept]) {
      byDepartment[dept] = {
        patients: 0,
        critical: 0,
        delayed: 0,
        blocked: 0,
        blockedSteps: [],
        openTasks: 0,
      };
    }
    const bucket = byDepartment[dept]!;
    bucket.patients++;
    if (patient.priority === "CRITICAL") bucket.critical++;
    if (patient.priority === "HIGH") bucket.delayed++;
    if (patient.status === "WAITING") bucket.blocked++;
    bucket.openTasks += patient.tasks.filter((t) => t.status !== "COMPLETED").length;
    for (const event of patient.workflowEvents) {
      if (event.status === "BLOCKED") {
        bucket.blockedSteps.push(`${patient.firstName} ${patient.lastName}: ${event.title}`);
      }
    }
  }

  return {
    hospital: hospitalStats,
    byDepartment,
    totalBlockedWorkflows: patients.reduce(
      (sum, p) =>
        sum + p.workflowEvents.filter((e) => e.status === "BLOCKED").length,
      0,
    ),
  };
}

function deriveBottleneckPredictions(
  signals: ReturnType<typeof buildBottleneckSignals>,
): BottleneckPredictionDto[] {
  const predictions: BottleneckPredictionDto[] = [];

  for (const [department, stats] of Object.entries(signals.byDepartment)) {
    if (predictions.length >= 5) break;
    const risk: BottleneckRisk =
      stats.blockedSteps.length >= 2 || stats.critical >= 2
        ? "high"
        : stats.delayed >= 2 || stats.blocked >= 1
          ? "medium"
          : "low";

    if (risk === "low" && stats.patients < 3) continue;

    predictions.push({
      id: `dept-${department.toLowerCase().replace(/\s+/g, "-")}`,
      department,
      risk,
      title: `${department} workflow pressure`,
      description: `${stats.patients} active patients, ${stats.blockedSteps.length} blocked steps, ${stats.openTasks} open tasks — likely to carry into tomorrow.`,
      affectedPatients: stats.blockedSteps.slice(0, 3),
    });
  }

  if (signals.hospital.waitingDischargeCount > 0) {
    predictions.unshift({
      id: "discharge-queue",
      department: "Hospital-wide",
      risk: signals.hospital.waitingDischargeCount >= 3 ? "high" : "medium",
      title: "Discharge queue backlog",
      description: `${signals.hospital.waitingDischargeCount} patients pending approval may delay bed turnover tomorrow.`,
      affectedPatients: [],
    });
  }

  return predictions.slice(0, 5);
}

function normalizePredictions(
  predictions: BottleneckPredictionDto[],
): BottleneckPredictionDto[] {
  return predictions.slice(0, 5).map((prediction, index) => ({
    id: prediction.id || `pred-${index}`,
    department: prediction.department || "Hospital-wide",
    risk: (["high", "medium", "low"].includes(prediction.risk)
      ? prediction.risk
      : "medium") as BottleneckRisk,
    title: prediction.title || "Workflow delay risk",
    description: prediction.description || "",
    affectedPatients: prediction.affectedPatients ?? [],
  }));
}
