import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export const metadata = {
  title: "Vérification e-mail | XCars",
};

export default async function VerificationEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const email = typeof query.email === "string" ? query.email : "";

  return (
    <AuthShell
      title="Vérifiez votre adresse"
      description="Recevez un nouveau lien sécurisé valable pendant 24 heures."
    >
      <ResendVerificationForm initialEmail={email} />
      <p className="mt-5 text-center text-sm text-muted-foreground">
        <Link
          href="/connexion"
          className="font-semibold text-primary hover:underline"
        >
          Retour à la connexion
        </Link>
      </p>
    </AuthShell>
  );
}
