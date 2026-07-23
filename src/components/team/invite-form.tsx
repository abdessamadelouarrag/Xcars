"use client";

import { CheckCircle2, Copy, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { permissionOptions } from "@/lib/auth/permission-options";
import type { Permission } from "@/lib/auth/permissions";

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<Permission[]>([
    "vehicles:read",
    "vehicles:update",
    "reservations:read",
    "reservations:update",
  ]);
  const [loading, setLoading] = useState(false);
  const [localInvitationUrl, setLocalInvitationUrl] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/team/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, permissions: selected }),
    });
    const payload = (await response.json()) as {
      data?: {
        developmentInvitationUrl?: string;
        emailDelivered?: boolean;
      };
      error?: { message: string };
    };
    setLoading(false);
    if (!response.ok) {
      toast.error(payload.error?.message ?? "Invitation non envoyée.");
      return;
    }
    setLocalInvitationUrl(payload.data?.developmentInvitationUrl ?? "");
    toast.success(
      payload.data?.emailDelivered
        ? "Invitation envoyée par e-mail"
        : "Invitation créée",
    );
    setEmail("");
    router.refresh();
  }

  async function copyLocalLink() {
    await navigator.clipboard.writeText(localInvitationUrl);
    toast.success("Lien d’invitation copié");
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="space-y-2">
        <Label>Adresse e-mail</Label>
        <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold">Permissions</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {permissionOptions.map((permission) => (
            <label key={permission.value} className="flex items-center gap-2 rounded-xl border border-border p-3 text-xs">
              <input
                type="checkbox"
                checked={selected.includes(permission.value)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, permission.value]
                      : current.filter((item) => item !== permission.value),
                  )
                }
                className="accent-primary"
              />
              {permission.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <Send />}
        Envoyer l’invitation
      </Button>
      {localInvitationUrl ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Invitation prête en local</p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                Copiez ce lien et envoyez-le au membre de votre équipe.
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={localInvitationUrl}
              readOnly
              aria-label="Lien d’invitation local"
              className="bg-white text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyLocalLink}
              aria-label="Copier le lien d’invitation"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
