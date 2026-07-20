"use client";

import Image from "next/image";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Eye,
  GripVertical,
  ImagePlus,
  Laptop,
  Loader2,
  Monitor,
  Save,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency } from "@/lib/utils";
import {
  sectionIds,
  themeUpdateSchema,
  type ThemeUpdateInput,
} from "@/lib/validation/theme";

type PreviewVehicle = {
  id: string;
  brand: string;
  model: string;
  dailyPrice: number;
  imageUrl?: string;
};

type ThemeEditorProps = {
  initialData: ThemeUpdateInput;
  agency: {
    name: string;
    description?: string | null;
    currency: string;
  };
  vehicles: PreviewVehicle[];
};

const presetLabels = {
  ELEGANT: "Élégant & premium",
  MINIMAL: "Moderne & minimal",
  SPORT: "Sportif & dynamique",
  LUXURY: "Sombre & luxueux",
};

const sectionLabels: Record<(typeof sectionIds)[number], string> = {
  search: "Recherche",
  featured: "Véhicules en vedette",
  categories: "Catégories",
  benefits: "Avantages",
  testimonials: "Témoignages",
  cta: "Appel à l’action",
  contact: "Contact & horaires",
};

export function ThemeEditor({ initialData, agency, vehicles }: ThemeEditorProps) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileTarget, setFileTarget] = useState<"logo" | "favicon" | "cover">("logo");
  const [data, setData] = useState(initialData);
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function update<K extends keyof ThemeUpdateInput>(
    key: K,
    value: ThemeUpdateInput[K],
  ) {
    setData((current) => ({ ...current, [key]: value }));
  }

  async function saveDraft(showToast = true) {
    const parsed = themeUpdateSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Réglages invalides.");
      return false;
    }
    setSaving(true);
    const response = await fetch("/api/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const payload = (await response.json()) as { error?: { message: string } };
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error?.message ?? "Brouillon non enregistré.");
      return false;
    }
    if (showToast) toast.success("Brouillon enregistré");
    return true;
  }

  async function publish() {
    const saved = await saveDraft(false);
    if (!saved) return;
    setPublishing(true);
    const response = await fetch("/api/theme/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: data.id }),
    });
    const payload = (await response.json()) as { error?: { message: string } };
    setPublishing(false);
    if (!response.ok) {
      toast.error(payload.error?.message ?? "Publication impossible.");
      return;
    }
    toast.success("Votre site est publié");
    router.refresh();
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    body.append("scope", "theme");
    const response = await fetch("/api/uploads", { method: "POST", body });
    const payload = (await response.json()) as {
      data?: { url: string; publicId: string };
      error?: { message: string };
    };
    if (!response.ok || !payload.data) {
      toast.error(payload.error?.message ?? "Téléversement impossible.");
      return;
    }
    if (fileTarget === "logo") {
      setData((current) => ({
        ...current,
        logoUrl: payload.data!.url,
        logoPublicId: payload.data!.publicId,
      }));
    } else if (fileTarget === "favicon") {
      setData((current) => ({
        ...current,
        faviconUrl: payload.data!.url,
        faviconPublicId: payload.data!.publicId,
      }));
    } else {
      setData((current) => ({
        ...current,
        coverUrl: payload.data!.url,
        coverPublicId: payload.data!.publicId,
      }));
    }
    toast.success("Image prête dans le brouillon");
  }

  function openFile(target: typeof fileTarget) {
    setFileTarget(target);
    fileInput.current?.click();
  }

  function handleSectionDrag(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.sectionOrder.indexOf(active.id as (typeof sectionIds)[number]);
    const newIndex = data.sectionOrder.indexOf(over.id as (typeof sectionIds)[number]);
    update("sectionOrder", arrayMove(data.sectionOrder, oldIndex, newIndex));
  }

  return (
    <div className="grid min-h-[calc(100vh-9rem)] gap-5 xl:grid-cols-[380px_1fr]">
      <aside className="space-y-6 rounded-2xl border border-border bg-card p-5 xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto">
        <input
          ref={fileInput}
          type="file"
          hidden
          accept="image/*"
          onChange={(event) => upload(event.target.files?.[0])}
        />
        <EditorGroup title="Thème">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(presetLabels) as Array<keyof typeof presetLabels>).map(
              (preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => update("preset", preset)}
                  className={cn(
                    "rounded-xl border p-3 text-left text-xs font-semibold transition",
                    data.preset === preset
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {presetLabels[preset]}
                </button>
              ),
            )}
          </div>
        </EditorGroup>

        <EditorGroup title="Identité visuelle">
          <div className="grid grid-cols-3 gap-2">
            {(["logo", "favicon", "cover"] as const).map((target) => (
              <button
                key={target}
                type="button"
                onClick={() => openFile(target)}
                className="flex min-h-20 flex-col items-center justify-center rounded-xl border border-dashed border-input bg-muted/25 p-2 text-[11px] font-semibold hover:border-primary"
              >
                <ImagePlus className="mb-1.5 size-4 text-primary" />
                {target === "logo" ? "Logo" : target === "favicon" ? "Favicon" : "Couverture"}
              </button>
            ))}
          </div>
        </EditorGroup>

        <EditorGroup title="Couleurs">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["primaryColor", "Principale"],
                ["secondaryColor", "Secondaire"],
                ["accentColor", "Accent"],
                ["backgroundColor", "Fond"],
                ["textColor", "Texte"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-xs font-medium">
                {label}
                <span className="mt-1.5 flex h-10 items-center gap-2 rounded-xl border border-border px-2">
                  <input
                    type="color"
                    value={data[key]}
                    onChange={(event) => update(key, event.target.value)}
                    className="size-6 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {data[key]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </EditorGroup>

        <EditorGroup title="Typographie & formes">
          <Field label="Police des titres">
            <select
              className="form-select"
              value={data.headingFont}
              onChange={(event) =>
                update("headingFont", event.target.value as ThemeUpdateInput["headingFont"])
              }
            >
              {["Manrope", "Inter", "Playfair Display", "Montserrat"].map((font) => (
                <option key={font}>{font}</option>
              ))}
            </select>
          </Field>
          <Field label="Police du contenu">
            <select
              className="form-select"
              value={data.bodyFont}
              onChange={(event) =>
                update("bodyFont", event.target.value as ThemeUpdateInput["bodyFont"])
              }
            >
              {["Inter", "Manrope", "Roboto", "Lato"].map((font) => (
                <option key={font}>{font}</option>
              ))}
            </select>
          </Field>
          <Field label="Arrondi">
            <select
              className="form-select"
              value={data.radius}
              onChange={(event) => update("radius", event.target.value as ThemeUpdateInput["radius"])}
            >
              <option value="SMALL">Faible</option>
              <option value="MEDIUM">Moyen</option>
              <option value="LARGE">Élevé</option>
            </select>
          </Field>
          <Field label="Style des cartes">
            <select
              className="form-select"
              value={data.cardStyle}
              onChange={(event) => update("cardStyle", event.target.value as ThemeUpdateInput["cardStyle"])}
            >
              <option value="elevated">Avec ombre</option>
              <option value="outlined">Avec bordure</option>
              <option value="flat">À plat</option>
            </select>
          </Field>
        </EditorGroup>

        <EditorGroup title="Texte d’accueil">
          <Field label="Sur-titre">
            <Input
              value={data.heroEyebrow ?? ""}
              onChange={(event) => update("heroEyebrow", event.target.value)}
            />
          </Field>
          <Field label="Titre principal">
            <Input
              value={data.heroTitle}
              onChange={(event) => update("heroTitle", event.target.value)}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={data.heroDescription}
              onChange={(event) => update("heroDescription", event.target.value)}
              className="min-h-24 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary"
            />
          </Field>
        </EditorGroup>

        <EditorGroup title="Sections et ordre">
          <DndContext
            id="theme-sections-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSectionDrag}
          >
            <SortableContext items={data.sectionOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {data.sectionOrder.map((section) => (
                  <SortableSection
                    key={section}
                    id={section}
                    label={sectionLabels[section]}
                    visible={data.visibleSections[section] ?? false}
                    onVisibleChange={(visible) =>
                      update("visibleSections", {
                        ...data.visibleSections,
                        [section]: visible,
                      })
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </EditorGroup>

        <div className="sticky bottom-0 grid grid-cols-2 gap-2 bg-card pt-2">
          <Button variant="outline" onClick={() => saveDraft()} disabled={saving || publishing}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Brouillon
          </Button>
          <Button onClick={publish} disabled={saving || publishing}>
            {publishing ? <Loader2 className="animate-spin" /> : <Eye />}
            Publier
          </Button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-[#dde4e2] dark:bg-[#07100e]">
        <div className="flex h-14 items-center justify-between border-b border-black/10 bg-white px-4 text-slate-900">
          <span className="text-sm font-semibold">Aperçu en direct</span>
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(
              [
                ["mobile", Smartphone],
                ["tablet", Tablet],
                ["desktop", Monitor],
              ] as const
            ).map(([value, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDevice(value)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg",
                  device === value ? "bg-white text-teal-700 shadow-sm" : "text-slate-500",
                )}
                aria-label={`Aperçu ${value}`}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-1 justify-center overflow-auto p-4 lg:p-7">
          <div
            className={cn(
              "h-fit min-h-full overflow-hidden bg-white shadow-2xl transition-[width] duration-300",
              device === "mobile"
                ? "w-[375px]"
                : device === "tablet"
                  ? "w-[768px]"
                  : "w-full max-w-[1280px]",
            )}
          >
            <ThemePreview data={data} agency={agency} vehicles={vehicles} device={device} />
          </div>
        </div>
      </section>
    </div>
  );
}

function ThemePreview({
  data,
  agency,
  vehicles,
  device,
}: Pick<ThemeEditorProps, "agency" | "vehicles"> & {
  data: ThemeUpdateInput;
  device: string;
}) {
  const radius = data.radius === "SMALL" ? "6px" : data.radius === "LARGE" ? "24px" : "14px";
  const isCompact = device === "mobile";
  return (
    <div
      style={{
        background: data.backgroundColor,
        color: data.textColor,
        fontFamily: data.bodyFont,
        minHeight: 700,
      }}
    >
      <header className="flex items-center justify-between px-[5%] py-4">
        <div className="flex items-center gap-2 font-bold">
          {data.logoUrl ? (
            <Image src={data.logoUrl} alt="" width={36} height={36} className="h-9 w-auto object-contain" />
          ) : (
            <span
              className="flex size-8 items-center justify-center text-xs font-black text-white"
              style={{ background: data.primaryColor, borderRadius: radius }}
            >
              {agency.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          {agency.name}
        </div>
        {!isCompact ? (
          <nav className="flex gap-5 text-xs font-semibold">
            <span>Accueil</span><span>Véhicules</span><span>À propos</span><span>Contact</span>
          </nav>
        ) : (
          <span className="text-lg">☰</span>
        )}
      </header>
      <section
        className="relative flex min-h-[360px] items-end overflow-hidden px-[6%] py-12 text-white"
        style={{
          background: data.coverUrl
            ? `linear-gradient(90deg, ${data.secondaryColor}ee, ${data.secondaryColor}55), url(${data.coverUrl}) center/cover`
            : `linear-gradient(135deg, ${data.secondaryColor}, ${data.primaryColor})`,
        }}
      >
        <div className="max-w-[620px]">
          <p className="text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: data.accentColor }}>
            {data.heroEyebrow}
          </p>
          <h2
            className={cn("mt-3 font-bold leading-[1.05]", isCompact ? "text-4xl" : "text-6xl")}
            style={{ fontFamily: data.headingFont }}
          >
            {data.heroTitle}
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/75">{data.heroDescription}</p>
          <button
            type="button"
            className="mt-6 px-5 py-3 text-xs font-bold"
            style={{ background: data.primaryColor, borderRadius: radius }}
          >
            Trouver un véhicule
          </button>
        </div>
      </section>
      {data.visibleSections.featured ? (
        <section className="px-[6%] py-12">
          <p className="text-xs font-bold" style={{ color: data.primaryColor }}>Notre sélection</p>
          <h3 className="mt-2 text-2xl font-bold" style={{ fontFamily: data.headingFont }}>Partez avec le bon véhicule.</h3>
          {vehicles.length ? (
            <div className={cn("mt-6 grid gap-4", isCompact ? "grid-cols-1" : "grid-cols-3")}>
              {vehicles.map((vehicle) => (
                <article
                  key={vehicle.id}
                  className="overflow-hidden"
                  style={{
                    borderRadius: radius,
                    border: data.cardStyle === "outlined" ? `1px solid ${data.primaryColor}30` : undefined,
                    boxShadow: data.cardStyle === "elevated" ? "0 12px 30px rgba(0,0,0,.08)" : undefined,
                    background: data.backgroundColor,
                  }}
                >
                  <div className="relative aspect-[16/10]" style={{ background: `${data.primaryColor}18` }}>
                    {vehicle.imageUrl ? (
                      <Image src={vehicle.imageUrl} alt="" fill className="object-cover" sizes="300px" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <p className="font-bold">{vehicle.brand} {vehicle.model}</p>
                    <p className="mt-1 text-xs opacity-60">
                      dès {formatCurrency(vehicle.dailyPrice, agency.currency, "fr-MA")} / jour
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed p-8 text-center text-xs opacity-60">
              Vos véhicules apparaîtront ici.
            </div>
          )}
        </section>
      ) : null}
      <footer className="flex items-center justify-between px-[6%] py-8 text-xs text-white/60" style={{ background: data.secondaryColor }}>
        <span>{agency.name}</span><span>Propulsé par XCars</span>
      </footer>
    </div>
  );
}

function EditorGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function SortableSection({
  id,
  label,
  visible,
  onVisibleChange,
}: {
  id: string;
  label: string;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2 rounded-xl border border-border px-2 py-2"
    >
      <button type="button" className="cursor-grab touch-none text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="size-4" />
      </button>
      <span className="flex-1 text-xs font-medium">{label}</span>
      <button
        type="button"
        onClick={() => onVisibleChange(!visible)}
        className={cn(
          "flex size-6 items-center justify-center rounded-full border",
          visible ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
        aria-label={visible ? `Masquer ${label}` : `Afficher ${label}`}
      >
        {visible ? <Check className="size-3" /> : null}
      </button>
    </div>
  );
}
