import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/product/product-card";
import { ArrowRight, Truck, ShieldCheck, Zap, Star } from "lucide-react";

const prisma = new PrismaClient();

// Función para obtener productos destacados o recientes
async function getFeaturedProducts() {
  // 1. Intentar buscar marcados como 'featured'
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

  // 2. Si no hay destacados, traer los últimos 4
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
      <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden border-b border-white/10">
        {/* Background Image con Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1534078362425-387ae9668c17?q=80&w=2669&auto=format&fit=crop"
            alt="Hero Background Deck"
            fill
            className="object-cover opacity-40 hover:scale-105 transition-transform duration-[20s]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-primary mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Star className="w-3 h-3 fill-current" />
            <span>La tienda #1 para Cardistry & Magia</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            DOMINA EL <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
              ARTE DE LAS CARTAS
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Descubre las barajas más exclusivas, gimmicks imposibles y accesorios premium.
            Únete a nuestra comunidad PRO y accede a precios que parecen magia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            <Link
              href="/products"
              className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              Ver Catálogo <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-full border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              Suscripción PRO
            </Link>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-20 border-b border-white/10 bg-black/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-white/5 hover:border-primary/20 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Envíos Rápidos</h3>
              <p className="text-muted-foreground text-sm">
                Envíos nacionales e internacionales calculados por peso. Ordinario o Certificado con Correos.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-white/5 hover:border-primary/20 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-pro mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sistema PRO</h3>
              <p className="text-muted-foreground text-sm">
                Desbloquea precios exclusivos y utiliza tu cupo mensual para ahorrar al máximo en cada pedido.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-white/5 hover:border-primary/20 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Calidad Premium</h3>
              <p className="text-muted-foreground text-sm">
                Selección curada de las mejores marcas: Theory11, Ellusionist, Virtuoso y más.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURED PRODUCTS --- */}
      <section className="py-24 container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Novedades Destacadas</h2>
            <p className="text-muted-foreground">Lo último que ha llegado a nuestros almacenes.</p>
          </div>
          <Link href="/products" className="hidden md:flex items-center gap-2 text-sm font-medium text-white hover:text-primary transition-colors">
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
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <p className="text-muted-foreground">Aún no hay productos destacados.</p>
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-white border-b border-white pb-0.5">
            Ver todo el catálogo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* --- PRO CTA BANNER --- */}
      <section className="py-24 relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 bg-pro/10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center bg-card/50 backdrop-blur-xl border border-pro/30 rounded-3xl p-8 md:p-16 shadow-[0_0_50px_rgba(139,92,246,0.15)]">
            <div className="inline-block p-3 rounded-full bg-pro/20 text-pro mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Deja de pagar el precio completo
            </h2>

            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Con Decklab PRO, accedes a precios de distribuidor.
              Elige tu nivel, obtén tu cupo mensual y empieza a ahorrar desde la primera baraja.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-4 rounded-xl bg-pro text-white font-bold hover:bg-pro/90 transition-all shadow-lg shadow-pro/20"
              >
                Crear Cuenta Gratis
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 rounded-xl border border-white/10 bg-black/40 text-white font-bold hover:bg-black/60 transition-all"
              >
                Ver Niveles PRO
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}