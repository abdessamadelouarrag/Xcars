"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  ChevronRight,
  ImagePlus,
  Loader2,
  Palette,
  Rocket,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type WizardData = {
  agency: {
    name: string;
    slug: string;
    description: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    contactEmail: string;
    openingHours: Record<string, string>;
  };
  visual: {
    logoUrl: string | null;
    logoPublicId: string | null;
    faviconUrl: string | null;
    faviconPublicId: string | null;
    coverUrl: string | null;
    coverPublicId: string | null;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    headingFont: string;
    bodyFont: string;
    radius: "SMALL" | "MEDIUM" | "LARGE";
  };
  preset: "ELEGANT" | "MINIMAL" | "SPORT" | "LUXURY";
};

const steps = [
  { label: "Agence", icon: Building2 },
  { label: "Identité", icon: Palette },
  { label: "Thème", icon: Check },
  { label: "Véhicule", icon: Rocket },
];

export function OnboardingWizard({
  initialStep,
  initialData,
}: {
  initialStep: number;
  initialData: WizardData;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(Math.min(4, Math.max(1, initialStep)));
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<"logo" | "favicon" | "cover">("logo");

  async function submitStep() {
    setSaving(true);
    const payload =
      step === 1
        ? { step, data: data.agency }
        : step === 2
          ? { step, data: data.visual }
          : step === 3
            ? { step, data: { preset: data.preset } }
            : { step, data: {} };
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: { message: string } };
    setSaving(false);
    if (!response.ok) {
      toast.error(result.error?.message ?? "Enregistrement impossible.");
      return;
    }
    if (step === 4) {
      toast.success("Votre espace est prêt");
      router.push("/dashboard/vehicules/nouveau");
      router.refresh();
      return;
    }
    setStep((current) => current + 1);
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    body.append("scope", "theme");
    const response = await fetch("/api/uploads", { method: "POST", body });
    const result = (await response.json()) as {
      data?: { url: string; publicId: string };
      error?: { message: string };
    };
    if (!response.ok || !result.data) {
      toast.error(result.error?.message ?? "Téléversement impossible.");
      return;
    }
    setData((current) => ({
      ...current,
      visual: {
        ...current.visual,
        [`${uploadTarget}Url`]: result.data!.url,
        [`${uploadTarget}PublicId`]: result.data!.publicId,
      },
    }));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10 grid grid-cols-4 gap-2">
        {steps.map((item, index) => {
          const number = index + 1;
          return (
            <div key={item.label} className="relative text-center">
              <span
                className={cn(
                  "mx-auto flex size-10 items-center justify-center rounded-xl border",
                  number <= step
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                <item.icon className="size-4" />
              </span>
              <p className="mt-2 hidden text-xs font-semibold sm:block">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-900/5 sm:p-9">
        {step === 1 ? (
          <StepOne data={data} setData={setData} />
        ) : step === 2 ? (
          <StepTwo
            data={data}
            setData={setData}
            openUpload={(target) => {
              setUploadTarget(target);
              fileInput.current?.click();
            }}
          />
        ) : step === 3 ? (
          <StepThree data={data} setData={setData} />
        ) : (
          <StepFour />
        )}
        <input
          ref={fileInput}
          type="file"
          hidden
          accept="image/*"
          onChange={(event) => upload(event.target.files?.[0])}
        />
        <div className="mt-8 flex justify-between border-t border-border pt-5">
          <Button
            variant="ghost"
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            disabled={step === 1 || saving}
          >
            Retour
          </Button>
          <Button onClick={submitStep} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            {step === 4 ? "Ajouter mon premier véhicule" : "Continuer"}
            {!saving ? <ChevronRight /> : null}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepOne({
  data,
  setData,
}: {
  data: WizardData;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
}) {
  function update(key: keyof WizardData["agency"], value: string) {
    setData((current) => ({
      ...current,
      agency: { ...current.agency, [key]: value },
    }));
  }
  return (
    <div>
      <StepTitle title="Parlez-nous de votre agence" description="Ces informations seront utilisées dans votre espace et sur votre site." />
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        {[
          ["name", "Nom de l’agence"],
          ["slug", "Adresse publique"],
          ["address", "Adresse"],
          ["city", "Ville"],
          ["country", "Pays"],
          ["phone", "Téléphone"],
          ["contactEmail", "E-mail de contact"],
        ].map(([key, label]) => (
          <label key={key} className="space-y-2">
            <Label>{label}</Label>
            <Input value={String(data.agency[key as keyof typeof data.agency])} onChange={(event) => update(key as keyof WizardData["agency"], event.target.value)} />
          </label>
        ))}
        <label className="space-y-2 sm:col-span-2">
          <Label>Description</Label>
          <Textarea value={data.agency.description} onChange={(event) => update("description", event.target.value)} />
        </label>
      </div>
    </div>
  );
}

function StepTwo({
  data,
  setData,
  openUpload,
}: {
  data: WizardData;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
  openUpload: (target: "logo" | "favicon" | "cover") => void;
}) {
  return (
    <div>
      <StepTitle title="Construisez votre identité" description="Tous ces réglages pourront être modifiés plus tard dans l’éditeur." />
      <div className="mt-7 grid grid-cols-3 gap-3">
        {(["logo", "favicon", "cover"] as const).map((target) => (
          <button key={target} onClick={() => openUpload(target)} className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-input bg-muted/30 text-xs font-semibold">
            <ImagePlus className="mb-2 size-5 text-primary" />
            {target === "logo" ? "Logo" : target === "favicon" ? "Favicon" : "Couverture"}
          </button>
        ))}
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {(
          [
            ["primaryColor", "Principale"],
            ["secondaryColor", "Secondaire"],
            ["accentColor", "Accent"],
            ["backgroundColor", "Fond"],
            ["textColor", "Texte"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-xs font-semibold">
            {label}
            <span className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-border px-2">
              <input
                type="color"
                value={data.visual[key]}
                onChange={(event) =>
                  setData((current) => ({
                    ...current,
                    visual: { ...current.visual, [key]: event.target.value },
                  }))
                }
              />
              <span className="font-mono text-[10px]">{data.visual[key]}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function StepThree({
  data,
  setData,
}: {
  data: WizardData;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
}) {
  const presets = [
    ["MINIMAL", "Moderne & minimal", "Clair, calme et efficace.", "#0F766E"],
    ["ELEGANT", "Élégant & premium", "Chaleureux et éditorial.", "#8A5A44"],
    ["SPORT", "Sportif & dynamique", "Franc, énergique et contrasté.", "#DC2626"],
    ["LUXURY", "Sombre & luxueux", "Noir, or et sophistiqué.", "#D7B56D"],
  ] as const;
  return (
    <div>
      <StepTitle title="Choisissez une direction visuelle" description="Le thème reste entièrement personnalisable." />
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {presets.map(([value, title, description, color]) => (
          <button
            key={value}
            onClick={() => setData((current) => ({ ...current, preset: value }))}
            className={cn(
              "rounded-2xl border p-5 text-left",
              data.preset === value ? "border-primary ring-3 ring-primary/10" : "border-border",
            )}
          >
            <span className="block h-20 rounded-xl" style={{ background: `linear-gradient(135deg, ${color}, #111827)` }} />
            <span className="mt-4 block font-bold">{title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepFour() {
  return (
    <div className="py-8 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Rocket className="size-7" />
      </span>
      <h2 className="mt-5 text-2xl font-bold">Votre site est prêt à prendre la route</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        La dernière étape ouvre le formulaire complet pour ajouter votre premier véhicule. Votre thème sera publié en même temps.
      </p>
    </div>
  );
}

function StepTitle({ title, description }: { title: string; description: string }) {
  return <div><h1 className="text-2xl font-bold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></div>;
}
