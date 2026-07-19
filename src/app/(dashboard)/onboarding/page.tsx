import { redirect } from "next/navigation";
import { CarFront } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getTenantContext } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { sectionIds } from "@/lib/validation/theme";

export const metadata = { title: "Configuration de votre agence" };

export default async function OnboardingPage() {
  const tenant = await getTenantContext();
  if (tenant.agency.status === "ACTIVE" && tenant.agency.onboardingStep >= 4) {
    redirect("/dashboard");
  }
  const [settings, draft] = await Promise.all([
    db.agencySettings.findUnique({ where: { agencyId: tenant.agency.id } }),
    db.themeConfiguration.findFirst({
      where: { agencyId: tenant.agency.id, status: "DRAFT" },
      orderBy: { version: "desc" },
    }),
  ]);
  if (!draft) redirect("/dashboard");
  const hours =
    settings?.openingHours &&
    typeof settings.openingHours === "object" &&
    !Array.isArray(settings.openingHours)
      ? (settings.openingHours as Record<string, string>)
      : {
          monday: "09:00–18:00",
          tuesday: "09:00–18:00",
          wednesday: "09:00–18:00",
          thursday: "09:00–18:00",
          friday: "09:00–18:00",
          saturday: "09:00–13:00",
          sunday: "Fermé",
        };

  return (
    <main className="min-h-screen bg-muted/45 px-5 py-8 sm:py-12">
      <div className="mx-auto mb-10 flex max-w-5xl items-center gap-2 font-bold">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <CarFront className="size-5" />
        </span>
        XCars
      </div>
      <OnboardingWizard
        initialStep={tenant.agency.onboardingStep}
        initialData={{
          agency: {
            name: tenant.agency.name,
            slug: tenant.agency.slug,
            description: tenant.agency.description ?? "",
            address: settings?.address ?? "",
            city: settings?.city ?? "",
            country: settings?.country ?? "",
            phone: settings?.phone ?? "",
            contactEmail: settings?.contactEmail ?? tenant.user.email,
            openingHours: hours,
          },
          visual: {
            logoUrl: settings?.logoUrl ?? null,
            logoPublicId: settings?.logoPublicId ?? null,
            faviconUrl: settings?.faviconUrl ?? null,
            faviconPublicId: settings?.faviconPublicId ?? null,
            coverUrl: settings?.coverUrl ?? null,
            coverPublicId: settings?.coverPublicId ?? null,
            primaryColor: draft.primaryColor,
            secondaryColor: draft.secondaryColor,
            accentColor: draft.accentColor,
            backgroundColor: draft.backgroundColor,
            textColor: draft.textColor,
            headingFont: draft.headingFont,
            bodyFont: draft.bodyFont,
            radius: draft.radius,
          },
          preset: draft.preset,
        }}
      />
    </main>
  );
}
