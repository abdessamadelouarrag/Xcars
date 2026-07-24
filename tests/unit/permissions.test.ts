import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/auth/permissions";

describe("tenant permissions", () => {
  it("allows an agency owner to manage all agency resources", () => {
    expect(
      hasPermission({
        platformRole: "OWNER",
        agencyRole: "OWNER",
        permission: "members:manage",
      }),
    ).toBe(true);
  });

  it("allows a platform administrator", () => {
    expect(
      hasPermission({
        platformRole: "ADMIN",
        permission: "theme:publish",
      }),
    ).toBe(true);
  });

  it("denies an ungranted staff permission", () => {
    expect(
      hasPermission({
        platformRole: "STAFF",
        agencyRole: "STAFF",
        grantedPermissions: ["vehicles:read"],
        permission: "vehicles:delete",
      }),
    ).toBe(false);
  });

  it("allows only the explicitly granted staff permission", () => {
    expect(
      hasPermission({
        platformRole: "STAFF",
        agencyRole: "STAFF",
        grantedPermissions: ["reservations:read", "reservations:update"],
        permission: "reservations:update",
      }),
    ).toBe(true);
  });

  it("allows read access when a stronger write permission is granted", () => {
    expect(
      hasPermission({
        platformRole: "STAFF",
        agencyRole: "STAFF",
        grantedPermissions: ["theme:update"],
        permission: "theme:read",
      }),
    ).toBe(true);
  });

  it("does not infer write access from a read permission", () => {
    expect(
      hasPermission({
        platformRole: "STAFF",
        agencyRole: "STAFF",
        grantedPermissions: ["theme:read"],
        permission: "theme:update",
      }),
    ).toBe(false);
  });
});
