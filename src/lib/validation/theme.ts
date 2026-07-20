import { z } from "zod";
import { imageUrlSchema } from "@/lib/validation/image";

export const sectionIds = [
  "search",
  "featured",
  "categories",
  "benefits",
  "testimonials",
  "cta",
  "contact",
] as const;

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadécimale invalide.");

export const themeUpdateSchema = z.object({
  id: z.string().uuid(),
  preset: z.enum(["ELEGANT", "MINIMAL", "SPORT", "LUXURY"]),
  primaryColor: hexColor,
  secondaryColor: hexColor,
  accentColor: hexColor,
  backgroundColor: hexColor,
  textColor: hexColor,
  headingFont: z.enum(["Manrope", "Inter", "Playfair Display", "Montserrat"]),
  bodyFont: z.enum(["Inter", "Manrope", "Roboto", "Lato"]),
  radius: z.enum(["SMALL", "MEDIUM", "LARGE"]),
  buttonStyle: z.enum(["solid", "outline", "soft"]),
  cardStyle: z.enum(["elevated", "outlined", "flat"]),
  navigationStyle: z.enum(["floating", "solid", "transparent"]),
  spacingScale: z.enum(["compact", "comfortable", "spacious"]),
  heroEyebrow: z.string().trim().max(100).nullable(),
  heroTitle: z.string().trim().min(5).max(140),
  heroDescription: z.string().trim().min(10).max(500),
  visibleSections: z.record(z.enum(sectionIds), z.boolean()),
  sectionOrder: z
    .array(z.enum(sectionIds))
    .length(sectionIds.length)
    .refine((items) => new Set(items).size === sectionIds.length),
  logoUrl: imageUrlSchema.nullable(),
  logoPublicId: z.string().max(255).nullable(),
  faviconUrl: imageUrlSchema.nullable(),
  faviconPublicId: z.string().max(255).nullable(),
  coverUrl: imageUrlSchema.nullable(),
  coverPublicId: z.string().max(255).nullable(),
});

export const publishThemeSchema = z.object({
  id: z.string().uuid(),
});

export type ThemeUpdateInput = z.infer<typeof themeUpdateSchema>;
