import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { verificationEmail } from "@/lib/email/templates";
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
import { createToken, hashToken } from "@/lib/security/tokens";
import { forgotPasswordSchema } from "@/lib/validation/auth";

const POST = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const rateLimit = checkRateLimit({
    key: requestFingerprint(request, "resend-verification"),
    limit: 4,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.success) {
    return jsonOk({
      message:
        "Si ce compte existe, un nouveau lien de vérification a été préparé.",
    });
  }

  const { email } = forgotPasswordSchema.parse(await parseJson(request));
  const user = await db.user.findUnique({
    where: { email },
    select: { name: true, emailVerified: true },
  });
  if (!user || user.emailVerified) {
    return jsonOk({
      message:
        "Si ce compte existe, un nouveau lien de vérification a été préparé.",
    });
  }

  const rawToken = createToken();
  await db.$transaction([
    db.verificationToken.deleteMany({
      where: { identifier: email, purpose: "EMAIL_VERIFICATION" },
    }),
    db.verificationToken.create({
      data: {
        identifier: email,
        token: hashToken(rawToken),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        purpose: "EMAIL_VERIFICATION",
      },
    }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const verificationUrl = new URL("/api/auth/verify", appUrl);
  verificationUrl.searchParams.set("email", email);
  verificationUrl.searchParams.set("token", rawToken);
  const delivery = await sendEmail({
    to: email,
    subject: "Vérifiez votre adresse e-mail",
    html: verificationEmail({
      name: user.name,
      actionUrl: verificationUrl.toString(),
    }),
  });

  return jsonOk({
    message: delivery.delivered
      ? "Un nouveau lien de vérification vient de vous être envoyé."
      : process.env.NODE_ENV === "development"
        ? "Le lien de vérification local est prêt."
        : "Le lien a été préparé, mais l’e-mail n’a pas pu être envoyé.",
    emailDelivered: delivery.delivered,
    developmentVerificationUrl:
      process.env.NODE_ENV === "development"
        ? verificationUrl.toString()
        : undefined,
  });
});

export { POST };
