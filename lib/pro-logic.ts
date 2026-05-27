import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";

// -------------------------------------------------------
// Tipos
// -------------------------------------------------------
export interface ProBenefits {
  earlyAccessHours: number;
  freeShipping: boolean;
  exclusiveProducts: boolean;
  bonusAllowancePercent: number;
}

export interface CartItemPricing {
  variantId: string;
  quantity: number;
  price: number;       // Precio público
  pricePro?: number | null; // Precio PRO (null si no tiene)
  proExempt: boolean;  // Si true, no descuenta del allowance
  productTitle: string;
}

export interface PricingResult {
  variantId: string;
  quantity: number;
  unitPrice: number;   // Precio final por unidad
  wasProPrice: boolean;
  subtotal: number;
  proAllowanceUsed: number; // Cuánto allowance PRO se consumió
}

// -------------------------------------------------------
// Obtener los perks del tier PRO del usuario
// -------------------------------------------------------
export async function getUserProBenefits(
  userId: string
): Promise<ProBenefits | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { proTier: true },
  });

  if (!user?.isPro || !user.proTier?.benefits) return null;

  const defaults: ProBenefits = {
    earlyAccessHours: 0,
    freeShipping: false,
    exclusiveProducts: false,
    bonusAllowancePercent: 0,
  };

  const benefits = user.proTier.benefits as Partial<ProBenefits>;

  return { ...defaults, ...benefits };
}

// -------------------------------------------------------
// Calcular el precio final de cada item del carrito
// teniendo en cuenta el allowance PRO disponible
// -------------------------------------------------------
export async function calculateCartPricing(
  userId: string,
  items: CartItemPricing[]
): Promise<{
  pricedItems: PricingResult[];
  totalProAllowanceUsed: number;
  totalSavings: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPro: true,
      proAllowanceBalance: true,
    },
  });

  let remainingAllowance = new Decimal(user?.proAllowanceBalance ?? 0);
  const isPro = user?.isPro ?? false;

  const pricedItems: PricingResult[] = [];
  let totalProAllowanceUsed = new Decimal(0);
  let totalSavings = new Decimal(0);

  for (const item of items) {
    const regularTotal = new Decimal(item.price).mul(item.quantity);

    // ¿Puede usar precio PRO?
    const canUsePro =
      isPro &&
      item.pricePro != null &&
      item.pricePro > 0 &&
      item.pricePro < item.price;

    if (!canUsePro) {
      pricedItems.push({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.price,
        wasProPrice: false,
        subtotal: regularTotal.toNumber(),
        proAllowanceUsed: 0,
      });
      continue;
    }

    const proTotal = new Decimal(item.pricePro!).mul(item.quantity);
    const savings = regularTotal.minus(proTotal);

    if (!item.proExempt) {
      // El precio PRO consume allowance
      if (remainingAllowance.gte(proTotal)) {
        // Allowance suficiente → precio PRO completo
        remainingAllowance = remainingAllowance.minus(proTotal);
        totalProAllowanceUsed = totalProAllowanceUsed.plus(proTotal);
        totalSavings = totalSavings.plus(savings);

        pricedItems.push({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.pricePro!,
          wasProPrice: true,
          subtotal: proTotal.toNumber(),
          proAllowanceUsed: proTotal.toNumber(),
        });
      } else if (remainingAllowance.gt(0)) {
        // Allowance parcial → precio normal (simplificamos: o todo PRO o todo normal)
        // Para items que exceden parcialmente el allowance, pagamos precio normal
        pricedItems.push({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.price,
          wasProPrice: false,
          subtotal: regularTotal.toNumber(),
          proAllowanceUsed: 0,
        });
      } else {
        // Sin allowance → precio normal
        pricedItems.push({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.price,
          wasProPrice: false,
          subtotal: regularTotal.toNumber(),
          proAllowanceUsed: 0,
        });
      }
    } else {
      // proExempt: precio PRO pero NO descuenta del allowance
      totalSavings = totalSavings.plus(savings);
      pricedItems.push({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.pricePro!,
        wasProPrice: true,
        subtotal: proTotal.toNumber(),
        proAllowanceUsed: 0, // No consume allowance
      });
    }
  }

  return {
    pricedItems,
    totalProAllowanceUsed: totalProAllowanceUsed.toNumber(),
    totalSavings: totalSavings.toNumber(),
  };
}

// -------------------------------------------------------
// Descontar el allowance PRO tras una compra confirmada
// (llamar desde el webhook de Stripe/PayPal)
// -------------------------------------------------------
export async function deductProAllowance(
  userId: string,
  amountToDeduct: number
): Promise<void> {
  if (amountToDeduct <= 0) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      proAllowanceBalance: {
        decrement: amountToDeduct,
      },
    },
  });
}

// -------------------------------------------------------
// Refill del allowance PRO tras renovación de suscripción
// (llamar desde webhook invoice.paid de Stripe)
// -------------------------------------------------------
export async function refillProAllowance(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { proTier: true },
  });

  if (!user?.isPro || !user.proTier) return;

  const tierAllowance = new Decimal(user.proTier.monthlyAllowance);
  const benefits = user.proTier.benefits as Partial<ProBenefits> | null;
  const bonusPercent = benefits?.bonusAllowancePercent ?? 0;

  // Allowance del tier + bonus porcentual configurado por admin
  const bonus = tierAllowance.mul(bonusPercent / 100);
  const newAllowance = tierAllowance.plus(bonus);

  // El saldo no gastado se ACUMULA (no se resetea)
  await prisma.user.update({
    where: { id: userId },
    data: {
      proAllowanceBalance: {
        increment: newAllowance.toNumber(),
      },
    },
  });
}
