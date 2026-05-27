import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DECKLAB — Acceso",
  description: "Accede a DECKLAB, la tienda privada de Pokémon TCG personalizado.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo con gradiente sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,99,99,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Grid pattern de fondo */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-sm relative z-10">{children}</div>
    </div>
  );
}
