import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/public-shell";
import { getLocale } from "@/i18n/messages";
import { getPublicAgency } from "@/lib/public-agency";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getPublicAgency(slug);
  if (!agency) return {};
  const title = agency.settings?.seoTitle ?? agency.name;
  const description =
    agency.settings?.seoDescription ??
    agency.description ??
    `Découvrez les véhicules de ${agency.name}.`;
  const seoKeywords = Array.isArray(agency.settings?.seoKeywords)
    ? agency.settings.seoKeywords.filter(
        (keyword): keyword is string => typeof keyword === "string",
      )
    : undefined;
  return {
    title: { absolute: title },
    description,
    keywords: seoKeywords,
    alternates: {
      canonical: `/agence/${agency.slug}`,
    },
    icons: agency.settings?.faviconUrl
      ? { icon: agency.settings.faviconUrl }
      : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/agence/${agency.slug}`,
      images: agency.settings?.coverUrl
        ? [{ url: agency.settings.coverUrl, alt: agency.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: agency.settings?.coverUrl
        ? [agency.settings.coverUrl]
        : undefined,
    },
  };
}

export default async function AgencyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getPublicAgency(slug);
  if (!agency || !agency.themes[0]) notFound();
  const theme = agency.themes[0];
  const locale = getLocale(agency.settings?.locale);
  const radius =
    theme.radius === "SMALL"
      ? "0.4rem"
      : theme.radius === "LARGE"
        ? "1.5rem"
        : "0.9rem";
  const style = {
    "--agency-primary": theme.primaryColor,
    "--agency-secondary": theme.secondaryColor,
    "--agency-accent": theme.accentColor,
    "--agency-background": theme.backgroundColor,
    "--agency-text": theme.textColor,
    "--agency-heading": `"${theme.headingFont}", "Segoe UI", serif`,
    "--agency-body": `"${theme.bodyFont}", "Segoe UI", sans-serif`,
    "--agency-radius": radius,
  } as CSSProperties;

  return (
    <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} style={style}>
      <PublicShell
        agency={{
          name: agency.name,
          slug: agency.slug,
          settings: agency.settings,
        }}
        locale={locale}
      >
        {children}
      </PublicShell>
    </div>
  );
}
