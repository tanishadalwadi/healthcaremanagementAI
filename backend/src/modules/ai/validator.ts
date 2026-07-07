import { z } from "zod";

export const patientIdParamSchema = z.object({
  patientId: z.string().uuid("Invalid patient id"),
});

export const askPulseBodySchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(2000),
  scope: z.enum(["admin", "doctor", "nurse"]),
  patientId: z.string().uuid("Invalid patient id").optional(),
});

export const insightsBodySchema = z.object({
  scope: z.enum(["doctor", "nurse"]),
});

export const handoffBodySchema = z.object({
  scope: z.enum(["doctor", "nurse"]),
});
