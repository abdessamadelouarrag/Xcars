import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/connexion`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/inscription`, changeFrequency: "monthly", priority: 0.5 },
  ];
  try {
    const agencies = await db.agency.findMany({
      where: { status: "ACTIVE" },
      select: {
        slug: true,
        updatedAt: true,
        vehicles: {
          where: { isArchived: false },
          select: { slug: true, updatedAt: true },
        },
      },
    });
    return [
      ...staticEntries,
      ...agencies.flatMap((agency) => [
        {
          url: `${baseUrl}/agence/${agency.slug}`,
          lastModified: agency.updatedAt,
          changeFrequency: "daily" as const,
          priority: 0.9,
        },
        {
          url: `${baseUrl}/agence/${agency.slug}/vehicules`,
          lastModified: agency.updatedAt,
          changeFrequency: "daily" as const,
          priority: 0.8,
        },
        ...agency.vehicles.map((vehicle) => ({
          url: `${baseUrl}/agence/${agency.slug}/vehicules/${vehicle.slug}`,
          lastModified: vehicle.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ]),
    ];
  } catch {
    return staticEntries;
  }
}
