import Link from "next/link";

export const metadata = { title: "Conditions d’utilisation" };

export default function PlatformTermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20">
      <Link href="/" className="text-sm font-bold text-primary">← XCars</Link>
      <h1 className="mt-8 text-4xl font-bold">Conditions d’utilisation</h1>
      <p className="mt-5 text-sm leading-7 text-muted-foreground">
        XCars fournit aux agences un outil de gestion et de publication. Chaque
        agence reste responsable des informations, tarifs, conditions de
        location et traitements réalisés dans son espace.
      </p>
      <h2 className="mt-10 text-xl font-bold">Utilisation du service</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        Les utilisateurs doivent protéger leurs accès, respecter les droits des
        clients et ne pas tenter d’accéder aux données d’une autre agence.
      </p>
      <h2 className="mt-10 text-xl font-bold">Disponibilité et données</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        Les sauvegardes, la conservation et les modalités contractuelles
        définitives doivent être adaptées au contexte de déploiement avant mise
        en production commerciale.
      </p>
    </main>
  );
}
