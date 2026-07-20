import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import { PublicVehicleCard } from "@/components/public/vehicle-card";
import { getLocale, getMessages } from "@/i18n/messages";
import { db } from "@/lib/db";
import { getFeaturedVehicles, getPublicAgency } from "@/lib/public-agency";

export default async function AgencyHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getPublicAgency(slug);
  if (!agency || !agency.themes[0]) notFound();
  const theme = agency.themes[0];
  const locale = getLocale(agency.settings?.locale);
  const t = getMessages(locale);
  const visible = theme.visibleSections as Record<string, boolean>;
  const [featured, categories] = await Promise.all([
    getFeaturedVehicles(agency.id),
    db.vehicle.groupBy({
      by: ["category"],
      where: { agencyId: agency.id, isArchived: false },
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
      take: 6,
    }),
  ]);
  const base = `/agence/${agency.slug}`;
  const heroTitle = theme.heroTitle ?? agency.name;
  const heroDescription =
    theme.heroDescription ??
    agency.description ??
    "Découvrez notre flotte et envoyez votre demande en quelques minutes.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    name: agency.name,
    description: agency.description,
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${base}`,
    telephone: agency.settings?.phone,
    email: agency.settings?.contactEmail,
    address: {
      "@type": "PostalAddress",
      streetAddress: agency.settings?.address,
      addressLocality: agency.settings?.city,
      addressCountry: agency.settings?.country,
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <section className="relative isolate min-h-[690px] overflow-hidden text-white">
        {agency.settings?.coverUrl ? (
          <Image
            src={agency.settings.coverUrl}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background: agency.settings?.coverUrl
              ? `linear-gradient(90deg, ${theme.secondaryColor}f2 0%, ${theme.secondaryColor}b8 48%, ${theme.secondaryColor}40 100%)`
              : `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})`,
          }}
        />
        <div className="relative mx-auto flex min-h-[690px] max-w-7xl items-center px-5 py-20 lg:px-8">
          <div className="max-w-3xl">
            {theme.heroEyebrow ? (
              <p
                className="text-xs font-extrabold uppercase tracking-[.2em]"
                style={{ color: theme.accentColor }}
              >
                {theme.heroEyebrow}
              </p>
            ) : null}
            <h1 className="font-agency-heading mt-5 text-balance text-5xl font-bold leading-[1.04] sm:text-6xl lg:text-7xl">
              {heroTitle}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
              {heroDescription}
            </p>
            <Link
              href={`${base}/vehicules`}
              className="mt-8 inline-flex items-center gap-2 rounded-[var(--agency-radius)] bg-[var(--agency-primary)] px-6 py-3.5 text-sm font-bold text-white"
            >
              {t.viewFleet} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {visible.search !== false ? (
        <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-5 lg:px-8">
          <form
            action={`${base}/vehicules`}
            className="grid gap-4 rounded-[var(--agency-radius)] bg-[var(--agency-background)] p-5 shadow-2xl shadow-black/10 md:grid-cols-[1fr_1fr_1.3fr_auto]"
          >
            <PublicField label={t.startDate}>
              <input className="agency-input" type="date" name="startsAt" required />
            </PublicField>
            <PublicField label={t.endDate}>
              <input className="agency-input" type="date" name="endsAt" required />
            </PublicField>
            <PublicField label={t.location}>
              <input
                className="agency-input"
                name="location"
                placeholder={agency.settings?.city ?? ""}
              />
            </PublicField>
            <button className="mt-auto flex h-12 items-center justify-center gap-2 rounded-[var(--agency-radius)] bg-[var(--agency-primary)] px-6 text-sm font-bold text-white">
              <Search className="size-4" /> {t.search}
            </button>
          </form>
        </section>
      ) : null}

      {visible.featured !== false ? (
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--agency-primary)]">
                {t.featuredEyebrow}
              </p>
              <h2 className="font-agency-heading mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">
                {t.featuredTitle}
              </h2>
            </div>
            <Link href={`${base}/vehicules`} className="hidden items-center gap-2 text-sm font-bold sm:flex">
              {t.viewFleet} <ArrowRight className="size-4" />
            </Link>
          </div>
          {featured.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featured.map((vehicle) => (
                <PublicVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  agencySlug={agency.slug}
                  currency={agency.settings?.currency ?? "EUR"}
                  locale={locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-MA"}
                  perDay={t.perDay}
                  details={t.details}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-[var(--agency-radius)] border border-dashed border-black/15 p-12 text-center text-sm opacity-60">
              La flotte sera bientôt disponible.
            </div>
          )}
        </section>
      ) : null}

      {visible.categories !== false && categories.length ? (
        <section className="bg-[color-mix(in_srgb,var(--agency-primary)_7%,var(--agency-background))] py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--agency-primary)]">
              {t.categories}
            </p>
            <h2 className="font-agency-heading mt-3 text-3xl font-bold">{t.categoriesTitle}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.category}
                  href={`${base}/vehicules?category=${encodeURIComponent(category.category)}`}
                  className="flex items-center justify-between rounded-[var(--agency-radius)] bg-[var(--agency-background)] p-5 font-bold shadow-sm"
                >
                  <span>{category.category}</span>
                  <span className="text-xs font-normal opacity-55">
                    {category._count._all} véhicule{category._count._all > 1 ? "s" : ""}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {visible.benefits !== false ? (
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--agency-primary)]">
                {t.benefits}
              </p>
              <h2 className="font-agency-heading mt-3 text-4xl font-bold">
                Une réservation simple, avec une équipe locale.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [ShieldCheck, "Prix transparents", "Les tarifs et la caution sont affichés avant votre demande."],
                [CalendarCheck, "Disponibilité vérifiée", "Le stock est contrôlé pour toute la période sélectionnée."],
                [MessageCircle, "Contact direct", "Votre demande est traitée par l’équipe de l’agence."],
                [CheckCircle2, "Confirmation claire", "Vous recevez le suivi de votre réservation par e-mail."],
              ].map(([Icon, title, description]) => {
                const BenefitIcon = Icon as typeof ShieldCheck;
                return (
                  <div key={String(title)} className="rounded-[var(--agency-radius)] border border-black/10 p-5">
                    <BenefitIcon className="size-5 text-[var(--agency-primary)]" />
                    <h3 className="mt-4 font-agency-heading font-bold">{String(title)}</h3>
                    <p className="mt-2 text-sm leading-6 opacity-60">{String(description)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {visible.cta !== false ? (
        <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8">
          <div className="rounded-[var(--agency-radius)] bg-[var(--agency-secondary)] px-6 py-14 text-center text-white sm:px-12">
            <h2 className="font-agency-heading text-3xl font-bold sm:text-4xl">{t.ctaTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/65">{t.ctaText}</p>
            <Link
              href={`${base}/vehicules`}
              className="mt-7 inline-flex rounded-[var(--agency-radius)] bg-[var(--agency-primary)] px-6 py-3 text-sm font-bold"
            >
              {t.viewFleet}
            </Link>
          </div>
        </section>
      ) : null}

      {visible.contact !== false ? (
        <section className="border-t border-black/10">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--agency-primary)]">
                {t.contact}
              </p>
              <h2 className="font-agency-heading mt-3 text-3xl font-bold">{agency.name}</h2>
              <div className="mt-7 space-y-4 text-sm">
                <p className="flex gap-3"><MapPin className="size-5 text-[var(--agency-primary)]" />{agency.settings?.address}, {agency.settings?.city}</p>
                <p className="flex gap-3"><Clock3 className="size-5 text-[var(--agency-primary)]" />{t.hours}</p>
              </div>
            </div>
            <div className="flex min-h-72 items-center justify-center rounded-[var(--agency-radius)] bg-[color-mix(in_srgb,var(--agency-primary)_10%,var(--agency-background))] p-8 text-center">
              <div>
                <MapPin className="mx-auto size-8 text-[var(--agency-primary)]" />
                <p className="mt-4 font-agency-heading text-xl font-bold">{agency.settings?.city}</p>
                <a
                  href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
                    `${agency.settings?.address ?? ""} ${agency.settings?.city ?? ""}`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-bold text-[var(--agency-primary)] underline"
                >
                  Ouvrir la carte
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function PublicField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold">
      <span className="mb-2 block opacity-55">{label}</span>
      {children}
    </label>
  );
}
