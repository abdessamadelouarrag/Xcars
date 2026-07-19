import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { agencySettingsSchema } from "@/lib/validation/agency";

const PATCH = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const tenant = await requireTenantPermission("agency:update");
  const input = agencySettingsSchema.parse(await parseJson(request));

  const [agency, settings] = await db.$transaction([
    db.agency.update({
      where: { id: tenant.agency.id },
      data: {
        name: sanitizePlainText(input.name),
        slug: input.slug,
        description: sanitizePlainText(input.description),
      },
    }),
    db.agencySettings.update({
      where: { agencyId: tenant.agency.id },
      data: {
        address: sanitizePlainText(input.address),
        city: sanitizePlainText(input.city),
        country: sanitizePlainText(input.country),
        phone: sanitizePlainText(input.phone),
        contactEmail: input.contactEmail,
        openingHours: input.openingHours,
        locale: input.locale,
        currency: input.currency,
        timezone: input.timezone,
        seoTitle: sanitizePlainText(input.seoTitle),
        seoDescription: sanitizePlainText(input.seoDescription),
      },
    }),
    db.auditLog.create({
      data: {
        agencyId: tenant.agency.id,
        actorId: tenant.user.id,
        action: "agency.settings.update",
        entityType: "Agency",
        entityId: tenant.agency.id,
      },
    }),
  ]);

  return jsonOk({ agency, settings });
});

export { PATCH };
