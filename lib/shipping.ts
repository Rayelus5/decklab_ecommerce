import { prisma } from "@/lib/prisma";
import type { ShippingRegion } from "@prisma/client";

// -------------------------------------------------------
// Tipos
// -------------------------------------------------------
export interface ShippingOption {
  id: string;
  name: string;
  type: string;
  price: number;
  region: ShippingRegion;
}

export interface CartItemWeight {
  variantId: string;
  quantity: number;
  weight: number; // en gramos
}

// -------------------------------------------------------
// Detectar región basándose en el país del código ISO
// -------------------------------------------------------
const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "FI",
  "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV",
  "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
]);

export function detectShippingRegion(countryCode: string): ShippingRegion {
  if (countryCode === "ES") return "NATIONAL";
  if (EU_COUNTRIES.has(countryCode)) return "EUROPE";
  // Por ahora solo soportamos Nacional y Europa
  return "EUROPE";
}

// -------------------------------------------------------
// Calcular peso total del carrito en gramos
// -------------------------------------------------------
export function calculateTotalWeight(items: CartItemWeight[]): number {
  return items.reduce((total, item) => total + item.weight * item.quantity, 0);
}

// -------------------------------------------------------
// Obtener opciones de envío disponibles para un peso y región
// -------------------------------------------------------
export async function getAvailableShippingOptions(
  totalWeightGrams: number,
  region: ShippingRegion
): Promise<ShippingOption[]> {
  const rates = await prisma.shippingRate.findMany({
    where: {
      active: true,
      region,
      minWeight: { lte: totalWeightGrams },
      OR: [
        { maxWeight: { gte: totalWeightGrams } },
        { maxWeight: -1 }, // Sin límite de peso
      ],
    },
    orderBy: [{ type: "asc" }, { price: "asc" }],
  });

  return rates.map((rate) => ({
    id: rate.id,
    name: rate.name,
    type: rate.type,
    price: Number(rate.price),
    region: rate.region,
  }));
}

// -------------------------------------------------------
// Obtener una tarifa de envío específica por ID
// -------------------------------------------------------
export async function getShippingRateById(
  rateId: string
): Promise<ShippingOption | null> {
  const rate = await prisma.shippingRate.findUnique({
    where: { id: rateId },
  });

  if (!rate) return null;

  return {
    id: rate.id,
    name: rate.name,
    type: rate.type,
    price: Number(rate.price),
    region: rate.region,
  };
}
