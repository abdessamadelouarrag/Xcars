"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck2,
  CarFront,
  Check,
  Globe2,
  LayoutDashboard,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: CarFront,
    title: "Flotte maîtrisée",
    description:
      "Catalogue, stock, statuts, maintenance, photos et disponibilités dans un espace unique.",
  },
  {
    icon: CalendarCheck2,
    title: "Réservations fiables",
    description:
      "Demandes, confirmation, calendrier et protection transactionnelle contre les doubles réservations.",
  },
  {
    icon: Palette,
    title: "Site à votre image",
    description:
      "Quatre directions créatives, couleurs, typographies et aperçu responsive avant publication.",
  },
  {
    icon: ShieldCheck,
    title: "Séparation par agence",
    description:
      "Chaque opération est filtrée et autorisée côté serveur selon le tenant et les permissions.",
  },
];

export function LandingPage() {
  return (
    <main className="overflow-hidden bg-[#f7faf9] text-[#112421]">
      <nav className="relative z-20 mx-auto flex h-20 max-w-7xl items-center px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#0f766e] text-white">
            <CarFront className="size-5" />
          </span>
          XCars
        </Link>
        <div className="ml-auto hidden items-center gap-7 text-sm font-semibold text-[#536c67] md:flex">
          <a href="#fonctionnalites">Fonctionnalités</a>
          <a href="#securite">Sécurité</a>
          <a href="#demarrer">Démarrer</a>
        </div>
        <Link
          href="/connexion"
          className="ml-auto text-sm font-semibold text-[#36504b] md:ml-8"
        >
          Connexion
        </Link>
        <Link
          href="/inscription"
          className={cn(
            buttonVariants(),
            "ml-3 bg-[#0f766e] text-white hover:bg-[#0b5f59]",
          )}
        >
          Créer mon agence
        </Link>
      </nav>

      <section className="relative">
        <div className="absolute left-1/2 top-0 size-[700px] -translate-x-1/2 rounded-full bg-teal-300/20 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:pb-32 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/70 px-3 py-1.5 text-xs font-bold text-teal-800">
              <Sparkles className="size-3.5" />
              Le cockpit des agences de location
            </p>
            <h1 className="mt-7 text-balance text-5xl font-extrabold leading-[1.03] tracking-[-.045em] sm:text-6xl lg:text-7xl">
              Votre flotte.
              <br />
              Votre site.
              <br />
              <span className="text-[#0f766e]">Une seule route.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-[#58706b] sm:text-lg">
              XCars réunit gestion des véhicules, disponibilités, réservations
              et publication de votre site de location — sans perdre votre identité.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/inscription"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-[#0f766e] text-white hover:bg-[#0b5f59]",
                )}
              >
                Lancer mon agence <ArrowRight />
              </Link>
              <Link
                href="/agence/atlas-cars"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-[#c9d8d5] bg-white/60",
                )}
              >
                Voir un site démo
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#657b77]">
              {["Onboarding guidé", "Site responsive", "FR · EN · AR/RTL"].map(
                (item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-[#0f766e]" /> {item}
                  </span>
                ),
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-teal-300/30 to-amber-200/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-[#102c29] p-2 shadow-[0_35px_100px_rgba(15,51,46,.28)]">
              <div className="rounded-[22px] bg-white">
                <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-5">
                  <span className="size-2.5 rounded-full bg-red-300" />
                  <span className="size-2.5 rounded-full bg-amber-300" />
                  <span className="size-2.5 rounded-full bg-emerald-300" />
                  <span className="ml-4 h-7 flex-1 rounded-lg bg-slate-50" />
                </div>
                <div className="grid min-h-[480px] grid-cols-[64px_1fr] sm:grid-cols-[180px_1fr]">
                  <div className="border-r border-slate-100 bg-[#f8faf9] p-3 sm:p-4">
                    <div className="mb-7 flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-teal-700 text-white">
                        <CarFront className="size-4" />
                      </span>
                      <strong className="hidden text-sm sm:block">XCars</strong>
                    </div>
                    <div className="space-y-2">
                      {[LayoutDashboard, CarFront, CalendarCheck2, Palette, Globe2].map(
                        (Icon, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex h-10 items-center gap-2 rounded-lg px-2 text-xs",
                              index === 0
                                ? "bg-teal-50 font-bold text-teal-800"
                                : "text-slate-400",
                            )}
                          >
                            <Icon className="size-4" />
                            <span className="hidden sm:block">
                              {["Vue d’ensemble", "Véhicules", "Réservations", "Thème", "Site public"][index]}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 p-4 sm:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700">
                      Tableau de bord
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">Bonjour 👋</h2>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {["Flotte", "Disponibles", "Demandes", "Utilisation"].map(
                        (label, index) => (
                          <div key={label} className="rounded-xl border border-slate-100 p-3">
                            <p className="text-[9px] text-slate-400">{label}</p>
                            <div className="mt-2 h-5 w-12 rounded bg-slate-100" />
                            <div
                              className={cn(
                                "mt-3 h-1.5 rounded-full",
                                ["bg-teal-500", "bg-emerald-400", "bg-amber-400", "bg-violet-400"][index],
                              )}
                              style={{ width: `${50 + index * 10}%` }}
                            />
                          </div>
                        ),
                      )}
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-100 p-4">
                      <div className="flex justify-between">
                        <div className="h-3 w-24 rounded bg-slate-100" />
                        <div className="h-3 w-12 rounded bg-slate-50" />
                      </div>
                      <div className="mt-7 flex h-28 items-end gap-2">
                        {[35, 48, 42, 68, 58, 84, 72, 92].map((height, index) => (
                          <span
                            key={index}
                            className="flex-1 rounded-t bg-teal-600/80"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="fonctionnalites" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-700">
              Tout au même endroit
            </p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Assez simple pour démarrer. Assez solide pour grandir.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.07 }}
                className="rounded-3xl border border-[#dfe9e6] bg-[#fbfdfc] p-7"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 max-w-lg text-sm leading-7 text-[#637873]">
                  {feature.description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="securite" className="bg-[#092c2a] py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-300">
              Sécurité par conception
            </p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Les frontières entre agences ne sont jamais une option d’interface.
            </h2>
          </div>
          <div className="grid content-center gap-5 text-sm leading-7 text-teal-50/70">
            {[
              "Contrôles d’autorisation dans chaque opération serveur.",
              "Validation Zod avant toute écriture en base.",
              "Transactions sérialisables pour les confirmations critiques.",
              "Journal d’audit pour les actions sensibles.",
            ].map((item) => (
              <p key={item} className="flex gap-3">
                <ShieldCheck className="mt-1 size-5 shrink-0 text-teal-300" />
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section id="demarrer" className="bg-white px-5 py-24">
        <div className="mx-auto max-w-5xl rounded-[36px] bg-[#f2f8f6] px-6 py-16 text-center sm:px-12">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Votre agence mérite mieux qu’un tableur et un site figé.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#617671]">
            Configurez votre identité, publiez votre flotte et centralisez les
            demandes depuis un seul espace sécurisé.
          </p>
          <Link
            href="/inscription"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-8 bg-[#0f766e] text-white hover:bg-[#0b5f59]",
            )}
          >
            Créer mon espace <ArrowRight />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#dfe9e6] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-[#647873] sm:flex-row sm:items-center lg:px-8">
          <p>© {new Date().getFullYear()} XCars</p>
          <div className="sm:ml-auto flex gap-5">
            <Link href="/conditions">Conditions</Link>
            <Link href="/confidentialite">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
