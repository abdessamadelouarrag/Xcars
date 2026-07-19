"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { agencySettingsSchema } from "@/lib/validation/agency";

type Values = z.input<typeof agencySettingsSchema>;

export function AgencySettingsForm({ initialData }: { initialData: Values }) {
  const form = useForm<Values>({
    resolver: zodResolver(agencySettingsSchema),
    defaultValues: initialData,
  });

  async function onSubmit(values: Values) {
    const response = await fetch("/api/agency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { error?: { message: string } };
    if (!response.ok) {
      toast.error(payload.error?.message ?? "Enregistrement impossible.");
      return;
    }
    toast.success("Paramètres enregistrés");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Informations de l’agence</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Nom" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </Field>
          <Field label="Slug public" error={form.formState.errors.slug?.message}>
            <Input {...form.register("slug")} />
          </Field>
          <Field label="Adresse">
            <Input {...form.register("address")} />
          </Field>
          <Field label="Ville">
            <Input {...form.register("city")} />
          </Field>
          <Field label="Pays">
            <Input {...form.register("country")} />
          </Field>
          <Field label="Téléphone">
            <Input type="tel" {...form.register("phone")} />
          </Field>
          <Field label="E-mail de contact" error={form.formState.errors.contactEmail?.message}>
            <Input type="email" {...form.register("contactEmail")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea {...form.register("description")} />
            </Field>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Langue, devise et fuseau horaire</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <Field label="Langue publique">
            <select className="form-select" {...form.register("locale")}>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية (RTL)</option>
            </select>
          </Field>
          <Field label="Devise (ISO)">
            <Input maxLength={3} {...form.register("currency")} />
          </Field>
          <Field label="Fuseau horaire">
            <Input {...form.register("timezone")} />
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Référencement</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Field label="Titre SEO" error={form.formState.errors.seoTitle?.message}>
            <Input {...form.register("seoTitle")} />
          </Field>
          <Field label="Description SEO" error={form.formState.errors.seoDescription?.message}>
            <Textarea {...form.register("seoDescription")} />
          </Field>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
          Enregistrer
        </Button>
      </div>
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
  return <label className="space-y-2"><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</label>;
}
