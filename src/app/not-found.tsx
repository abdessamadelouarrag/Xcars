import Link from "next/link";
import { CarFront } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <CarFront />
      </span>
      <p className="mt-6 text-sm font-bold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold">Cette route n’existe pas</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        La page a peut-être été déplacée ou n’est plus disponible.
      </p>
      <Link href="/" className={`${buttonVariants()} mt-6`}>
        Retour à l’accueil
      </Link>
    </main>
  );
}
