"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GripVertical,
  ImagePlus,
  Loader2,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fuelTypes,
  transmissions,
  vehicleFormSchema,
  vehicleStatuses,
} from "@/lib/validation/vehicle";

type FormValues = z.infer<typeof vehicleFormSchema>;

export type VehicleFormInitialData = FormValues & {
  id?: string;
  features: string[];
};

const statusLabels = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  RENTED: "Loué",
  MAINTENANCE: "Maintenance",
  UNAVAILABLE: "Indisponible",
} as const;

const fuelLabels = {
  GASOLINE: "Essence",
  DIESEL: "Diesel",
  HYBRID: "Hybride",
  ELECTRIC: "Électrique",
  LPG: "GPL",
} as const;

const defaultValues: FormValues = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  licensePlate: "",
  category: "Citadine",
  transmission: "MANUAL",
  fuelType: "GASOLINE",
  seats: 5,
  doors: 5,
  mileage: 0,
  color: "",
  dailyPrice: 0,
  weeklyPrice: null,
  deposit: 0,
  description: "",
  rentalConditions: null,
  status: "AVAILABLE",
  totalQuantity: 1,
  location: "",
  availableFrom: null,
  isFeatured: false,
  images: [],
};

export function VehicleForm({
  initialData,
}: {
  initialData?: VehicleFormInitialData;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [features, setFeatures] = useState(initialData?.features ?? []);
  const [featureDraft, setFeatureDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: initialData ?? defaultValues,
  });
  const images = useFieldArray({ control: form.control, name: "images" });
  const watchedImages = form.watch("images");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function addFeature() {
    const value = featureDraft.trim();
    if (!value || features.includes(value) || features.length >= 40) return;
    setFeatures((current) => [...current, value]);
    setFeatureDraft("");
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 12 - images.fields.length)) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/uploads", { method: "POST", body });
        const payload = (await response.json()) as {
          data?: { url: string; publicId: string };
          error?: { message: string };
        };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message ?? "Téléversement impossible.");
        }
        images.append({
          url: payload.data.url,
          publicId: payload.data.publicId,
          alt: `${form.getValues("brand")} ${form.getValues("model")}`.trim(),
          isPrimary: images.fields.length === 0,
        });
      }
      toast.success("Images ajoutées");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Téléversement impossible.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.fields.findIndex((field) => field.id === active.id);
    const newIndex = images.fields.findIndex((field) => field.id === over.id);
    images.move(oldIndex, newIndex);
  }

  function makePrimary(index: number) {
    form.setValue(
      "images",
      watchedImages.map((image, imageIndex) => ({
        ...image,
        isPrimary: imageIndex === index,
      })),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  async function onSubmit(values: FormValues) {
    setServerError("");
    const endpoint = initialData?.id
      ? `/api/vehicles/${initialData.id}`
      : "/api/vehicles";
    const response = await fetch(endpoint, {
      method: initialData?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, features }),
    });
    const payload = (await response.json()) as {
      data?: { id: string };
      error?: { message: string };
    };
    if (!response.ok) {
      setServerError(payload.error?.message ?? "Enregistrement impossible.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    toast.success(initialData?.id ? "Véhicule mis à jour" : "Véhicule ajouté");
    router.push("/dashboard/vehicules");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {serverError ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {serverError}
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Informations principales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Marque" error={form.formState.errors.brand?.message}>
            <Input {...form.register("brand")} placeholder="Dacia" />
          </Field>
          <Field label="Modèle" error={form.formState.errors.model?.message}>
            <Input {...form.register("model")} placeholder="Duster" />
          </Field>
          <Field label="Année" error={form.formState.errors.year?.message}>
            <Input type="number" {...form.register("year", { valueAsNumber: true })} />
          </Field>
          <Field
            label="Immatriculation"
            error={form.formState.errors.licensePlate?.message}
          >
            <Input {...form.register("licensePlate")} placeholder="12345-A-6" />
          </Field>
          <Field label="Catégorie" error={form.formState.errors.category?.message}>
            <Input {...form.register("category")} placeholder="SUV" />
          </Field>
          <Field label="Transmission">
            <select className="form-select" {...form.register("transmission")}>
              {transmissions.map((value) => (
                <option key={value} value={value}>
                  {value === "MANUAL" ? "Manuelle" : "Automatique"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Carburant">
            <select className="form-select" {...form.register("fuelType")}>
              {fuelTypes.map((value) => (
                <option key={value} value={value}>
                  {fuelLabels[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut">
            <select className="form-select" {...form.register("status")}>
              {vehicleStatuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Places" error={form.formState.errors.seats?.message}>
            <Input type="number" {...form.register("seats", { valueAsNumber: true })} />
          </Field>
          <Field label="Portes" error={form.formState.errors.doors?.message}>
            <Input type="number" {...form.register("doors", { valueAsNumber: true })} />
          </Field>
          <Field label="Kilométrage" error={form.formState.errors.mileage?.message}>
            <Input type="number" {...form.register("mileage", { valueAsNumber: true })} />
          </Field>
          <Field label="Couleur" error={form.formState.errors.color?.message}>
            <Input {...form.register("color")} placeholder="Noir métallisé" />
          </Field>
          <Field label="Localisation" error={form.formState.errors.location?.message}>
            <Input {...form.register("location")} placeholder="Marrakech centre" />
          </Field>
          <Field
            label="Quantité en stock"
            error={form.formState.errors.totalQuantity?.message}
          >
            <Input
              type="number"
              min={1}
              {...form.register("totalQuantity", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Disponible à partir du">
            <Controller
              control={form.control}
              name="availableFrom"
              render={({ field }) => (
                <Input
                  type="date"
                  value={field.value?.slice(0, 10) ?? ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value
                        ? new Date(`${event.target.value}T00:00:00.000Z`).toISOString()
                        : null,
                    )
                  }
                />
              )}
            />
          </Field>
          <label className="flex h-11 items-center gap-3 self-end rounded-xl border border-border px-3.5 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              {...form.register("isFeatured")}
            />
            Mettre en avant
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tarifs et caution</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <Field label="Prix par jour" error={form.formState.errors.dailyPrice?.message}>
            <Input
              type="number"
              step="0.01"
              min={0}
              {...form.register("dailyPrice", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Prix par semaine (facultatif)">
            <Input
              type="number"
              step="0.01"
              min={0}
              {...form.register("weeklyPrice", {
                setValueAs: (value) => (value === "" ? null : Number(value)),
              })}
            />
          </Field>
          <Field label="Caution" error={form.formState.errors.deposit?.message}>
            <Input
              type="number"
              step="0.01"
              min={0}
              {...form.register("deposit", { valueAsNumber: true })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Présentation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <Field label="Description" error={form.formState.errors.description?.message}>
            <Textarea
              {...form.register("description")}
              placeholder="Présentez les atouts du véhicule…"
            />
          </Field>
          <Field label="Conditions de location">
            <Textarea
              {...form.register("rentalConditions", {
                setValueAs: (value) => (value === "" ? null : value),
              })}
              placeholder="Âge minimum, ancienneté du permis…"
            />
          </Field>
          <div className="lg:col-span-2">
            <Label>Équipements</Label>
            <div className="mt-2 flex gap-2">
              <Input
                value={featureDraft}
                onChange={(event) => setFeatureDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addFeature();
                  }
                }}
                placeholder="Climatisation, CarPlay…"
              />
              <Button variant="outline" onClick={addFeature}>
                <Plus />
                Ajouter
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {features.map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() =>
                      setFeatures((items) => items.filter((item) => item !== feature))
                    }
                    aria-label={`Retirer ${feature}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            hidden
            onChange={(event) => uploadFiles(event.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || images.fields.length >= 12}
            className="flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-input bg-muted/30 px-6 text-center transition hover:border-primary hover:bg-primary/5 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="mb-3 size-6 animate-spin text-primary" />
            ) : (
              <ImagePlus className="mb-3 size-6 text-primary" />
            )}
            <span className="text-sm font-semibold">
              {uploading ? "Téléversement en cours…" : "Ajouter des photos"}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              JPEG, PNG, WebP ou AVIF · 8 Mo maximum · 12 images
            </span>
          </button>
          {form.formState.errors.images?.root?.message ? (
            <p className="mt-2 text-xs text-destructive">
              {form.formState.errors.images.root.message}
            </p>
          ) : null}
          <DndContext
            id="vehicle-images-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.fields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="mt-4 grid gap-3">
                {images.fields.map((field, index) => (
                  <SortableImage
                    key={field.id}
                    id={field.id}
                    image={watchedImages[index]}
                    index={index}
                    onPrimary={() => makePrimary(index)}
                    onRemove={() => {
                      const wasPrimary = watchedImages[index]?.isPrimary;
                      images.remove(index);
                      if (wasPrimary && images.fields.length > 1) {
                        setTimeout(() => makePrimary(0), 0);
                      }
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-2xl border border-border bg-background/90 p-3 shadow-lg backdrop-blur">
        <Button variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {initialData?.id ? "Enregistrer les modifications" : "Ajouter le véhicule"}
        </Button>
      </div>
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
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function SortableImage({
  id,
  image,
  index,
  onPrimary,
  onRemove,
}: {
  id: string;
  image?: FormValues["images"][number];
  index: number;
  onPrimary: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  if (!image) return null;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 rounded-xl border border-border bg-background p-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none p-2 text-muted-foreground"
        aria-label={`Déplacer l’image ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="relative size-16 overflow-hidden rounded-lg bg-muted">
        <Image src={image.url} alt={image.alt ?? ""} fill className="object-cover" sizes="64px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Photo {index + 1}</p>
        <button
          type="button"
          onClick={onPrimary}
          className={`mt-1 flex items-center gap-1 text-xs ${
            image.isPrimary ? "font-semibold text-primary" : "text-muted-foreground"
          }`}
        >
          <Star className={`size-3 ${image.isPrimary ? "fill-current" : ""}`} />
          {image.isPrimary ? "Image principale" : "Définir comme principale"}
        </button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={`Supprimer l’image ${index + 1}`}
      >
        <Trash2 className="text-destructive" />
      </Button>
    </div>
  );
}
