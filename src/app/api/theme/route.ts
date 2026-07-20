import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { themeUpdateSchema } from "@/lib/validation/theme";

const PATCH = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const tenant = await requireTenantPermission("theme:update");
  const input = themeUpdateSchema.parse(await parseJson(request));
  const draft = await db.themeConfiguration.findFirst({
    where: {
      id: input.id,
      agencyId: tenant.agency.id,
      status: "DRAFT",
    },
  });
  if (!draft) throw new NotFoundError("Brouillon introuvable.");

  const [theme] = await db.$transaction([
    db.themeConfiguration.update({
      where: { id: draft.id },
      data: {
        preset: input.preset,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        accentColor: input.accentColor,
        backgroundColor: input.backgroundColor,
        textColor: input.textColor,
        headingFont: input.headingFont,
        bodyFont: input.bodyFont,
        radius: input.radius,
        buttonStyle: input.buttonStyle,
        cardStyle: input.cardStyle,
        navigationStyle: input.navigationStyle,
        spacingScale: input.spacingScale,
        heroEyebrow: input.heroEyebrow
          ? sanitizePlainText(input.heroEyebrow)
          : null,
        heroTitle: sanitizePlainText(input.heroTitle),
        heroDescription: sanitizePlainText(input.heroDescription),
        visibleSections: input.visibleSections,
        sectionOrder: input.sectionOrder,
      },
    }),
    db.agencySettings.update({
      where: { agencyId: tenant.agency.id },
      data: {
        logoUrl: input.logoUrl,
        logoPublicId: input.logoPublicId,
        faviconUrl: input.faviconUrl,
        faviconPublicId: input.faviconPublicId,
        coverUrl: input.coverUrl,
        coverPublicId: input.coverPublicId,
      },
    }),
    db.auditLog.create({
      data: {
        agencyId: tenant.agency.id,
        actorId: tenant.user.id,
        action: "theme.draft.update",
        entityType: "ThemeConfiguration",
        entityId: draft.id,
      },
    }),
  ]);

  return jsonOk(theme);
});

export { PATCH };
