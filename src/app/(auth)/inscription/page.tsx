import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Créer une agence | XCars",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Créez votre agence"
      description="Votre espace de gestion et votre premier site seront prêts en quelques étapes."
    >
      <RegisterForm />
    </AuthShell>
  );
}
