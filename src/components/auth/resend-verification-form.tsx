"use client";

import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VerificationResponse = {
  data?: {
    message: string;
    developmentVerificationUrl?: string;
  };
  error?: { message: string };
};

export function ResendVerificationForm({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<VerificationResponse["data"]>();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(undefined);
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = (await response.json()) as VerificationResponse;
    setLoading(false);
    if (!response.ok) {
      setError(payload.error?.message ?? "Le lien n’a pas pu être préparé.");
      return;
    }
    setResult(payload.data);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
          <div className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <p className="text-sm">{result.message}</p>
          </div>
          {result.developmentVerificationUrl ? (
            <a
              href={result.developmentVerificationUrl}
              className="mt-3 inline-flex text-sm font-semibold underline"
            >
              Vérifier mon adresse en local
            </a>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="verification-email">Adresse e-mail</Label>
        <Input
          id="verification-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <MailCheck />
        )}
        Renvoyer le lien de vérification
      </Button>
    </form>
  );
}
