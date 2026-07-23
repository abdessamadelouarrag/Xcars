"use client";

import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AcceptInvitation({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/team/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const payload = (await response.json()) as { error?: { message: string } };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error?.message ?? "Invitation non acceptée.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <Button onClick={accept} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <Check />}
        Accepter l’invitation
      </Button>
    </div>
  );
}
