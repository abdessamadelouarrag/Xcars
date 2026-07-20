"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertTriangle />
      </span>
      <h1 className="mt-5 text-xl font-bold">Impossible de charger cet espace</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Vérifiez vos autorisations ou la connexion au service, puis réessayez.
      </p>
      <Button className="mt-6" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
