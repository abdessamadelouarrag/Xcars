import { hash } from "bcryptjs";
import { db } from "@/lib/db";
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
import { hashToken } from "@/lib/security/tokens";
import { invitationRegistrationSchema } from "@/lib/validation/team";

const POST = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const rateLimit = checkRateLimit({
    key: requestFingerprint(request, "invitation-registration"),
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.success) {
    throw new AppError(
      "Trop de tentatives. Réessayez plus tard.",
      429,
      "RATE_LIMITED",
      rateLimit.retryAfterSeconds,
    );
  }

  const input = invitationRegistrationSchema.parse(await parseJson(request));
  const invitation = await db.agencyInvitation.findFirst({
    where: {
      tokenHash: hashToken(input.token),
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });
  if (!invitation) {
    throw new NotFoundError("Invitation invalide ou expirée.");
  }

  const existingUser = await db.user.findUnique({
    where: { email: invitation.email },
    select: { id: true },
  });
  if (existingUser) {
    throw new AppError(
      "Un compte existe déjà avec cette adresse. Connectez-vous pour accepter l’invitation.",
      409,
      "ACCOUNT_ALREADY_EXISTS",
    );
  }

  const permissions = Array.isArray(invitation.permissions)
    ? invitation.permissions.filter(
        (permission): permission is string => typeof permission === "string",
      )
    : [];
  const passwordHash = await hash(input.password, 12);

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: sanitizePlainText(input.name),
        email: invitation.email,
        emailVerified: new Date(),
        passwordHash,
        role: "STAFF",
      },
    });
    await tx.agencyMember.create({
      data: {
        agencyId: invitation.agencyId,
        userId: user.id,
        role: "STAFF",
        permissions,
      },
    });
    await tx.agencyInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
  });

  return jsonOk({
    created: true,
    email: invitation.email,
  });
});

export { POST };
