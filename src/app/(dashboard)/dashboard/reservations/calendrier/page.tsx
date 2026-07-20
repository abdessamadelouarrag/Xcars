import Link from "next/link";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Calendrier des réservations",
};

export default async function ReservationCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenantPermission("reservations:read");
  const query = await searchParams;
  const monthValue = typeof query.month === "string" ? query.month : format(new Date(), "yyyy-MM");
  let month: Date;
  try {
    month = parse(monthValue, "yyyy-MM", new Date());
  } catch {
    month = new Date();
  }
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const reservations = await db.reservation.findMany({
    where: {
      agencyId: tenant.agency.id,
      status: { in: ["NEW", "PENDING", "CONFIRMED"] },
      startsAt: { lte: gridEnd },
      endsAt: { gte: gridStart },
    },
    include: {
      vehicle: { select: { brand: true, model: true } },
      customer: { select: { name: true } },
    },
    orderBy: { startsAt: "asc" },
  });
  const days: Date[] = [];
  for (let day = gridStart; day <= gridEnd; day = addDays(day, 1)) {
    days.push(day);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendrier</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualisez les demandes et locations actives.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`?month=${format(subMonths(month, 1), "yyyy-MM")}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronLeft />
          </Link>
          <span className="min-w-32 text-center text-sm font-semibold capitalize">
            {format(month, "MMMM yyyy", { locale: fr })}
          </span>
          <Link
            href={`?month=${format(addMonths(month, 1), "yyyy-MM")}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronRight />
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <div className="grid min-w-[840px] grid-cols-7 border-b border-border bg-muted/40">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((label) => (
            <div key={label} className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
              {label}
            </div>
          ))}
        </div>
        <div className="grid min-w-[840px] grid-cols-7">
          {days.map((day) => {
            const dayReservations = reservations.filter(
              (reservation) => reservation.startsAt <= addDays(day, 1) && reservation.endsAt > day,
            );
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-32 border-b border-r border-border p-2",
                  !isSameMonth(day, month) && "bg-muted/25 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                    isSameDay(day, new Date()) && "bg-primary text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-2 space-y-1">
                  {dayReservations.slice(0, 3).map((reservation) => (
                    <Link
                      key={reservation.id}
                      href={`/dashboard/reservations/${reservation.id}`}
                      className="block rounded-lg bg-primary/10 px-2 py-1.5 text-[10px] leading-tight text-primary"
                    >
                      <strong>{reservation.vehicle.brand} {reservation.vehicle.model}</strong>
                      <span className="mt-0.5 block truncate">{reservation.customer.name}</span>
                    </Link>
                  ))}
                  {dayReservations.length > 3 ? (
                    <Badge variant="secondary">+{dayReservations.length - 3}</Badge>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
