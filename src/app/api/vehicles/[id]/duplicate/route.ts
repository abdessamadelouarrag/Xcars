import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  withApiErrorHandling,
} from "@/lib/http/api";

type Context = { params: Promise<{ id: string }> };

const POST = withApiErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  const tenant = await requireTenantPermission("vehicles:create");
  const { id } = await context.params;
  const source = await db.vehicle.findFirst({
    where: { id, agencyId: tenant.agency.id },
    include: { images: true, features: true },
  });
  if (!source) throw new NotFoundError("Véhicule introuvable.");

  const suffix = Date.now().toString(36).slice(-5);
  const duplicate = await db.vehicle.create({
    data: {
      agencyId: tenant.agency.id,
      createdById: tenant.user.id,
      slug: `${source.slug}-copie-${suffix}`,
      brand: source.brand,
      model: `${source.model} — copie`,
      year: source.year,
      licensePlate: `${source.licensePlate}-${suffix}`.slice(0, 30),
      category: source.category,
      transmission: source.transmission,
      fuelType: source.fuelType,
      seats: source.seats,
      doors: source.doors,
      mileage: source.mileage,
      color: source.color,
      dailyPrice: source.dailyPrice,
      weeklyPrice: source.weeklyPrice,
      deposit: source.deposit,
      description: source.description,
      rentalConditions: source.rentalConditions,
      status: "UNAVAILABLE",
      totalQuantity: source.totalQuantity,
      location: source.location,
      isFeatured: false,
      images: {
        create: source.images.map(({ url, publicId, alt, position, isPrimary }) => ({
          agencyId: tenant.agency.id,
          url,
          publicId,
          alt,
          position,
          isPrimary,
        })),
      },
      features: {
        create: source.features.map(({ name, icon }) => ({
          agencyId: tenant.agency.id,
          name,
          icon,
        })),
      },
    },
  });

  return jsonOk(duplicate, { status: 201 });
});

export { POST };
