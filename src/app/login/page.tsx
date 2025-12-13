"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/ui/loader"; // Nuestro loader personalizado
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Credenciales incorrectas");
            setLoading(false);
        } else {
            router.push("/"); // Redirigir al home
            router.refresh(); // Actualizar sesión en UI
        }
    };

    const handleGoogleLogin = () => {
        setLoading(true);
        signIn("google", { callbackUrl: "/" });
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-white/5 shadow-2xl">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                        Bienvenido de nuevo
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Accede a tu cuenta para gestionar tus pedidos
                    </p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full rounded-lg bg-input border border-transparent focus:border-primary px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-600"
                            placeholder="nombre@ejemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Contraseña</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full rounded-lg bg-input border border-transparent focus:border-primary px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-600"
                            placeholder="••••••••"
                        />
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
                        {loading ? <Loader size={20} color="black" /> : "Iniciar Sesión"}
                    </button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors py-3 text-sm font-medium text-white"
                >
                    {/* Icono Google Simple */}
                    <svg className="h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                    Google
                </button>

                <p className="text-center text-sm text-muted-foreground">
                    ¿No tienes cuenta?{" "}
                    <Link href="/register" className="text-white hover:underline font-medium">
                        Regístrate
                    </Link>
                </p>
            </div>
        </div>
    );
}