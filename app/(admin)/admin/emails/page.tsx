import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { EmailComposer } from "./email-composer";

export const metadata: Metadata = { title: "Emails — DECKLAB Admin" };

export default async function AdminEmailsPage() {
  const users = await safeQuery(
    () =>
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, isPro: true },
      }),
    [],
    "users.findMany (emails)"
  );

  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isPro: u.isPro,
  }));

  const proCount = serialized.filter((u) => u.isPro).length;

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-snow">Emails</h1>
        <p className="text-slate-300 text-sm mt-1">
          {serialized.length} usuario{serialized.length !== 1 ? "s" : ""} con email ·{" "}
          {proCount} PRO
        </p>
      </div>
      <EmailComposer users={serialized} />
    </div>
  );
}
