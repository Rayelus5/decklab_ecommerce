import { describe, it, expect } from "vitest";
import {
  detectShippingRegion,
  calculateTotalWeight,
} from "@/lib/shipping";

describe("detectShippingRegion", () => {
  it("returns NATIONAL for Spain", () => {
    expect(detectShippingRegion("ES")).toBe("NATIONAL");
  });

  it("returns EUROPE for EU member states", () => {
    expect(detectShippingRegion("DE")).toBe("EUROPE");
    expect(detectShippingRegion("FR")).toBe("EUROPE");
    expect(detectShippingRegion("IT")).toBe("EUROPE");
    expect(detectShippingRegion("PT")).toBe("EUROPE");
    expect(detectShippingRegion("NL")).toBe("EUROPE");
    expect(detectShippingRegion("PL")).toBe("EUROPE");
  });

  it("returns EUROPE for non-EU non-ES countries (fallback)", () => {
    expect(detectShippingRegion("US")).toBe("EUROPE");
    expect(detectShippingRegion("MX")).toBe("EUROPE");
    expect(detectShippingRegion("JP")).toBe("EUROPE");
  });

  it("handles lowercase codes gracefully (no match → EUROPE)", () => {
    // Los códigos deben ser uppercase según el estándar ISO
    expect(detectShippingRegion("es")).toBe("EUROPE"); // lowercase no coincide → fallback
  });
});

describe("calculateTotalWeight", () => {
  it("returns 0 for empty cart", () => {
    expect(calculateTotalWeight([])).toBe(0);
  });

  it("sums weights × quantities correctly", () => {
    const items = [
      { variantId: "v1", quantity: 2, weight: 150 }, // 300g
      { variantId: "v2", quantity: 1, weight: 200 }, // 200g
    ];
    expect(calculateTotalWeight(items)).toBe(500);
  });

  it("handles single item", () => {
    expect(calculateTotalWeight([{ variantId: "v1", quantity: 3, weight: 100 }])).toBe(300);
  });

  it("handles fractional grams correctly", () => {
    const items = [
      { variantId: "v1", quantity: 2, weight: 33.3 },
    ];
    expect(calculateTotalWeight(items)).toBeCloseTo(66.6, 5);
  });
});
