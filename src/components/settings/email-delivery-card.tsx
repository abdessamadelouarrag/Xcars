"use client";

import { CheckCircle2, Loader2, MailCheck, ServerCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmailDeliveryCard({
  configured,
  transport,
  recipient,
  canTest,
}: {
  configured: boolean;
  transport: "smtp" | "resend" | "development";
  recipient: string;
  canTest: boolean;
}) {
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);

  async function testDelivery() {
    setTesting(true);
    setTested(false);
    const response = await fetch("/api/email/test", { method: "POST" });
    const payload = (await response.json()) as {
      error?: { message: string };
    };
    setTesting(false);
    if (!response.ok) {
      toast.error(payload.error?.message ?? "Test SMTP impossible.");
      return;
    }
    setTested(true);
    toast.success(`E-mail de test envoyé à ${recipient}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ServerCog className="size-5 text-primary" />
          Service e-mail global
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span
              className={`size-2 rounded-full ${
                configured ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {configured
              ? `Transport ${transport.toUpperCase()} configuré`
              : "Transport e-mail non configuré"}
          </div>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            Un seul expéditeur sert toutes les agences pour les vérifications,
            invitations, réinitialisations et notifications.
          </p>
        </div>
        {canTest ? (
          <Button
            type="button"
            variant={tested ? "outline" : "default"}
            disabled={!configured || testing}
            onClick={testDelivery}
          >
            {testing ? (
              <Loader2 className="animate-spin" />
            ) : tested ? (
              <CheckCircle2 />
            ) : (
              <MailCheck />
            )}
            {tested ? "E-mail envoyé" : "Tester l’envoi"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
