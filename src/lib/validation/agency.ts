import { z } from "zod";
import { imageUrlSchema } from "@/lib/validation/image";

const agencyDetails = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(3_000),
  address: z.string().trim().max(200),
  city: z.string().trim().max(100),
  country: z.string().trim().max(100),
  phone: z.string().trim().max(30),
  contactEmail: z.string().email().max(254),
  openingHours: z.record(z.string(), z.string().max(100)),
});

export const onboardingSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal(1), data: agencyDetails }),
  z.object({
    step: z.literal(2),
    data: z.object({
      logoUrl: imageUrlSchema.nullable(),
      logoPublicId: z.string().nullable(),
      faviconUrl: imageUrlSchema.nullable(),
      faviconPublicId: z.string().nullable(),
      coverUrl: imageUrlSchema.nullable(),
      coverPublicId: z.string().nullable(),
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      headingFont: z.string().max(50),
      bodyFont: z.string().max(50),
      radius: z.enum(["SMALL", "MEDIUM", "LARGE"]),
    }),
  }),
  z.object({
    step: z.literal(3),
    data: z.object({
      preset: z.enum(["ELEGANT", "MINIMAL", "SPORT", "LUXURY"]),
    }),
  }),
  z.object({ step: z.literal(4), data: z.object({}) }),
]);

export const agencySettingsSchema = agencyDetails.extend({
  locale: z.enum(["fr", "en", "ar"]),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  timezone: z.string().trim().min(2).max(100),
  seoTitle: z.string().trim().max(70),
  seoDescription: z.string().trim().max(170),
});
