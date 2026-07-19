"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";
import { registerSchema } from "@/lib/validation/auth";

type RegisterValues = z.input<typeof registerSchema>;

type RegisterResponse = {
  data?: {
    message: string;
    developmentVerificationUrl?: string;
  };
  error?: { message: string };
};

export function RegisterForm() {
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState<RegisterResponse["data"]>();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      agencyName: "",
      slug: "",
      acceptedTerms: false,
    },
  });
  const agencyName = form.watch("agencyName");

  useEffect(() => {
    if (!form.formState.dirtyFields.slug) {
      form.setValue("slug", slugify(agencyName), { shouldValidate: false });
    }
  }, [agencyName, form]);

  async function onSubmit(values: RegisterValues) {
    setServerError("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as RegisterResponse;
    if (!response.ok) {
      setServerError(
        payload.error?.message ?? "Impossible de créer le compte.",
      );
      return;
    }
    setSuccess(payload.data);
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
        <CheckCircle2 className="size-8 text-emerald-600" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold">Vérifiez votre boîte e-mail</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          {success.message}
        </p>
        {success.developmentVerificationUrl ? (
          <a
            className="mt-4 inline-flex text-sm font-semibold underline"
            href={success.developmentVerificationUrl}
          >
            Lien de vérification local
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {serverError ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {serverError}
        </div>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="name"
          label="Votre nom"
          error={form.formState.errors.name?.message}
        >
          <Input id="name" autoComplete="name" {...form.register("name")} />
        </FormField>
        <FormField
          id="agencyName"
          label="Nom de l’agence"
          error={form.formState.errors.agencyName?.message}
        >
          <Input id="agencyName" {...form.register("agencyName")} />
        </FormField>
      </div>
      <FormField
        id="slug"
        label="Adresse publique"
        hint={`xcars.app/agence/${form.watch("slug") || "mon-agence"}`}
        error={form.formState.errors.slug?.message}
      >
        <Input id="slug" spellCheck={false} {...form.register("slug")} />
      </FormField>
      <FormField
        id="email"
        label="Adresse e-mail"
        error={form.formState.errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...form.register("email")}
        />
      </FormField>
      <FormField
        id="password"
        label="Mot de passe"
        hint="10 caractères, avec majuscule, minuscule et chiffre."
        error={form.formState.errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...form.register("password")}
        />
      </FormField>
      <label className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-input accent-primary"
          {...form.register("acceptedTerms")}
        />
        <span>
          J’accepte les{" "}
          <Link href="/conditions" className="font-medium text-foreground underline">
            conditions d’utilisation
          </Link>{" "}
          et la politique de confidentialité.
        </span>
      </label>
      {form.formState.errors.acceptedTerms ? (
        <p className="text-xs text-destructive">
          {form.formState.errors.acceptedTerms.message}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : null}
        Créer mon espace
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
