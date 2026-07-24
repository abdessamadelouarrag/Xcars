import { randomUUID } from "node:crypto";
import {
  PrismaClient,
  type Prisma,
} from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assertVehicleAvailability,
  getVehicleAvailableQuantity,
} from "@/lib/vehicles/availability";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;
const prisma = testDatabaseUrl
  ? new PrismaClient({ datasourceUrl: testDatabaseUrl })
  : null;
const runId = randomUUID().slice(0, 8);
let agencyAId = "";
let agencyBId = "";
let vehicleAId = "";
let ownerAId = "";
let ownerBId = "";

describeWithDatabase("PostgreSQL tenant isolation and booking safety", () => {
  beforeAll(async () => {
    if (!prisma) return;
    const ownerA = await prisma.user.create({
      data: {
        email: `owner-a-${runId}@example.test`,
        name: "Owner A",
        emailVerified: new Date(),
      },
    });
    const ownerB = await prisma.user.create({
      data: {
        email: `owner-b-${runId}@example.test`,
        name: "Owner B",
        emailVerified: new Date(),
      },
    });
    ownerAId = ownerA.id;
    ownerBId = ownerB.id;
    const agencyA = await prisma.agency.create({
      data: {
        ownerId: ownerA.id,
        name: `Agency A ${runId}`,
        slug: `agency-a-${runId}`,
      },
    });
    const agencyB = await prisma.agency.create({
      data: {
        ownerId: ownerB.id,
        name: `Agency B ${runId}`,
        slug: `agency-b-${runId}`,
      },
    });
    agencyAId = agencyA.id;
    agencyBId = agencyB.id;
    const vehicle = await prisma.vehicle.create({
      data: {
        agencyId: agencyA.id,
        slug: `test-car-${runId}`,
        brand: "Test",
        model: "Car",
        year: 2026,
        licensePlate: `TEST-${runId}`,
        category: "Test",
        transmission: "AUTOMATIC",
        fuelType: "ELECTRIC",
        seats: 5,
        doors: 5,
        color: "Noir",
        dailyPrice: 100,
        description: "Integration test vehicle",
        totalQuantity: 1,
        location: "Test city",
      },
    });
    vehicleAId = vehicle.id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.user.deleteMany({
      where: { id: { in: [ownerAId, ownerBId] } },
    });
    await prisma.$disconnect();
  });

  it("never returns agency A vehicles through an agency B scoped query", async () => {
    if (!prisma) return;
    const foreignVehicles = await prisma.vehicle.findMany({
      where: { agencyId: agencyBId, id: vehicleAId },
    });
    expect(foreignVehicles).toHaveLength(0);
  });

  it("rejects an overlapping confirmation when stock is exhausted", async () => {
    if (!prisma) return;
    const customer = await prisma.customer.create({
      data: {
        agencyId: agencyAId,
        name: "Integration Customer",
        email: `customer-${runId}@example.test`,
        phone: "+212600000000",
      },
    });
    await prisma.reservation.create({
      data: {
        agencyId: agencyAId,
        vehicleId: vehicleAId,
        customerId: customer.id,
        reference: `TEST-${runId}`,
        status: "CONFIRMED",
        startsAt: new Date("2026-09-01T10:00:00Z"),
        endsAt: new Date("2026-09-10T10:00:00Z"),
        pickupLocation: "Test city",
        returnLocation: "Test city",
        dailyRate: 100,
        totalAmount: 900,
        acceptedTermsAt: new Date(),
      },
    });

    const available = await prisma.$transaction((tx) =>
      getVehicleAvailableQuantity(tx, {
        agencyId: agencyAId,
        vehicleId: vehicleAId,
        startsAt: new Date("2026-09-03T10:00:00Z"),
        endsAt: new Date("2026-09-05T10:00:00Z"),
      }),
    );
    expect(available).toBe(0);

    await expect(
      prisma.$transaction((tx) =>
        assertVehicleAvailability(tx, {
          agencyId: agencyAId,
          vehicleId: vehicleAId,
          startsAt: new Date("2026-09-03T10:00:00Z"),
          endsAt: new Date("2026-09-05T10:00:00Z"),
          requestedQuantity: 1,
        }),
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
