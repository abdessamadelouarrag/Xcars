"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { credentialsSchema } from "@/lib/validation/auth";

type LoginValues = z.infer<typeof credentialsSchema>;

export function LoginForm({
  callbackUrl = "/dashboard",
  verified,
  invited,
  initialEmail = "",
  initialError,
}: {
  callbackUrl?: string;
  verified?: boolean;
  invited?: boolean;
  initialEmail?: string;
  initialError?: string;
}) {
  const [error, setError] = useState(initialError ?? "");
  const form = useForm<LoginValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: initialEmail, password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setError("");
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
      redirectTo: callbackUrl,
    });
    if (result?.error) {
      setError(
        "Identifiants incorrects ou adresse e-mail non vérifiée.",
      );
      return;
    }
    window.location.assign(result?.url ?? callbackUrl);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {verified ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          Adresse vérifiée. Vous pouvez maintenant vous connecter.
        </div>
      ) : null}
      {invited ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          Votre compte Staff est prêt. Connectez-vous pour rejoindre l’agence.
        </div>
      ) : null}
      {error ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="vous@agence.com"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
          <Link
            href="/mot-de-passe-oublie"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register("password")}
        />
      </div>
      <div className="-mt-2 text-right">
        <Link
          href={`/verification-email${form.watch("email") ? `?email=${encodeURIComponent(form.watch("email"))}` : ""}`}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Renvoyer l’e-mail de vérification
        </Link>
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : null}
        Se connecter
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-primary hover:underline">
          Créer mon agence
        </Link>
      </p>
    </form>
  );
}
