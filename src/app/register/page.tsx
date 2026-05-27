"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { registerUser } from "@/actions/register";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden.");
            setLoading(false);
            return;
        }

        const res = await registerUser(formData);

        if (res?.error) {
            toast.error(res.error);
            setLoading(false);
        } else {
            toast.success("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
            router.push("/login?registered=true");
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <div className="w-full max-w-[420px] space-y-6">

                <div className="text-center space-y-3">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-neon-violet/10 text-neon-violet rounded-[12px] flex items-center justify-center">
                            <UserPlus className="w-6 h-6" />
                        </div>
                    </div>
                    <h1 className="text-heading-lg font-aeonikpro font-medium text-ghost-white">
                        Crear cuenta
                    </h1>
                    <p className="text-body text-whisper-blue">
                        Únete a Decklab Shop para acceder a ventajas exclusivas
                    </p>
                </div>

                <Card variant="login-form" className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-caption text-whisper-blue uppercase tracking-wider font-medium">
                                Nombre
                            </label>
                            <Input
                                name="name"
                                type="text"
                                required
                                placeholder="Tu nombre completo"
                                className="h-11"
                            />
                        </div>
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
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="block text-caption text-whisper-blue uppercase tracking-wider font-medium">
                                    Contraseña
                                </label>
                                <Input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-caption text-whisper-blue uppercase tracking-wider font-medium">
                                    Repetir
                                </label>
                                <Input
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    placeholder="••••••"
                                    className="h-11"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="solid-primary"
                            size="lg"
                            isLoading={loading}
                            className="w-full mt-2"
                        >
                            Crear Cuenta
                        </Button>
                    </form>

                    <p className="text-center text-body text-whisper-blue">
                        ¿Ya tienes cuenta?{" "}
                        <Link href="/login" className="text-celestial-light hover:text-ghost-white transition-colors font-medium">
                            Inicia sesión
                        </Link>
                    </p>
                </Card>
            </div>
        </div>
    );
}
