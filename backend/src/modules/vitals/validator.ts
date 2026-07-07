import { z } from "zod";

export const patientIdParamSchema = z.object({
  patientId: z.string().uuid("Invalid patient id"),
});

export const listVitalSignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const createVitalSignBodySchema = z.object({
  bloodPressure: z
    .string()
    .trim()
    .min(1, "Blood pressure is required")
    .max(20, "Blood pressure must be at most 20 characters"),
  pulse: z.coerce.number().int().min(0).max(300),
  temperature: z.coerce.number().min(90).max(110),
  respRate: z.coerce.number().int().min(0).max(80),
  o2Saturation: z.coerce.number().int().min(0).max(100),
  recordedById: z.string().uuid("Invalid recorder id").optional().nullable(),
});

export type ListVitalSignsQuery = z.infer<typeof listVitalSignsQuerySchema>;
export type CreateVitalSignBody = z.infer<typeof createVitalSignBodySchema>;
