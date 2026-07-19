import Link from "next/link";

export const metadata = { title: "Confidentialité" };

export default function PlatformPrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20">
      <Link href="/" className="text-sm font-bold text-primary">← XCars</Link>
      <h1 className="mt-8 text-4xl font-bold">Politique de confidentialité</h1>
      <p className="mt-5 text-sm leading-7 text-muted-foreground">
        XCars traite les données de compte, d’agence et de réservation afin de
        fournir le service. Les données métier sont isolées par agence et
        accessibles uniquement aux membres autorisés et aux administrateurs de
        la plateforme lorsque l’exploitation l’exige.
      </p>
      <h2 className="mt-10 text-xl font-bold">Vos droits</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        Une procédure de contact, d’export et de suppression doit être reliée à
        l’adresse légale de l’exploitant avant le lancement public.
      </p>
    </main>
  );
}
