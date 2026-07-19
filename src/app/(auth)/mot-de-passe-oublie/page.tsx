import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Mot de passe oublié | XCars",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Retrouvez votre accès"
      description="Nous vous enverrons un lien sécurisé valable pendant 30 minutes."
    >
      <ForgotPasswordForm />
      <Link
        href="/connexion"
        className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour à la connexion
      </Link>
    </AuthShell>
  );
}
