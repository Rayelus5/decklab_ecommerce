"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerSchema } from "@/lib/validations";

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Error al crear la cuenta");
        return;
      }

      // Auto-login tras registro
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.success("Cuenta creada. Inicia sesión para continuar.");
        router.push("/login");
        return;
      }

      toast.success("¡Cuenta creada! Bienvenido a DECKLAB 🎴");
      router.push("/products");
      router.refresh();
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Input
        label="Nombre"
        type="text"
        placeholder="Tu nombre"
        autoComplete="name"
        leftIcon={<User size={15} />}
        error={errors.name?.message}
        {...register("name")}
      />

      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        autoComplete="email"
        leftIcon={<Mail size={15} />}
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Contraseña"
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres, una mayúscula y un número"
        leftIcon={<Lock size={15} />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="hover:text-snow transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
        error={errors.password?.message}
        {...register("password")}
      />

      <Input
        label="Confirmar contraseña"
        type={showConfirm ? "text" : "password"}
        placeholder="••••••••"
        autoComplete="new-password"
        leftIcon={<Lock size={15} />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowConfirm((p) => !p)}
            className="hover:text-snow transition-colors"
            aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
        size="lg"
        className="mt-1"
      >
        Crear cuenta
      </Button>
    </form>
  );
}
