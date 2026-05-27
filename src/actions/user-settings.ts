"use server";

import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

// Esquemas de validación
const ProfileSchema = z.object({
    name: z.string().min(2, "El nombre es muy corto"),
});

const PasswordSchema = z.object({
    currentPassword: z.string().min(1, "Introduce tu contraseña actual"),
    newPassword: z.string().min(6, "La nueva contraseña debe tener 6+ caracteres"),
    confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "No autorizado" };

    const name = formData.get("name") as string;
    const parsed = ProfileSchema.safeParse({ name });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name: parsed.data.name },
        });
        revalidatePath("/profile");
        return { success: "Perfil actualizado correctamente" };
    } catch (error) {
        return { error: "Error al actualizar perfil" };
    }
}

export async function changePassword(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "No autorizado" };

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const parsed = PasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    // 1. Verificar contraseña actual
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.password) return { error: "Usuario no válido" };

    const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordsMatch) return { error: "La contraseña actual es incorrecta" };

    // 2. Hashear nueva y guardar
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        });
        return { success: "Contraseña cambiada correctamente" };
    } catch (error) {
        return { error: "Error al cambiar contraseña" };
    }
}