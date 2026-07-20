import { Prisma, ReservationStatus } from "@prisma/client";
import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { withSerializableRetry } from "@/lib/db-transaction";
import { sendEmail } from "@/lib/email/send";
import { reservationEmail } from "@/lib/email/templates";
import { AppError, NotFoundError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { reservationUpdateSchema } from "@/lib/validation/reservation";
import { assertVehicleAvailability } from "@/lib/vehicles/availability";

type Context = { params: Promise<{ id: string }> };

const transitions: Record<ReservationStatus, ReservationStatus[]> = {
  NEW: ["PENDING", "CONFIRMED", "DECLINED", "CANCELLED"],
  PENDING: ["CONFIRMED", "DECLINED", "CANCELLED"],
  CONFIRMED: ["CANCELLED", "COMPLETED"],
  DECLINED: [],
  CANCELLED: [],
  COMPLETED: [],
};

const PATCH = withApiErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  const tenant = await requireTenantPermission("reservations:update");
  const { id } = await context.params;
  const input = reservationUpdateSchema.parse(await parseJson(request));

  const updated = await withSerializableRetry(async (tx) => {
    const reservation = await tx.reservation.findFirst({
      where: { id, agencyId: tenant.agency.id },
      include: {
        vehicle: true,
        customer: true,
        agency: { include: { settings: true } },
      },
    });
    if (!reservation) throw new NotFoundError("Réservation introuvable.");

    if (input.status && input.status !== reservation.status) {
      if (!transitions[reservation.status].includes(input.status)) {
        throw new AppError(
          "Ce changement de statut n’est pas autorisé.",
          409,
          "INVALID_STATUS_TRANSITION",
        );
      }
      if (input.status === "CONFIRMED") {
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM Vehicle WHERE id = ${reservation.vehicleId} FOR UPDATE`,
        );
        await assertVehicleAvailability(tx, {
          agencyId: tenant.agency.id,
          vehicleId: reservation.vehicleId,
          startsAt: reservation.startsAt,
          endsAt: reservation.endsAt,
          requestedQuantity: reservation.quantity,
          excludeReservationId: reservation.id,
        });
      }
    }

    const result = await tx.reservation.update({
      where: { id },
      data: {
        status: input.status,
        internalNote:
          input.internalNote === undefined
            ? undefined
            : input.internalNote
              ? sanitizePlainText(input.internalNote)
              : null,
      },
      include: {
        vehicle: true,
        customer: true,
        agency: { include: { settings: true } },
      },
    });

    if (input.status && input.status !== reservation.status) {
      await tx.reservationStatusHistory.create({
        data: {
          agencyId: tenant.agency.id,
          reservationId: id,
          changedById: tenant.user.id,
          fromStatus: reservation.status,
          toStatus: input.status,
          note: input.statusNote
            ? sanitizePlainText(input.statusNote)
            : null,
        },
      });
      await tx.auditLog.create({
        data: {
          agencyId: tenant.agency.id,
          actorId: tenant.user.id,
          action: `reservation.${input.status.toLowerCase()}`,
          entityType: "Reservation",
          entityId: id,
        },
      });
    }
    return result;
  });

  if (input.status && ["CONFIRMED", "DECLINED", "CANCELLED"].includes(input.status)) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const title =
      input.status === "CONFIRMED"
        ? "Votre réservation est confirmée"
        : input.status === "DECLINED"
          ? "Mise à jour de votre demande"
          : "Votre réservation a été annulée";
    await sendEmail({
      to: updated.customer.email,
      subject: `${title} · ${updated.reference}`,
      html: reservationEmail(
        title,
        `${updated.vehicle.brand} ${updated.vehicle.model} · référence ${updated.reference}.`,
        `${appUrl}/agence/${updated.agency.slug}`,
      ),
    });
  }

  return jsonOk(updated);
});

export { PATCH };
