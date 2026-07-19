import { hash } from "bcryptjs";
import {
  AgencyRole,
  AgencyStatus,
  BorderRadius,
  FuelType,
  Prisma,
  PrismaClient,
  ReservationStatus,
  ThemePreset,
  ThemeVersionStatus,
  Transmission,
  UserRole,
  VehicleStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Demo2026!";

const sectionOrder = [
  "search",
  "featured",
  "categories",
  "benefits",
  "testimonials",
  "cta",
  "contact",
];

const visibleSections = Object.fromEntries(
  sectionOrder.map((section) => [section, true]),
);

async function resetDemoData() {
  const demoEmails = [
    "admin@xcars.ma",
    "owner@atlascars.ma",
    "owner@noircars.ma",
  ];

  await prisma.user.deleteMany({ where: { email: { in: demoEmails } } });
}

async function main() {
  await resetDemoData();
  const passwordHash = await hash(DEFAULT_PASSWORD, 12);

  await prisma.user.create({
    data: {
      name: "Administrateur XCars",
      email: "admin@xcars.ma",
      emailVerified: new Date(),
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const atlasOwner = await prisma.user.create({
    data: {
      name: "Yassine El Amrani",
      email: "owner@atlascars.ma",
      emailVerified: new Date(),
      passwordHash,
      role: UserRole.OWNER,
    },
  });

  const noirOwner = await prisma.user.create({
    data: {
      name: "Sofia Benali",
      email: "owner@noircars.ma",
      emailVerified: new Date(),
      passwordHash,
      role: UserRole.OWNER,
    },
  });

  const atlas = await prisma.agency.create({
    data: {
      name: "Atlas Cars",
      slug: "atlas-cars",
      description:
        "Votre mobilité au Maroc, avec une flotte récente et un service local attentionné.",
      ownerId: atlasOwner.id,
      status: AgencyStatus.ACTIVE,
      onboardingStep: 4,
      members: {
        create: {
          userId: atlasOwner.id,
          role: AgencyRole.OWNER,
          permissions: ["*"],
        },
      },
      settings: {
        create: {
          address: "18 avenue Mohammed VI",
          city: "Marrakech",
          country: "Maroc",
          phone: "+212 5 24 00 00 00",
          contactEmail: "bonjour@atlascars.ma",
          openingHours: {
            monday: "08:30–19:00",
            tuesday: "08:30–19:00",
            wednesday: "08:30–19:00",
            thursday: "08:30–19:00",
            friday: "08:30–19:00",
            saturday: "09:00–18:00",
            sunday: "09:00–13:00",
          },
          coverUrl:
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1800&q=85",
          locale: "fr",
          currency: "MAD",
          seoTitle: "Location de voitures à Marrakech | Atlas Cars",
          seoDescription:
            "Réservez votre voiture à Marrakech auprès d’une agence locale transparente.",
        },
      },
      themes: {
        create: {
          version: 1,
          status: ThemeVersionStatus.PUBLISHED,
          preset: ThemePreset.MINIMAL,
          primaryColor: "#0F766E",
          secondaryColor: "#102A2A",
          accentColor: "#F4B942",
          backgroundColor: "#F7FAF9",
          textColor: "#142321",
          headingFont: "Manrope",
          bodyFont: "Inter",
          radius: BorderRadius.LARGE,
          heroEyebrow: "Explorez le Maroc autrement",
          heroTitle: "La route commence ici.",
          heroDescription:
            "Une sélection de véhicules fiables, un prix clair et une équipe disponible à chaque étape.",
          visibleSections,
          sectionOrder,
          publishedAt: new Date(),
          createdById: atlasOwner.id,
        },
      },
    },
  });

  const noir = await prisma.agency.create({
    data: {
      name: "Noir Automotive",
      slug: "noir-automotive",
      description:
        "Location de véhicules premium et expérience de conciergerie à Casablanca.",
      ownerId: noirOwner.id,
      status: AgencyStatus.ACTIVE,
      onboardingStep: 4,
      members: {
        create: {
          userId: noirOwner.id,
          role: AgencyRole.OWNER,
          permissions: ["*"],
        },
      },
      settings: {
        create: {
          address: "42 boulevard d’Anfa",
          city: "Casablanca",
          country: "Maroc",
          phone: "+212 5 22 00 00 00",
          contactEmail: "concierge@noir-automotive.ma",
          openingHours: {
            monday: "09:00–20:00",
            tuesday: "09:00–20:00",
            wednesday: "09:00–20:00",
            thursday: "09:00–20:00",
            friday: "09:00–20:00",
            saturday: "10:00–19:00",
            sunday: "Sur rendez-vous",
          },
          coverUrl:
            "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1800&q=85",
          locale: "fr",
          currency: "MAD",
          seoTitle: "Location automobile premium à Casablanca",
          seoDescription:
            "Véhicules haut de gamme et conciergerie personnalisée à Casablanca.",
        },
      },
      themes: {
        create: {
          version: 1,
          status: ThemeVersionStatus.PUBLISHED,
          preset: ThemePreset.LUXURY,
          primaryColor: "#D7B56D",
          secondaryColor: "#111111",
          accentColor: "#F1D798",
          backgroundColor: "#090909",
          textColor: "#F7F3EA",
          headingFont: "Playfair Display",
          bodyFont: "Inter",
          radius: BorderRadius.SMALL,
          cardStyle: "outlined",
          navigationStyle: "transparent",
          heroEyebrow: "Automobile · Conciergerie",
          heroTitle: "L’exception, à portée de route.",
          heroDescription:
            "Des modèles premium préparés avec soin pour vos rendez-vous, séjours et événements.",
          visibleSections,
          sectionOrder,
          publishedAt: new Date(),
          createdById: noirOwner.id,
        },
      },
    },
  });

  const atlasVehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        agencyId: atlas.id,
        createdById: atlasOwner.id,
        slug: "dacia-duster",
        brand: "Dacia",
        model: "Duster",
        year: 2025,
        licensePlate: "ATLAS-001",
        category: "SUV",
        transmission: Transmission.MANUAL,
        fuelType: FuelType.DIESEL,
        seats: 5,
        doors: 5,
        mileage: 12400,
        color: "Blanc glacier",
        dailyPrice: new Prisma.Decimal("490"),
        weeklyPrice: new Prisma.Decimal("2990"),
        deposit: new Prisma.Decimal("5000"),
        description:
          "SUV polyvalent et confortable, idéal pour Marrakech, l’Atlas et les longs trajets.",
        rentalConditions: "Permis valide depuis 2 ans. Conducteur âgé de 23 ans minimum.",
        status: VehicleStatus.AVAILABLE,
        totalQuantity: 3,
        location: "Marrakech centre",
        isFeatured: true,
        images: {
          create: [
            {
              agencyId: atlas.id,
              url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85",
              alt: "SUV blanc sur route",
              isPrimary: true,
              position: 0,
            },
          ],
        },
        features: {
          create: [
            { agencyId: atlas.id, name: "Climatisation" },
            { agencyId: atlas.id, name: "Bluetooth" },
            { agencyId: atlas.id, name: "Caméra de recul" },
          ],
        },
      },
    }),
    prisma.vehicle.create({
      data: {
        agencyId: atlas.id,
        createdById: atlasOwner.id,
        slug: "renault-clio",
        brand: "Renault",
        model: "Clio",
        year: 2024,
        licensePlate: "ATLAS-002",
        category: "Citadine",
        transmission: Transmission.AUTOMATIC,
        fuelType: FuelType.GASOLINE,
        seats: 5,
        doors: 5,
        mileage: 18900,
        color: "Gris rafale",
        dailyPrice: new Prisma.Decimal("350"),
        weeklyPrice: new Prisma.Decimal("2190"),
        deposit: new Prisma.Decimal("3500"),
        description:
          "Citadine agile et économique avec boîte automatique, parfaite pour les déplacements urbains.",
        status: VehicleStatus.AVAILABLE,
        totalQuantity: 2,
        location: "Aéroport Marrakech-Ménara",
        isFeatured: true,
        images: {
          create: {
            agencyId: atlas.id,
            url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=85",
            alt: "Voiture compacte grise",
            isPrimary: true,
            position: 0,
          },
        },
        features: {
          create: [
            { agencyId: atlas.id, name: "CarPlay" },
            { agencyId: atlas.id, name: "Régulateur de vitesse" },
          ],
        },
      },
    }),
  ]);

  await prisma.vehicle.create({
    data: {
      agencyId: noir.id,
      createdById: noirOwner.id,
      slug: "range-rover-velar",
      brand: "Range Rover",
      model: "Velar",
      year: 2025,
      licensePlate: "NOIR-001",
      category: "SUV premium",
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.HYBRID,
      seats: 5,
      doors: 5,
      mileage: 4200,
      color: "Noir Santorini",
      dailyPrice: new Prisma.Decimal("2200"),
      weeklyPrice: new Prisma.Decimal("13900"),
      deposit: new Prisma.Decimal("25000"),
      description:
        "Un SUV sophistiqué, silencieux et puissant, livré à l’adresse de votre choix.",
      rentalConditions:
        "Permis valide depuis 5 ans. Conducteur âgé de 28 ans minimum. Caution par carte bancaire.",
      status: VehicleStatus.AVAILABLE,
      totalQuantity: 2,
      location: "Casablanca Anfa",
      isFeatured: true,
      images: {
        create: {
          agencyId: noir.id,
          url: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=85",
          alt: "SUV premium noir",
          isPrimary: true,
          position: 0,
        },
      },
      features: {
        create: [
          { agencyId: noir.id, name: "Toit panoramique" },
          { agencyId: noir.id, name: "Sièges ventilés" },
          { agencyId: noir.id, name: "Son Meridian" },
        ],
      },
    },
  });

  const customer = await prisma.customer.create({
    data: {
      agencyId: atlas.id,
      name: "Amine Idrissi",
      email: "amine@example.com",
      phone: "+212 6 12 34 56 78",
    },
  });

  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 5);
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + 4);

  await prisma.reservation.create({
    data: {
      agencyId: atlas.id,
      vehicleId: atlasVehicles[0].id,
      customerId: customer.id,
      reference: "ATL-DEMO-001",
      status: ReservationStatus.CONFIRMED,
      startsAt,
      endsAt,
      pickupLocation: "Aéroport Marrakech-Ménara",
      returnLocation: "Marrakech centre",
      dailyRate: new Prisma.Decimal("490"),
      totalAmount: new Prisma.Decimal("1960"),
      currency: "MAD",
      acceptedTermsAt: new Date(),
      history: {
        create: [
          {
            agencyId: atlas.id,
            toStatus: ReservationStatus.NEW,
          },
          {
            agencyId: atlas.id,
            fromStatus: ReservationStatus.NEW,
            toStatus: ReservationStatus.CONFIRMED,
            changedById: atlasOwner.id,
          },
        ],
      },
    },
  });

  console.info("Données de démonstration créées.");
  console.info("Admin: admin@xcars.ma / Demo2026!");
  console.info("Atlas: owner@atlascars.ma / Demo2026!");
  console.info("Noir: owner@noircars.ma / Demo2026!");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
