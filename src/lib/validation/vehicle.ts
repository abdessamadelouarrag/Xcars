import { z } from "zod";
import { imageUrlSchema } from "@/lib/validation/image";

export const vehicleStatuses = [
  "AVAILABLE",
  "RESERVED",
  "RENTED",
  "MAINTENANCE",
  "UNAVAILABLE",
] as const;

export const transmissions = ["MANUAL", "AUTOMATIC"] as const;
export const fuelTypes = [
  "GASOLINE",
  "DIESEL",
  "HYBRID",
  "ELECTRIC",
  "LPG",
] as const;

const optionalMoney = z.union([
  z.number().nonnegative().max(1_000_000),
  z.null(),
]);

export const vehicleSchema = z.object({
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 2),
  licensePlate: z.string().trim().min(2).max(30),
  category: z.string().trim().min(2).max(50),
  transmission: z.enum(transmissions),
  fuelType: z.enum(fuelTypes),
  seats: z.number().int().min(1).max(60),
  doors: z.number().int().min(1).max(10),
  mileage: z.number().int().min(0).max(5_000_000),
  color: z.string().trim().min(2).max(50),
  dailyPrice: z.number().positive().max(1_000_000),
  weeklyPrice: optionalMoney,
  deposit: z.number().nonnegative().max(10_000_000),
  description: z.string().trim().min(20).max(5_000),
  rentalConditions: z.string().trim().max(5_000).nullable(),
  status: z.enum(vehicleStatuses),
  totalQuantity: z.number().int().min(1).max(1_000),
  location: z.string().trim().min(2).max(120),
  availableFrom: z.string().datetime().nullable(),
  isFeatured: z.boolean(),
  features: z.array(z.string().trim().min(1).max(80)).max(40),
  images: z
    .array(
      z.object({
        url: imageUrlSchema,
        publicId: z.string().max(255).nullable().optional(),
        alt: z.string().trim().max(160).nullable().optional(),
        isPrimary: z.boolean(),
      }),
    )
    .max(12)
    .refine(
      (images) =>
        images.length === 0 ||
        images.filter((image) => image.isPrimary).length === 1,
      "Sélectionnez exactement une image principale.",
    ),
});

export const vehicleFormSchema = vehicleSchema.omit({ features: true });

export const vehicleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(6).max(48).default(12),
  search: z.string().trim().max(100).optional(),
  status: z.enum([...vehicleStatuses, "ARCHIVED"]).optional(),
  category: z.string().trim().max(50).optional(),
  brand: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z
    .enum(["newest", "oldest", "price-asc", "price-desc", "popular"])
    .default("newest"),
  view: z.enum(["grid", "table"]).default("grid"),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
