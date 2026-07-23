import { z } from "zod";
import { requireUser } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { AppError, NotFoundError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";
import { hashToken } from "@/lib/security/tokens";

const schema = z.object({ token: z.string().length(64) });

const POST = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const user = await requireUser();
  const { token } = schema.parse(await parseJson(request));
  const invitation = await db.agencyInvitation.findFirst({
    where: {
      tokenHash: hashToken(token),
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });
  if (!invitation) throw new NotFoundError("Invitation invalide ou expirée.");
  if (invitation.email !== user.email.toLowerCase()) {
    throw new AppError(
      "Cette invitation a été envoyée à une autre adresse e-mail.",
      403,
      "INVITATION_EMAIL_MISMATCH",
    );
  }
  const grantedPermissions = Array.isArray(invitation.permissions)
    ? invitation.permissions.filter(
        (permission): permission is string => typeof permission === "string",
      )
    : [];

  await db.$transaction([
    db.agencyMember.upsert({
      where: {
        agencyId_userId: {
          agencyId: invitation.agencyId,
          userId: user.id,
        },
      },
      create: {
        agencyId: invitation.agencyId,
        userId: user.id,
        role: "STAFF",
        permissions: grantedPermissions,
      },
      update: {
        role: "STAFF",
        permissions: grantedPermissions,
        isActive: true,
      },
    }),
    db.agencyInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    }),
  ]);
  return jsonOk({ accepted: true, agencyId: invitation.agencyId });
});

export { POST };
