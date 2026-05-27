import { Order, OrderItem, ProductVariant, Product } from "@prisma/client";
import { Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/components/ui/button";

type OrderWithItems = Order & {
    items: (OrderItem & {
        variant: ProductVariant & { product: Product };
    })[];
};

export default function RecentOrders({ orders }: { orders: OrderWithItems[] }) {
    if (orders.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-[rgba(186,215,247,0.12)] rounded-[12px]">
                <Package className="w-10 h-10 text-interstellar-gray mx-auto mb-3 opacity-50" />
                <p className="text-body text-whisper-blue">Aún no has realizado ningún pedido.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {orders.map((order) => {
                let statusColor = "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
                let StatusIcon = Clock;

                if (order.status === "PAID" || order.status === "PROCESSING") {
                    statusColor = "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20";
                    StatusIcon = CheckCircle;
                } else if (order.status === "CANCELLED") {
                    statusColor = "text-red-400 bg-red-500/10 border-red-500/20";
                    StatusIcon = XCircle;
                }

                return (
                    <div
                        key={order.id}
                        className="group rounded-[12px] bg-[rgba(186,214,247,0.02)] border border-[rgba(186,215,247,0.08)] shadow-subtle-3 p-5 hover:border-[rgba(186,215,247,0.18)] transition-colors"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-[rgba(186,214,247,0.06)] border border-[rgba(186,215,247,0.1)] flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4 text-arctic-mist" />
                                </div>
                                <div>
                                    <p className="text-body font-medium text-ghost-white">
                                        Pedido #{order.orderNumber}
                                    </p>
                                    <p className="text-caption text-whisper-blue">
                                        {new Date(order.createdAt).toLocaleDateString("es-ES", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-caption font-bold w-fit",
                                statusColor
                            )}>
                                <StatusIcon className="w-3 h-3" />
                                <span>{order.status}</span>
                            </div>
                        </div>

                        <div className="border-t border-[rgba(186,215,247,0.06)] pt-4 flex justify-between items-end">
                            <div className="space-y-1.5">
                                <p className="text-caption text-whisper-blue">Artículos:</p>
                                <div className="flex -space-x-2 overflow-hidden">
                                    {order.items.slice(0, 4).map((item) => (
                                        <div
                                            key={item.id}
                                            className="relative inline-flex h-8 w-8 rounded-full ring-2 ring-midnight-abyss bg-[rgba(186,214,247,0.08)] items-center justify-center text-caption font-bold text-arctic-mist"
                                        >
                                            {item.variant.product.title.charAt(0)}
                                        </div>
                                    ))}
                                    {order.items.length > 4 && (
                                        <div className="relative inline-flex h-8 w-8 rounded-full ring-2 ring-midnight-abyss bg-[rgba(186,214,247,0.06)] items-center justify-center text-caption text-whisper-blue">
                                            +{order.items.length - 4}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-caption text-whisper-blue mb-1">Total Pagado</p>
                                <p className="text-subheading font-aeonikpro font-medium text-ghost-white">
                                    {Number(order.total).toFixed(2)}€
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
