import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Le mot de passe doit contenir au moins 10 caractères.")
  .max(128)
  .regex(/[a-z]/, "Ajoutez au moins une lettre minuscule.")
  .regex(/[A-Z]/, "Ajoutez au moins une lettre majuscule.")
  .regex(/[0-9]/, "Ajoutez au moins un chiffre.");

export const credentialsSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(254).transform((value) => value.toLowerCase()),
  password: passwordSchema,
  agencyName: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilisez des minuscules et des tirets."),
  acceptedTerms: z
    .boolean()
    .refine((value) => value, "Vous devez accepter les conditions."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.toLowerCase()),
  token: z.string().length(64),
  password: passwordSchema,
});
