import { PublicNavbar } from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/ui/page-transition";

/**
 * Layout de las páginas públicas (landing y /legal).
 *
 * Mismo aspecto que (store)/layout.tsx pero SIN auth(): leer la sesión aquí
 * haría dinámicas estas páginas y cada visita de un bot costaría CPU en Vercel.
 * La sesión se lee en el cliente dentro de <PublicNavbar />.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-void-black">
      <PublicNavbar />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
