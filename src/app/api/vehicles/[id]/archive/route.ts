import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  withApiErrorHandling,
} from "@/lib/http/api";

type Context = { params: Promise<{ id: string }> };

const POST = withApiErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  const tenant = await requireTenantPermission("vehicles:update");
  const { id } = await context.params;
  const result = await db.vehicle.updateMany({
    where: { id, agencyId: tenant.agency.id },
    data: { isArchived: true, status: "ARCHIVED", isFeatured: false },
  });
  if (!result.count) throw new NotFoundError("Véhicule introuvable.");
  await db.auditLog.create({
    data: {
      agencyId: tenant.agency.id,
      actorId: tenant.user.id,
      action: "vehicle.archive",
      entityType: "Vehicle",
      entityId: id,
    },
  });
  return jsonOk({ archived: true });
});

export { POST };
