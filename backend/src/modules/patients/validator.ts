import { Gender, PatientStatus, Priority } from "@prisma/client";
import { z } from "zod";

export const patientIdParamSchema = z.object({
  id: z.string().uuid("Invalid patient id"),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user id"),
});

export const listPatientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  department: z.string().uuid("Invalid department id").optional(),
  status: z.nativeEnum(PatientStatus).optional(),
  excludeStatus: z.nativeEnum(PatientStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assignedNurseId: z.string().uuid("Invalid nurse id").optional(),
  assignedDoctorId: z.string().uuid("Invalid doctor id").optional(),
});

export const createPatientBodySchema = z.object({
  patientNumber: z
    .string()
    .trim()
    .min(1, "Patient number is required")
    .max(50, "Patient number must be at most 50 characters"),
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must be at most 100 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must be at most 100 characters"),
  age: z.coerce
    .number()
    .int("Age must be an integer")
    .min(0, "Age must be at least 0")
    .max(150, "Age must be at most 150"),
  gender: z.nativeEnum(Gender, { message: "Invalid gender" }),
  room: z
    .string()
    .trim()
    .min(1, "Room cannot be empty")
    .max(50, "Room must be at most 50 characters")
    .optional()
    .nullable(),
  diagnosis: z
    .string()
    .trim()
    .min(1, "Diagnosis cannot be empty")
    .max(255, "Diagnosis must be at most 255 characters")
    .optional()
    .nullable(),
  departmentId: z.string().uuid("Invalid department id"),
  status: z.nativeEnum(PatientStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assignedNurseId: z.string().uuid("Invalid nurse id").optional().nullable(),
  assignedDoctorId: z.string().uuid("Invalid doctor id").optional().nullable(),
  dischargeRequestedAt: z.coerce.date().optional().nullable(),
});

export const updatePatientBodySchema = createPatientBodySchema.partial();

export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;
export type CreatePatientBody = z.infer<typeof createPatientBodySchema>;
export type UpdatePatientBody = z.infer<typeof updatePatientBodySchema>;
