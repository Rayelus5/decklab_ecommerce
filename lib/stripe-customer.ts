import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve el Stripe Customer ID del usuario.
 * Si aún no tiene uno, crea el cliente en Stripe, guarda el ID en la BD y lo devuelve.
 * Así cada usuario tiene UN SOLO cliente en Stripe, sin duplicados.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, name: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Crear cliente en Stripe
  const customer = await stripe.customers.create({
    email,
    name: name ?? user?.name ?? undefined,
    metadata: { userId },
  });

  // Guardar en BD para futuros checkouts
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
