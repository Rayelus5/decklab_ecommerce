import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, MapPin, Trash2 } from "lucide-react";
import { addAddress, deleteAddress } from "@/actions/addresses"; // Actions que acabamos de crear

const prisma = new PrismaClient();

export default async function AddressesPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const addresses = await prisma.address.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white">
                    <ArrowLeft className="w-4 h-4" /> Volver al Perfil
                </Link>
                <h1 className="text-2xl font-bold text-white">Mis Direcciones</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Formulario Nueva Dirección */}
                <div className="bg-card border border-white/10 rounded-2xl p-6 h-fit">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" /> Nueva Dirección
                    </h2>
                    <form action={addAddress} className="space-y-4">
                        <div>
                            <label className="text-xs uppercase font-bold text-muted-foreground">Etiqueta (Ej. Casa, Oficina)</label>
                            <input name="label" required placeholder="Casa" className="w-full mt-1 bg-input border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none" />
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-muted-foreground">Dirección</label>
                            <input name="line1" required placeholder="Calle Principal 123" className="w-full mt-1 bg-input border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase font-bold text-muted-foreground">Ciudad</label>
                                <input name="city" required className="w-full mt-1 bg-input border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none" />
                            </div>
                            <div>
                                <label className="text-xs uppercase font-bold text-muted-foreground">CP</label>
                                <input name="postalCode" required className="w-full mt-1 bg-input border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-muted-foreground">País</label>
                            <select name="country" className="w-full mt-1 bg-input border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none">
                                <option value="ES">España</option>
                                <option value="FR">Francia</option>
                                <option value="PT">Portugal</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-muted-foreground">Teléfono</label>
                            <input name="phone" placeholder="+34 600..." className="w-full mt-1 bg-input border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none" />
                        </div>

                        <button type="submit" className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition">
                            Guardar Dirección
                        </button>
                    </form>
                </div>

                {/* Listado */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white mb-4">Guardadas</h2>
                    {addresses.length === 0 ? (
                        <p className="text-muted-foreground text-sm italic">No tienes direcciones guardadas.</p>
                    ) : (
                        addresses.map((addr) => (
                            <div key={addr.id} className="group relative bg-white/5 border border-white/5 rounded-xl p-5 hover:border-white/20 transition">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span className="font-bold text-white">{addr.label}</span>
                                    </div>

                                    {/* Botón Borrar (Server Action directo) */}
                                    <form action={deleteAddress.bind(null, addr.id)}>
                                        <button className="text-muted-foreground hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-0.5">
                                    <p>{addr.line1}</p>
                                    <p>{addr.postalCode}, {addr.city}</p>
                                    <p>{addr.country === 'ES' ? 'España' : addr.country}</p>
                                    {addr.phone && <p className="text-xs mt-1 opacity-70">Tel: {addr.phone}</p>}
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}