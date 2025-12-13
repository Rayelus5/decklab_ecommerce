import Link from "next/link";
import Image from "next/image";
import { Product, ProductImage, ProductVariant, Category } from "@prisma/client";
import { ShieldCheck } from "lucide-react";

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
            <div className="relative h-full flex flex-col overflow-hidden rounded-xl border border-white/5 bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">

                {/* Imagen con efecto Zoom suave */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary/50">
                    <Image
                        src={image}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* Badge PRO si aplica */}
                    {hasProPrice && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-pro backdrop-blur-md border border-pro/20">
                            <ShieldCheck className="w-3 h-3" />
                            <span>PRO</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {product.category?.name || "General"}
                    </div>

                    <h3 className="mb-2 text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors">
                        {product.title}
                    </h3>

                    <div className="mt-auto pt-2 flex items-end gap-2">
                        {hasProPrice ? (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground uppercase">Precio</span>
                                    <span className="text-sm text-muted-foreground line-through decoration-white/30">
                                        {Number(mainVariant.price).toFixed(2)}€
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-pro font-bold uppercase">Precio PRO</span>
                                    <span className="text-xl font-bold text-white">
                                        {Number(mainVariant.pricePro).toFixed(2)}€
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-white">
                                    {Number(mainVariant.price).toFixed(2)}€
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}