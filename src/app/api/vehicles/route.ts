import type { Prisma } from "@prisma/client";
import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { slugify } from "@/lib/utils";
import {
  vehicleListQuerySchema,
  vehicleSchema,
} from "@/lib/validation/vehicle";

const GET = withApiErrorHandling(async (request: Request) => {
  const context = await requireTenantPermission("vehicles:read");
  const url = new URL(request.url);
  const query = vehicleListQuerySchema.parse(
    Object.fromEntries(url.searchParams),
  );
  const where: Prisma.VehicleWhereInput = {
    agencyId: context.agency.id,
    isArchived: query.status === "ARCHIVED" ? true : false,
    ...(query.search
      ? {
          OR: [
            { brand: { contains: query.search } },
            { model: { contains: query.search } },
            { licensePlate: { contains: query.search } },
          ],
        }
      : {}),
    ...(query.status && query.status !== "ARCHIVED"
      ? { status: query.status }
      : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.brand ? { brand: query.brand } : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? {
          dailyPrice: {
            gte: query.minPrice,
            lte: query.maxPrice,
          },
        }
      : {}),
  };
  const orderBy: Prisma.VehicleOrderByWithRelationInput =
    query.sort === "price-asc"
      ? { dailyPrice: "asc" }
      : query.sort === "price-desc"
        ? { dailyPrice: "desc" }
        : query.sort === "popular"
          ? { popularity: "desc" }
          : { createdAt: query.sort === "oldest" ? "asc" : "desc" };

  const [items, total] = await Promise.all([
    db.vehicle.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { reservations: true } },
      },
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.vehicle.count({ where }),
  ]);

  return jsonOk({
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      pageCount: Math.ceil(total / query.pageSize),
    },
  });
});

const POST = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const context = await requireTenantPermission("vehicles:create");
  const input = vehicleSchema.parse(await parseJson(request));
  const baseSlug = slugify(`${input.brand}-${input.model}`);
  const matchingSlugs = await db.vehicle.count({
    where: { agencyId: context.agency.id, slug: { startsWith: baseSlug } },
  });
  const slug = matchingSlugs ? `${baseSlug}-${matchingSlugs + 1}` : baseSlug;

  const vehicle = await db.$transaction(async (tx) => {
    const created = await tx.vehicle.create({
      data: {
        agencyId: context.agency.id,
        createdById: context.user.id,
        slug,
        brand: sanitizePlainText(input.brand),
        model: sanitizePlainText(input.model),
        year: input.year,
        licensePlate: sanitizePlainText(input.licensePlate).toUpperCase(),
        category: sanitizePlainText(input.category),
        transmission: input.transmission,
        fuelType: input.fuelType,
        seats: input.seats,
        doors: input.doors,
        mileage: input.mileage,
        color: sanitizePlainText(input.color),
        dailyPrice: input.dailyPrice,
        weeklyPrice: input.weeklyPrice,
        deposit: input.deposit,
        description: sanitizePlainText(input.description),
        rentalConditions: input.rentalConditions
          ? sanitizePlainText(input.rentalConditions)
          : null,
        status: input.status,
        totalQuantity: input.totalQuantity,
        location: sanitizePlainText(input.location),
        availableFrom: input.availableFrom
          ? new Date(input.availableFrom)
          : null,
        isFeatured: input.isFeatured,
        features: {
          create: input.features.map((name) => ({
            agencyId: context.agency.id,
            name: sanitizePlainText(name),
          })),
        },
        images: {
          create: input.images.map((image, position) => ({
            agencyId: context.agency.id,
            url: image.url,
            publicId: image.publicId,
            alt: image.alt
              ? sanitizePlainText(image.alt)
              : `${input.brand} ${input.model}`,
            isPrimary: image.isPrimary,
            position,
          })),
        },
      },
    });

    await tx.vehicleStatusHistory.create({
      data: {
        agencyId: context.agency.id,
        vehicleId: created.id,
        changedById: context.user.id,
        toStatus: input.status,
        reason: "Création du véhicule",
      },
    });
    await tx.auditLog.create({
      data: {
        agencyId: context.agency.id,
        actorId: context.user.id,
        action: "vehicle.create",
        entityType: "Vehicle",
        entityId: created.id,
      },
    });
    return created;
  });

  return jsonOk(vehicle, { status: 201 });
});

export { GET, POST };
