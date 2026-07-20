import { z } from "zod";

export const reservationStatuses = [
  "NEW",
  "PENDING",
  "CONFIRMED",
  "DECLINED",
  "CANCELLED",
  "COMPLETED",
] as const;

export const reservationRequestSchema = z
  .object({
    vehicleId: z.string().uuid(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    pickupLocation: z.string().trim().min(2).max(120),
    returnLocation: z.string().trim().min(2).max(120),
    quantity: z.number().int().min(1).max(20).default(1),
    customerName: z.string().trim().min(2).max(100),
    customerEmail: z
      .string()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    customerPhone: z.string().trim().min(6).max(30),
    message: z.string().trim().max(2_000).nullable().optional(),
    acceptedTerms: z
      .boolean()
      .refine((value) => value, "Vous devez accepter les conditions."),
    idempotencyKey: z.string().uuid().optional(),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "La date de fin doit suivre la date de début.",
    path: ["endsAt"],
  });

export const availabilitySearchSchema = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    location: z.string().trim().max(120).optional(),
    category: z.string().trim().max(60).optional(),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "La date de fin doit suivre la date de début.",
    path: ["endsAt"],
  });

export const reservationUpdateSchema = z.object({
  status: z.enum(reservationStatuses).optional(),
  internalNote: z.string().trim().max(3_000).nullable().optional(),
  statusNote: z.string().trim().max(1_000).nullable().optional(),
});

export const reservationListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(reservationStatuses).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().max(100).optional(),
});
