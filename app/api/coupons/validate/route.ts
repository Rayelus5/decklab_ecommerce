import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateCoupon, applyCoupon } from "@/lib/coupon";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { code, subtotal } = body as { code: string; subtotal: number };

    if (!code?.trim()) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    const result = await validateCoupon(code.trim().toUpperCase(), session.user.id, subtotal);

    if (!result.valid || !result.coupon) {
      return NextResponse.json({ error: result.error ?? "Cupón inválido" }, { status: 400 });
    }

    // Calcular el descuento
    const { discount } = applyCoupon(subtotal, result.coupon.type, result.coupon.value);

    return NextResponse.json({
      valid: true,
      discount,
      coupon: result.coupon,
    });
  } catch (error) {
    console.error("[COUPON VALIDATE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
