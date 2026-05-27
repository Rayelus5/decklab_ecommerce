import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";

// -------------------------------------------------------
// Tipos
// -------------------------------------------------------
export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    type: string;
    value: number;
  };
  error?: string;
}

export interface CouponApplyResult {
  discount: number;
  finalTotal: number;
}

// -------------------------------------------------------
// Validar un código de cupón
// -------------------------------------------------------
export async function validateCoupon(
  code: string,
  userId: string,
  orderTotal: number,
  productIds?: string[],
  categoryIds?: string[]
): Promise<CouponValidationResult> {
  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.toUpperCase().trim(),
      isActive: true,
    },
  });

  if (!coupon) {
    return { valid: false, error: "Código de cupón no válido" };
  }

  // Verificar expiración
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { valid: false, error: "Este cupón ha expirado" };
  }

  // Verificar usos globales máximos
  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
    return { valid: false, error: "Este cupón ha alcanzado su límite de usos" };
  }

  // Verificar usos por usuario
  if (coupon.maxUsesPerUser !== null) {
    const userUsageCount = await prisma.order.count({
      where: {
        userId,
        couponCode: coupon.code,
        status: { not: "CANCELLED" },
      },
    });
    if (userUsageCount >= coupon.maxUsesPerUser) {
      return { valid: false, error: "Ya has usado este cupón el máximo de veces permitidas" };
    }
  }

  // Verificar pedido mínimo
  if (coupon.minOrderAmount !== null) {
    const minAmount = Number(coupon.minOrderAmount);
    if (orderTotal < minAmount) {
      return {
        valid: false,
        error: `El pedido mínimo para este cupón es ${minAmount.toFixed(2)}€`,
      };
    }
  }

  // Verificar aplicabilidad por producto/categoría
  if (coupon.productIds.length > 0 && productIds) {
    const hasValidProduct = productIds.some((id) =>
      coupon.productIds.includes(id)
    );
    if (!hasValidProduct) {
      return { valid: false, error: "Este cupón no aplica a ningún producto de tu carrito" };
    }
  }

  if (coupon.categoryIds.length > 0 && categoryIds) {
    const hasValidCategory = categoryIds.some((id) =>
      coupon.categoryIds.includes(id)
    );
    if (!hasValidCategory) {
      return { valid: false, error: "Este cupón no aplica a ninguna categoría de tu carrito" };
    }
  }

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
    },
  };
}

// -------------------------------------------------------
// Calcular el descuento aplicado por un cupón
// -------------------------------------------------------
export function applyCoupon(
  orderTotal: number,
  couponType: string,
  couponValue: number
): CouponApplyResult {
  const total = new Decimal(orderTotal);
  const value = new Decimal(couponValue);

  let discount: Decimal;

  if (couponType === "PERCENT") {
    discount = total.mul(value.div(100));
  } else {
    // FIXED
    discount = Decimal.min(value, total); // No puede descuento > total
  }

  const finalTotal = total.minus(discount);

  return {
    discount: discount.toDecimalPlaces(2).toNumber(),
    finalTotal: Decimal.max(0, finalTotal).toDecimalPlaces(2).toNumber(),
  };
}

// -------------------------------------------------------
// Incrementar el contador de usos de un cupón
// (llamar desde el webhook tras confirmar el pago)
// -------------------------------------------------------
export async function incrementCouponUsage(couponId: string): Promise<void> {
  await prisma.coupon.update({
    where: { id: couponId },
    data: { usesCount: { increment: 1 } },
  });
}
