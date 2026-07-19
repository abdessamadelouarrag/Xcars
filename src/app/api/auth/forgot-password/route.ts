import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { resetPasswordEmail } from "@/lib/email/templates";
import { AppError } from "@/lib/http/errors";
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
    key: requestFingerprint(request, "forgot-password"),
    limit: 4,
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

  const { email } = forgotPasswordSchema.parse(await parseJson(request));
  const user = await db.user.findUnique({ where: { email } });

  if (user?.passwordHash) {
    const rawToken = createToken();
    await db.$transaction([
      db.verificationToken.deleteMany({
        where: { identifier: email, purpose: "PASSWORD_RESET" },
      }),
      db.verificationToken.create({
        data: {
          identifier: email,
          token: hashToken(rawToken),
          purpose: "PASSWORD_RESET",
          expires: new Date(Date.now() + 30 * 60 * 1000),
        },
      }),
    ]);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const resetUrl = new URL("/reinitialisation", appUrl);
    resetUrl.searchParams.set("email", email);
    resetUrl.searchParams.set("token", rawToken);
    await sendEmail({
      to: email,
      subject: "Réinitialisez votre mot de passe",
      html: resetPasswordEmail({
        name: user.name,
        actionUrl: resetUrl.toString(),
      }),
    });
  }

  return jsonOk({
    message:
      "Si ce compte existe, un lien de réinitialisation vient d’être envoyé.",
  });
});

export { POST };
