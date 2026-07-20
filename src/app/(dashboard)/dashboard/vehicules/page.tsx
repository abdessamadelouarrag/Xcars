import Image from "next/image";
import Link from "next/link";
import type { Prisma, VehicleStatus } from "@prisma/client";
import {
  CarFront,
  Grid2X2,
  List,
  MapPin,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { VehicleActions } from "@/components/vehicles/vehicle-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { vehicleStatusLabels } from "@/lib/dashboard/queries";
import { cn, formatCurrency } from "@/lib/utils";
import { vehicleListQuerySchema } from "@/lib/validation/vehicle";

export const metadata = {
  title: "Véhicules",
};

const sortOrder: Record<string, Prisma.VehicleOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  "price-asc": { dailyPrice: "asc" },
  "price-desc": { dailyPrice: "desc" },
  popular: { popularity: "desc" },
};

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenantPermission("vehicles:read");
  const rawQuery = await searchParams;
  const scalarQuery = Object.fromEntries(
    Object.entries(rawQuery).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const query = vehicleListQuerySchema.parse(scalarQuery);
  const where: Prisma.VehicleWhereInput = {
    agencyId: tenant.agency.id,
    isArchived: query.status === "ARCHIVED",
    ...(query.search
      ? {
          OR: [
            { brand: { contains: query.search } },
            { model: { contains: query.search } },
            { licensePlate: { contains: query.search } },
          ],
        }
      : {}),
    ...(query.status && query.status !== "ARCHIVED" ? { status: query.status } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.brand ? { brand: query.brand } : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? { dailyPrice: { gte: query.minPrice, lte: query.maxPrice } }
      : {}),
  };

  const [vehicles, total, facets, settings] = await Promise.all([
    db.vehicle.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { reservations: true } },
      },
      orderBy: sortOrder[query.sort],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.vehicle.count({ where }),
    db.vehicle.findMany({
      where: { agencyId: tenant.agency.id, isArchived: false },
      select: { brand: true, category: true },
      distinct: ["brand", "category"],
    }),
    db.agencySettings.findUnique({
      where: { agencyId: tenant.agency.id },
      select: { currency: true },
    }),
  ]);
  const pageCount = Math.ceil(total / query.pageSize);
  const currency = settings?.currency ?? "EUR";
  const brands = [...new Set(facets.map((item) => item.brand))].sort();
  const categories = [...new Set(facets.map((item) => item.category))].sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Véhicules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} véhicule{total === 1 ? "" : "s"} dans cette vue.
          </p>
        </div>
        <Link href="/dashboard/vehicules/nouveau" className={buttonVariants()}>
          <Plus />
          Ajouter un véhicule
        </Link>
      </div>

      <form className="grid gap-3 rounded-2xl border border-border bg-card p-4 lg:grid-cols-[1.5fr_repeat(3,1fr)_auto]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="search"
            defaultValue={query.search}
            placeholder="Marque, modèle, immatriculation…"
            className="form-select pl-10"
          />
        </div>
        <select name="status" defaultValue={query.status ?? ""} className="form-select">
          <option value="">Tous les statuts</option>
          {Object.entries(vehicleStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="brand" defaultValue={query.brand ?? ""} className="form-select">
          <option value="">Toutes les marques</option>
          {brands.map((brand) => (
            <option key={brand}>{brand}</option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={query.category ?? ""}
          className="form-select"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <button className={buttonVariants()} type="submit">
          Filtrer
        </button>
        <div className="flex flex-wrap gap-3 lg:col-span-5">
          <select name="sort" defaultValue={query.sort} className="form-select w-auto">
            <option value="newest">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="popular">Popularité</option>
          </select>
          <input type="hidden" name="view" value={query.view} />
          <div className="ml-auto flex rounded-xl border border-border p-1">
            <ViewLink query={scalarQuery} view="grid" active={query.view === "grid"}>
              <Grid2X2 />
              <span className="sr-only">Grille</span>
            </ViewLink>
            <ViewLink query={scalarQuery} view="table" active={query.view === "table"}>
              <List />
              <span className="sr-only">Tableau</span>
            </ViewLink>
          </div>
        </div>
      </form>

      {!vehicles.length ? (
        <EmptyState
          icon={CarFront}
          title="Aucun véhicule trouvé"
          description={
            Object.keys(scalarQuery).length
              ? "Essayez de modifier les filtres ou effacez la recherche."
              : "Ajoutez votre premier véhicule pour le publier sur votre site."
          }
          action={
            <Link href="/dashboard/vehicules/nouveau" className={buttonVariants()}>
              <Plus /> Ajouter un véhicule
            </Link>
          }
        />
      ) : query.view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {vehicles.map((vehicle) => (
            <article
              key={vehicle.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="relative aspect-[16/10] bg-muted">
                {vehicle.images[0] ? (
                  <Image
                    src={vehicle.images[0].url}
                    alt={vehicle.images[0].alt ?? `${vehicle.brand} ${vehicle.model}`}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <CarFront className="size-10 text-muted-foreground/40" />
                  </div>
                )}
                <Badge className="absolute left-3 top-3" variant={statusVariant(vehicle.status)}>
                  {vehicleStatusLabels[vehicle.status]}
                </Badge>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">
                      {vehicle.brand} {vehicle.model}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {vehicle.year} · {vehicle.category}
                    </p>
                  </div>
                  <p className="text-right text-sm font-bold text-primary">
                    {formatCurrency(vehicle.dailyPrice.toString(), currency, "fr-MA")}
                    <span className="block text-[10px] font-normal text-muted-foreground">
                      / jour
                    </span>
                  </p>
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {vehicle.location} · stock {vehicle.totalQuantity}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <Link
                    href={`/dashboard/vehicules/${vehicle.id}/modifier`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    <Pencil /> Modifier
                  </Link>
                  <VehicleActions vehicleId={vehicle.id} />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Véhicule</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Localisation</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Prix / jour</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-muted/25">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 overflow-hidden rounded-lg bg-muted">
                        {vehicle.images[0] ? (
                          <Image
                            src={vehicle.images[0].url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.licensePlate}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(vehicle.status)}>
                      {vehicleStatusLabels[vehicle.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{vehicle.location}</td>
                  <td className="px-4 py-3">{vehicle.totalQuantity}</td>
                  <td className="px-4 py-3 font-semibold">
                    {formatCurrency(vehicle.dailyPrice.toString(), currency, "fr-MA")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/dashboard/vehicules/${vehicle.id}/modifier`}
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                      >
                        <Pencil />
                        <span className="sr-only">Modifier</span>
                      </Link>
                      <VehicleActions vehicleId={vehicle.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
            <Link
              key={page}
              href={buildQuery(scalarQuery, { page: String(page) })}
              className={buttonVariants({
                variant: page === query.page ? "default" : "outline",
                size: "icon",
              })}
            >
              {page}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

function statusVariant(status: VehicleStatus) {
  if (status === "AVAILABLE") return "success" as const;
  if (status === "MAINTENANCE" || status === "RESERVED") return "warning" as const;
  if (status === "UNAVAILABLE" || status === "ARCHIVED") return "destructive" as const;
  return "secondary" as const;
}

function buildQuery(
  current: Record<string, string | undefined>,
  updates: Record<string, string>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value) params.set(key, value);
  }
  for (const [key, value] of Object.entries(updates)) params.set(key, value);
  return `?${params.toString()}`;
}

function ViewLink({
  query,
  view,
  active,
  children,
}: {
  query: Record<string, string | undefined>;
  view: "grid" | "table";
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={buildQuery(query, { view, page: "1" })}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg [&_svg]:size-4",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
      )}
    >
      {children}
    </Link>
  );
}
