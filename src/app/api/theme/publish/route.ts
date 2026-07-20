import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";
import { publishThemeSchema } from "@/lib/validation/theme";

const POST = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const tenant = await requireTenantPermission("theme:publish");
  const { id } = publishThemeSchema.parse(await parseJson(request));
  const draft = await db.themeConfiguration.findFirst({
    where: { id, agencyId: tenant.agency.id, status: "DRAFT" },
  });
  if (!draft) throw new NotFoundError("Brouillon introuvable.");

  const nextDraft = await db.$transaction(async (tx) => {
    await tx.themeConfiguration.updateMany({
      where: { agencyId: tenant.agency.id, status: "PUBLISHED" },
      data: { status: "ARCHIVED" },
    });
    await tx.themeConfiguration.update({
      where: { id: draft.id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    const nextVersion = draft.version + 1;
    const visibleSections = draft.visibleSections as Prisma.InputJsonValue;
    const sectionOrder = draft.sectionOrder as Prisma.InputJsonValue;
    const created = await tx.themeConfiguration.create({
      data: {
        agencyId: tenant.agency.id,
        createdById: tenant.user.id,
        version: nextVersion,
        status: "DRAFT",
        preset: draft.preset,
        primaryColor: draft.primaryColor,
        secondaryColor: draft.secondaryColor,
        accentColor: draft.accentColor,
        backgroundColor: draft.backgroundColor,
        textColor: draft.textColor,
        headingFont: draft.headingFont,
        bodyFont: draft.bodyFont,
        radius: draft.radius,
        buttonStyle: draft.buttonStyle,
        cardStyle: draft.cardStyle,
        navigationStyle: draft.navigationStyle,
        spacingScale: draft.spacingScale,
        heroEyebrow: draft.heroEyebrow,
        heroTitle: draft.heroTitle,
        heroDescription: draft.heroDescription,
        visibleSections,
        sectionOrder,
      },
    });
    await tx.agency.update({
      where: { id: tenant.agency.id },
      data: { status: "ACTIVE" },
    });
    await tx.auditLog.create({
      data: {
        agencyId: tenant.agency.id,
        actorId: tenant.user.id,
        action: "theme.publish",
        entityType: "ThemeConfiguration",
        entityId: draft.id,
        metadata: { version: draft.version },
      },
    });
    return created;
  });

  revalidatePath(`/agence/${tenant.agency.slug}`, "layout");
  return jsonOk({
    publishedVersion: draft.version,
    nextDraftId: nextDraft.id,
  });
});

export { POST };
