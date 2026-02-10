import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { User, Mail, MapPin, LogOut, Link } from "lucide-react";
import ProStatusCard from "@/components/profile/pro-status-card";
import RecentOrders from "@/components/profile/recent-orders";
import { SignOutButton } from "@/components/layout/auth-buttons";

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
                                include: { product: true }
                            }
                        }
                    }
                }
            },
            addresses: {
                where: { isDefault: true },
                take: 1
            }
        }
    });
}

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login?callbackUrl=/profile");
    }

    const user = await getUserProfile(session.user.id);

    if (!user) {
        // Caso raro: sesión activa pero usuario borrado
        return <div>Error cargando perfil.</div>;
    }

    const defaultAddress = user.addresses[0];

    return (
        <div className="min-h-screen container mx-auto px-4 py-12">

            {/* Header simple */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/10 pb-8">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 flex items-center justify-center border-2 border-white/10 shadow-xl">
                        <span className="text-3xl font-bold text-white/50">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{user.email}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/profile/settings"
                        className="px-4 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition"
                    >
                        Editar Perfil
                    </Link>
                    <div className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg">
                        <SignOutButton />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* COLUMNA IZQUIERDA (Info y Dirección) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Tarjeta de Dirección */}
                    <div className="rounded-2xl border border-white/10 bg-card p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Dirección Principal
                        </h3>

                        {defaultAddress ? (
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p className="text-white font-medium">{user.name}</p>
                                <p>{defaultAddress.line1}</p>
                                {defaultAddress.line2 && <p>{defaultAddress.line2}</p>}
                                <p>{defaultAddress.postalCode}, {defaultAddress.city}</p>
                                <p>{defaultAddress.country === "ES" ? "España" : defaultAddress.country}</p>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-sm text-muted-foreground">
                                <p>No tienes direcciones guardadas.</p>
                                <p className="text-xs opacity-50 mt-1">Se guardará automáticamente al hacer tu primer pedido.</p>
                            </div>
                        )}
                        <Link
                            href="/profile/addresses"
                            className="mt-4 block w-full py-2 text-xs font-bold text-center text-white border border-white/10 hover:bg-white/5 rounded-lg transition"
                        >
                            Gestionar Direcciones
                        </Link>
                    </div>

                    {/* Opciones de cuenta (Links dummy) */}
                    <div className="rounded-2xl border border-white/10 bg-card p-2">
                        <Link
                            href="/profile/settings"
                            className="block w-full text-left px-4 py-3 text-sm text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition"
                        >
                            Cambiar Contraseña
                        </Link>
                        <Link
                            href="/profile/settings"
                            className="block w-full text-left px-4 py-3 text-sm text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition"
                        >
                            Preferencias de Email
                        </Link>
                        <Link
                            href="/profile/settings"
                            className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                            Eliminar Cuenta
                        </Link>
                    </div>
                </div>

                {/* COLUMNA DERECHA (PRO Dashboard y Pedidos) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* 1. ESTATUS PRO */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4">Membresía & Saldo</h3>
                        <ProStatusCard user={user} />
                    </section>

                    {/* 2. HISTORIAL DE PEDIDOS */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Historial de Pedidos</h3>
                            {/* Podría ser un Link a /orders si hubieran muchos */}
                        </div>
                        <RecentOrders orders={user.orders} />
                    </section>

                </div>
            </div>
        </div>
    );
}