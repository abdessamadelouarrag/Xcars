import type { Prisma } from "@prisma/client";
import { ThemeEditor } from "@/components/theme/theme-editor";
import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { sectionIds, type ThemeUpdateInput } from "@/lib/validation/theme";

export const metadata = {
  title: "Personnalisation du site",
};

export default async function CustomizationPage() {
  const tenant = await requireTenantPermission("theme:read");
  const [settings, vehicles] = await Promise.all([
    db.agencySettings.findUnique({ where: { agencyId: tenant.agency.id } }),
    db.vehicle.findMany({
      where: { agencyId: tenant.agency.id, isArchived: false },
      include: { images: { where: { isPrimary: true }, take: 1 } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
  ]);
  let draft = await db.themeConfiguration.findFirst({
    where: { agencyId: tenant.agency.id, status: "DRAFT" },
    orderBy: { version: "desc" },
  });
  if (!draft) {
    const published = await db.themeConfiguration.findFirst({
      where: { agencyId: tenant.agency.id, status: "PUBLISHED" },
      orderBy: { version: "desc" },
    });
    draft = await db.themeConfiguration.create({
      data: {
        agencyId: tenant.agency.id,
        createdById: tenant.user.id,
        version: (published?.version ?? 0) + 1,
        preset: published?.preset ?? "MINIMAL",
        primaryColor: published?.primaryColor ?? "#0F766E",
        secondaryColor: published?.secondaryColor ?? "#0F172A",
        accentColor: published?.accentColor ?? "#F59E0B",
        backgroundColor: published?.backgroundColor ?? "#FFFFFF",
        textColor: published?.textColor ?? "#0F172A",
        headingFont: published?.headingFont ?? "Manrope",
        bodyFont: published?.bodyFont ?? "Inter",
        radius: published?.radius ?? "MEDIUM",
        buttonStyle: published?.buttonStyle ?? "solid",
        cardStyle: published?.cardStyle ?? "elevated",
        navigationStyle: published?.navigationStyle ?? "floating",
        spacingScale: published?.spacingScale ?? "comfortable",
        heroEyebrow: published?.heroEyebrow ?? "Votre prochaine route",
        heroTitle: published?.heroTitle ?? "Trouvez le véhicule qui vous ressemble.",
        heroDescription:
          published?.heroDescription ??
          "Réservez simplement auprès d’une agence locale disponible.",
        visibleSections:
          (published?.visibleSections as Prisma.InputJsonValue | undefined) ??
          Object.fromEntries(sectionIds.map((section) => [section, true])),
        sectionOrder:
          (published?.sectionOrder as Prisma.InputJsonValue | undefined) ??
          sectionIds,
      },
    });
  }

  const visibleSections = Object.fromEntries(
    sectionIds.map((section) => [
      section,
      Boolean(
        (draft.visibleSections as Record<string, unknown> | null)?.[section] ??
          true,
      ),
    ]),
  ) as ThemeUpdateInput["visibleSections"];
  const rawOrder = draft.sectionOrder as string[];
  const sectionOrder =
    Array.isArray(rawOrder) &&
    rawOrder.length === sectionIds.length &&
    rawOrder.every((item) => sectionIds.includes(item as (typeof sectionIds)[number]))
      ? (rawOrder as ThemeUpdateInput["sectionOrder"])
      : [...sectionIds];

  const initialData: ThemeUpdateInput = {
    id: draft.id,
    preset: draft.preset,
    primaryColor: draft.primaryColor,
    secondaryColor: draft.secondaryColor,
    accentColor: draft.accentColor,
    backgroundColor: draft.backgroundColor,
    textColor: draft.textColor,
    headingFont: draft.headingFont as ThemeUpdateInput["headingFont"],
    bodyFont: draft.bodyFont as ThemeUpdateInput["bodyFont"],
    radius: draft.radius,
    buttonStyle: draft.buttonStyle as ThemeUpdateInput["buttonStyle"],
    cardStyle: draft.cardStyle as ThemeUpdateInput["cardStyle"],
    navigationStyle: draft.navigationStyle as ThemeUpdateInput["navigationStyle"],
    spacingScale: draft.spacingScale as ThemeUpdateInput["spacingScale"],
    heroEyebrow: draft.heroEyebrow,
    heroTitle: draft.heroTitle ?? "Trouvez le véhicule qui vous ressemble.",
    heroDescription:
      draft.heroDescription ??
      "Réservez simplement auprès d’une agence locale disponible.",
    visibleSections,
    sectionOrder,
    logoUrl: settings?.logoUrl ?? null,
    logoPublicId: settings?.logoPublicId ?? null,
    faviconUrl: settings?.faviconUrl ?? null,
    faviconPublicId: settings?.faviconPublicId ?? null,
    coverUrl: settings?.coverUrl ?? null,
    coverPublicId: settings?.coverPublicId ?? null,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site & thème</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les changements restent en brouillon jusqu’à leur publication.
          </p>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Brouillon v{draft.version}
        </p>
      </div>
      <ThemeEditor
        initialData={initialData}
        agency={{
          name: tenant.agency.name,
          description: tenant.agency.description,
          currency: settings?.currency ?? "EUR",
        }}
        vehicles={vehicles.map((vehicle) => ({
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          dailyPrice: Number(vehicle.dailyPrice),
          imageUrl: vehicle.images[0]?.url,
        }))}
      />
    </div>
  );
}
