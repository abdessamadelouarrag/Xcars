import { AgencySettingsForm } from "@/components/settings/agency-settings-form";
import { EmailDeliveryCard } from "@/components/settings/email-delivery-card";
import { hasPermission, isPermission } from "@/lib/auth/permissions";
import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { getEmailTransportStatus } from "@/lib/email/send";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const tenant = await requireTenantPermission("agency:read");
  const grantedPermissions = Array.isArray(tenant.membership?.permissions)
    ? tenant.membership.permissions.filter(isPermission)
    : [];
  const canTestEmail = hasPermission({
    platformRole: tenant.user.role,
    agencyRole: tenant.membership?.role,
    grantedPermissions,
    permission: "agency:update",
  });
  const emailTransport = getEmailTransportStatus();
  const settings = await db.agencySettings.findUnique({
    where: { agencyId: tenant.agency.id },
  });
  const openingHours =
    settings?.openingHours &&
    typeof settings.openingHours === "object" &&
    !Array.isArray(settings.openingHours)
      ? (settings.openingHours as Record<string, string>)
      : {};

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Coordonnées, langue, devise et métadonnées de votre site.
        </p>
      </div>
      <AgencySettingsForm
        initialData={{
          name: tenant.agency.name,
          slug: tenant.agency.slug,
          description: tenant.agency.description ?? "",
          address: settings?.address ?? "",
          city: settings?.city ?? "",
          country: settings?.country ?? "",
          phone: settings?.phone ?? "",
          contactEmail: settings?.contactEmail ?? tenant.user.email,
          openingHours,
          locale: (settings?.locale === "en" || settings?.locale === "ar" ? settings.locale : "fr"),
          currency: settings?.currency ?? "EUR",
          timezone: settings?.timezone ?? "Africa/Casablanca",
          seoTitle: settings?.seoTitle ?? "",
          seoDescription: settings?.seoDescription ?? "",
        }}
      />
      <EmailDeliveryCard
        configured={emailTransport.configured}
        transport={emailTransport.transport}
        recipient={tenant.user.email}
        canTest={canTestEmail}
      />
    </div>
  );
}
