"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  phone: z.string().trim().max(30),
  message: z.string().trim().min(10).max(3_000),
});

type Values = z.infer<typeof contactSchema>;

export function PublicContactForm({ agencySlug }: { agencySlug: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<Values>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  async function onSubmit(values: Values) {
    setError("");
    const response = await fetch(`/api/public/agencies/${agencySlug}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { error?: { message: string } };
    if (!response.ok) {
      setError(payload.error?.message ?? "Message non envoyé.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-[var(--agency-radius)] border border-emerald-200 bg-emerald-50 p-8 text-emerald-950">
        <CheckCircle2 className="size-8 text-emerald-600" />
        <h2 className="font-agency-heading mt-4 text-xl font-bold">Message envoyé</h2>
        <p className="mt-2 text-sm">L’équipe de l’agence vous répondra directement.</p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom complet" error={form.formState.errors.name?.message}>
          <Input autoComplete="name" {...form.register("name")} />
        </Field>
        <Field label="Adresse e-mail" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
      </div>
      <Field label="Téléphone (facultatif)" error={form.formState.errors.phone?.message}>
        <Input type="tel" autoComplete="tel" {...form.register("phone")} />
      </Field>
      <Field label="Votre message" error={form.formState.errors.message?.message}>
        <Textarea className="min-h-40" {...form.register("message")} />
      </Field>
      <Button
        type="submit"
        size="lg"
        className="rounded-[var(--agency-radius)] bg-[var(--agency-primary)]"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
        Envoyer le message
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
