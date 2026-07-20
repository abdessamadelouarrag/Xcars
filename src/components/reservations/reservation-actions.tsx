"use client";

import { useRouter } from "next/navigation";
import { Check, Loader2, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReservationActions({
  reservationId,
  currentStatus,
  initialNote,
}: {
  reservationId: string;
  currentStatus: string;
  initialNote?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [note, setNote] = useState(initialNote ?? "");

  async function update(payload: { status?: string; internalNote?: string }) {
    setLoading(payload.status ?? "note");
    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as {
      error?: { message: string };
    };
    setLoading(null);
    if (!response.ok) {
      toast.error(result.error?.message ?? "Mise à jour impossible.");
      return;
    }
    toast.success(payload.status ? "Statut mis à jour" : "Note enregistrée");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {["NEW", "PENDING"].includes(currentStatus) ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => update({ status: "CONFIRMED" })} disabled={Boolean(loading)}>
            {loading === "CONFIRMED" ? <Loader2 className="animate-spin" /> : <Check />}
            Confirmer
          </Button>
          {currentStatus === "NEW" ? (
            <Button
              variant="outline"
              onClick={() => update({ status: "PENDING" })}
              disabled={Boolean(loading)}
            >
              Mettre en attente
            </Button>
          ) : null}
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm("Refuser cette demande ?")) {
                update({ status: "DECLINED" });
              }
            }}
            disabled={Boolean(loading)}
          >
            {loading === "DECLINED" ? <Loader2 className="animate-spin" /> : <X />}
            Refuser
          </Button>
        </div>
      ) : null}
      {currentStatus === "CONFIRMED" ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => update({ status: "COMPLETED" })}>
            <Check /> Marquer terminée
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (window.confirm("Annuler cette réservation confirmée ?")) {
                update({ status: "CANCELLED" });
              }
            }}
          >
            Annuler
          </Button>
        </div>
      ) : null}
      <div>
        <label className="text-sm font-semibold" htmlFor="internal-note">
          Note interne
        </label>
        <Textarea
          id="internal-note"
          className="mt-2"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Visible uniquement par votre équipe…"
        />
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => update({ internalNote: note })}
          disabled={loading === "note"}
        >
          {loading === "note" ? <Loader2 className="animate-spin" /> : <Save />}
          Enregistrer la note
        </Button>
      </div>
    </div>
  );
}
