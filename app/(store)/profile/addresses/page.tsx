import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { AddressesManager } from "@/components/profile/addresses-manager";

export const metadata: Metadata = {
  title: "Mis direcciones — DECKLAB",
};

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile/addresses");

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      label: true,
      line1: true,
      line2: true,
      city: true,
      postalCode: true,
      province: true,
      country: true,
      phone: true,
      isDefault: true,
    },
  });

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
          <h1 className="text-2xl font-semibold text-snow">Mis direcciones</h1>
          <p className="text-slate-300 text-sm mt-0.5">
            Gestiona tus direcciones de envío
          </p>
        </div>
      </div>

      <AddressesManager initialAddresses={addresses} />
    </div>
  );
}
