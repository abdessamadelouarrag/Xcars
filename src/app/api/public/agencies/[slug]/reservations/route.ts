import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
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
import {
  checkRateLimit,
  requestFingerprint,
} from "@/lib/security/rate-limit";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { reservationRequestSchema } from "@/lib/validation/reservation";
import { assertVehicleAvailability } from "@/lib/vehicles/availability";

type Context = { params: Promise<{ slug: string }> };

const POST = withApiErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  const { slug } = await context.params;
  const rateLimit = checkRateLimit({
    key: requestFingerprint(request, `reservation:${slug}`),
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.success) {
    throw new AppError(
      "Trop de demandes. Réessayez plus tard.",
      429,
      "RATE_LIMITED",
      rateLimit.retryAfterSeconds,
    );
  }
  const input = reservationRequestSchema.parse(await parseJson(request));
  const agency = await db.agency.findFirst({
    where: { slug, status: "ACTIVE" },
    include: { settings: true },
  });
  if (!agency) throw new NotFoundError("Agence introuvable.");

  const vehicle = await db.vehicle.findFirst({
    where: {
      id: input.vehicleId,
      agencyId: agency.id,
      isArchived: false,
    },
  });
  if (!vehicle) throw new NotFoundError("Véhicule introuvable.");

  const dayCount = Math.max(
    1,
    Math.ceil(
      (input.endsAt.getTime() - input.startsAt.getTime()) /
        (24 * 60 * 60 * 1000),
    ),
  );
  const totalAmount = new Prisma.Decimal(vehicle.dailyPrice)
    .times(dayCount)
    .times(input.quantity);
  const reference = `${agency.slug.slice(0, 3).toUpperCase()}-${new Date()
    .getFullYear()
    .toString()
    .slice(-2)}-${randomBytes(3).toString("hex").toUpperCase()}`;

  const reservation = await withSerializableRetry(async (tx) => {
    await tx.$queryRaw(
      Prisma.sql`SELECT id FROM Vehicle WHERE id = ${vehicle.id} FOR UPDATE`,
    );

    if (input.idempotencyKey) {
      const existing = await tx.reservation.findFirst({
        where: {
          agencyId: agency.id,
          idempotencyKey: input.idempotencyKey,
        },
      });
      if (existing) return existing;
    }

    await assertVehicleAvailability(tx, {
      agencyId: agency.id,
      vehicleId: vehicle.id,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      requestedQuantity: input.quantity,
    });

    const customer = await tx.customer.upsert({
      where: {
        agencyId_email: {
          agencyId: agency.id,
          email: input.customerEmail,
        },
      },
      create: {
        agencyId: agency.id,
        name: sanitizePlainText(input.customerName),
        email: input.customerEmail,
        phone: sanitizePlainText(input.customerPhone),
      },
      update: {
        name: sanitizePlainText(input.customerName),
        phone: sanitizePlainText(input.customerPhone),
      },
    });

    const created = await tx.reservation.create({
      data: {
        agencyId: agency.id,
        vehicleId: vehicle.id,
        customerId: customer.id,
        reference,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        pickupLocation: sanitizePlainText(input.pickupLocation),
        returnLocation: sanitizePlainText(input.returnLocation),
        quantity: input.quantity,
        dailyRate: vehicle.dailyPrice,
        totalAmount,
        currency: agency.settings?.currency ?? "EUR",
        customerMessage: input.message
          ? sanitizePlainText(input.message)
          : null,
        acceptedTermsAt: new Date(),
        idempotencyKey: input.idempotencyKey,
        history: {
          create: {
            agencyId: agency.id,
            toStatus: "NEW",
            note: "Demande reçue depuis le site public",
          },
        },
      },
    });
    await tx.notification.create({
      data: {
        agencyId: agency.id,
        title: "Nouvelle demande de réservation",
        body: `${input.customerName} souhaite réserver ${vehicle.brand} ${vehicle.model}.`,
        type: "reservation.new",
        href: `/dashboard/reservations/${created.id}`,
      },
    });
    await tx.vehicle.update({
      where: { id: vehicle.id },
      data: { popularity: { increment: 1 } },
    });
    return created;
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  if (agency.settings?.contactEmail) {
    await sendEmail({
      to: agency.settings.contactEmail,
      subject: `Nouvelle réservation ${reservation.reference}`,
      html: reservationEmail(
        "Nouvelle demande de réservation",
        `${input.customerName} souhaite réserver ${vehicle.brand} ${vehicle.model}.`,
        `${appUrl}/dashboard/reservations/${reservation.id}`,
      ),
    });
  }

  return jsonOk(
    {
      id: reservation.id,
      reference: reservation.reference,
      status: reservation.status,
    },
    { status: 201 },
  );
});

export { POST };
