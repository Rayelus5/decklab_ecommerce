import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import { Providers } from "@/components/providers"; // <--- Importamos
import { auth } from "@/lib/auth"; // <--- Importamos auth para obtener sesión server-side

export const metadata: Metadata = {
  title: "DECKLAB SHOP",
  description: "Tienda exclusiva para miembros PRO",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Obtenemos la sesión en el servidor
  const session = await auth();

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