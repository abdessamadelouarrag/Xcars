import { requireTenantPermission } from "@/lib/auth/tenant";
import {
  getEmailTransportStatus,
  sendEmail,
} from "@/lib/email/send";
import { emailTransportTest } from "@/lib/email/templates";
import { AppError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  withApiErrorHandling,
} from "@/lib/http/api";
import {
  checkRateLimit,
  requestFingerprint,
} from "@/lib/security/rate-limit";

const POST = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const tenant = await requireTenantPermission("agency:update");
  const rateLimit = checkRateLimit({
    key: requestFingerprint(request, "email-test"),
    limit: 3,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.success) {
    throw new AppError(
      "Trop de tests envoyés. Réessayez plus tard.",
      429,
      "RATE_LIMITED",
      rateLimit.retryAfterSeconds,
    );
  }

  const status = getEmailTransportStatus();
  if (!status.configured) {
    throw new AppError(
      "Le transport e-mail global n’est pas configuré.",
      503,
      "EMAIL_NOT_CONFIGURED",
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const delivery = await sendEmail({
    to: tenant.user.email,
    subject: "Test SMTP XCars",
    html: emailTransportTest({
      name: tenant.user.name,
      actionUrl: appUrl,
    }),
  });
  if (!delivery.delivered) {
    throw new AppError(
      "Le serveur SMTP a refusé l’envoi. Vérifiez ses identifiants.",
      502,
      "EMAIL_DELIVERY_FAILED",
    );
  }

  return jsonOk({
    delivered: true,
    transport: delivery.transport,
    recipient: tenant.user.email,
  });
});

export { POST };
