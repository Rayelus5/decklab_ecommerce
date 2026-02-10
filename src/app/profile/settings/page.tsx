"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Save, Lock, User, AlertTriangle, Trash2 } from "lucide-react";
import { updateProfile, changePassword } from "@/actions/user-settings";
import Loader from "@/components/ui/loader";
import { deleteAccount } from "@/actions/delete-account";

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPass, setLoadingPass] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoadingProfile(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const res = await updateProfile(formData);

        if (res.success) {
            await update(); // Actualizar sesión en cliente
            setMessage({ type: 'success', text: res.success });
        } else {
            setMessage({ type: 'error', text: res.error || "Error" });
        }
        setLoadingProfile(false);
    };

    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoadingPass(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const res = await changePassword(formData);

        if (res.success) {
            setMessage({ type: 'success', text: res.success });
            (e.target as HTMLFormElement).reset();
        } else {
            setMessage({ type: 'error', text: res.error || "Error" });
        }
        setLoadingPass(false);
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-8">
                <ArrowLeft className="w-4 h-4" /> Volver al Perfil
            </Link>

            <h1 className="text-3xl font-bold text-white mb-8">Ajustes de Cuenta</h1>

            {message && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.text}
                </div>
            )}

            {/* 1. Datos Personales */}
            <section className="bg-card border border-white/10 rounded-2xl p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" /> Datos Personales
                </h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="text-xs uppercase font-bold text-muted-foreground">Nombre</label>
                        <input
                            name="name"
                            defaultValue={session?.user?.name || ""}
                            className="w-full mt-1 bg-input border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs uppercase font-bold text-muted-foreground">Email</label>
                        <input
                            disabled
                            value={session?.user?.email || ""}
                            className="w-full mt-1 bg-white/5 border border-white/5 rounded-lg px-4 py-2 text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">El email no se puede cambiar por seguridad.</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loadingProfile}
                        className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loadingProfile ? <Loader size={16} color="black" /> : <><Save className="w-4 h-4" /> Guardar Cambios</>}
                    </button>
                </form>
            </section>

            {/* 2. Seguridad */}
            <section className="bg-card border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" /> Seguridad
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="text-xs uppercase font-bold text-muted-foreground">Contraseña Actual</label>
                        <input
                            name="currentPassword"
                            type="password"
                            required
                            className="w-full mt-1 bg-input border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs uppercase font-bold text-muted-foreground">Nueva Contraseña</label>
                            <input
                                name="newPassword"
                                type="password"
                                required
                                className="w-full mt-1 bg-input border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-muted-foreground">Repetir Nueva</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                className="w-full mt-1 bg-input border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loadingPass}
                        className="px-6 py-2 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 border border-white/10 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loadingPass ? <Loader size={16} color="white" /> : "Actualizar Contraseña"}
                    </button>
                </form>
            </section>

            {/* ... secciones anteriores ... */}

            {/* 3. ZONA DE PELIGRO */}
            <section className="bg-red-950/10 border border-red-500/20 rounded-2xl p-6 mt-12">
                <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />Eliminar Cuenta
                </h2>

                <p className="text-sm text-red-200/70 mb-6">
                    Esta acción es irreversible. Se borrarán todos tus datos personales,
                    historial de pedidos y se cancelará tu suscripción PRO inmediatamente.
                </p>

                <form
                    action={async () => {
                        // Confirmación nativa simple pero efectiva
                        if (confirm("¿ESTÁS SEGURO? Esta acción no se puede deshacer y perderás tu saldo PRO.")) {
                            await deleteAccount();
                        }
                    }}
                >
                    <button
                        type="submit"
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                    >
                        <Trash2 className="w-4 h-4" />
                        Eliminar mi cuenta permanentemente
                    </button>
                </form>
            </section>
        </div>
    );
}