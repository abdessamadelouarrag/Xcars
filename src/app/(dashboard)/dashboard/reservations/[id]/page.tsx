import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CarFront,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  UserRound,
} from "lucide-react";
import { ReservationActions } from "@/components/reservations/reservation-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireTenantPermission } from "@/lib/auth/tenant";
import { reservationStatusLabels } from "@/lib/dashboard/queries";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: `Réservation ${id.slice(0, 8)}` };
}

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requireTenantPermission("reservations:read");
  const { id } = await params;
  const reservation = await db.reservation.findFirst({
    where: { id, agencyId: tenant.agency.id },
    include: {
      customer: true,
      vehicle: true,
      history: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!reservation) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs font-semibold text-primary">
            {reservation.reference}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {reservation.vehicle.brand} {reservation.vehicle.model}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Demande reçue le {formatLongDate(reservation.createdAt)}
          </p>
        </div>
        <Badge className="self-start text-sm" variant={reservation.status === "CONFIRMED" ? "success" : "warning"}>
          {reservationStatusLabels[reservation.status]}
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Détails de la location</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Info icon={CalendarDays} label="Début">
                {formatLongDate(reservation.startsAt)}
              </Info>
              <Info icon={CalendarDays} label="Fin">
                {formatLongDate(reservation.endsAt)}
              </Info>
              <Info icon={MapPin} label="Lieu de départ">
                {reservation.pickupLocation}
              </Info>
              <Info icon={MapPin} label="Lieu de retour">
                {reservation.returnLocation}
              </Info>
              <Info icon={CarFront} label="Véhicule">
                <Link
                  href={`/dashboard/vehicules/${reservation.vehicleId}/modifier`}
                  className="font-semibold text-primary hover:underline"
                >
                  {reservation.vehicle.brand} {reservation.vehicle.model}
                </Link>
              </Info>
              <Info icon={CarFront} label="Quantité">
                {reservation.quantity}
              </Info>
              <Info icon={CalendarDays} label="Tarif">
                {formatCurrency(
                  reservation.dailyRate.toString(),
                  reservation.currency,
                  "fr-MA",
                )}{" "}
                / jour
              </Info>
              <Info icon={CalendarDays} label="Montant estimé">
                <strong className="text-lg">
                  {formatCurrency(
                    reservation.totalAmount.toString(),
                    reservation.currency,
                    "fr-MA",
                  )}
                </strong>
              </Info>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Message du client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 rounded-xl bg-muted/50 p-4 text-sm leading-6">
                <MessageSquareText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                {reservation.customerMessage || "Aucun message ajouté."}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-5 border-l border-border pl-5">
                {reservation.history.map((item) => (
                  <li key={item.id} className="relative">
                    <span className="absolute -left-[25px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <p className="text-sm font-semibold">
                      {reservationStatusLabels[item.toStatus]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatLongDate(item.createdAt)}
                      {item.changedBy?.name ? ` · ${item.changedBy.name}` : ""}
                    </p>
                    {item.note ? (
                      <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Info icon={UserRound} label="Nom">
                {reservation.customer.name}
              </Info>
              <Info icon={Mail} label="E-mail">
                <a className="text-primary hover:underline" href={`mailto:${reservation.customer.email}`}>
                  {reservation.customer.email}
                </a>
              </Info>
              <Info icon={Phone} label="Téléphone">
                <a className="text-primary hover:underline" href={`tel:${reservation.customer.phone}`}>
                  {reservation.customer.phone}
                </a>
              </Info>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Traitement</CardTitle>
            </CardHeader>
            <CardContent>
              <ReservationActions
                reservationId={reservation.id}
                currentStatus={reservation.status}
                initialNote={reservation.internalNote}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

function formatLongDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(value);
}
