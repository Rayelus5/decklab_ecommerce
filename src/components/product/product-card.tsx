import Link from "next/link";
import Image from "next/image";
import { Product, ProductImage, ProductVariant, Category } from "@prisma/client";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Tipo extendido para incluir relaciones
type ProductWithRelations = Product & {
    images: ProductImage[];
    variants: ProductVariant[];
    category: Category | null;
};

interface ProductCardProps {
    product: ProductWithRelations;
}

export function ProductCard({ product }: ProductCardProps) {
    // Tomamos la primera variante para mostrar precios "desde"
    const mainVariant = product.variants[0];
    const hasProPrice = mainVariant?.pricePro !== null;
    const image = product.images[0]?.url || "/placeholder.jpg";

    return (
        <Link href={`/products/${product.slug}`} className="group block h-full">
            <Card variant="glassy-feature" className="relative h-full flex flex-col overflow-hidden transition-all duration-300 hover:border-white/20 p-0 rounded-2xl">

                {/* Imagen con efecto Zoom suave */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[rgba(0,0,0,0.5)]">
                    <Image
                        src={image}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* Badge PRO si aplica */}
                    {hasProPrice && (
                        <div className="absolute top-3 right-3">
                            <Badge variant="status" className="px-2 py-1 text-[10px] bg-black/60 backdrop-blur-md">
                                <ShieldCheck className="w-3 h-3 text-neon-violet" />
                                <span className="text-neon-violet">PRO</span>
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 text-caption text-arctic-mist uppercase tracking-wider">
                        {product.category?.name || "General"}
                    </div>

                    <h3 className="mb-2 text-subheading font-bold text-ghost-white leading-tight group-hover:text-celestial-light transition-colors">
                        {product.title}
                    </h3>

                    <div className="mt-auto pt-4 flex items-end gap-3 border-t border-white/5">
                        {hasProPrice ? (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-whisper-blue font-dotdigital">ESTÁNDAR</span>
                                    <span className="text-body text-arctic-mist line-through decoration-white/30">
                                        {Number(mainVariant.price).toFixed(2)}€
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-neon-violet font-bold font-dotdigital">PRO</span>
                                    <span className="text-heading font-bold text-ghost-white">
                                        {Number(mainVariant.pricePro).toFixed(2)}€
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col">
                                <span className="text-heading font-bold text-ghost-white">
                                    {Number(mainVariant.price).toFixed(2)}€
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </Link>
    );
}