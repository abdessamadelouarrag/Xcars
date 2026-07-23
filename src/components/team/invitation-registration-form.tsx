"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invitationRegistrationSchema } from "@/lib/validation/team";

type InvitationRegistrationValues = z.infer<
  typeof invitationRegistrationSchema
>;

export function InvitationRegistrationForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<InvitationRegistrationValues>({
    resolver: zodResolver(invitationRegistrationSchema),
    defaultValues: { token, name: "", password: "" },
  });

  async function submit(values: InvitationRegistrationValues) {
    setError("");
    const response = await fetch("/api/team/invitations/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as {
      data?: { email: string };
      error?: { message: string };
    };
    if (!response.ok) {
      setError(payload.error?.message ?? "Le compte n’a pas pu être créé.");
      return;
    }

    const loginEmail = payload.data?.email ?? email;
    router.push(
      `/connexion?invited=true&email=${encodeURIComponent(loginEmail)}`,
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className="mt-6 space-y-4 text-left"
    >
      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="invitation-email">Adresse e-mail</Label>
        <Input id="invitation-email" value={email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invitation-name">Votre nom</Label>
        <Input
          id="invitation-name"
          autoComplete="name"
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="invitation-password">Créer un mot de passe</Label>
        <Input
          id="invitation-password"
          type="password"
          autoComplete="new-password"
          {...form.register("password")}
        />
        <p className="text-xs text-muted-foreground">
          10 caractères, avec majuscule, minuscule et chiffre.
        </p>
        {form.formState.errors.password ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Check />
        )}
        Créer mon compte et rejoindre l’équipe
      </Button>
    </form>
  );
}
