import { notFound } from "next/navigation";
import { PublicPageHeader } from "@/components/public/page-header";
import { getPublicAgency } from "@/lib/public-agency";

export const metadata = { title: "Politique de confidentialité" };

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getPublicAgency(slug);
  if (!agency) notFound();
  return (
    <main>
      <PublicPageHeader eyebrow={agency.name} title="Politique de confidentialité" />
      <article className="mx-auto max-w-3xl px-5 py-20 text-sm leading-7">
        {[
          ["Données collectées", "Lors d’une demande, le nom, l’adresse e-mail, le téléphone, les dates, les lieux et le message sont enregistrés afin de traiter la location."],
          ["Finalité", `Ces informations sont utilisées par ${agency.name} pour répondre, vérifier la disponibilité et assurer le suivi de la demande.`],
          ["Conservation et sécurité", "L’accès aux données est limité aux membres autorisés de l’agence et aux administrateurs de la plateforme pour les besoins d’exploitation et de sécurité."],
          ["Vos droits", `Vous pouvez demander l’accès, la rectification ou la suppression de vos informations en contactant ${agency.settings?.contactEmail ?? "l’agence via sa page de contact"}.`],
          ["Sous-traitants", "La plateforme peut s’appuyer sur des prestataires d’hébergement, d’envoi d’e-mails et de stockage d’images, limités aux données nécessaires à leur service."],
        ].map(([title, text]) => (
          <section key={title} className="mb-8">
            <h2 className="font-agency-heading text-xl font-bold">{title}</h2>
            <p className="mt-3 opacity-65">{text}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
