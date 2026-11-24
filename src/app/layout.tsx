import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "DECKLAB SHOP",
  description: "Tienda exclusiva para miembros PRO",
  // Proyecto privado: no indexar en buscadores ni en crawlers de IA
  robots: { index: false, follow: false, nocache: true },
};

// IMPORTANTE: no leer la sesión (auth(), cookies(), headers()) en este layout.
// Haría dinámicas TODAS las rutas (incluida la 404) y dispararía el consumo de CPU.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        {/* Envolvemos todo en Providers */}
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          
          <footer className="border-t border-white/10 py-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Decklab Shop. Todos los derechos reservados.
          </footer>
        </Providers>
      </body>
    </html>
  );
}