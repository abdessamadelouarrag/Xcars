import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Fuel, Gauge, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type PublicVehicleCardProps = {
  vehicle: {
    slug: string;
    brand: string;
    model: string;
    category: string;
    transmission: string;
    fuelType: string;
    seats: number;
    dailyPrice: { toString(): string } | number;
    images: Array<{ url: string; alt?: string | null }>;
  };
  agencySlug: string;
  currency: string;
  locale: string;
  perDay: string;
  details: string;
};

const fuelLabels: Record<string, string> = {
  GASOLINE: "Essence",
  DIESEL: "Diesel",
  HYBRID: "Hybride",
  ELECTRIC: "Électrique",
  LPG: "GPL",
};

export function PublicVehicleCard({
  vehicle,
  agencySlug,
  currency,
  locale,
  perDay,
  details,
}: PublicVehicleCardProps) {
  return (
    <article className="agency-card group overflow-hidden rounded-[var(--agency-radius)] bg-[var(--agency-background)]">
      <Link
        href={`/agence/${agencySlug}/vehicules/${vehicle.slug}`}
        className="relative block aspect-[16/10] overflow-hidden bg-black/5"
      >
        {vehicle.images[0] ? (
          <Image
            src={vehicle.images[0].url}
            alt={vehicle.images[0].alt ?? `${vehicle.brand} ${vehicle.model}`}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm opacity-40">
            Photo à venir
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-900 backdrop-blur">
          {vehicle.category}
        </span>
      </Link>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-agency-heading text-lg font-bold">
              {vehicle.brand} {vehicle.model}
            </h3>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] opacity-55">
              <span className="flex items-center gap-1"><Gauge className="size-3" />{vehicle.transmission === "AUTOMATIC" ? "Auto." : "Manuelle"}</span>
              <span className="flex items-center gap-1"><Fuel className="size-3" />{fuelLabels[vehicle.fuelType]}</span>
              <span className="flex items-center gap-1"><Users className="size-3" />{vehicle.seats}</span>
            </div>
          </div>
          <p className="text-end text-base font-extrabold text-[var(--agency-primary)]">
            {formatCurrency(vehicle.dailyPrice.toString(), currency, locale)}
            <span className="block text-[10px] font-normal opacity-60">{perDay}</span>
          </p>
        </div>
        <Link
          href={`/agence/${agencySlug}/vehicules/${vehicle.slug}`}
          className="mt-5 flex items-center justify-between border-t border-black/10 pt-4 text-xs font-bold"
        >
          {details}
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
