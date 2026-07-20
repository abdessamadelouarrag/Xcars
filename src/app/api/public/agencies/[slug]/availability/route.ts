import { AgencyStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/http/errors";
import {
  jsonOk,
  withApiErrorHandling,
} from "@/lib/http/api";
import { availabilitySearchSchema } from "@/lib/validation/reservation";
import { getVehicleAvailableQuantity } from "@/lib/vehicles/availability";

type Context = { params: Promise<{ slug: string }> };

const GET = withApiErrorHandling(async (request: Request, context: Context) => {
  const { slug } = await context.params;
  const query = availabilitySearchSchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const agency = await db.agency.findFirst({
    where: { slug, status: AgencyStatus.ACTIVE },
    select: { id: true },
  });
  if (!agency) throw new NotFoundError("Agence introuvable.");

  const vehicles = await db.vehicle.findMany({
    where: {
      agencyId: agency.id,
      isArchived: false,
      status: { notIn: ["MAINTENANCE", "UNAVAILABLE", "ARCHIVED"] },
      ...(query.location
        ? { location: { contains: query.location } }
        : {}),
      ...(query.category ? { category: query.category } : {}),
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      features: { take: 6 },
    },
  });

  const availableVehicles = await db.$transaction(async (tx) => {
    const quantities = await Promise.all(
      vehicles.map((vehicle) =>
        getVehicleAvailableQuantity(tx, {
          agencyId: agency.id,
          vehicleId: vehicle.id,
          startsAt: query.startsAt,
          endsAt: query.endsAt,
        }),
      ),
    );
    return vehicles
      .map((vehicle, index) => ({
        ...vehicle,
        availableQuantity: quantities[index],
      }))
      .filter((vehicle) => vehicle.availableQuantity > 0);
  });

  return jsonOk({ items: availableVehicles });
});

export { GET };
