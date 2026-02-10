import { Order, OrderItem, ProductVariant, Product } from "@prisma/client";
import { Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Tipo complejo para incluir relaciones
type OrderWithItems = Order & {
    items: (OrderItem & {
        variant: ProductVariant & { product: Product }
    })[];
};

export default function RecentOrders({ orders }: { orders: OrderWithItems[] }) {
    if (orders.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Aún no has realizado ningún pedido.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => {
                // Formatear estado
                let statusColor = "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
                let StatusIcon = Clock;

                if (order.status === "PAID" || order.status === "PROCESSING") {
                    statusColor = "text-green-500 bg-green-500/10 border-green-500/20";
                    StatusIcon = CheckCircle;
                } else if (order.status === "CANCELLED") {
                    statusColor = "text-red-500 bg-red-500/10 border-red-500/20";
                    StatusIcon = XCircle;
                }

                return (
                    <div key={order.id} className="group rounded-xl bg-card border border-white/5 p-5 hover:border-white/10 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Pedido #{order.orderNumber}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(order.createdAt).toLocaleDateString("es-ES", {
                                            day: "numeric", month: "long", year: "numeric"
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold w-fit", statusColor)}>
                                <StatusIcon className="w-3 h-3" />
                                <span>{order.status}</span>
                            </div>
                        </div>

                        <div className="border-t border-white/5 pt-4 flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Artículos:</p>
                                <div className="flex -space-x-2 overflow-hidden">
                                    {order.items.slice(0, 4).map((item, i) => (
                                        <div key={item.id} className="relative inline-block h-8 w-8 rounded-full ring-2 ring-background bg-zinc-800 flex items-center justify-center text-[10px] text-white font-bold">
                                            {/* Idealmente aquí iría la imagen pequeña del producto */}
                                            {item.variant.product.title.charAt(0)}
                                        </div>
                                    ))}
                                    {order.items.length > 4 && (
                                        <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-background bg-zinc-700 flex items-center justify-center text-[10px] text-white">
                                            +{order.items.length - 4}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-1">Total Pagado</p>
                                <p className="text-xl font-bold text-white">{Number(order.total).toFixed(2)}€</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}