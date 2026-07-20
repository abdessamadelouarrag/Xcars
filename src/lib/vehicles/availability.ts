import type { Prisma, VehicleStatus } from "@prisma/client";
import { ConflictError } from "@/lib/http/errors";

type DatabaseClient = Prisma.TransactionClient;

type UnavailablePeriod = {
  startsAt: Date;
  endsAt: Date;
  quantity: number;
};

export function intervalsOverlap(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
) {
  return firstStart < secondEnd && firstEnd > secondStart;
}

export function maximumConcurrentQuantity(
  periods: UnavailablePeriod[],
  rangeStart: Date,
  rangeEnd: Date,
) {
  const events = periods.flatMap((period) => [
    {
      at: new Date(Math.max(period.startsAt.getTime(), rangeStart.getTime())),
      delta: period.quantity,
    },
    {
      at: new Date(Math.min(period.endsAt.getTime(), rangeEnd.getTime())),
      delta: -period.quantity,
    },
  ]);

  events.sort(
    (left, right) =>
      left.at.getTime() - right.at.getTime() || left.delta - right.delta,
  );

  let current = 0;
  let maximum = 0;
  for (const event of events) {
    current += event.delta;
    maximum = Math.max(maximum, current);
  }
  return maximum;
}

export async function getVehicleAvailableQuantity(
  tx: DatabaseClient,
  input: {
    agencyId: string;
    vehicleId: string;
    startsAt: Date;
    endsAt: Date;
    excludeReservationId?: string;
  },
) {
  if (input.endsAt <= input.startsAt) {
    throw new ConflictError("La date de fin doit suivre la date de début.");
  }

  const [vehicle, reservations, blocks] = await Promise.all([
    tx.vehicle.findFirst({
      where: {
        id: input.vehicleId,
        agencyId: input.agencyId,
        isArchived: false,
      },
      select: { totalQuantity: true, status: true, availableFrom: true },
    }),
    tx.reservation.findMany({
      where: {
        agencyId: input.agencyId,
        vehicleId: input.vehicleId,
        status: "CONFIRMED",
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
        ...(input.excludeReservationId
          ? { id: { not: input.excludeReservationId } }
          : {}),
      },
      select: { startsAt: true, endsAt: true, quantity: true },
    }),
    tx.vehicleAvailabilityBlock.findMany({
      where: {
        agencyId: input.agencyId,
        vehicleId: input.vehicleId,
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
      },
      select: { startsAt: true, endsAt: true, quantity: true },
    }),
  ]);

  if (!vehicle) return 0;
  const unavailableStatuses: VehicleStatus[] = [
    "MAINTENANCE",
    "UNAVAILABLE",
    "ARCHIVED",
  ];
  if (
    unavailableStatuses.includes(vehicle.status) ||
    (vehicle.availableFrom && vehicle.availableFrom > input.startsAt)
  ) {
    return 0;
  }

  const maximumUnavailable = maximumConcurrentQuantity(
    [...reservations, ...blocks],
    input.startsAt,
    input.endsAt,
  );
  return Math.max(0, vehicle.totalQuantity - maximumUnavailable);
}

export async function assertVehicleAvailability(
  tx: DatabaseClient,
  input: Parameters<typeof getVehicleAvailableQuantity>[1] & {
    requestedQuantity: number;
  },
) {
  const available = await getVehicleAvailableQuantity(tx, input);
  if (available < input.requestedQuantity) {
    throw new ConflictError(
      "Ce véhicule n’est plus disponible pour toute la période sélectionnée.",
      { available },
    );
  }
  return available;
}
