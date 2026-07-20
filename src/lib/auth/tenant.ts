import { cache } from "react";
import type { Agency, AgencyMember, User } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/http/errors";
import { hasPermission, type Permission } from "@/lib/auth/permissions";

type SessionUser = Pick<User, "id" | "email" | "name" | "image" | "role">;

export type TenantContext = {
  user: SessionUser;
  agency: Agency;
  membership: AgencyMember | null;
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
    },
  });
});

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function getTenantContext(
  requestedAgencyId?: string,
): Promise<TenantContext> {
  const user = await requireUser();

  if (user.role === "ADMIN" && requestedAgencyId) {
    const agency = await db.agency.findUnique({
      where: { id: requestedAgencyId },
    });
    if (!agency) throw new NotFoundError("Agence introuvable.");
    return { user, agency, membership: null };
  }

  const membership = await db.agencyMember.findFirst({
    where: {
      userId: user.id,
      isActive: true,
      ...(requestedAgencyId ? { agencyId: requestedAgencyId } : {}),
    },
    include: { agency: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  if (!membership) {
    if (requestedAgencyId) {
      throw new ForbiddenError(
        "Cette agence n’appartient pas à votre espace.",
      );
    }
    throw new NotFoundError("Aucune agence active n’est associée à ce compte.");
  }

  return {
    user,
    agency: membership.agency,
    membership,
  };
}

export function assertPermission(
  context: TenantContext,
  permission: Permission,
) {
  const allowed = hasPermission({
    platformRole: context.user.role,
    agencyRole: context.membership?.role,
    grantedPermissions: Array.isArray(context.membership?.permissions)
      ? context.membership.permissions.filter(
          (permission): permission is string => typeof permission === "string",
        )
      : [],
    permission,
  });
  if (!allowed) throw new ForbiddenError();
}

export async function requireTenantPermission(
  permission: Permission,
  agencyId?: string,
) {
  const context = await getTenantContext(agencyId);
  assertPermission(context, permission);
  return context;
}
