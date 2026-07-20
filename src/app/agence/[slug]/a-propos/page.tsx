import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { PublicPageHeader } from "@/components/public/page-header";
import { getPublicAgency } from "@/lib/public-agency";

export const metadata = { title: "À propos" };

export default async function AboutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getPublicAgency(slug);
  if (!agency) notFound();
  return (
    <main>
      <PublicPageHeader
        eyebrow="Notre agence"
        title={`À propos de ${agency.name}`}
        description={agency.description}
      />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-agency-heading text-3xl font-bold">
              Une équipe locale pour accompagner votre trajet.
            </h2>
            <p className="mt-5 whitespace-pre-line text-sm leading-7 opacity-65">
              {agency.description ??
                `${agency.name} propose une flotte adaptée aux déplacements du quotidien et aux voyages.`}
            </p>
            <p className="mt-5 flex items-center gap-2 text-sm font-semibold">
              <MapPin className="size-4 text-[var(--agency-primary)]" />
              {agency.settings?.address}, {agency.settings?.city},{" "}
              {agency.settings?.country}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [ShieldCheck, "Réservation vérifiée", "Chaque confirmation tient compte du stock réel sur toute la période."],
              [CheckCircle2, "Informations claires", "Tarifs, caution et conditions sont présentés sur chaque fiche."],
              [Sparkles, "Flotte suivie", "Le statut de chaque véhicule est maintenu par l’équipe de l’agence."],
              [MapPin, "Service local", "Vous échangez directement avec l’agence qui prépare votre véhicule."],
            ].map(([Icon, title, description]) => {
              const CardIcon = Icon as typeof ShieldCheck;
              return (
                <div key={String(title)} className="rounded-[var(--agency-radius)] border border-black/10 p-5">
                  <CardIcon className="size-5 text-[var(--agency-primary)]" />
                  <h3 className="font-agency-heading mt-4 font-bold">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-6 opacity-60">{String(description)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
