import { notFound } from "next/navigation";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { PublicContactForm } from "@/components/public/contact-form";
import { PublicPageHeader } from "@/components/public/page-header";
import { getPublicAgency } from "@/lib/public-agency";

export const metadata = { title: "Contact" };

export default async function ContactPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getPublicAgency(slug);
  if (!agency) notFound();
  const hours =
    agency.settings?.openingHours &&
    typeof agency.settings.openingHours === "object" &&
    !Array.isArray(agency.settings.openingHours)
      ? (agency.settings.openingHours as Record<string, string>)
      : {};

  return (
    <main>
      <PublicPageHeader
        eyebrow={agency.name}
        title="Parlons de votre location"
        description="Une question sur un véhicule, une période ou les conditions ? Écrivez directement à l’équipe."
      />
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
        <div className="space-y-6">
          <ContactLine icon={MapPin} label="Adresse">
            {agency.settings?.address}, {agency.settings?.city}
          </ContactLine>
          {agency.settings?.phone ? (
            <ContactLine icon={Phone} label="Téléphone">
              <a href={`tel:${agency.settings.phone}`}>{agency.settings.phone}</a>
            </ContactLine>
          ) : null}
          {agency.settings?.contactEmail ? (
            <ContactLine icon={Mail} label="E-mail">
              <a href={`mailto:${agency.settings.contactEmail}`}>
                {agency.settings.contactEmail}
              </a>
            </ContactLine>
          ) : null}
          <ContactLine icon={Clock3} label="Horaires">
            <div className="mt-2 grid gap-1 text-xs opacity-65">
              {Object.entries(hours).map(([day, value]) => (
                <p key={day} className="flex justify-between gap-5">
                  <span className="capitalize">{day}</span><span>{value}</span>
                </p>
              ))}
            </div>
          </ContactLine>
        </div>
        <div className="rounded-[var(--agency-radius)] border border-black/10 p-6 sm:p-8">
          <PublicContactForm agencySlug={agency.slug} />
        </div>
      </section>
    </main>
  );
}

function ContactLine({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--agency-radius)] bg-[color-mix(in_srgb,var(--agency-primary)_10%,var(--agency-background))] text-[var(--agency-primary)]">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-45">{label}</p>
        <div className="mt-1 text-sm font-semibold">{children}</div>
      </div>
    </div>
  );
}
