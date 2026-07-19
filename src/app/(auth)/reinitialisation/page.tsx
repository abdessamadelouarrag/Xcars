import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Nouveau mot de passe | XCars",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const email = typeof query.email === "string" ? query.email : "";
  const token = typeof query.token === "string" ? query.token : "";

  return (
    <AuthShell
      title="Choisissez un nouveau mot de passe"
      description="Utilisez une phrase unique que vous n’employez sur aucun autre service."
    >
      {email && token ? (
        <ResetPasswordForm email={email} token={token} />
      ) : (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Ce lien de réinitialisation est incomplet.
        </p>
      )}
    </AuthShell>
  );
}
