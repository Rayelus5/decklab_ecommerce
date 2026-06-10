import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getUserGamificationData } from "@/lib/gamification";
import { GamificationTabs } from "@/components/gamification/gamification-tabs";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Mis Cajas — DECKLAB",
};

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile/inventory");

  const data = await getUserGamificationData(session.user.id);

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-white">Error cargando el inventario.</p>
      </div>
    );
  }

  const { user, eggs, incubator, pokemons } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      {/* Header */}
      <div>
        <Link
          href="/profile"
          className="text-slate-300 hover:text-snow text-sm flex items-center gap-1 mb-4 transition-colors"
        >
          <ChevronLeft size={16} /> Volver al perfil
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-snow">Mis Cajas</h1>
            <p className="text-slate-300 text-sm mt-1">
              Gestiona tus huevos y los Pokémon que has coleccionado.
            </p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="text-amber-400 font-bold">{user?.pokemonedas || 0}</span>
            <span className="text-amber-500/80 text-sm font-medium">Pokemonedas</span>
          </div>
        </div>
      </div>

      <GamificationTabs
        userId={session.user.id}
        eggs={eggs}
        incubator={incubator}
        pokemons={pokemons}
        boxesUnlocked={user?.boxesUnlocked || 8}
        balance={Number(user?.proAllowanceBalance || 0)}
        pokemonedas={user?.pokemonedas || 0}
      />
    </div>
  );
}
