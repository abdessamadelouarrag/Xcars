import Link from "next/link";
import type { Prisma, ReservationStatus } from "@prisma/client";
import {
  CalendarDays,
  ChevronRight,
  Download,
  Mail,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTenantPermission } from "@/lib/auth/tenant";
import {
  reservationStatusLabels,
} from "@/lib/dashboard/queries";
import { db } from "@/lib/db";
import { cn, formatCurrency } from "@/lib/utils";
import { reservationListSchema } from "@/lib/validation/reservation";

export const metadata = {
  title: "Réservations",
};

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenantPermission("reservations:read");
  const rawQuery = await searchParams;
  const scalarQuery = Object.fromEntries(
    Object.entries(rawQuery).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const query = reservationListSchema.parse(scalarQuery);
  const where: Prisma.ReservationWhereInput = {
    agencyId: tenant.agency.id,
    ...(query.status ? { status: query.status } : {}),
    ...(query.from || query.to
      ? {
          startsAt: {
            gte: query.from,
            lte: query.to,
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { reference: { contains: query.search } },
            {
              customer: {
                name: { contains: query.search },
              },
            },
            {
              vehicle: {
                brand: { contains: query.search },
              },
            },
            {
              vehicle: {
                model: { contains: query.search },
              },
            },
          ],
        }
      : {}),
  };
  const pageSize = 15;
  const [reservations, total, statusGroups] = await Promise.all([
    db.reservation.findMany({
      where,
      include: {
        customer: true,
        vehicle: { select: { brand: true, model: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * pageSize,
      take: pageSize,
    }),
    db.reservation.count({ where }),
    db.reservation.groupBy({
      by: ["status"],
      where: { agencyId: tenant.agency.id },
      _count: { _all: true },
    }),
  ]);
  const pageCount = Math.ceil(total / pageSize);
  const statusCounts = new Map(
    statusGroups.map((group) => [group.status, group._count._all]),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Réservations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Traitez les demandes et suivez chaque location.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/reservations/calendrier"
            className={buttonVariants({ variant: "outline" })}
          >
            <CalendarDays />
            Calendrier
          </Link>
          <Link
            href="/api/reservations/export"
            className={buttonVariants({ variant: "outline" })}
          >
            <Download />
            CSV
          </Link>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <StatusTab
          href="/dashboard/reservations"
          label="Toutes"
          count={statusGroups.reduce((sum, group) => sum + group._count._all, 0)}
          active={!query.status}
        />
        {(Object.keys(reservationStatusLabels) as ReservationStatus[]).map((status) => (
          <StatusTab
            key={status}
            href={`?status=${status}`}
            label={reservationStatusLabels[status]}
            count={statusCounts.get(status) ?? 0}
            active={query.status === status}
          />
        ))}
      </div>

      <form className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1.5fr_1fr_1fr_auto]">
        {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="search"
            defaultValue={query.search}
            placeholder="Référence, client ou véhicule…"
            className="form-select pl-10"
          />
        </div>
        <input
          name="from"
          type="date"
          defaultValue={query.from?.toISOString().slice(0, 10)}
          className="form-select"
          aria-label="À partir du"
        />
        <input
          name="to"
          type="date"
          defaultValue={query.to?.toISOString().slice(0, 10)}
          className="form-select"
          aria-label="Jusqu’au"
        />
        <button className={buttonVariants()} type="submit">
          Filtrer
        </button>
      </form>

      {reservations.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[930px] text-left text-sm">
            <thead className="border-b border-border bg-muted/45 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Référence</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Véhicule</th>
                <th className="px-4 py-3 font-semibold">Période</th>
                <th className="px-4 py-3 font-semibold">Montant</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-muted/25">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">
                    {reservation.reference}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{reservation.customer.name}</p>
                    <a
                      href={`mailto:${reservation.customer.email}`}
                      className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <Mail className="size-3" />
                      {reservation.customer.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {reservation.vehicle.brand} {reservation.vehicle.model}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(reservation.startsAt)} → {formatDate(reservation.endsAt)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatCurrency(
                      reservation.totalAmount.toString(),
                      reservation.currency,
                      "fr-MA",
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(reservation.status)}>
                      {reservationStatusLabels[reservation.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/reservations/${reservation.id}`}
                      className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                      <ChevronRight />
                      <span className="sr-only">Ouvrir</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Aucune réservation dans cette vue"
          description="Les demandes envoyées depuis votre site apparaîtront ici. Modifiez les filtres si nécessaire."
        />
      )}

      {pageCount > 1 ? (
        <nav className="flex justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(scalarQuery)) {
              if (value) params.set(key, value);
            }
            params.set("page", String(page));
            return (
              <Link
                key={page}
                href={`?${params}`}
                className={buttonVariants({
                  variant: page === query.page ? "default" : "outline",
                  size: "icon",
                })}
              >
                {page}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

function StatusTab({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px]">{count}</span>
    </Link>
  );
}

function statusVariant(status: ReservationStatus) {
  if (status === "CONFIRMED" || status === "COMPLETED") return "success" as const;
  if (status === "NEW" || status === "PENDING") return "warning" as const;
  if (status === "DECLINED" || status === "CANCELLED") return "destructive" as const;
  return "secondary" as const;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}
