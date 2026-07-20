"use client";

import { useRouter } from "next/navigation";
import { Archive, Copy, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function VehicleActions({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function mutate(action: "duplicate" | "archive" | "delete") {
    if (
      action === "delete" &&
      !window.confirm(
        "Supprimer définitivement ce véhicule ? Cette action est irréversible.",
      )
    ) {
      return;
    }
    if (
      action === "archive" &&
      !window.confirm("Archiver ce véhicule et le retirer du site public ?")
    ) {
      return;
    }
    setLoading(action);
    const endpoint =
      action === "delete"
        ? `/api/vehicles/${vehicleId}`
        : `/api/vehicles/${vehicleId}/${action}`;
    const response = await fetch(endpoint, {
      method: action === "delete" ? "DELETE" : "POST",
    });
    const payload = (await response.json()) as {
      error?: { message: string };
    };
    setLoading(null);
    if (!response.ok) {
      toast.error(payload.error?.message ?? "Action impossible.");
      return;
    }
    toast.success(
      action === "duplicate"
        ? "Copie créée"
        : action === "archive"
          ? "Véhicule archivé"
          : "Véhicule supprimé",
    );
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => mutate("duplicate")}
        aria-label="Dupliquer"
        disabled={Boolean(loading)}
      >
        {loading === "duplicate" ? <Loader2 className="animate-spin" /> : <Copy />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => mutate("archive")}
        aria-label="Archiver"
        disabled={Boolean(loading)}
      >
        {loading === "archive" ? <Loader2 className="animate-spin" /> : <Archive />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => mutate("delete")}
        aria-label="Supprimer"
        disabled={Boolean(loading)}
      >
        {loading === "delete" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Trash2 className="text-destructive" />
        )}
      </Button>
    </div>
  );
}
