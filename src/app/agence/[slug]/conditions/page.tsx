import { notFound } from "next/navigation";
import { PublicPageHeader } from "@/components/public/page-header";
import { getPublicAgency } from "@/lib/public-agency";

export const metadata = { title: "Conditions générales" };

export default async function TermsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getPublicAgency(slug);
  if (!agency) notFound();
  return (
    <main>
      <PublicPageHeader eyebrow={agency.name} title="Conditions générales de location" />
      <article className="prose-agency mx-auto max-w-3xl px-5 py-20 text-sm leading-7">
        <LegalSection title="1. Objet">
          Les présentes conditions encadrent les demandes de location envoyées à {agency.name}. Une demande en ligne ne constitue une réservation définitive qu’après confirmation par l’agence.
        </LegalSection>
        <LegalSection title="2. Éligibilité du conducteur">
          Le conducteur doit présenter un permis valide et respecter les critères affichés sur la fiche du véhicule. Des justificatifs complémentaires peuvent être demandés avant la remise du véhicule.
        </LegalSection>
        <LegalSection title="3. Tarifs et caution">
          Les montants affichés sont des estimations établies selon la durée et le tarif journalier. La caution, les options et les éventuels frais supplémentaires sont précisés avant la confirmation finale.
        </LegalSection>
        <LegalSection title="4. Disponibilité">
          La disponibilité est vérifiée lors de la demande puis à sa confirmation. En cas d’indisponibilité, l’agence peut proposer un véhicule comparable ou refuser la demande.
        </LegalSection>
        <LegalSection title="5. Modification et annulation">
          Pour modifier ou annuler une demande, contactez l’agence en indiquant votre référence. Les conditions applicables sont celles communiquées lors de la confirmation.
        </LegalSection>
        <LegalSection title="6. Contact">
          {agency.settings?.contactEmail ?? "Utilisez la page de contact de l’agence"} · {agency.settings?.phone}
        </LegalSection>
      </article>
    </main>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mb-8"><h2 className="font-agency-heading text-xl font-bold">{title}</h2><p className="mt-3 opacity-65">{children}</p></section>;
}
