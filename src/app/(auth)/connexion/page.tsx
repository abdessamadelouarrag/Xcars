import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Connexion | XCars",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const callbackUrl =
    typeof query.callbackUrl === "string" ? query.callbackUrl : "/dashboard";
  const email = typeof query.email === "string" ? query.email : "";
  const error =
    query.error === "verification-expired"
      ? "Ce lien de vérification est invalide ou a expiré."
      : query.error === "verification-invalid"
        ? "Le lien de vérification est incomplet."
        : undefined;

  return (
    <AuthShell
      title="Heureux de vous revoir"
      description="Connectez-vous pour gérer votre flotte, vos demandes et votre site."
    >
      <LoginForm
        callbackUrl={callbackUrl}
        verified={query.verified === "true"}
        invited={query.invited === "true"}
        initialEmail={email}
        initialError={error}
      />
    </AuthShell>
  );
}
