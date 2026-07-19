import Link from "next/link";
import { CarFront, CheckCircle2 } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#092c2a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 size-[420px] rounded-full bg-[#2dd4bf]/15 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2 text-lg font-bold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white text-[#0f766e]">
            <CarFront className="size-5" />
          </span>
          XCars
        </Link>
        <div className="relative max-w-xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[.18em] text-teal-300">
            Votre agence, votre marque
          </p>
          <h2 className="text-balance text-4xl font-semibold leading-tight xl:text-5xl">
            Pilotez votre flotte et publiez un site qui vous ressemble.
          </h2>
          <ul className="mt-10 grid gap-4 text-sm text-teal-50/80">
            {[
              "Site public personnalisable en temps réel",
              "Disponibilités et réservations centralisées",
              "Données strictement isolées par agence",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-teal-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-teal-100/50">
          Une plateforme conçue pour les loueurs indépendants.
        </p>
      </section>
      <section className="flex items-center justify-center bg-background px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex items-center gap-2 text-lg font-bold lg:hidden"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <CarFront className="size-5" />
            </span>
            XCars
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
