import { notFound } from "next/navigation";
import { PublicPageHeader } from "@/components/public/page-header";
import { getPublicAgency } from "@/lib/public-agency";

export const metadata = { title: "Questions fréquentes" };

const faqs = [
  ["Comment envoyer une demande ?", "Choisissez un véhicule, renseignez vos dates et vos coordonnées, puis envoyez le formulaire. L’agence vérifie ensuite la disponibilité."],
  ["La demande confirme-t-elle immédiatement la location ?", "Non. Une demande est d’abord examinée par l’agence. Vous recevez un e-mail lorsqu’elle est confirmée ou refusée."],
  ["Quels documents sont nécessaires ?", "Les documents et critères précis figurent dans les conditions de chaque véhicule. L’agence peut demander un permis valide et une pièce d’identité."],
  ["Comment la caution est-elle gérée ?", "Le montant de la caution est affiché sur la fiche du véhicule. Les modalités de dépôt sont confirmées directement par l’agence."],
  ["Puis-je modifier ou annuler ma demande ?", "Contactez l’agence avec votre référence de réservation. Les possibilités dépendent de l’état de la demande et des conditions applicables."],
];

export default async function FaqPage({
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
        eyebrow={agency.name}
        title="Questions fréquentes"
        description="Les réponses essentielles avant d’envoyer votre demande."
      />
      <section className="mx-auto max-w-4xl px-5 py-20">
        <div className="space-y-3">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group rounded-[var(--agency-radius)] border border-black/10 p-5">
              <summary className="cursor-pointer list-none font-agency-heading font-bold">
                {question}
              </summary>
              <p className="mt-4 text-sm leading-7 opacity-65">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
