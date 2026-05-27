"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            toast.error("Credenciales incorrectas. Verifica tu email y contraseña.");
            setLoading(false);
        } else {
            router.push("/");
            router.refresh();
        }
    };

    const handleGoogleLogin = () => {
        setLoading(true);
        signIn("google", { callbackUrl: "/" });
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <div className="w-full max-w-[420px] space-y-6">

                <div className="text-center space-y-3">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-neon-violet/10 text-neon-violet rounded-[12px] flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                    </div>
                    <h1 className="text-heading-lg font-aeonikpro font-medium text-ghost-white">
                        Bienvenido de nuevo
                    </h1>
                    <p className="text-body text-whisper-blue">
                        Accede a tu cuenta para gestionar tus pedidos
                    </p>
                </div>

                <Card variant="login-form" className="space-y-5">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-caption text-whisper-blue uppercase tracking-wider font-medium">
                                Email
                            </label>
                            <Input
                                name="email"
                                type="email"
                                required
                                placeholder="nombre@ejemplo.com"
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-caption text-whisper-blue uppercase tracking-wider font-medium">
                                Contraseña
                            </label>
                            <Input
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="h-11"
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="solid-primary"
                            size="lg"
                            isLoading={loading}
                            className="w-full mt-2"
                        >
                            Iniciar Sesión
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-[rgba(186,215,247,0.12)]" />
                        </div>
                        <div className="relative flex justify-center text-caption uppercase">
                            <span className="bg-[rgba(5,6,15,0.97)] px-3 text-whisper-blue">
                                O continúa con
                            </span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="secondary-outline"
                        size="lg"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full"
                    >
                        <svg className="h-4 w-4 shrink-0" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                        </svg>
                        Continuar con Google
                    </Button>

                    <p className="text-center text-body text-whisper-blue">
                        ¿No tienes cuenta?{" "}
                        <Link href="/register" className="text-celestial-light hover:text-ghost-white transition-colors font-medium">
                            Regístrate
                        </Link>
                    </p>
                </Card>
            </div>
        </div>
    );
}
