import { notFound } from "next/navigation";
import type { VehicleFormInitialData } from "@/components/vehicles/vehicle-form";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";

export const metadata = {
  title: "Modifier un véhicule",
};

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requireTenantPermission("vehicles:update");
  const { id } = await params;
  const vehicle = await db.vehicle.findFirst({
    where: { id, agencyId: tenant.agency.id },
    include: {
      images: { orderBy: { position: "asc" } },
      features: { orderBy: { name: "asc" } },
    },
  });
  if (!vehicle) notFound();

  const initialData: VehicleFormInitialData = {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    licensePlate: vehicle.licensePlate,
    category: vehicle.category,
    transmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    seats: vehicle.seats,
    doors: vehicle.doors,
    mileage: vehicle.mileage,
    color: vehicle.color,
    dailyPrice: Number(vehicle.dailyPrice),
    weeklyPrice: vehicle.weeklyPrice ? Number(vehicle.weeklyPrice) : null,
    deposit: Number(vehicle.deposit),
    description: vehicle.description,
    rentalConditions: vehicle.rentalConditions,
    status: vehicle.status === "ARCHIVED" ? "UNAVAILABLE" : vehicle.status,
    totalQuantity: vehicle.totalQuantity,
    location: vehicle.location,
    availableFrom: vehicle.availableFrom?.toISOString() ?? null,
    isFeatured: vehicle.isFeatured,
    features: vehicle.features.map((feature) => feature.name),
    images: vehicle.images.map((image) => ({
      url: image.url,
      publicId: image.publicId,
      alt: image.alt,
      isPrimary: image.isPrimary,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Modifier {vehicle.brand} {vehicle.model}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les changements seront visibles sur le site dès l’enregistrement.
        </p>
      </div>
      <VehicleForm initialData={initialData} />
    </div>
  );
}
