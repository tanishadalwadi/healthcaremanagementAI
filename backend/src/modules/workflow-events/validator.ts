import { WorkflowEventStatus, WorkflowEventType } from "@prisma/client";
import { z } from "zod";

export const workflowEventIdParamSchema = z.object({
  id: z.string().uuid("Invalid workflow event id"),
});

export const patientIdParamSchema = z.object({
  patientId: z.string().uuid("Invalid patient id"),
});

export const listWorkflowEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  patientId: z.string().uuid("Invalid patient id").optional(),
  status: z.nativeEnum(WorkflowEventStatus).optional(),
  eventType: z.nativeEnum(WorkflowEventType).optional(),
});

export const createWorkflowEventBodySchema = z.object({
  patientId: z.string().uuid("Invalid patient id"),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .nullable(),
  eventType: z.nativeEnum(WorkflowEventType, { message: "Invalid event type" }),
  status: z.nativeEnum(WorkflowEventStatus).optional(),
  sequence: z.coerce
    .number()
    .int("Sequence must be an integer")
    .min(1, "Sequence must be at least 1"),
  createdBy: z.string().uuid("Invalid user id").optional().nullable(),
  occurredAt: z.coerce.date().optional(),
});

export const updateWorkflowEventBodySchema =
  createWorkflowEventBodySchema.partial();

export const updateWorkflowEventStatusBodySchema = z.object({
  status: z.nativeEnum(WorkflowEventStatus, { message: "Invalid status" }),
});
