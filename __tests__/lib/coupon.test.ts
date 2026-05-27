import { describe, it, expect } from "vitest";
import { applyCoupon } from "@/lib/coupon";

describe("applyCoupon", () => {
  describe("PERCENT type", () => {
    it("applies 10% discount to 100€ order", () => {
      const result = applyCoupon(100, "PERCENT", 10);
      expect(result.discount).toBe(10);
      expect(result.finalTotal).toBe(90);
    });

    it("applies 50% discount", () => {
      const result = applyCoupon(80, "PERCENT", 50);
      expect(result.discount).toBe(40);
      expect(result.finalTotal).toBe(40);
    });

    it("applies 100% discount (free)", () => {
      const result = applyCoupon(50, "PERCENT", 100);
      expect(result.discount).toBe(50);
      expect(result.finalTotal).toBe(0);
    });

    it("handles decimal orders correctly", () => {
      const result = applyCoupon(33.33, "PERCENT", 10);
      expect(result.discount).toBeCloseTo(3.33, 2);
      expect(result.finalTotal).toBeCloseTo(30, 2);
    });
  });

  describe("FIXED type", () => {
    it("applies fixed 5€ discount to 30€ order", () => {
      const result = applyCoupon(30, "FIXED", 5);
      expect(result.discount).toBe(5);
      expect(result.finalTotal).toBe(25);
    });

    it("caps discount at order total (discount cannot exceed total)", () => {
      const result = applyCoupon(10, "FIXED", 50);
      expect(result.discount).toBe(10); // Capped at order total
      expect(result.finalTotal).toBe(0);
    });

    it("exact match: discount equals order total", () => {
      const result = applyCoupon(25, "FIXED", 25);
      expect(result.discount).toBe(25);
      expect(result.finalTotal).toBe(0);
    });

    it("applies fixed discount to decimal order", () => {
      const result = applyCoupon(19.99, "FIXED", 5);
      expect(result.discount).toBe(5);
      expect(result.finalTotal).toBeCloseTo(14.99, 2);
    });
  });

  describe("edge cases", () => {
    it("zero order total returns 0 discount", () => {
      const result = applyCoupon(0, "PERCENT", 10);
      expect(result.discount).toBe(0);
      expect(result.finalTotal).toBe(0);
    });

    it("zero coupon value returns no discount", () => {
      const result = applyCoupon(100, "FIXED", 0);
      expect(result.discount).toBe(0);
      expect(result.finalTotal).toBe(100);
    });
  });
});
