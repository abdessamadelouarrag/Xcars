"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z
  .object({
    startsAt: z.string().min(1, "Choisissez une date."),
    endsAt: z.string().min(1, "Choisissez une date."),
    pickupLocation: z.string().trim().min(2),
    returnLocation: z.string().trim().min(2),
    quantity: z.number().int().min(1).max(20),
    customerName: z.string().trim().min(2),
    customerEmail: z.string().email(),
    customerPhone: z.string().trim().min(6),
    message: z.string().trim().max(2_000),
    acceptedTerms: z
      .boolean()
      .refine((value) => value, "Vous devez accepter les conditions."),
  })
  .refine((data) => !data.startsAt || !data.endsAt || data.endsAt > data.startsAt, {
    message: "La date de retour doit suivre la date de départ.",
    path: ["endsAt"],
  });

type Values = z.infer<typeof formSchema>;

export function ReservationForm({
  agencySlug,
  vehicleId,
  defaultLocation,
  defaultStartsAt = "",
  defaultEndsAt = "",
}: {
  agencySlug: string;
  vehicleId: string;
  defaultLocation?: string;
  defaultStartsAt?: string;
  defaultEndsAt?: string;
}) {
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const form = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startsAt: defaultStartsAt,
      endsAt: defaultEndsAt,
      pickupLocation: defaultLocation ?? "",
      returnLocation: defaultLocation ?? "",
      quantity: 1,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      message: "",
      acceptedTerms: false,
    },
  });

  async function onSubmit(values: Values) {
    setError("");
    const response = await fetch(
      `/api/public/agencies/${agencySlug}/reservations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          vehicleId,
          startsAt: new Date(`${values.startsAt}T10:00:00.000Z`),
          endsAt: new Date(`${values.endsAt}T10:00:00.000Z`),
          message: values.message || null,
          idempotencyKey,
        }),
      },
    );
    const payload = (await response.json()) as {
      data?: { reference: string };
      error?: { message: string };
    };
    if (!response.ok || !payload.data) {
      setError(payload.error?.message ?? "Votre demande n’a pas pu être envoyée.");
      return;
    }
    setReference(payload.data.reference);
  }

  if (reference) {
    return (
      <div className="rounded-[var(--agency-radius)] border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
        <CheckCircle2 className="size-8 text-emerald-600" />
        <h3 className="font-agency-heading mt-4 text-xl font-bold">
          Demande envoyée
        </h3>
        <p className="mt-2 text-sm leading-6">
          L’agence va vérifier votre demande. Votre référence est{" "}
          <strong>{reference}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date de départ" error={form.formState.errors.startsAt?.message}>
          <Input type="date" min={new Date().toISOString().slice(0, 10)} {...form.register("startsAt")} />
        </Field>
        <Field label="Date de retour" error={form.formState.errors.endsAt?.message}>
          <Input type="date" min={new Date().toISOString().slice(0, 10)} {...form.register("endsAt")} />
        </Field>
        <Field label="Lieu de départ" error={form.formState.errors.pickupLocation?.message}>
          <Input {...form.register("pickupLocation")} />
        </Field>
        <Field label="Lieu de retour" error={form.formState.errors.returnLocation?.message}>
          <Input {...form.register("returnLocation")} />
        </Field>
        <Field label="Nom complet" error={form.formState.errors.customerName?.message}>
          <Input autoComplete="name" {...form.register("customerName")} />
        </Field>
        <Field label="E-mail" error={form.formState.errors.customerEmail?.message}>
          <Input type="email" autoComplete="email" {...form.register("customerEmail")} />
        </Field>
        <Field label="Téléphone" error={form.formState.errors.customerPhone?.message}>
          <Input type="tel" autoComplete="tel" {...form.register("customerPhone")} />
        </Field>
        <Field label="Quantité" error={form.formState.errors.quantity?.message}>
          <Input
            type="number"
            min={1}
            max={20}
            {...form.register("quantity", { valueAsNumber: true })}
          />
        </Field>
      </div>
      <Field label="Message (facultatif)">
        <Textarea {...form.register("message")} />
      </Field>
      <label className="flex items-start gap-3 text-xs leading-5 opacity-70">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-[var(--agency-primary)]"
          {...form.register("acceptedTerms")}
        />
        <span>
          J’accepte les{" "}
          <Link className="font-bold underline" href={`/agence/${agencySlug}/conditions`}>
            conditions de location
          </Link>
          .
        </span>
      </label>
      {form.formState.errors.acceptedTerms ? (
        <p className="text-xs text-red-600">{form.formState.errors.acceptedTerms.message}</p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="w-full rounded-[var(--agency-radius)] bg-[var(--agency-primary)] hover:opacity-90"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
        Envoyer ma demande
      </Button>
      <p className="text-center text-[11px] opacity-50">
        Aucun paiement n’est demandé à cette étape. La disponibilité est vérifiée à l’envoi.
      </p>
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
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
