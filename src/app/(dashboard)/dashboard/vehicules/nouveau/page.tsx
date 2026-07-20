import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { requireTenantPermission } from "@/lib/auth/tenant";

export const metadata = {
  title: "Ajouter un véhicule",
};

export default async function NewVehiclePage() {
  await requireTenantPermission("vehicles:create");
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ajouter un véhicule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complétez les informations qui seront visibles sur votre site public.
        </p>
      </div>
      <VehicleForm />
    </div>
  );
}
