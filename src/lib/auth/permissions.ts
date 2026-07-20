import type { AgencyRole, UserRole } from "@prisma/client";

export const permissions = [
  "agency:read",
  "agency:update",
  "vehicles:read",
  "vehicles:create",
  "vehicles:update",
  "vehicles:delete",
  "reservations:read",
  "reservations:update",
  "reservations:export",
  "theme:read",
  "theme:update",
  "theme:publish",
  "members:read",
  "members:manage",
] as const;

export type Permission = (typeof permissions)[number];

const impliedPermissions: Partial<Record<Permission, Permission[]>> = {
  "agency:update": ["agency:read"],
  "vehicles:create": ["vehicles:read"],
  "vehicles:update": ["vehicles:read"],
  "vehicles:delete": ["vehicles:read"],
  "reservations:update": ["reservations:read"],
  "reservations:export": ["reservations:read"],
  "theme:update": ["theme:read"],
  "theme:publish": ["theme:read", "theme:update"],
  "members:manage": ["members:read"],
};

export function isPermission(value: unknown): value is Permission {
  return (
    typeof value === "string" &&
    permissions.includes(value as Permission)
  );
}

export function hasPermission(input: {
  platformRole: UserRole;
  agencyRole?: AgencyRole | null;
  grantedPermissions?: string[];
  permission: Permission;
}) {
  if (input.platformRole === "ADMIN" || input.agencyRole === "OWNER") {
    return true;
  }
  if (
    input.grantedPermissions?.includes("*") ||
    input.grantedPermissions?.includes(input.permission)
  ) {
    return true;
  }

  return Object.entries(impliedPermissions).some(
    ([grantedPermission, implied]) =>
      input.grantedPermissions?.includes(grantedPermission) &&
      implied?.includes(input.permission),
  );
}
