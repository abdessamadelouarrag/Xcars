import { z } from "zod";
import { db } from "@/lib/db";
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

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  phone: z.string().trim().max(30),
  message: z.string().trim().min(10).max(3_000),
});

type Context = { params: Promise<{ slug: string }> };

const POST = withApiErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  const { slug } = await context.params;
  const rateLimit = checkRateLimit({
    key: requestFingerprint(request, `contact:${slug}`),
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.success) {
    throw new AppError(
      "Trop de messages envoyés. Réessayez plus tard.",
      429,
      "RATE_LIMITED",
      rateLimit.retryAfterSeconds,
    );
  }
  const input = contactSchema.parse(await parseJson(request));
  const agency = await db.agency.findFirst({
    where: { slug, status: "ACTIVE" },
    include: { settings: true },
  });
  if (!agency) throw new NotFoundError("Agence introuvable.");

  await db.notification.create({
    data: {
      agencyId: agency.id,
      title: `Message de ${sanitizePlainText(input.name)}`,
      body: sanitizePlainText(input.message),
      type: "contact.new",
      href: `mailto:${input.email}`,
    },
  });
  if (agency.settings?.contactEmail) {
    await sendEmail({
      to: agency.settings.contactEmail,
      subject: `Nouveau message depuis ${agency.name}`,
      html: reservationEmail(
        `Message de ${sanitizePlainText(input.name)}`,
        `${sanitizePlainText(input.message)} — Répondre à ${input.email}${
          input.phone ? `, téléphone ${sanitizePlainText(input.phone)}` : ""
        }.`,
        `mailto:${input.email}`,
      ),
    });
  }
  return jsonOk({ sent: true }, { status: 201 });
});

export { POST };
