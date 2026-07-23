import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { AcceptInvitation } from "@/components/team/accept-invitation";
import { InvitationRegistrationForm } from "@/components/team/invitation-registration-form";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/security/tokens";

export const metadata = { title: "Invitation" };

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : "";
  if (token.length !== 64) notFound();
  const invitation = await db.agencyInvitation.findFirst({
    where: {
      tokenHash: hashToken(token),
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: { agency: { select: { name: true } } },
  });
  if (!invitation) notFound();
  const user = await getSessionUser();
  const invitedUser = await db.user.findUnique({
    where: { email: invitation.email },
    select: { id: true },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/45 px-5">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Users />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Rejoindre {invitation.agency.name}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Cette invitation donne un accès staff avec des permissions limitées.
        </p>
        <div className="mt-6">
          {user ? (
            <AcceptInvitation token={token} />
          ) : !invitedUser ? (
            <InvitationRegistrationForm
              token={token}
              email={invitation.email}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Un compte existe déjà pour {invitation.email}.
              </p>
              <Link
                href={`/connexion?email=${encodeURIComponent(invitation.email)}&callbackUrl=${encodeURIComponent(`/invitation?token=${token}`)}`}
                className={buttonVariants()}
              >
                Se connecter pour accepter
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
