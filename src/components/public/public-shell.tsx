import Image from "next/image";
import Link from "next/link";
import { CarFront, Menu, Phone } from "lucide-react";
import type { Locale } from "@/i18n/messages";
import { getMessages } from "@/i18n/messages";

type PublicShellProps = {
  children: React.ReactNode;
  agency: {
    name: string;
    slug: string;
    settings: {
      logoUrl?: string | null;
      phone?: string | null;
      contactEmail?: string | null;
      address?: string | null;
      city?: string | null;
    } | null;
  };
  locale: Locale;
};

export function PublicShell({ children, agency, locale }: PublicShellProps) {
  const t = getMessages(locale);
  const base = `/agence/${agency.slug}`;
  return (
    <div className="agency-site min-h-screen bg-[var(--agency-background)] text-[var(--agency-text)]">
      <header className="agency-nav sticky top-0 z-40 border-b border-black/5 bg-[var(--agency-background)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center px-5 lg:px-8">
          <Link href={base} className="flex items-center gap-2.5 font-bold">
            {agency.settings?.logoUrl ? (
              <Image
                src={agency.settings.logoUrl}
                alt={agency.name}
                width={140}
                height={44}
                className="h-10 w-auto object-contain"
                priority
              />
            ) : (
              <>
                <span className="flex size-9 items-center justify-center rounded-[var(--agency-radius)] bg-[var(--agency-primary)] text-white">
                  <CarFront className="size-5" />
                </span>
                <span className="font-agency-heading text-lg">{agency.name}</span>
              </>
            )}
          </Link>
          <nav className="ml-auto hidden items-center gap-7 text-sm font-semibold md:flex">
            <Link href={base}>{t.home}</Link>
            <Link href={`${base}/vehicules`}>{t.vehicles}</Link>
            <Link href={`${base}/a-propos`}>{t.about}</Link>
            <Link href={`${base}/faq`}>{t.faq}</Link>
            <Link href={`${base}/contact`}>{t.contact}</Link>
          </nav>
          {agency.settings?.phone ? (
            <a
              href={`tel:${agency.settings.phone}`}
              className="ml-7 hidden items-center gap-2 rounded-[var(--agency-radius)] bg-[var(--agency-primary)] px-4 py-2.5 text-sm font-bold text-white lg:flex"
            >
              <Phone className="size-4" />
              {agency.settings.phone}
            </a>
          ) : null}
          <details className="relative ml-auto md:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center">
              <Menu className="size-5" />
              <span className="sr-only">Menu</span>
            </summary>
            <nav className="absolute end-0 top-12 grid w-52 gap-1 rounded-xl border border-black/10 bg-[var(--agency-background)] p-2 text-sm font-semibold shadow-xl">
              <Link className="rounded-lg px-3 py-2" href={base}>{t.home}</Link>
              <Link className="rounded-lg px-3 py-2" href={`${base}/vehicules`}>{t.vehicles}</Link>
              <Link className="rounded-lg px-3 py-2" href={`${base}/a-propos`}>{t.about}</Link>
              <Link className="rounded-lg px-3 py-2" href={`${base}/contact`}>{t.contact}</Link>
            </nav>
          </details>
        </div>
      </header>
      {children}
      <footer className="bg-[var(--agency-secondary)] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-3 lg:px-8">
          <div>
            <p className="font-agency-heading text-xl font-bold">{agency.name}</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-white/60">
              {agency.settings?.address}
              {agency.settings?.city ? `, ${agency.settings.city}` : ""}
            </p>
          </div>
          <div className="grid content-start gap-2 text-sm text-white/70">
            <Link href={`${base}/vehicules`}>{t.vehicles}</Link>
            <Link href={`${base}/a-propos`}>{t.about}</Link>
            <Link href={`${base}/contact`}>{t.contact}</Link>
            <Link href={`${base}/faq`}>{t.faq}</Link>
          </div>
          <div className="grid content-start gap-2 text-sm text-white/70">
            <Link href={`${base}/conditions`}>{t.legal}</Link>
            <Link href={`${base}/confidentialite`}>{t.privacy}</Link>
            {agency.settings?.contactEmail ? (
              <a href={`mailto:${agency.settings.contactEmail}`}>
                {agency.settings.contactEmail}
              </a>
            ) : null}
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/45">
          © {new Date().getFullYear()} {agency.name} · {t.poweredBy}
        </div>
      </footer>
    </div>
  );
}
