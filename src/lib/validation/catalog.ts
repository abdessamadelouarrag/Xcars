import { z } from "zod";

export const catalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]).optional(),
  fuelType: z
    .enum(["GASOLINE", "DIESEL", "HYBRID", "ELECTRIC", "LPG"])
    .optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  startsAt: z.string().date().optional(),
  endsAt: z.string().date().optional(),
  location: z.string().trim().max(120).optional(),
  sort: z.enum(["price-asc", "price-desc", "newest", "popular"]).default("popular"),
  view: z.enum(["grid", "list"]).default("grid"),
});
