import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { Mail, MapPin } from "lucide-react";
import ProStatusCard from "@/components/profile/pro-status-card";
import RecentOrders from "@/components/profile/recent-orders";
import { SignOutButton } from "@/components/layout/auth-buttons";
import Link from "next/link";
import { cn } from "@/components/ui/button";

const prisma = new PrismaClient();

async function getUserProfile(userId: string) {
    return await prisma.user.findUnique({
        where: { id: userId },
        include: {
            proTier: true,
            orders: {
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    items: {
                        include: {
                            variant: {
                                include: { product: true },
                            },
                        },
                    },
                },
            },
            addresses: {
                where: { isDefault: true },
                take: 1,
            },
        },
    });
}

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login?callbackUrl=/profile");
    }

    const user = await getUserProfile(session.user.id);

    if (!user) {
        return <div className="text-whisper-blue p-12 text-center">Error cargando perfil.</div>;
    }

    const defaultAddress = user.addresses[0];

    return (
        <div className="min-h-screen container mx-auto px-4 py-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-[rgba(186,215,247,0.12)] pb-8">
                <div className="flex items-center gap-5">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-neon-violet/20 to-midnight-abyss flex items-center justify-center border border-[rgba(186,215,247,0.15)] shadow-subtle-4 shrink-0">
                        <span className="text-3xl font-aeonikpro font-medium text-ghost-white/60">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-heading-lg font-aeonikpro font-medium text-ghost-white">
                            {user.name}
                        </h1>
                        <div className="flex items-center gap-2 text-whisper-blue mt-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="text-body">{user.email}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/profile/settings"
                        className={cn(
                            "inline-flex items-center justify-center h-10 px-4 text-body font-medium text-arctic-mist",
                            "bg-transparent border border-[rgba(186,215,247,0.12)] rounded-pill",
                            "hover:bg-white/5 transition-colors"
                        )}
                    >
                        Editar Perfil
                    </Link>
                    <div className="border border-red-500/20 rounded-pill overflow-hidden hover:border-red-500/40 transition-colors">
                        <SignOutButton />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Columna izquierda */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Dirección principal */}
                    <div className="rounded-[16px] border border-[rgba(186,215,247,0.12)] bg-[rgba(186,214,247,0.03)] shadow-subtle-4 p-6">
                        <h3 className="text-body-lg font-medium text-ghost-white mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-neon-violet" />
                            Dirección Principal
                        </h3>

                        {defaultAddress ? (
                            <div className="text-body text-whisper-blue space-y-1">
                                <p className="text-ghost-white font-medium">{user.name}</p>
                                <p>{defaultAddress.line1}</p>
                                {defaultAddress.line2 && <p>{defaultAddress.line2}</p>}
                                <p>{defaultAddress.postalCode}, {defaultAddress.city}</p>
                                <p>{defaultAddress.country === "ES" ? "España" : defaultAddress.country}</p>
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <p className="text-body text-whisper-blue">No tienes direcciones guardadas.</p>
                                <p className="text-caption text-interstellar-gray mt-1">
                                    Se guardará automáticamente al hacer tu primer pedido.
                                </p>
                            </div>
                        )}

                        <Link
                            href="/profile/addresses"
                            className={cn(
                                "mt-4 block w-full py-2 text-caption font-bold text-center text-arctic-mist",
                                "border border-[rgba(186,215,247,0.12)] hover:bg-white/5 rounded-[8px] transition-colors"
                            )}
                        >
                            Gestionar Direcciones
                        </Link>
                    </div>

                    {/* Opciones de cuenta */}
                    <div className="rounded-[16px] border border-[rgba(186,215,247,0.12)] bg-[rgba(186,214,247,0.03)] overflow-hidden">
                        <Link
                            href="/profile/settings"
                            className="block w-full px-4 py-3 text-body text-whisper-blue hover:text-ghost-white hover:bg-white/5 transition-colors border-b border-[rgba(186,215,247,0.06)]"
                        >
                            Cambiar Contraseña
                        </Link>
                        <Link
                            href="/profile/settings"
                            className="block w-full px-4 py-3 text-body text-whisper-blue hover:text-ghost-white hover:bg-white/5 transition-colors border-b border-[rgba(186,215,247,0.06)]"
                        >
                            Preferencias de Email
                        </Link>
                        <Link
                            href="/profile/settings"
                            className="block w-full px-4 py-3 text-body text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            Eliminar Cuenta
                        </Link>
                    </div>
                </div>

                {/* Columna derecha */}
                <div className="lg:col-span-8 space-y-8">

                    <section>
                        <h3 className="text-subheading font-medium text-ghost-white mb-4">
                            Membresía &amp; Saldo
                        </h3>
                        <ProStatusCard user={user} />
                    </section>

                    <section>
                        <h3 className="text-subheading font-medium text-ghost-white mb-4">
                            Historial de Pedidos
                        </h3>
                        <RecentOrders orders={user.orders} />
                    </section>
                </div>
            </div>
        </div>
    );
}
