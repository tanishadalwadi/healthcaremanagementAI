import { ConsultationStatus } from "@prisma/client";
import { z } from "zod";

export const consultationIdParamSchema = z.object({
  id: z.string().uuid("Invalid consultation id"),
});

export const patientIdParamSchema = z.object({
  patientId: z.string().uuid("Invalid patient id"),
});

export const listConsultationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  patientId: z.string().uuid("Invalid patient id").optional(),
  doctorId: z.string().uuid("Invalid doctor id").optional(),
  departmentId: z.string().uuid("Invalid department id").optional(),
  status: z.nativeEnum(ConsultationStatus).optional(),
});

export const createConsultationBodySchema = z.object({
  patientId: z.string().uuid("Invalid patient id"),
  doctorId: z.string().uuid("Invalid doctor id"),
  departmentId: z.string().uuid("Invalid department id"),
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(500, "Reason must be at most 500 characters"),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be at most 2000 characters")
    .optional()
    .nullable(),
  status: z.nativeEnum(ConsultationStatus).optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
});

export const updateConsultationBodySchema = createConsultationBodySchema.partial();

export const updateConsultationStatusBodySchema = z.object({
  status: z.nativeEnum(ConsultationStatus, { message: "Invalid status" }),
});

export type ListConsultationsQuery = z.infer<typeof listConsultationsQuerySchema>;
export type CreateConsultationBody = z.infer<typeof createConsultationBodySchema>;
export type UpdateConsultationBody = z.infer<typeof updateConsultationBodySchema>;
export type UpdateConsultationStatusBody = z.infer<
  typeof updateConsultationStatusBodySchema
>;
