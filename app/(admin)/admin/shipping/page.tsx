import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ShippingManager } from "./shipping-manager";

export const metadata: Metadata = { title: "Envíos — DECKLAB Admin" };

export default async function AdminShippingPage() {
  const rates = await prisma.shippingRate.findMany({
    orderBy: [{ region: "asc" }, { type: "asc" }, { minWeight: "asc" }],
  });

  const serialized = rates.map((r) => ({ ...r, price: Number(r.price) }));

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-snow">Tarifas de envío</h1>
        <p className="text-slate-300 text-sm mt-1">
          Gestiona las tarifas por peso, región y tipo de envío. El peso se expresa en gramos.
        </p>
      </div>
      <ShippingManager initialRates={serialized} />
    </div>
  );
}
