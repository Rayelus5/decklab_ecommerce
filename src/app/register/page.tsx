"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/actions/register"; // Importamos la server action
import Loader from "@/components/ui/loader";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            setLoading(false);
            return;
        }

        // Llamada al Server Action
        const res = await registerUser(formData);

        if (res?.error) {
            setError(res.error);
            setLoading(false);
        } else {
            // Éxito: Redirigir al login
            router.push("/login?registered=true");
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-white/5 shadow-2xl">

                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <UserPlus className="w-6 h-6" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                        Crear cuenta
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Únete a Decklab Shop para acceder a ventajas exclusivas
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Nombre</label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full rounded-lg bg-input border border-transparent focus:border-primary px-4 py-3 text-sm text-white outline-none transition-all"
                            placeholder="Tu nombre completo"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full rounded-lg bg-input border border-transparent focus:border-primary px-4 py-3 text-sm text-white outline-none transition-all"
                            placeholder="nombre@ejemplo.com"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Contraseña</label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="w-full rounded-lg bg-input border border-transparent focus:border-primary px-4 py-3 text-sm text-white outline-none transition-all"
                                placeholder="••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Repetir</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                className="w-full rounded-lg bg-input border border-transparent focus:border-primary px-4 py-3 text-sm text-white outline-none transition-all"
                                placeholder="••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-white text-black font-bold py-3 hover:bg-gray-200 transition-colors disabled:opacity-50 flex justify-center"
                    >
                        {loading ? <Loader size={20} color="black" /> : "Registrarse"}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-white hover:underline font-medium">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}