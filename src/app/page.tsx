import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/product/product-card";
import { ArrowRight, Truck, ShieldCheck, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const prisma = new PrismaClient();

async function getFeaturedProducts() {
  let products = await prisma.product.findMany({
    where: {
      isFeatured: true,
      isArchived: false
    },
    take: 4,
    include: {
      images: true,
      category: true,
      variants: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (products.length === 0) {
    products = await prisma.product.findMany({
      where: { isArchived: false },
      take: 4,
      include: {
        images: true,
        category: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  return products;
}

export default async function Home() {
  const products = await getFeaturedProducts();

  return (
    <div className="flex flex-col min-h-screen">

      {/* --- HERO SECTION --- */}
      <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden border-b border-white/5">
        {/* Background Image con Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1534078362425-387ae9668c17?q=80&w=2669&auto=format&fit=crop"
            alt="Hero Background Deck"
            fill
            className="object-cover opacity-20 hover:scale-105 transition-transform duration-[20s]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight-abyss via-midnight-abyss/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-midnight-abyss/90 via-transparent to-midnight-abyss/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Badge variant="status" className="px-3 py-1.5 flex gap-2 border border-white/10">
              <Star className="w-4 h-4 fill-current text-celestial-light" />
              <span className="text-body font-untitled-sans">La tienda #1 para Cardistry & Magia</span>
            </Badge>
          </div>

          <h1 className="text-display-xl md:text-7xl lg:text-[80px] font-aeonikpro font-medium tracking-tight text-ghost-white mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 leading-[1.1]">
            DOMINA EL <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ghost-white to-whisper-blue">
              ARTE DE LAS CARTAS
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-heading font-untitled-sans text-arctic-mist mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Descubre las barajas más exclusivas, gimmicks imposibles y accesorios premium.
            Únete a nuestra comunidad PRO y accede a precios que parecen magia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            <Link href="/products">
                <Button variant="solid-primary" size="lg" className="flex items-center gap-2">
                  Ver Catálogo <ArrowRight className="w-5 h-5" />
                </Button>
            </Link>
            <Link href="/pricing">
                <Button variant="secondary-outline" size="lg">
                  Suscripción PRO
                </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-20 border-b border-white/5 bg-midnight-abyss">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card variant="glassy-feature" className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-[rgba(186,214,247,0.06)] flex items-center justify-center text-celestial-light mb-4 shadow-subtle-3">
                <Truck className="w-6 h-6" />
              </div>
              <CardTitle className="mb-2 text-heading">Envíos Rápidos</CardTitle>
              <CardDescription>
                Envíos nacionales e internacionales calculados por peso. Ordinario o Certificado con Correos.
              </CardDescription>
            </Card>

            <Card variant="glassy-feature" className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-neon-violet/10 flex items-center justify-center text-neon-violet mb-4 shadow-subtle-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle className="mb-2 text-heading">Sistema PRO</CardTitle>
              <CardDescription>
                Desbloquea precios exclusivos y utiliza tu cupo mensual para ahorrar al máximo en cada pedido.
              </CardDescription>
            </Card>

            <Card variant="glassy-feature" className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-[rgba(186,214,247,0.06)] flex items-center justify-center text-celestial-light mb-4 shadow-subtle-3">
                <Zap className="w-6 h-6" />
              </div>
              <CardTitle className="mb-2 text-heading">Calidad Premium</CardTitle>
              <CardDescription>
                Selección curada de las mejores marcas: Theory11, Ellusionist, Virtuoso y más.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* --- FEATURED PRODUCTS --- */}
      <section className="py-24 container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-display font-aeonikpro font-medium text-ghost-white mb-2">Novedades Destacadas</h2>
            <p className="text-subheading font-untitled-sans text-whisper-blue">Lo último que ha llegado a nuestros almacenes.</p>
          </div>
          <Link href="/products" className="hidden md:flex items-center gap-2 text-body font-medium text-ghost-white hover:text-celestial-light transition-colors">
            Ver todo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-[16px]">
            <p className="text-whisper-blue text-body">Aún no hay productos destacados.</p>
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link href="/products" className="inline-flex items-center gap-2 text-body font-medium text-ghost-white border-b border-white/20 pb-0.5">
            Ver todo el catálogo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* --- PRO CTA BANNER --- */}
      <section className="py-24 relative overflow-hidden bg-midnight-abyss">
        {/* Fondo decorativo con gradiente */}
        <div className="absolute inset-0 opacity-20" style={{ background: "var(--gradient-twilight-gradient-overlay)" }} />

        <div className="container mx-auto px-4 relative z-10 flex justify-center">
          <Card variant="login-form" className="max-w-4xl w-full text-center p-8 md:p-16 border border-white/5">
            <div className="inline-flex p-4 rounded-full bg-neon-violet/10 text-neon-violet mb-6 shadow-subtle-3">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h2 className="text-display md:text-[56px] font-aeonikpro font-medium text-ghost-white mb-6 leading-tight">
              Deja de pagar el precio completo
            </h2>

            <p className="text-subheading text-arctic-mist mb-10 max-w-2xl mx-auto">
              Con Decklab PRO, accedes a precios de distribuidor.
              Elige tu nivel, obtén tu cupo mensual y empieza a ahorrar desde la primera baraja.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button variant="solid-primary" size="lg" className="w-full sm:w-auto">
                  Crear Cuenta Gratis
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="primary-pill" size="lg" className="w-full sm:w-auto">
                  Ver Niveles PRO
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

    </div>
  );
}