import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/auth/tenant";
import { isPermission } from "@/lib/auth/permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getTenantContext();
  if (context.agency.onboardingStep < 4) {
    redirect("/onboarding");
  }
  const grantedPermissions = Array.isArray(context.membership?.permissions)
    ? context.membership.permissions.filter(isPermission)
    : [];

  const notificationWhere = {
    agencyId: context.agency.id,
    OR: [{ userId: null }, { userId: context.user.id }],
  };
  const [unreadNotifications, notifications] = await Promise.all([
    db.notification.count({
      where: { ...notificationWhere, readAt: null },
    }),
    db.notification.findMany({
      where: notificationWhere,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <DashboardShell
      agencyName={context.agency.name}
      agencySlug={context.agency.slug}
      userName={context.user.name}
      userEmail={context.user.email}
      unreadNotifications={unreadNotifications}
      platformRole={context.user.role}
      agencyRole={context.membership?.role ?? null}
      grantedPermissions={grantedPermissions}
      notifications={notifications.map((notification) => ({
        ...notification,
        readAt: notification.readAt?.toISOString() ?? null,
        createdAt: notification.createdAt.toISOString(),
      }))}
    >
      {children}
    </DashboardShell>
  );
}
