import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { SettingsClient } from "@/components/profile/settings-client";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Configuración — DECKLAB",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      password: true,
      isPro: true,
      proSince: true,
      proSubscriptionId: true,
      proTier: { select: { name: true } },
    },
  });

  if (!user) redirect("/login");

  // Check if Stripe subscription is set to cancel at period end
  let cancelAtPeriodEnd = false;
  if (user.proSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(user.proSubscriptionId);
      cancelAtPeriodEnd = sub.cancel_at_period_end;
    } catch {
      // Subscription might not exist anymore
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="cursor-pointer p-1.5 rounded-[8px] text-slate-300 hover:text-snow hover:bg-white/6 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-snow">Configuración</h1>
          <p className="text-slate-300 text-sm mt-0.5">Gestiona tu cuenta y suscripción</p>
        </div>
      </div>

      <SettingsClient
        name={user.name}
        email={user.email ?? ""}
        hasPassword={!!user.password}
        isPro={user.isPro}
        proSince={user.proSince}
        proTierName={user.proTier?.name ?? null}
        subscriptionId={user.proSubscriptionId}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
      />
    </div>
  );
}
