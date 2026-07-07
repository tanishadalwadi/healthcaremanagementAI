export interface AiSummaryDto {
  patientId: string;
  summary: string;
  generatedAt: Date;
}

export type AiScope = "admin" | "doctor" | "nurse";

export interface AskPulseDto {
  answer: string;
  generatedAt: Date;
}

export interface AiInsightItemDto {
  id: string;
  icon: string;
  text: string;
}

export interface AiInsightsDto {
  items: AiInsightItemDto[];
  generatedAt: Date;
}

export interface WorkflowReplayStepDto {
  id: string;
  phase: "intake" | "inpatient" | "discharge";
  title: string;
  status: string;
  occurredAt: string;
  narration: string;
}

export interface WorkflowReplayDto {
  patientId: string;
  patientName: string;
  overview: string;
  steps: WorkflowReplayStepDto[];
  generatedAt: Date;
}

export interface HandoffHighlightDto {
  patientId: string;
  name: string;
  room: string;
  note: string;
}

export interface ShiftHandoffDto {
  summary: string;
  highlights: HandoffHighlightDto[];
  generatedAt: Date;
}

export type BottleneckRisk = "high" | "medium" | "low";

export interface BottleneckPredictionDto {
  id: string;
  department: string;
  risk: BottleneckRisk;
  title: string;
  description: string;
  affectedPatients: string[];
}

export interface PredictiveBottlenecksDto {
  forecast: string;
  predictions: BottleneckPredictionDto[];
  generatedAt: Date;
}
