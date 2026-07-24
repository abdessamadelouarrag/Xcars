import { describe, expect, it } from "vitest";
import { registerSchema } from "@/lib/validation/auth";
import { imageUrlSchema } from "@/lib/validation/image";
import { reservationRequestSchema } from "@/lib/validation/reservation";
import { vehicleSchema } from "@/lib/validation/vehicle";

describe("Zod validation", () => {
  it("accepts secure remote and generated local image URLs", () => {
    expect(
      imageUrlSchema.safeParse(
        "/uploads/eb6b39bd-a7eb-4cb4-9350-632a62053512/4d43230b-48c4-4a86-b4ce-95092d0fb523.png",
      ).success,
    ).toBe(true);
    expect(
      imageUrlSchema.safeParse("https://images.example.com/car.jpg").success,
    ).toBe(true);
  });

  it("rejects unsafe or malformed image URLs", () => {
    expect(imageUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(imageUrlSchema.safeParse("/uploads/../../secret.png").success).toBe(
      false,
    );
  });

  it("rejects a weak account password", () => {
    const result = registerSchema.safeParse({
      name: "Test Owner",
      email: "owner@example.com",
      password: "password",
      agencyName: "Test Cars",
      slug: "test-cars",
      acceptedTerms: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a reservation whose end precedes its start", () => {
    const result = reservationRequestSchema.safeParse({
      vehicleId: "b7b210ff-9524-4b04-8cc5-02128041d140",
      startsAt: "2026-08-10",
      endsAt: "2026-08-09",
      pickupLocation: "Marrakech",
      returnLocation: "Marrakech",
      quantity: 1,
      customerName: "Test Client",
      customerEmail: "client@example.com",
      customerPhone: "+212600000000",
      acceptedTerms: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires exactly one primary image when images exist", () => {
    const baseVehicle = {
      brand: "Dacia",
      model: "Duster",
      year: 2025,
      licensePlate: "TEST-1",
      category: "SUV",
      transmission: "MANUAL",
      fuelType: "DIESEL",
      seats: 5,
      doors: 5,
      mileage: 0,
      color: "Blanc",
      dailyPrice: 400,
      weeklyPrice: null,
      deposit: 4000,
      description: "Un véhicule de test suffisamment décrit.",
      rentalConditions: null,
      status: "AVAILABLE",
      totalQuantity: 1,
      location: "Marrakech",
      availableFrom: null,
      isFeatured: false,
      features: [],
      images: [
        {
          url: "https://images.example.com/car.jpg",
          isPrimary: false,
        },
      ],
    };
    expect(vehicleSchema.safeParse(baseVehicle).success).toBe(false);
  });
});
