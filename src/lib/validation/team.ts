import { z } from "zod";
import { permissions } from "@/lib/auth/permissions";
import { passwordSchema } from "@/lib/validation/auth";

export const invitationSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.toLowerCase()),
  permissions: z
    .array(z.enum(permissions))
    .max(permissions.length)
    .refine((items) => new Set(items).size === items.length),
});

export const memberPermissionsSchema = z.object({
  permissions: z
    .array(z.enum(permissions))
    .max(permissions.length)
    .refine((items) => new Set(items).size === items.length),
});

export const invitationRegistrationSchema = z.object({
  token: z.string().length(64),
  name: z.string().trim().min(2).max(80),
  password: passwordSchema,
});
