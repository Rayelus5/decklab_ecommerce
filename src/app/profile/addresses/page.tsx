import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, MapPin, Trash2 } from "lucide-react";
import { addAddress, deleteAddress } from "@/actions/addresses";

const prisma = new PrismaClient();

export default async function AddressesPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const addresses = await prisma.address.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    const inputClass = "w-full mt-1 bg-[rgba(199,211,234,0.06)] border border-[rgba(186,215,247,0.08)] rounded-[4px] px-[10px] py-2 text-body text-ghost-white placeholder:text-whisper-blue focus:border-celestial-light focus:outline-none focus:ring-1 focus:ring-celestial-light transition-colors";
    const labelClass = "block text-caption text-whisper-blue uppercase tracking-wider font-medium";

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 text-body text-whisper-blue hover:text-ghost-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Perfil
                </Link>
                <h1 className="text-heading font-aeonikpro font-medium text-ghost-white">
                    Mis Direcciones
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Formulario Nueva Dirección */}
                <div className="rounded-[16px] border border-[rgba(186,215,247,0.12)] bg-[rgba(186,214,247,0.03)] shadow-subtle-4 p-6 h-fit">
                    <h2 className="text-subheading font-medium text-ghost-white mb-5 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-neon-violet" />
                        Nueva Dirección
                    </h2>
                    <form action={async (formData) => { await addAddress(formData); }} className="space-y-4">
                        <div>
                            <label className={labelClass}>Etiqueta (Ej. Casa, Oficina)</label>
                            <input name="label" required placeholder="Casa" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Dirección</label>
                            <input name="line1" required placeholder="Calle Principal 123" className={inputClass} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Ciudad</label>
                                <input name="city" required className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>CP</label>
                                <input name="postalCode" required className={inputClass} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>País</label>
                            <select
                                name="country"
                                className={`${inputClass} cursor-pointer`}
                            >
                                <option value="ES">España</option>
                                <option value="FR">Francia</option>
                                <option value="PT">Portugal</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Teléfono</label>
                            <input name="phone" placeholder="+34 600..." className={inputClass} />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2.5 bg-neon-violet text-ghost-white text-body font-medium rounded-md hover:bg-neon-violet/90 transition-colors"
                        >
                            Guardar Dirección
                        </button>
                    </form>
                </div>

                {/* Listado */}
                <div className="space-y-3">
                    <h2 className="text-subheading font-medium text-ghost-white mb-4">Guardadas</h2>
                    {addresses.length === 0 ? (
                        <p className="text-body text-whisper-blue italic">No tienes direcciones guardadas.</p>
                    ) : (
                        addresses.map((addr) => (
                            <div
                                key={addr.id}
                                className="group relative rounded-[12px] bg-[rgba(186,214,247,0.02)] border border-[rgba(186,215,247,0.08)] p-5 hover:border-[rgba(186,215,247,0.18)] transition-colors"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-neon-violet" />
                                        <span className="text-body font-medium text-ghost-white">{addr.label}</span>
                                    </div>

                                    <form action={async () => { await deleteAddress(addr.id); }}>
                                        <button
                                            type="submit"
                                            className="text-interstellar-gray hover:text-red-400 p-1.5 rounded-[6px] hover:bg-red-500/10 transition-colors"
                                            aria-label="Eliminar dirección"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                                <div className="text-body text-whisper-blue space-y-0.5">
                                    <p>{addr.line1}</p>
                                    <p>{addr.postalCode}, {addr.city}</p>
                                    <p>{addr.country === "ES" ? "España" : addr.country}</p>
                                    {addr.phone && (
                                        <p className="text-caption text-interstellar-gray mt-1">
                                            Tel: {addr.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
