import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  CarFront,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { PublicVehicleCard } from "@/components/public/vehicle-card";
import { getLocale, getMessages } from "@/i18n/messages";
import { db } from "@/lib/db";
import { getPublicAgency } from "@/lib/public-agency";
import { cn } from "@/lib/utils";
import { catalogQuerySchema } from "@/lib/validation/catalog";
import { getVehicleAvailableQuantity } from "@/lib/vehicles/availability";

export const metadata = {
  title: "Véhicules",
};

const orderBy: Record<string, Prisma.VehicleOrderByWithRelationInput> = {
  "price-asc": { dailyPrice: "asc" },
  "price-desc": { dailyPrice: "desc" },
  newest: { createdAt: "desc" },
  popular: { popularity: "desc" },
};

export default async function PublicCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const agency = await getPublicAgency(slug);
  if (!agency) return null;
  const rawQuery = await searchParams;
  const scalarQuery = Object.fromEntries(
    Object.entries(rawQuery).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const query = catalogQuerySchema.parse(scalarQuery);
  const locale = getLocale(agency.settings?.locale);
  const t = getMessages(locale);
  const pageSize = 12;
  const where: Prisma.VehicleWhereInput = {
    agencyId: agency.id,
    isArchived: false,
    status: { notIn: ["MAINTENANCE", "UNAVAILABLE", "ARCHIVED"] },
    ...(query.search
      ? {
          OR: [
            { brand: { contains: query.search } },
            { model: { contains: query.search } },
          ],
        }
      : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.transmission ? { transmission: query.transmission } : {}),
    ...(query.fuelType ? { fuelType: query.fuelType } : {}),
    ...(query.location
      ? { location: { contains: query.location } }
      : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? { dailyPrice: { gte: query.minPrice, lte: query.maxPrice } }
      : {}),
  };
  const include = {
    images: { where: { isPrimary: true }, take: 1 },
    features: { take: 4 },
  } satisfies Prisma.VehicleInclude;
  const hasDateRange = Boolean(query.startsAt && query.endsAt && query.endsAt > query.startsAt);
  let vehicles: Prisma.VehicleGetPayload<{ include: typeof include }>[];
  let total: number;

  if (hasDateRange) {
    const candidates = await db.vehicle.findMany({
      where,
      include,
      orderBy: orderBy[query.sort],
    });
    const startsAt = new Date(`${query.startsAt}T10:00:00.000Z`);
    const endsAt = new Date(`${query.endsAt}T10:00:00.000Z`);
    const available = await db.$transaction(async (tx) => {
      const quantities = await Promise.all(
        candidates.map((vehicle) =>
          getVehicleAvailableQuantity(tx, {
            agencyId: agency.id,
            vehicleId: vehicle.id,
            startsAt,
            endsAt,
          }),
        ),
      );
      return candidates.filter((_, index) => quantities[index] > 0);
    });
    total = available.length;
    vehicles = available.slice((query.page - 1) * pageSize, query.page * pageSize);
  } else {
    [vehicles, total] = await Promise.all([
      db.vehicle.findMany({
        where,
        include,
        orderBy: orderBy[query.sort],
        skip: (query.page - 1) * pageSize,
        take: pageSize,
      }),
      db.vehicle.count({ where }),
    ]);
  }
  const [categories, priceRange] = await Promise.all([
    db.vehicle.findMany({
      where: { agencyId: agency.id, isArchived: false },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
    db.vehicle.aggregate({
      where: { agencyId: agency.id, isArchived: false },
      _min: { dailyPrice: true },
      _max: { dailyPrice: true },
    }),
  ]);
  const pageCount = Math.ceil(total / pageSize);
  const localeCode = locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-MA";

  return (
    <main className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[var(--agency-primary)]">
          {agency.name}
        </p>
        <h1 className="font-agency-heading mt-3 text-4xl font-bold sm:text-5xl">
          {t.vehicles}
        </h1>
        <p className="mt-4 text-sm leading-6 opacity-60">
          Parcourez la flotte et vérifiez les disponibilités pour vos dates.
        </p>
      </div>

      <form className="mt-10 rounded-[var(--agency-radius)] border border-black/10 p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="lg:col-span-2">
            <span className="mb-2 block text-xs font-bold">Recherche</span>
            <span className="relative block">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 opacity-45" />
              <input
                name="search"
                defaultValue={query.search}
                className="agency-input pl-10"
                placeholder="Marque ou modèle"
              />
            </span>
          </label>
          <PublicFilter label={t.startDate}>
            <input name="startsAt" type="date" defaultValue={query.startsAt} className="agency-input" />
          </PublicFilter>
          <PublicFilter label={t.endDate}>
            <input name="endsAt" type="date" defaultValue={query.endsAt} className="agency-input" />
          </PublicFilter>
          <PublicFilter label={t.categories}>
            <select name="category" defaultValue={query.category ?? ""} className="agency-input">
              <option value="">Toutes</option>
              {categories.map(({ category }) => <option key={category}>{category}</option>)}
            </select>
          </PublicFilter>
          <PublicFilter label="Transmission">
            <select name="transmission" defaultValue={query.transmission ?? ""} className="agency-input">
              <option value="">Toutes</option>
              <option value="MANUAL">Manuelle</option>
              <option value="AUTOMATIC">Automatique</option>
            </select>
          </PublicFilter>
          <PublicFilter label="Carburant">
            <select name="fuelType" defaultValue={query.fuelType ?? ""} className="agency-input">
              <option value="">Tous</option>
              <option value="GASOLINE">Essence</option>
              <option value="DIESEL">Diesel</option>
              <option value="HYBRID">Hybride</option>
              <option value="ELECTRIC">Électrique</option>
            </select>
          </PublicFilter>
          <PublicFilter label="Trier">
            <select name="sort" defaultValue={query.sort} className="agency-input">
              <option value="popular">Plus demandés</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="newest">Plus récents</option>
            </select>
          </PublicFilter>
        </div>
        <input type="hidden" name="view" value={query.view} />
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs opacity-50">
            {priceRange._min.dailyPrice && priceRange._max.dailyPrice
              ? `${priceRange._min.dailyPrice} – ${priceRange._max.dailyPrice} ${agency.settings?.currency ?? "EUR"} / jour`
              : ""}
          </p>
          <button className="flex h-11 items-center gap-2 rounded-[var(--agency-radius)] bg-[var(--agency-primary)] px-5 text-sm font-bold text-white">
            <SlidersHorizontal className="size-4" /> Filtrer
          </button>
        </div>
      </form>

      <div className="mt-9 flex items-center justify-between">
        <p className="text-sm font-semibold">
          {total} véhicule{total === 1 ? "" : "s"}
          {hasDateRange ? " disponible(s) pour ces dates" : ""}
        </p>
        <div className="flex rounded-[var(--agency-radius)] border border-black/10 p-1">
          <ViewLink query={scalarQuery} view="grid" active={query.view === "grid"}><Grid2X2 /></ViewLink>
          <ViewLink query={scalarQuery} view="list" active={query.view === "list"}><List /></ViewLink>
        </div>
      </div>

      {vehicles.length ? (
        <div className={cn("mt-6 grid gap-6", query.view === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className={query.view === "list" ? "max-w-3xl" : ""}>
              <PublicVehicleCard
                vehicle={vehicle}
                agencySlug={agency.slug}
                currency={agency.settings?.currency ?? "EUR"}
                locale={localeCode}
                perDay={t.perDay}
                details={t.details}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-[var(--agency-radius)] border border-dashed border-black/15 text-center">
          <CarFront className="size-9 opacity-30" />
          <h2 className="font-agency-heading mt-4 text-lg font-bold">Aucun véhicule disponible</h2>
          <p className="mt-2 max-w-md text-sm opacity-55">Modifiez les dates ou les filtres pour élargir votre recherche.</p>
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="mt-10 flex justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
            <Link
              key={page}
              href={queryHref(scalarQuery, { page: String(page) })}
              className={cn(
                "flex size-10 items-center justify-center rounded-[var(--agency-radius)] border text-sm font-bold",
                page === query.page
                  ? "border-[var(--agency-primary)] bg-[var(--agency-primary)] text-white"
                  : "border-black/10",
              )}
            >
              {page}
            </Link>
          ))}
        </nav>
      ) : null}
    </main>
  );
}

function PublicFilter({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className="mb-2 block text-xs font-bold">{label}</span>{children}</label>;
}

function queryHref(
  query: Record<string, string | undefined>,
  updates: Record<string, string>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
  for (const [key, value] of Object.entries(updates)) params.set(key, value);
  return `?${params}`;
}

function ViewLink({
  query,
  view,
  active,
  children,
}: {
  query: Record<string, string | undefined>;
  view: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={queryHref(query, { view, page: "1" })}
      className={cn(
        "flex size-8 items-center justify-center rounded-[calc(var(--agency-radius)*.7)] [&_svg]:size-4",
        active ? "bg-[var(--agency-primary)] text-white" : "opacity-50",
      )}
    >
      {children}
    </Link>
  );
}
