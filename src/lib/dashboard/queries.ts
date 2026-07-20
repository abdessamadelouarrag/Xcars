import {
  ReservationStatus,
  VehicleStatus,
  type Prisma,
} from "@prisma/client";
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { db } from "@/lib/db";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(agencyId: string) {
  const now = new Date();
  const chartStart = startOfMonth(subMonths(now, 5));

  const [
    vehicleTotal,
    vehicleStatusGroups,
    vehicleQuantity,
    reservationStatusGroups,
    revenue,
    activeReservations,
    reservationsForCharts,
    popularGroups,
    recentReservations,
  ] = await Promise.all([
    db.vehicle.count({ where: { agencyId, isArchived: false } }),
    db.vehicle.groupBy({
      by: ["status"],
      where: { agencyId, isArchived: false },
      _count: { _all: true },
    }),
    db.vehicle.aggregate({
      where: { agencyId, isArchived: false },
      _sum: { totalQuantity: true },
    }),
    db.reservation.groupBy({
      by: ["status"],
      where: { agencyId },
      _count: { _all: true },
    }),
    db.reservation.aggregate({
      where: {
        agencyId,
        status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED] },
      },
      _sum: { totalAmount: true },
    }),
    db.reservation.aggregate({
      where: {
        agencyId,
        status: ReservationStatus.CONFIRMED,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      _sum: { quantity: true },
    }),
    db.reservation.findMany({
      where: { agencyId, createdAt: { gte: chartStart } },
      select: {
        createdAt: true,
        totalAmount: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.reservation.groupBy({
      by: ["vehicleId"],
      where: { agencyId },
      _count: { _all: true },
      orderBy: { _count: { vehicleId: "desc" } },
      take: 5,
    }),
    db.reservation.findMany({
      where: { agencyId },
      include: {
        vehicle: { select: { brand: true, model: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const popularVehicleIds = popularGroups.map((group) => group.vehicleId);
  const popularVehicles = popularVehicleIds.length
    ? await db.vehicle.findMany({
        where: { agencyId, id: { in: popularVehicleIds } },
        select: { id: true, brand: true, model: true },
      })
    : [];

  const statusCount = new Map(
    vehicleStatusGroups.map((item) => [item.status, item._count._all]),
  );
  const reservationCount = new Map(
    reservationStatusGroups.map((item) => [item.status, item._count._all]),
  );

  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const month = addMonths(chartStart, index);
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const rows = reservationsForCharts.filter(
      (reservation) =>
        reservation.createdAt >= start && reservation.createdAt <= end,
    );
    return {
      month: format(month, "MMM", { locale: fr }),
      reservations: rows.length,
      revenue: rows
        .filter(
          (row) =>
            row.status === ReservationStatus.CONFIRMED ||
            row.status === ReservationStatus.COMPLETED,
        )
        .reduce((sum, row) => sum + Number(row.totalAmount), 0),
    };
  });

  const totalQuantity = vehicleQuantity._sum.totalQuantity ?? 0;
  const utilized = activeReservations._sum.quantity ?? 0;

  return {
    metrics: {
      vehicleTotal,
      available: statusCount.get(VehicleStatus.AVAILABLE) ?? 0,
      reserved: statusCount.get(VehicleStatus.RESERVED) ?? 0,
      maintenance: statusCount.get(VehicleStatus.MAINTENANCE) ?? 0,
      reservationRequests:
        (reservationCount.get(ReservationStatus.NEW) ?? 0) +
        (reservationCount.get(ReservationStatus.PENDING) ?? 0),
      confirmed: reservationCount.get(ReservationStatus.CONFIRMED) ?? 0,
      revenue: Number(revenue._sum.totalAmount ?? 0),
      utilization:
        totalQuantity > 0 ? Math.round((utilized / totalQuantity) * 100) : 0,
    },
    monthlyData,
    vehicleStatuses: Object.values(VehicleStatus)
      .filter((status) => status !== VehicleStatus.ARCHIVED)
      .map((status) => ({
        status,
        value: statusCount.get(status) ?? 0,
      })),
    popularVehicles: popularGroups.map((group) => {
      const vehicle = popularVehicles.find(
        (item) => item.id === group.vehicleId,
      );
      return {
        name: vehicle ? `${vehicle.brand} ${vehicle.model}` : "Véhicule",
        requests: group._count._all,
      };
    }),
    recentReservations,
  };
}

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  NEW: "Nouvelle",
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  DECLINED: "Refusée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
};

export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  RENTED: "Loué",
  MAINTENANCE: "Maintenance",
  UNAVAILABLE: "Indisponible",
  ARCHIVED: "Archivé",
};
