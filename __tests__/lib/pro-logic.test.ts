import { describe, it, expect, vi, beforeEach } from "vitest";

// Mockear Prisma antes de importar pro-logic
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { calculateCartPricing } from "@/lib/pro-logic";
import type { CartItemPricing } from "@/lib/pro-logic";

const mockPrismaUser = prisma.user as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

describe("calculateCartPricing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses regular prices for non-PRO user", async () => {
    mockPrismaUser.findUnique.mockResolvedValue({
      isPro: false,
      proAllowanceBalance: 0,
    });

    const items: CartItemPricing[] = [
      {
        variantId: "v1",
        quantity: 2,
        price: 30,
        pricePro: 20,
        proExempt: false,
        productTitle: "Producto A",
      },
    ];

    const result = await calculateCartPricing("user-1", items);
    expect(result.pricedItems[0].wasProPrice).toBe(false);
    expect(result.pricedItems[0].unitPrice).toBe(30);
    expect(result.pricedItems[0].subtotal).toBe(60);
    expect(result.totalProAllowanceUsed).toBe(0);
  });

  it("applies PRO price when allowance is sufficient", async () => {
    mockPrismaUser.findUnique.mockResolvedValue({
      isPro: true,
      proAllowanceBalance: 100,
    });

    const items: CartItemPricing[] = [
      {
        variantId: "v1",
        quantity: 2,
        price: 30,
        pricePro: 20,
        proExempt: false,
        productTitle: "Producto A",
      },
    ];

    const result = await calculateCartPricing("user-1", items);
    expect(result.pricedItems[0].wasProPrice).toBe(true);
    expect(result.pricedItems[0].unitPrice).toBe(20);
    expect(result.pricedItems[0].subtotal).toBe(40);
    expect(result.totalProAllowanceUsed).toBe(40); // 20€ × 2 = 40€
    expect(result.totalSavings).toBe(20); // (30-20) × 2 = 20€
  });

  it("falls back to regular price when allowance is insufficient", async () => {
    mockPrismaUser.findUnique.mockResolvedValue({
      isPro: true,
      proAllowanceBalance: 10, // Solo 10€, necesita 40€ para precio PRO
    });

    const items: CartItemPricing[] = [
      {
        variantId: "v1",
        quantity: 2,
        price: 30,
        pricePro: 20,
        proExempt: false,
        productTitle: "Producto A",
      },
    ];

    const result = await calculateCartPricing("user-1", items);
    expect(result.pricedItems[0].wasProPrice).toBe(false);
    expect(result.pricedItems[0].unitPrice).toBe(30);
    expect(result.totalProAllowanceUsed).toBe(0);
  });

  it("applies PRO price without consuming allowance for proExempt items", async () => {
    mockPrismaUser.findUnique.mockResolvedValue({
      isPro: true,
      proAllowanceBalance: 0, // Sin allowance
    });

    const items: CartItemPricing[] = [
      {
        variantId: "v1",
        quantity: 1,
        price: 50,
        pricePro: 35,
        proExempt: true, // Exempt: precio PRO sin consumir allowance
        productTitle: "Producto Exclusivo",
      },
    ];

    const result = await calculateCartPricing("user-1", items);
    expect(result.pricedItems[0].wasProPrice).toBe(true);
    expect(result.pricedItems[0].unitPrice).toBe(35);
    expect(result.pricedItems[0].proAllowanceUsed).toBe(0);
    expect(result.totalProAllowanceUsed).toBe(0);
    expect(result.totalSavings).toBe(15);
  });

  it("handles multiple items with partial allowance", async () => {
    mockPrismaUser.findUnique.mockResolvedValue({
      isPro: true,
      proAllowanceBalance: 30, // Suficiente solo para el primer item (20€)
    });

    const items: CartItemPricing[] = [
      {
        variantId: "v1",
        quantity: 1,
        price: 30,
        pricePro: 20,
        proExempt: false,
        productTitle: "Producto A",
      },
      {
        variantId: "v2",
        quantity: 1,
        price: 40,
        pricePro: 25,
        proExempt: false,
        productTitle: "Producto B",
      },
    ];

    const result = await calculateCartPricing("user-1", items);
    // Primer item: PRO (20€ <= 30€ allowance)
    expect(result.pricedItems[0].wasProPrice).toBe(true);
    expect(result.pricedItems[0].unitPrice).toBe(20);
    // Segundo item: Regular (allowance restante 10€ < 25€ necesario)
    expect(result.pricedItems[1].wasProPrice).toBe(false);
    expect(result.pricedItems[1].unitPrice).toBe(40);
    expect(result.totalProAllowanceUsed).toBe(20);
  });

  it("handles item without pricePro (always regular price)", async () => {
    mockPrismaUser.findUnique.mockResolvedValue({
      isPro: true,
      proAllowanceBalance: 999,
    });

    const items: CartItemPricing[] = [
      {
        variantId: "v1",
        quantity: 1,
        price: 25,
        pricePro: null, // Sin precio PRO
        proExempt: false,
        productTitle: "Producto sin PRO",
      },
    ];

    const result = await calculateCartPricing("user-1", items);
    expect(result.pricedItems[0].wasProPrice).toBe(false);
    expect(result.pricedItems[0].unitPrice).toBe(25);
  });
});
