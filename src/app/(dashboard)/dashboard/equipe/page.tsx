import { Crown, UserRound } from "lucide-react";
import { InviteForm } from "@/components/team/invite-form";
import { MemberPermissionsEditor } from "@/components/team/member-permissions-editor";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireTenantPermission } from "@/lib/auth/tenant";
import { hasPermission, isPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const metadata = { title: "Équipe" };

export default async function TeamPage() {
  const tenant = await requireTenantPermission("members:read");
  const grantedPermissions = Array.isArray(tenant.membership?.permissions)
    ? tenant.membership.permissions.filter(isPermission)
    : [];
  const canManageMembers = hasPermission({
    platformRole: tenant.user.role,
    agencyRole: tenant.membership?.role,
    grantedPermissions,
    permission: "members:manage",
  });
  const [members, invitations] = await Promise.all([
    db.agencyMember.findMany({
      where: { agencyId: tenant.agency.id, isActive: true },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    db.agencyInvitation.findMany({
      where: { agencyId: tenant.agency.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Équipe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Donnez à votre staff uniquement les accès nécessaires.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader><CardTitle>Membres actifs</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  {member.role === "OWNER" ? <Crown className="size-4 text-amber-600" /> : <UserRound className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{member.user.name ?? member.user.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                </div>
                <Badge variant={member.role === "OWNER" ? "warning" : "secondary"}>
                  {member.role === "OWNER" ? "Propriétaire" : "Staff"}
                </Badge>
                {member.role === "STAFF" && canManageMembers ? (
                  <MemberPermissionsEditor
                    memberId={member.id}
                    memberName={member.user.name ?? member.user.email}
                    initialPermissions={
                      Array.isArray(member.permissions)
                        ? member.permissions.filter(isPermission)
                        : []
                    }
                  />
                ) : null}
              </div>
            ))}
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center gap-3 py-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"><UserRound className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{invitation.email}</p>
                  <p className="text-xs text-muted-foreground">Invitation envoyée</p>
                </div>
                <Badge variant="outline">En attente</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Inviter un membre</CardTitle></CardHeader>
          <CardContent>
            {canManageMembers ? (
              <InviteForm />
            ) : (
              <p className="text-sm text-muted-foreground">
                Vous pouvez consulter l’équipe, mais pas modifier ses accès.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
