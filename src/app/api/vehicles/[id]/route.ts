import { ConflictError, NotFoundError } from "@/lib/http/errors";
import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { vehicleSchema } from "@/lib/validation/vehicle";

type Context = { params: Promise<{ id: string }> };

const GET = withApiErrorHandling(async (_request: Request, context: Context) => {
  const tenant = await requireTenantPermission("vehicles:read");
  const { id } = await context.params;
  const vehicle = await db.vehicle.findFirst({
    where: { id, agencyId: tenant.agency.id },
    include: {
      images: { orderBy: { position: "asc" } },
      features: { orderBy: { name: "asc" } },
      availabilityBlocks: { orderBy: { startsAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!vehicle) throw new NotFoundError("Véhicule introuvable.");
  return jsonOk(vehicle);
});

const PATCH = withApiErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  const tenant = await requireTenantPermission("vehicles:update");
  const { id } = await context.params;
  const input = vehicleSchema.parse(await parseJson(request));
  const current = await db.vehicle.findFirst({
    where: { id, agencyId: tenant.agency.id },
  });
  if (!current) throw new NotFoundError("Véhicule introuvable.");

  const vehicle = await db.$transaction(async (tx) => {
    await tx.vehicleImage.deleteMany({
      where: { agencyId: tenant.agency.id, vehicleId: id },
    });
    await tx.vehicleFeature.deleteMany({
      where: { agencyId: tenant.agency.id, vehicleId: id },
    });

    const updated = await tx.vehicle.update({
      where: { id },
      data: {
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
            agencyId: tenant.agency.id,
            name: sanitizePlainText(name),
          })),
        },
        images: {
          create: input.images.map((image, position) => ({
            agencyId: tenant.agency.id,
            url: image.url,
            publicId: image.publicId,
            alt: image.alt,
            isPrimary: image.isPrimary,
            position,
          })),
        },
      },
    });

    if (current.status !== input.status) {
      await tx.vehicleStatusHistory.create({
        data: {
          agencyId: tenant.agency.id,
          vehicleId: id,
          changedById: tenant.user.id,
          fromStatus: current.status,
          toStatus: input.status,
          reason: "Mise à jour du véhicule",
        },
      });
    }
    await tx.auditLog.create({
      data: {
        agencyId: tenant.agency.id,
        actorId: tenant.user.id,
        action: "vehicle.update",
        entityType: "Vehicle",
        entityId: id,
      },
    });
    return updated;
  });

  return jsonOk(vehicle);
});

const DELETE = withApiErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  const tenant = await requireTenantPermission("vehicles:delete");
  const { id } = await context.params;
  const vehicle = await db.vehicle.findFirst({
    where: { id, agencyId: tenant.agency.id },
    select: {
      id: true,
      _count: {
        select: {
          reservations: {
            where: { status: { in: ["NEW", "PENDING", "CONFIRMED"] } },
          },
        },
      },
    },
  });
  if (!vehicle) throw new NotFoundError("Véhicule introuvable.");
  if (vehicle._count.reservations > 0) {
    throw new ConflictError(
      "Ce véhicule possède des réservations actives. Archivez-le plutôt que de le supprimer.",
    );
  }

  await db.$transaction([
    db.auditLog.create({
      data: {
        agencyId: tenant.agency.id,
        actorId: tenant.user.id,
        action: "vehicle.delete",
        entityType: "Vehicle",
        entityId: id,
      },
    }),
    db.vehicle.delete({ where: { id } }),
  ]);
  return jsonOk({ deleted: true });
});

export { DELETE, GET, PATCH };
