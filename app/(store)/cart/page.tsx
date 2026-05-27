import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { CartClient } from "./cart-client";

export const metadata: Metadata = {
  title: "Tu carrito — DECKLAB",
};

export default async function CartPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Leer isPro y proAllowanceBalance directamente desde la BD —
  // no desde el token JWT, que puede estar hasta 5 min desfasado.
  // Así el carrito siempre refleja el estado real del usuario.
  let isPro = false;
  let proAllowanceBalance = 0;

  if (userId) {
    const user = await safeQuery(
      () => prisma.user.findUnique({
        where: { id: userId },
        select: { isPro: true, proAllowanceBalance: true },
      }),
      null,
      "cart.user"
    );
    isPro = user?.isPro ?? false;
    proAllowanceBalance = user?.proAllowanceBalance
      ? Number(user.proAllowanceBalance)
      : 0;
  }

  return <CartClient isPro={isPro} proAllowanceBalance={proAllowanceBalance} />;
}
