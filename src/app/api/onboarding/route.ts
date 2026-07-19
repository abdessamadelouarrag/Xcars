import type { Prisma } from "@prisma/client";
import { getTenantContext } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { onboardingSchema } from "@/lib/validation/agency";

const POST = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const tenant = await getTenantContext();
  if (tenant.membership?.role !== "OWNER" && tenant.user.role !== "ADMIN") {
    throw new NotFoundError();
  }
  const input = onboardingSchema.parse(await parseJson(request));
  const draft = await db.themeConfiguration.findFirst({
    where: { agencyId: tenant.agency.id, status: "DRAFT" },
    orderBy: { version: "desc" },
  });

  if (input.step === 1) {
    await db.$transaction([
      db.agency.update({
        where: { id: tenant.agency.id },
        data: {
          name: sanitizePlainText(input.data.name),
          slug: input.data.slug,
          description: sanitizePlainText(input.data.description),
          onboardingStep: 2,
        },
      }),
      db.agencySettings.update({
        where: { agencyId: tenant.agency.id },
        data: {
          address: sanitizePlainText(input.data.address),
          city: sanitizePlainText(input.data.city),
          country: sanitizePlainText(input.data.country),
          phone: sanitizePlainText(input.data.phone),
          contactEmail: input.data.contactEmail,
          openingHours: input.data.openingHours,
        },
      }),
    ]);
  } else if (input.step === 2) {
    if (!draft) throw new NotFoundError("Brouillon de thème introuvable.");
    await db.$transaction([
      db.agencySettings.update({
        where: { agencyId: tenant.agency.id },
        data: {
          logoUrl: input.data.logoUrl,
          logoPublicId: input.data.logoPublicId,
          faviconUrl: input.data.faviconUrl,
          faviconPublicId: input.data.faviconPublicId,
          coverUrl: input.data.coverUrl,
          coverPublicId: input.data.coverPublicId,
        },
      }),
      db.themeConfiguration.update({
        where: { id: draft.id },
        data: {
          primaryColor: input.data.primaryColor,
          secondaryColor: input.data.secondaryColor,
          accentColor: input.data.accentColor,
          backgroundColor: input.data.backgroundColor,
          textColor: input.data.textColor,
          headingFont: input.data.headingFont,
          bodyFont: input.data.bodyFont,
          radius: input.data.radius,
        },
      }),
      db.agency.update({
        where: { id: tenant.agency.id },
        data: { onboardingStep: 3 },
      }),
    ]);
  } else if (input.step === 3) {
    if (!draft) throw new NotFoundError("Brouillon de thème introuvable.");
    const presetColors = {
      ELEGANT: { primaryColor: "#8A5A44", secondaryColor: "#241A17", accentColor: "#D9B99B" },
      MINIMAL: { primaryColor: "#0F766E", secondaryColor: "#102A2A", accentColor: "#F4B942" },
      SPORT: { primaryColor: "#DC2626", secondaryColor: "#111827", accentColor: "#FACC15" },
      LUXURY: { primaryColor: "#D7B56D", secondaryColor: "#111111", accentColor: "#F1D798" },
    }[input.data.preset];
    await db.$transaction([
      db.themeConfiguration.update({
        where: { id: draft.id },
        data: { preset: input.data.preset, ...presetColors },
      }),
      db.agency.update({
        where: { id: tenant.agency.id },
        data: { onboardingStep: 4 },
      }),
    ]);
  } else {
    if (!draft) throw new NotFoundError("Brouillon de thème introuvable.");
    await db.$transaction(async (tx) => {
      await tx.themeConfiguration.update({
        where: { id: draft.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
      await tx.agency.update({
        where: { id: tenant.agency.id },
        data: { onboardingStep: 4, status: "ACTIVE" },
      });
      await tx.auditLog.create({
        data: {
          agencyId: tenant.agency.id,
          actorId: tenant.user.id,
          action: "agency.onboarding.complete",
          entityType: "Agency",
          entityId: tenant.agency.id,
          metadata: { publishedThemeVersion: draft.version },
        },
      });
    });
  }

  return jsonOk({ nextStep: Math.min(4, input.step + 1) });
});

export { POST };
