"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Save, Lock, User, AlertTriangle, Trash2 } from "lucide-react";
import { updateProfile, changePassword } from "@/actions/user-settings";
import { deleteAccount } from "@/actions/delete-account";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPass, setLoadingPass] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoadingProfile(true);

        const formData = new FormData(e.currentTarget);
        const res = await updateProfile(formData);

        if (res.success) {
            await update();
            toast.success(res.success);
        } else {
            toast.error(res.error || "Error al actualizar el perfil.");
        }
        setLoadingProfile(false);
    };

    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoadingPass(true);

        const formData = new FormData(e.currentTarget);
        const res = await changePassword(formData);

        if (res.success) {
            toast.success(res.success);
            (e.target as HTMLFormElement).reset();
        } else {
            toast.error(res.error || "Error al cambiar la contraseña.");
        }
        setLoadingPass(false);
    };

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        await deleteAccount();
    };

    const sectionClass = "rounded-[16px] border border-[rgba(186,215,247,0.12)] bg-[rgba(186,214,247,0.03)] shadow-subtle-4 p-6";
    const labelClass = "block text-caption text-whisper-blue uppercase tracking-wider font-medium mb-1.5";

    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <Link
                href="/profile"
                className="inline-flex items-center gap-2 text-body text-whisper-blue hover:text-ghost-white transition-colors mb-8"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver al Perfil
            </Link>

            <h1 className="text-heading-lg font-aeonikpro font-medium text-ghost-white mb-8">
                Ajustes de Cuenta
            </h1>

            {/* 1. Datos Personales */}
            <section className={`${sectionClass} mb-6`}>
                <h2 className="text-subheading font-medium text-ghost-white mb-5 flex items-center gap-2">
                    <User className="w-4 h-4 text-neon-violet" />
                    Datos Personales
                </h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className={labelClass}>Nombre</label>
                        <Input
                            name="name"
                            defaultValue={session?.user?.name || ""}
                            className="h-11"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Email</label>
                        <Input
                            disabled
                            value={session?.user?.email || ""}
                            className="h-11 opacity-50 cursor-not-allowed"
                        />
                        <p className="text-caption text-interstellar-gray mt-1.5">
                            El email no se puede cambiar por seguridad.
                        </p>
                    </div>
                    <Button
                        type="submit"
                        variant="solid-primary"
                        isLoading={loadingProfile}
                        className="px-6"
                    >
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                    </Button>
                </form>
            </section>

            {/* 2. Seguridad */}
            <section className={`${sectionClass} mb-6`}>
                <h2 className="text-subheading font-medium text-ghost-white mb-5 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-neon-violet" />
                    Seguridad
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className={labelClass}>Contraseña Actual</label>
                        <Input
                            name="currentPassword"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="h-11"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Nueva Contraseña</label>
                            <Input
                                name="newPassword"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="h-11"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Repetir Nueva</label>
                            <Input
                                name="confirmPassword"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="h-11"
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        variant="secondary-outline"
                        isLoading={loadingPass}
                        className="px-6"
                    >
                        Actualizar Contraseña
                    </Button>
                </form>
            </section>

            {/* 3. Zona de Peligro */}
            <section className="rounded-[16px] border border-red-500/20 bg-red-950/8 p-6">
                <h2 className="text-subheading font-medium text-red-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Eliminar Cuenta
                </h2>

                <p className="text-body text-red-200/60 mb-5">
                    Esta acción es irreversible. Se borrarán todos tus datos personales,
                    historial de pedidos y se cancelará tu suscripción PRO inmediatamente.
                </p>

                {!showDeleteConfirm ? (
                    <Button
                        type="button"
                        variant="secondary-outline"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                    >
                        <Trash2 className="w-4 h-4" />
                        Eliminar mi cuenta permanentemente
                    </Button>
                ) : (
                    <div className="space-y-3 p-4 rounded-[10px] bg-red-500/5 border border-red-500/20">
                        <p className="text-body font-medium text-red-300">
                            ¿Estás completamente seguro? Esta acción no se puede deshacer y perderás tu saldo PRO.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="secondary-outline"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1"
                                disabled={deletingAccount}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleDeleteAccount}
                                isLoading={deletingAccount}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 rounded-md"
                            >
                                <Trash2 className="w-4 h-4" />
                                Sí, eliminar cuenta
                            </Button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
