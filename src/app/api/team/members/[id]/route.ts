import { requireTenantPermission } from "@/lib/auth/tenant";
import { isPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";
import { memberPermissionsSchema } from "@/lib/validation/team";

const PATCH = withApiErrorHandling(
  async (
    request: Request,
    context: { params: Promise<{ id: string }> },
  ) => {
    assertSameOrigin(request);
    const tenant = await requireTenantPermission("members:manage");
    const { id } = await context.params;
    const input = memberPermissionsSchema.parse(await parseJson(request));
    const member = await db.agencyMember.findFirst({
      where: { id, agencyId: tenant.agency.id, isActive: true },
      select: { id: true, role: true, userId: true },
    });
    if (!member) throw new NotFoundError("Membre introuvable.");
    if (member.role === "OWNER") {
      throw new ForbiddenError(
        "Les permissions du propriétaire ne peuvent pas être limitées.",
      );
    }
    const hasFullControl =
      tenant.user.role === "ADMIN" || tenant.membership?.role === "OWNER";
    if (!hasFullControl) {
      if (member.userId === tenant.user.id) {
        throw new ForbiddenError(
          "Vous ne pouvez pas modifier vos propres permissions.",
        );
      }
      const grantedPermissions = Array.isArray(
        tenant.membership?.permissions,
      )
        ? tenant.membership.permissions.filter(isPermission)
        : [];
      if (
        input.permissions.some(
          (permission) => !grantedPermissions.includes(permission),
        )
      ) {
        throw new ForbiddenError(
          "Vous ne pouvez attribuer que les permissions que vous possédez.",
        );
      }
    }

    const [updated] = await db.$transaction([
      db.agencyMember.update({
        where: { id: member.id },
        data: { permissions: input.permissions },
      }),
      db.auditLog.create({
        data: {
          agencyId: tenant.agency.id,
          actorId: tenant.user.id,
          action: "team.permissions.update",
          entityType: "AgencyMember",
          entityId: member.id,
          metadata: {
            userId: member.userId,
            permissions: input.permissions,
          },
        },
      }),
    ]);

    return jsonOk({
      id: updated.id,
      permissions: updated.permissions,
    });
  },
);

export { PATCH };
