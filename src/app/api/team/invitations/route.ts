import { requireTenantPermission } from "@/lib/auth/tenant";
import { isPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { invitationEmail } from "@/lib/email/templates";
import { AppError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";
import { createToken, hashToken } from "@/lib/security/tokens";
import { invitationSchema } from "@/lib/validation/team";

const POST = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const tenant = await requireTenantPermission("members:manage");
  const input = invitationSchema.parse(await parseJson(request));
  const hasFullControl =
    tenant.user.role === "ADMIN" || tenant.membership?.role === "OWNER";
  if (!hasFullControl) {
    const grantedPermissions = Array.isArray(tenant.membership?.permissions)
      ? tenant.membership.permissions.filter(isPermission)
      : [];
    if (
      input.permissions.some(
        (permission) => !grantedPermissions.includes(permission),
      )
    ) {
      throw new AppError(
        "Vous ne pouvez attribuer que les permissions que vous possédez.",
        403,
        "FORBIDDEN",
      );
    }
  }
  const existingMember = await db.agencyMember.findFirst({
    where: {
      agencyId: tenant.agency.id,
      user: { email: input.email },
      isActive: true,
    },
  });
  if (existingMember) {
    throw new AppError("Cette personne fait déjà partie de l’agence.", 409, "MEMBER_EXISTS");
  }
  const rawToken = createToken();
  await db.agencyInvitation.deleteMany({
    where: {
      agencyId: tenant.agency.id,
      email: input.email,
      status: "PENDING",
    },
  });
  await db.agencyInvitation.create({
    data: {
      agencyId: tenant.agency.id,
      invitedById: tenant.user.id,
      email: input.email,
      permissions: input.permissions,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const inviteUrl = new URL("/invitation", appUrl);
  inviteUrl.searchParams.set("token", rawToken);
  const delivery = await sendEmail({
    to: input.email,
    subject: `Invitation à rejoindre ${tenant.agency.name}`,
    html: invitationEmail({
      agencyName: tenant.agency.name,
      invitedBy: tenant.user.name ?? tenant.user.email,
      actionUrl: inviteUrl.toString(),
    }),
  });
  return jsonOk({
    sent: true,
    emailDelivered: delivery.delivered,
    developmentInvitationUrl:
      process.env.NODE_ENV === "development" ? inviteUrl.toString() : undefined,
  }, { status: 201 });
});

export { POST };
