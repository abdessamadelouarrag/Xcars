import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CarFront,
  Check,
  DoorOpen,
  Fuel,
  Gauge,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PublicVehicleCard } from "@/components/public/vehicle-card";
import { ReservationForm } from "@/components/public/reservation-form";
import { getLocale, getMessages } from "@/i18n/messages";
import { db } from "@/lib/db";
import { getPublicAgency } from "@/lib/public-agency";
import { formatCurrency } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string; vehicleSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, vehicleSlug } = await params;
  const agency = await getPublicAgency(slug);
  if (!agency) return {};
  const vehicle = await db.vehicle.findFirst({
    where: { agencyId: agency.id, slug: vehicleSlug, isArchived: false },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });
  if (!vehicle) return {};
  const title = `${vehicle.brand} ${vehicle.model} à louer`;
  return {
    title: { absolute: `${title} | ${agency.name}` },
    description: vehicle.description.slice(0, 160),
    openGraph: {
      title,
      description: vehicle.description.slice(0, 160),
      images: vehicle.images[0] ? [{ url: vehicle.images[0].url }] : undefined,
    },
  };
}

export default async function PublicVehiclePage({ params, searchParams }: PageProps) {
  const { slug, vehicleSlug } = await params;
  const agency = await getPublicAgency(slug);
  if (!agency) notFound();
  const vehicle = await db.vehicle.findFirst({
    where: {
      agencyId: agency.id,
      slug: vehicleSlug,
      isArchived: false,
      status: { notIn: ["MAINTENANCE", "UNAVAILABLE", "ARCHIVED"] },
    },
    include: {
      images: { orderBy: { position: "asc" } },
      features: { orderBy: { name: "asc" } },
    },
  });
  if (!vehicle) notFound();
  const query = await searchParams;
  const startsAt = typeof query.startsAt === "string" ? query.startsAt : "";
  const endsAt = typeof query.endsAt === "string" ? query.endsAt : "";
  const locale = getLocale(agency.settings?.locale);
  const t = getMessages(locale);
  const currency = agency.settings?.currency ?? "EUR";
  const localeCode = locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-MA";
  const similar = await db.vehicle.findMany({
    where: {
      agencyId: agency.id,
      category: vehicle.category,
      id: { not: vehicle.id },
      isArchived: false,
      status: { notIn: ["MAINTENANCE", "UNAVAILABLE", "ARCHIVED"] },
    },
    include: { images: { where: { isPrimary: true }, take: 1 } },
    take: 3,
  });
  const specs = [
    [Gauge, vehicle.transmission === "AUTOMATIC" ? "Automatique" : "Manuelle"],
    [Fuel, fuelLabel(vehicle.fuelType)],
    [Users, `${vehicle.seats} places`],
    [DoorOpen, `${vehicle.doors} portes`],
    [CalendarDays, String(vehicle.year)],
    [MapPin, vehicle.location],
  ] as const;

  return (
    <main>
      <section className="mx-auto max-w-7xl px-5 pb-14 pt-8 lg:px-8 lg:pb-20">
        <nav className="mb-6 text-xs opacity-55">
          <Link href={`/agence/${agency.slug}`}>Accueil</Link> /{" "}
          <Link href={`/agence/${agency.slug}/vehicules`}>Véhicules</Link> /{" "}
          {vehicle.brand} {vehicle.model}
        </nav>
        <div className="grid gap-3 lg:grid-cols-[1.7fr_1fr]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--agency-radius)] bg-black/5 lg:row-span-2">
            {vehicle.images[0] ? (
              <Image
                src={vehicle.images[0].url}
                alt={vehicle.images[0].alt ?? `${vehicle.brand} ${vehicle.model}`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 65vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center"><CarFront className="size-12 opacity-30" /></div>
            )}
          </div>
          {vehicle.images.slice(1, 3).map((image) => (
            <div key={image.id} className="relative hidden min-h-0 overflow-hidden rounded-[var(--agency-radius)] bg-black/5 lg:block">
              <Image src={image.url} alt={image.alt ?? ""} fill className="object-cover" sizes="35vw" />
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--agency-primary)]">
                  {vehicle.category}
                </p>
                <h1 className="font-agency-heading mt-2 text-4xl font-bold sm:text-5xl">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <p className="mt-2 text-sm opacity-55">{vehicle.color} · {vehicle.mileage.toLocaleString(localeCode)} km</p>
              </div>
              <p className="text-2xl font-extrabold text-[var(--agency-primary)]">
                {formatCurrency(vehicle.dailyPrice.toString(), currency, localeCode)}
                <span className="block text-end text-xs font-normal opacity-55">{t.perDay}</span>
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {specs.map(([Icon, value]) => (
                <div key={value} className="flex items-center gap-3 rounded-[var(--agency-radius)] border border-black/10 p-4">
                  <Icon className="size-5 text-[var(--agency-primary)]" />
                  <span className="text-sm font-semibold">{value}</span>
                </div>
              ))}
            </div>
            <section className="mt-10">
              <h2 className="font-agency-heading text-2xl font-bold">Description</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 opacity-65">{vehicle.description}</p>
            </section>
            {vehicle.features.length ? (
              <section className="mt-10">
                <h2 className="font-agency-heading text-2xl font-bold">Équipements</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {vehicle.features.map((feature) => (
                    <p key={feature.id} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-[var(--agency-primary)]" /> {feature.name}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}
            {vehicle.rentalConditions ? (
              <section className="mt-10 rounded-[var(--agency-radius)] bg-[color-mix(in_srgb,var(--agency-primary)_7%,var(--agency-background))] p-6">
                <h2 className="flex items-center gap-2 font-agency-heading text-xl font-bold">
                  <ShieldCheck className="size-5 text-[var(--agency-primary)]" />
                  Conditions de location
                </h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 opacity-65">{vehicle.rentalConditions}</p>
                <p className="mt-4 text-sm font-semibold">Caution : {formatCurrency(vehicle.deposit.toString(), currency, localeCode)}</p>
              </section>
            ) : null}
          </div>
          <aside className="h-fit rounded-[var(--agency-radius)] border border-black/10 p-5 shadow-xl shadow-black/5 lg:sticky lg:top-24">
            <h2 className="font-agency-heading text-xl font-bold">Demander ce véhicule</h2>
            <p className="mt-2 text-xs leading-5 opacity-55">
              Envoyez vos dates. L’agence vous répondra après vérification.
            </p>
            <div className="mt-5">
              <ReservationForm
                agencySlug={agency.slug}
                vehicleId={vehicle.id}
                defaultLocation={vehicle.location}
                defaultStartsAt={startsAt}
                defaultEndsAt={endsAt}
              />
            </div>
          </aside>
        </div>
      </section>

      {similar.length ? (
        <section className="bg-[color-mix(in_srgb,var(--agency-primary)_6%,var(--agency-background))] py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <h2 className="font-agency-heading text-3xl font-bold">Véhicules similaires</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {similar.map((item) => (
                <PublicVehicleCard
                  key={item.id}
                  vehicle={item}
                  agencySlug={agency.slug}
                  currency={currency}
                  locale={localeCode}
                  perDay={t.perDay}
                  details={t.details}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function fuelLabel(value: string) {
  return {
    GASOLINE: "Essence",
    DIESEL: "Diesel",
    HYBRID: "Hybride",
    ELECTRIC: "Électrique",
    LPG: "GPL",
  }[value] ?? value;
}
