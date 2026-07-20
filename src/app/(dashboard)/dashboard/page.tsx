import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CarFront,
  CircleDollarSign,
  Clock3,
  Gauge,
  Plus,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { ActivityChart, PopularVehiclesChart, VehicleStatusChart } from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTenantContext } from "@/lib/auth/tenant";
import {
  getDashboardData,
  reservationStatusLabels,
  vehicleStatusLabels,
} from "@/lib/dashboard/queries";
import { db } from "@/lib/db";
import { cn, formatCurrency } from "@/lib/utils";

export const metadata = {
  title: "Tableau de bord",
};

export default async function DashboardPage() {
  const { agency } = await getTenantContext();
  const [data, settings] = await Promise.all([
    getDashboardData(agency.id),
    db.agencySettings.findUnique({
      where: { agencyId: agency.id },
      select: { currency: true },
    }),
  ]);
  const currency = settings?.currency ?? "EUR";
  const metrics = [
    {
      label: "Véhicules",
      value: data.metrics.vehicleTotal,
      detail: `${data.metrics.available} disponibles`,
      icon: CarFront,
      color: "text-teal-700 bg-teal-50 dark:bg-teal-950 dark:text-teal-300",
    },
    {
      label: "Demandes à traiter",
      value: data.metrics.reservationRequests,
      detail: `${data.metrics.confirmed} confirmées`,
      icon: Clock3,
      color: "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      label: "Revenu confirmé",
      value: formatCurrency(data.metrics.revenue, currency, "fr-MA"),
      detail: "Réservations confirmées",
      icon: CircleDollarSign,
      color: "text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      label: "Taux d’utilisation",
      value: `${data.metrics.utilization}%`,
      detail: `${data.metrics.maintenance} en maintenance`,
      icon: Gauge,
      color: "text-violet-700 bg-violet-50 dark:bg-violet-950 dark:text-violet-300",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Bonjour 👋</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Voici l’activité de {agency.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Les données sont calculées à partir de votre flotte et de vos réservations.
          </p>
        </div>
        <Link
          href="/dashboard/vehicules/nouveau"
          className={cn(buttonVariants({ size: "default" }), "self-start sm:self-auto")}
        >
          <Plus />
          Ajouter un véhicule
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs clés">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight">{metric.value}</p>
                </div>
                <span className={cn("flex size-10 items-center justify-center rounded-xl", metric.color)}>
                  <metric.icon className="size-5" />
                </span>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Activité des six derniers mois</CardTitle>
            <CardDescription>Réservations reçues et revenu confirmé.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityChart data={data.monthlyData} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>État de la flotte</CardTitle>
            <CardDescription>Répartition actuelle des véhicules.</CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleStatusChart
              data={data.vehicleStatuses.map((item) => ({
                ...item,
                label: vehicleStatusLabels[item.status],
              }))}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Dernières réservations</CardTitle>
              <CardDescription>Les demandes les plus récentes.</CardDescription>
            </div>
            <Link
              href="/dashboard/reservations"
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              Tout voir <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentReservations.length ? (
              <div className="divide-y divide-border">
                {data.recentReservations.map((reservation) => (
                  <Link
                    href={`/dashboard/reservations/${reservation.id}`}
                    key={reservation.id}
                    className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
                  >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <CalendarCheck2 className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {reservation.customer.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {reservation.vehicle.brand} {reservation.vehicle.model} · {reservation.reference}
                      </p>
                    </div>
                    <Badge
                      variant={
                        reservation.status === "CONFIRMED"
                          ? "success"
                          : reservation.status === "NEW"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {reservationStatusLabels[reservation.status]}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <ShieldCheck className="mb-3 size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">Aucune demande reçue</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Les demandes de votre site apparaîtront ici.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Véhicules les plus demandés</CardTitle>
            <CardDescription>Classement basé sur les vraies demandes.</CardDescription>
          </CardHeader>
          <CardContent>
            <PopularVehiclesChart data={data.popularVehicles} />
          </CardContent>
        </Card>
      </section>

      {data.metrics.maintenance > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <Wrench className="size-5 shrink-0" />
          <p>
            {data.metrics.maintenance} véhicule(s) en maintenance. Vérifiez leurs périodes de blocage.
          </p>
        </div>
      ) : null}
    </div>
  );
}
