import { cache } from "react";
import { db } from "@/lib/db";

export const getPublicAgency = cache(async (slug: string) => {
  return db.agency.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      settings: true,
      themes: {
        where: { status: "PUBLISHED" },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });
});

export const getFeaturedVehicles = cache(async (agencyId: string) => {
  return db.vehicle.findMany({
    where: {
      agencyId,
      isArchived: false,
      isFeatured: true,
      status: { notIn: ["MAINTENANCE", "UNAVAILABLE", "ARCHIVED"] },
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      features: { take: 4 },
    },
    orderBy: [{ popularity: "desc" }, { createdAt: "desc" }],
    take: 6,
  });
});
