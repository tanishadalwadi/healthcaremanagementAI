import { z } from "zod";

export const notificationIdParamSchema = z.object({
  id: z.string().uuid("Invalid notification id"),
});

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  userId: z.string().uuid("Invalid user id").optional(),
  read: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
