import { TaskStatus } from "@prisma/client";
import { z } from "zod";

export const taskIdParamSchema = z.object({
  id: z.string().uuid("Invalid task id"),
});

export const patientIdParamSchema = z.object({
  patientId: z.string().uuid("Invalid patient id"),
});

export const assigneeIdParamSchema = z.object({
  assignedTo: z.string().uuid("Invalid assignee id"),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  patientId: z.string().uuid("Invalid patient id").optional(),
  assignedTo: z.string().uuid("Invalid assignee id").optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export const createTaskBodySchema = z.object({
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
  assignedTo: z.string().uuid("Invalid assignee id"),
  status: z.nativeEnum(TaskStatus).optional(),
  dueAt: z.coerce.date().optional().nullable(),
});

export const updateTaskBodySchema = createTaskBodySchema.partial();

export const updateTaskStatusBodySchema = z.object({
  status: z.nativeEnum(TaskStatus, { message: "Invalid status" }),
});
