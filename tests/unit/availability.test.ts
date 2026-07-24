import { describe, expect, it } from "vitest";
import {
  intervalsOverlap,
  maximumConcurrentQuantity,
} from "@/lib/vehicles/availability";

describe("vehicle availability intervals", () => {
  it("uses half-open intervals so adjacent rentals do not overlap", () => {
    const firstStart = new Date("2026-08-01T10:00:00Z");
    const firstEnd = new Date("2026-08-05T10:00:00Z");
    const secondStart = new Date("2026-08-05T10:00:00Z");
    const secondEnd = new Date("2026-08-08T10:00:00Z");

    expect(
      intervalsOverlap(firstStart, firstEnd, secondStart, secondEnd),
    ).toBe(false);
  });

  it("finds the maximum concurrent quantity instead of summing disjoint rentals", () => {
    const rangeStart = new Date("2026-08-01T10:00:00Z");
    const rangeEnd = new Date("2026-08-15T10:00:00Z");
    const result = maximumConcurrentQuantity(
      [
        {
          startsAt: new Date("2026-08-02T10:00:00Z"),
          endsAt: new Date("2026-08-05T10:00:00Z"),
          quantity: 1,
        },
        {
          startsAt: new Date("2026-08-04T10:00:00Z"),
          endsAt: new Date("2026-08-08T10:00:00Z"),
          quantity: 2,
        },
        {
          startsAt: new Date("2026-08-10T10:00:00Z"),
          endsAt: new Date("2026-08-12T10:00:00Z"),
          quantity: 4,
        },
      ],
      rangeStart,
      rangeEnd,
    );

    expect(result).toBe(4);
  });

  it("counts reservations and maintenance blocks together", () => {
    const result = maximumConcurrentQuantity(
      [
        {
          startsAt: new Date("2026-08-02T10:00:00Z"),
          endsAt: new Date("2026-08-06T10:00:00Z"),
          quantity: 2,
        },
        {
          startsAt: new Date("2026-08-03T10:00:00Z"),
          endsAt: new Date("2026-08-05T10:00:00Z"),
          quantity: 1,
        },
      ],
      new Date("2026-08-01T10:00:00Z"),
      new Date("2026-08-10T10:00:00Z"),
    );

    expect(result).toBe(3);
  });
});
